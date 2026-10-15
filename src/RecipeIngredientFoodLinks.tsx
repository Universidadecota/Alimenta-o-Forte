import {useEffect,useMemo,useState} from "react";
import {supabase} from "./lib/supabase";

type Food={id:string;name:string;published:boolean;editorial_status:string;nutrition_per_100g:Record<string,unknown>|null};
type NutritionVariant={id:string;food_item_id:string;variant_name:string;food_state:string;source_name:string;source_reference:string};
type RecipeIngredient={id:string;name:string;quantity:number|null;unit:string;measure_mode:string;is_optional:boolean;position:number};
type MatchStatus="candidate"|"confirmed";
type LinkEdit={food_item_id:string;nutrition_variant_id:string|null;match_status:MatchStatus;match_notes:string;total_mass_g:number|null;mass_evidence:string};
const empty=():LinkEdit=>({food_item_id:"",nutrition_variant_id:null,match_status:"candidate",match_notes:"",total_mass_g:null,mass_evidence:""});
export default function RecipeIngredientFoodLinks({recipeId}:{recipeId:string}){
 const [ingredients,setIngredients]=useState<RecipeIngredient[]>([]);
 const [foods,setFoods]=useState<Food[]>([]);
 const [variants,setVariants]=useState<NutritionVariant[]>([]);
 const [edits,setEdits]=useState<Record<string,LinkEdit>>({});
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  let active=true;
  const client=supabase;
  setIngredients([]);setFoods([]);setVariants([]);setEdits({});setLoading(true);setError("");setMessage("");
  if(!client){setLoading(false);setError("Supabase indisponível.");return;}
  void (async()=>{
   try{
    const [itemResult,foodResult,variantResult]=await Promise.all([
     client.from("recipe_ingredients").select("id,name,quantity,unit,measure_mode,is_optional,position").eq("recipe_id",recipeId).order("position"),
     client.from("food_items").select("id,name,published,editorial_status,nutrition_per_100g").order("name"),
     client.from("cc_food_nutrition_variants").select("id,food_item_id,variant_name,food_state,source_name,source_reference").order("variant_name")
    ]);
    if(itemResult.error)throw itemResult.error;
    if(foodResult.error)throw foodResult.error;
    if(variantResult.error)throw variantResult.error;
    const items=itemResult.data??[];
    const ids=items.map(item=>item.id);
    let stored: Array<{ingredient_id:string;food_item_id:string;nutrition_variant_id:string|null;match_status:string;match_notes:string;total_mass_g:number|null;mass_evidence:string}>=[];
    if(ids.length){
     const {data,error:linkError}=await client.from("cc_recipe_ingredient_food_links")
      .select("ingredient_id,food_item_id,nutrition_variant_id,match_status,match_notes,total_mass_g,mass_evidence").in("ingredient_id",ids);
     if(linkError)throw linkError;
     stored=data??[];
    }
    if(!active)return;
    setIngredients(items);
    setFoods(foodResult.data??[]);
    setVariants(variantResult.data??[]);
    const loaded:Record<string,LinkEdit>={};
    items.forEach(item=>{loaded[item.id]=empty();});
    stored.forEach(link=>{
     loaded[link.ingredient_id]={
      food_item_id:link.food_item_id,nutrition_variant_id:link.nutrition_variant_id??null,
      match_status:link.match_status as MatchStatus,
      match_notes:link.match_notes??"",total_mass_g:link.total_mass_g==null?null:Number(link.total_mass_g),
      mass_evidence:link.mass_evidence??""
     };
    });
    setEdits(loaded);
   }catch(e){if(active)setError(e instanceof Error?e.message:"Não foi possível carregar vínculos nutricionais.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[recipeId]);
 const confirmed=useMemo(()=>ingredients.filter(item=>edits[item.id]?.match_status==="confirmed"&&edits[item.id]?.nutrition_variant_id).length,[ingredients,edits]);
 const patch=(id:string,change:Partial<LinkEdit>)=>{
  setEdits(current=>({...current,[id]:{...empty(),...current[id],...change}}));
  setMessage("");
 };
 const save=async(item:RecipeIngredient)=>{
  const edit=edits[item.id]??empty();
  if(!supabase||saving||!edit.food_item_id)return;
  setError("");setMessage("");
  if(edit.match_status==="confirmed"&&!edit.nutrition_variant_id){
   setError("Para confirmar, selecione a variante e o estado de preparo exatos.");return;
  }
  if(edit.match_status==="confirmed"&&edit.match_notes.trim().length<3){
   setError("Explique a correspondência antes de confirmar o vínculo.");return;
  }
  if(edit.total_mass_g!==null&&(!Number.isFinite(edit.total_mass_g)||
    edit.total_mass_g<=0||edit.mass_evidence.trim().length<3)){
   setError("Para usar massa em gramas, registre uma quantidade positiva e a fonte da equivalência.");return;
  }
  setSaving(item.id);
  try{
   const {error:writeError}=await supabase.from("cc_recipe_ingredient_food_links")
    .upsert({ingredient_id:item.id,...edit},{onConflict:"ingredient_id"});
   if(writeError)throw writeError;
   setMessage("Vínculo de “"+item.name+"” salvo como "+(edit.match_status==="confirmed"?"correspondência editorial confirmada.":"candidato pendente.") );
  }catch(e){setError(e instanceof Error?e.message:"Falha ao salvar vínculo.");}
  finally{setSaving(null);}
 };
 return <section className="cc-ingredient-mapping" aria-label="Relacionar ingredientes à biblioteca">
  <h3>Ingredientes e Biblioteca de Alimentos</h3>
  <p className="detail-note">Vincule manualmente cada ingrediente à referência exata. Um vínculo confirmado não aprova a composição nutricional nem comprova ausência de alergênicos.</p>
  <p className="detail-note">{confirmed} de {ingredients.length} correspondências editoriais confirmadas. Valores nutricionais verificados ainda dependem de fontes e revisão técnica.</p>
  {loading?<p role="status">Carregando ingredientes...</p>:ingredients.map(item=>{
   const edit=edits[item.id]??empty();
   const food=foods.find(f=>f.id===edit.food_item_id);
   return <article className="cc-mapping-item" key={item.id}>
    <h4>{item.name}</h4>
    <p className="detail-note">Medida original: {item.measure_mode==="measured"?item.quantity+" "+item.unit:item.measure_mode==="taste"?"A gosto":"Quantidade não informada"}{item.is_optional?" · opcional":""}</p>
    <label>Alimento correspondente
     <select value={edit.food_item_id} onChange={e=>patch(item.id,{food_item_id:e.target.value,nutrition_variant_id:null,match_status:"candidate",match_notes:"",total_mass_g:null,mass_evidence:""})}>
      <option value="">Selecione apenas após identificar o alimento</option>
      {foods.map(f=><option key={f.id} value={f.id}>{f.name}{f.published?"":" · não publicado"}</option>)}
     </select>
    </label>
    {food&&<>
     <label>Variante e estado de preparo
      <select value={edit.nutrition_variant_id??""}
       onChange={e=>patch(item.id,{nutrition_variant_id:e.target.value||null,match_status:"candidate",match_notes:"",total_mass_g:null,mass_evidence:""})}>
       <option value="">Escolher variante exata; sem correspondência automática</option>
       {variants.filter(v=>v.food_item_id===food.id).map(v=>
        <option key={v.id} value={v.id}>{v.variant_name} · {v.source_reference||"fonte pendente"}</option>)}
      </select>
     </label>
     {variants.every(v=>v.food_item_id!==food.id)&&
      <p className="detail-note">Ainda não há variantes documentadas para este alimento. Cadastre-as antes de confirmar a correspondência.</p>}
     <p className="detail-note">A identificação da variante não aprova o valor nutricional nem a segurança em alergias.</p>
    </>}
    <label>Andamento da correspondência
     <select value={edit.match_status} onChange={e=>patch(item.id,{match_status:e.target.value as MatchStatus})}>
      <option value="candidate">Candidato — conferir</option>
      <option value="confirmed">Confirmado editorialmente (não é aprovação nutricional)</option>
     </select>
    </label>
    <label>Justificativa da correspondência
     <input maxLength={2000} placeholder="Ex.: mesma variedade e estado de preparo" value={edit.match_notes}
      onChange={e=>patch(item.id,{match_notes:e.target.value})}/>
    </label>
    <div className="cc-tech-fields">
     <label>Massa total na receita (g), se verificada
      <input type="number" min=".001" max={1000000} step="any" placeholder="Não informada"
       value={edit.total_mass_g??""} onChange={e=>patch(item.id,{total_mass_g:e.target.value===""?null:Number(e.target.value)})}/>
     </label>
     <label>Fonte da massa ou equivalência
      <input maxLength={1000} placeholder="Ex.: 150 g na fórmula original; rótulo; medição"
       value={edit.mass_evidence} onChange={e=>patch(item.id,{mass_evidence:e.target.value})}/>
     </label>
    </div>
    <p className="detail-note">Colheres, unidades, pitadas, cm e latas não são convertidos automaticamente. Ingredientes sem quantidade ou a gosto permanecem pendentes.</p>
    <button type="button" className="secondary" onClick={()=>void save(item)}
     disabled={!!saving||!edit.food_item_id}>{saving===item.id?"Salvando...":"Salvar vínculo deste ingrediente"}</button>
   </article>;
  })}
  {!loading&&ingredients.length===0&&<p className="detail-note">Nenhum ingrediente encontrado para esta receita.</p>}
  {error&&<p role="alert" className="cc-tech-error">{error}</p>}
  {message&&<p role="status" className="cc-tech-success">{message}</p>}
 </section>;
}
