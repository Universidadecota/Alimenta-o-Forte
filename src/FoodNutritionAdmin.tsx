import {useEffect,useState,type FormEvent} from "react";
import {supabase} from "./lib/supabase";
import FoodNutritionReviewPanel from "./FoodNutritionReviewPanel";

type Food={id:string;name:string;published:boolean};
type FoodState="unspecified"|"raw"|"cooked"|"sauteed"|"fried"|"roasted"|"grilled"|"drained"|"prepared"|"packaged"|"other";
type ReviewStatus="pending"|"in_review"|"needs_source"|"awaiting_specialist";
type Nutrient="energy_kcal"|"protein_g"|"carbohydrates_g"|"fats_g"|"fiber_g"|"sodium_mg";
type VariantDraft={
 variant_name:string;food_state:FoodState;preparation_method:string;
 source_name:string;source_reference:string;source_url:string;
 energy_kcal:number|null;protein_g:number|null;carbohydrates_g:number|null;
 fats_g:number|null;fiber_g:number|null;sodium_mg:number|null;
 review_status:ReviewStatus;notes:string;
};
type Variant=VariantDraft & {id:string;food_item_id:string};
const blank=():VariantDraft=>({
 variant_name:"",food_state:"unspecified",preparation_method:"",
 source_name:"",source_reference:"",source_url:"",
 energy_kcal:null,protein_g:null,carbohydrates_g:null,fats_g:null,
 fiber_g:null,sodium_mg:null,review_status:"pending",notes:""
});
const fromVariant=(row:Variant):VariantDraft=>({
 variant_name:row.variant_name,food_state:row.food_state,preparation_method:row.preparation_method,
 source_name:row.source_name,source_reference:row.source_reference,source_url:row.source_url,
 energy_kcal:row.energy_kcal,protein_g:row.protein_g,carbohydrates_g:row.carbohydrates_g,
 fats_g:row.fats_g,fiber_g:row.fiber_g,sodium_mg:row.sodium_mg,
 review_status:row.review_status,notes:row.notes
});
const nutrients:{key:Nutrient;label:string;unit:string;max:number}[]=[
 {key:"energy_kcal",label:"Energia",unit:"kcal",max:1000},
 {key:"protein_g",label:"Proteínas",unit:"g",max:100},
 {key:"carbohydrates_g",label:"Carboidratos",unit:"g",max:100},
 {key:"fats_g",label:"Gorduras totais",unit:"g",max:100},
 {key:"fiber_g",label:"Fibras",unit:"g",max:100},
 {key:"sodium_mg",label:"Sódio",unit:"mg",max:50000}
];
const statusLabels:Record<ReviewStatus,string>={
 pending:"Pendente",in_review:"Em revisão",needs_source:"Conferir fonte/valores",
 awaiting_specialist:"Aguardando profissional"
};
const stateLabels:Record<FoodState,string>={
 unspecified:"A identificar",raw:"Cru",cooked:"Cozido",sauteed:"Refogado",
 fried:"Frito",roasted:"Assado",grilled:"Grelhado",drained:"Drenado",
 prepared:"Preparado",packaged:"Industrializado / rótulo",other:"Outro (descrever)"
};

export default function FoodNutritionAdmin(){
 const [foods,setFoods]=useState<Food[]>([]);
 const [selectedFood,setSelectedFood]=useState("");
 const [variants,setVariants]=useState<Variant[]>([]);
 const [selectedVariant,setSelectedVariant]=useState("");
 const [form,setForm]=useState<VariantDraft>(blank);
 const [loading,setLoading]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [unsavedChanges,setUnsavedChanges]=useState(false);
 const [savedRevision,setSavedRevision]=useState(0);
 useEffect(()=>{
  let active=true;
  const client=supabase;
  if(!client){setError("Supabase indisponível.");return;}
  void (async()=>{
   const {data,error:queryError}=await client.from("food_items").select("id,name,published").order("name");
   if(!active)return;
   if(queryError){setError(queryError.message);return;}
   setFoods(data??[]);
   setSelectedFood((data??[])[0]?.id??"");
  })();
  return()=>{active=false;};
 },[]);
 useEffect(()=>{
  let active=true;
  const client=supabase;
  setLoading(true);setVariants([]);setSelectedVariant("");setForm(blank());
  setUnsavedChanges(false);
  setError("");setMessage("");
  if(!client||!selectedFood){setLoading(false);return;}
  void (async()=>{
   const {data,error:readError}=await client.from("cc_food_nutrition_variants")
    .select("id,food_item_id,variant_name,food_state,preparation_method,source_name,source_reference,source_url,energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g,sodium_mg,review_status,notes")
    .eq("food_item_id",selectedFood).order("variant_name");
   if(!active)return;
   if(readError){setError(readError.message);setLoading(false);return;}
   const records=(data??[]) as Variant[];
   setVariants(records);
   if(records.length){setSelectedVariant(records[0].id);setForm(fromVariant(records[0]));}
   setLoading(false);
  })();
  return()=>{active=false;};
 },[selectedFood]);
 const chooseVariant=(id:string)=>{
  setSelectedVariant(id);setForm(id?fromVariant(variants.find(v=>v.id===id)!):blank());
  setUnsavedChanges(false);
  setError("");setMessage("");
 };
 const patch=<K extends keyof VariantDraft,>(key:K,value:VariantDraft[K])=>{
  setForm(previous=>({...previous,[key]:value}));setMessage("");setUnsavedChanges(true);
 };
 const save=async(event:FormEvent)=>{
  event.preventDefault();
  if(!supabase||!selectedFood||loading||saving)return;
  setError("");setMessage("");
  if(form.variant_name.trim().length<4){
   setError("Informe a variedade e o preparo de forma específica.");return;
  }
  const hasNutrients=nutrients.some(({key})=>form[key]!==null);
  if(hasNutrients&&(form.source_name.trim().length<3||
    form.source_reference.trim().length<2||form.food_state==="unspecified")){
   setError("Para informar nutrientes, identifique fonte, código/edição e estado do alimento.");return;
  }
  if(form.source_url&& !/^https:\/\//i.test(form.source_url)){
   setError("A URL deve começar por HTTPS ou ficar vazia.");return;
  }
  if(nutrients.some(({key,max})=>{
   const value=form[key];
   return value!==null&&(!Number.isFinite(value)||value<0||value>max);
  })){
   setError("Confira os valores numéricos e os limites por 100 g.");return;
  }
  setSaving(true);
  try{
   const fields={...form,variant_name:form.variant_name.trim(),food_item_id:selectedFood};
   const builder=supabase.from("cc_food_nutrition_variants");
   const query=selectedVariant?
     builder.update(fields).eq("id",selectedVariant).eq("food_item_id",selectedFood):
     builder.insert(fields);
   const {data,error:writeError}=await query.select("id,food_item_id,variant_name,food_state,preparation_method,source_name,source_reference,source_url,energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g,sodium_mg,review_status,notes").single();
   if(writeError)throw writeError;
   const saved=data as Variant;
   setVariants(previous=>(selectedVariant?previous.map(v=>v.id===saved.id?saved:v):[...previous,saved])
    .sort((a,b)=>a.variant_name.localeCompare(b.variant_name,"pt-BR")));
   setSelectedVariant(saved.id);setForm(fromVariant(saved));
   setUnsavedChanges(false);setSavedRevision(n=>n+1);
   setMessage("Variante editorial salva. Nenhum dado nutricional foi publicado ou aprovado.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar a variante.");}
  finally{setSaving(false);}
 };
 return <section className="cc-food-nutrition-admin" aria-label="Variedades e composição nutricional">
  <h3>Base nutricional — variedades e preparo</h3>
  <p className="detail-note">Um alimento pode ter várias composições: variedade, estado cru/cozido e preparo alteram a referência. Toda variante é administrativa e permanece em revisão, mesmo quando possui fonte cadastrada.</p>
  <label>Alimento do catálogo
   <select value={selectedFood} disabled={saving} onChange={e=>setSelectedFood(e.target.value)}>
    {foods.map(food=><option key={food.id} value={food.id}>{food.name}{food.published?"":" · não publicado"}</option>)}
   </select>
  </label>
  {loading?<p role="status">Carregando variantes...</p>:selectedFood&&<>
   <label>Variante e estado de preparo <small>({variants.length} cadastradas)</small>
    <select value={selectedVariant} disabled={saving} onChange={e=>chooseVariant(e.target.value)}>
     <option value="">+ Nova variante, com identificação precisa</option>
     {variants.map(v=><option key={v.id} value={v.id}>{v.variant_name} · {stateLabels[v.food_state]} · {statusLabels[v.review_status]}</option>)}
    </select>
   </label>
   <form className="cc-tech-form" onSubmit={e=>void save(e)}>
    <label>Nome exato da variedade / alimento na fonte
     <input required minLength={4} maxLength={180} placeholder="Ex.: Abobrinha, italiana, crua"
      value={form.variant_name} onChange={e=>patch("variant_name",e.target.value)}/>
    </label>
    <div className="cc-tech-fields">
     <label>Estado de preparo
      <select value={form.food_state} onChange={e=>patch("food_state",e.target.value as FoodState)}>
       {Object.entries(stateLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}
      </select>
     </label>
     <label>Detalhe do preparo
      <input maxLength={240} placeholder="Se necessário: refogado, com óleo etc."
       value={form.preparation_method} onChange={e=>patch("preparation_method",e.target.value)}/>
     </label>
     <label>Andamento editorial
      <select value={form.review_status} onChange={e=>patch("review_status",e.target.value as ReviewStatus)}>
       {Object.entries(statusLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}
      </select>
     </label>
    </div>
    <label>Fonte dos dados
     <input maxLength={240} placeholder="Ex.: NEPA/UNICAMP — TACO 4ª edição"
      value={form.source_name} onChange={e=>patch("source_name",e.target.value)}/>
    </label>
    <label>Código exato, edição e página na fonte
     <input maxLength={500} placeholder="Ex.: Tabela 1, linha 71, edição 2011"
      value={form.source_reference} onChange={e=>patch("source_reference",e.target.value)}/>
    </label>
    <label>URL da fonte
     <input maxLength={1000} value={form.source_url} placeholder="https://..."
      onChange={e=>patch("source_url",e.target.value)}/>
    </label>
    <h4>Composição por 100 g de parte comestível</h4>
    <div className="cc-nutrient-grid">
     {nutrients.map(({key,label,unit,max})=><label key={key}>{label} ({unit})
      <input type="number" min={0} max={max} step="any" placeholder="Sem valor verificado"
       value={form[key]??""}
       onChange={e=>patch(key,e.target.value===""?null:Number(e.target.value))}/>
     </label>)}
    </div>
    <label>Pendências e evidências técnicas
     <textarea rows={3} maxLength={4000} value={form.notes}
      onChange={e=>patch("notes",e.target.value)}/>
    </label>
    <p className="detail-note">O cadastro não aprova nutrientes nem sua aplicação em receitas. Valores ausentes não devem ser tratados como zero. Não use nutrientes de uma variante em outra.</p>
    {error&&<p role="alert" className="cc-tech-error">{error}</p>}
    {message&&<p role="status" className="cc-tech-success">{message}</p>}
    <button type="submit" className="primary" disabled={saving}>{saving?"Salvando...":selectedVariant?"Salvar alterações da variante":"Cadastrar variante para revisão"}</button>
   </form>
   {selectedVariant&&<FoodNutritionReviewPanel
    key={selectedVariant+"-"+savedRevision}
    variantId={selectedVariant} hasUnsavedChanges={unsavedChanges}/>} 
  </>}
  {!selectedFood&&<p className="detail-note">Nenhum alimento disponível.</p>}
 </section>;
}
