import {useEffect,useState,type FormEvent} from "react";
import {supabase} from "./lib/supabase";

type Food={id:string;name:string;published:boolean};
type FoodState="unspecified"|"raw"|"cooked"|"drained"|"prepared"|"packaged";
type ReviewStatus="pending"|"in_review"|"needs_source"|"awaiting_specialist";
type NumericField="energy_kcal"|"protein_g"|"carbohydrates_g"|"fats_g"|"fiber_g"|"sodium_mg";
type NutritionDraft={
 food_state:FoodState;source_name:string;source_reference:string;source_url:string;
 energy_kcal:number|null;protein_g:number|null;carbohydrates_g:number|null;fats_g:number|null;
 fiber_g:number|null;sodium_mg:number|null;
 review_status:ReviewStatus;notes:string;
};
const initial: NutritionDraft={
 food_state:"unspecified",source_name:"",source_reference:"",source_url:"",
 energy_kcal:null,protein_g:null,carbohydrates_g:null,fats_g:null,
 fiber_g:null,sodium_mg:null,review_status:"pending",notes:""
};
const nutrients:{key:NumericField;label:string;unit:string;max:number}[]=[
 {key:"energy_kcal",label:"Energia",unit:"kcal",max:1000},
 {key:"protein_g",label:"Proteínas",unit:"g",max:100},
 {key:"carbohydrates_g",label:"Carboidratos",unit:"g",max:100},
 {key:"fats_g",label:"Gorduras totais",unit:"g",max:100},
 {key:"fiber_g",label:"Fibras",unit:"g",max:100},
 {key:"sodium_mg",label:"Sódio",unit:"mg",max:50000}
];
const statusLabel:Record<ReviewStatus,string>={
 pending:"Pendente",in_review:"Em revisão",needs_source:"Fonte a confirmar",awaiting_specialist:"Aguardando profissional"
};
export default function FoodNutritionAdmin(){
 const [foods,setFoods]=useState<Food[]>([]);
 const [selected,setSelected]=useState("");
 const [draft,setDraft]=useState<NutritionDraft>({...initial});
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  let active=true;
  const client=supabase;
  if(!client){setError("Supabase indisponível.");return;}
  void (async()=>{
   const {data,error:loadError}=await client.from("food_items")
    .select("id,name,published").order("name");
   if(!active)return;
   if(loadError){setError(loadError.message);return;}
   setFoods(data??[]);
   setSelected((data??[])[0]?.id??"");
  })();
  return()=>{active=false;};
 },[]);
 useEffect(()=>{
  let active=true;
  const client=supabase;
  setDraft({...initial});setError("");setMessage("");
  if(!client||!selected)return;
  setLoading(true);
  void (async()=>{
   const {data,error:readError}=await client.from("cc_food_nutrition_drafts")
    .select("food_state,source_name,source_reference,source_url,energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g,sodium_mg,review_status,notes")
    .eq("food_item_id",selected).maybeSingle();
   if(!active)return;
   if(readError)setError(readError.message);
   else if(data)setDraft({...initial,...data} as NutritionDraft);
   setLoading(false);
  })();
  return()=>{active=false;};
 },[selected]);
 const patch=<K extends keyof NutritionDraft,>(key:K,value:NutritionDraft[K])=>{
  setDraft(previous=>({...previous,[key]:value}));setMessage("");
 };
 const save=async(event:FormEvent)=>{
  event.preventDefault();
  if(!supabase||!selected||loading||busy)return;
  setError("");setMessage("");
  const hasValues=nutrients.some(({key})=>draft[key]!==null);
  if(hasValues&&(draft.source_name.trim().length<3||
    draft.source_reference.trim().length<2||draft.food_state==="unspecified")){
   setError("Antes de registrar nutrientes, informe fonte, código/edição e estado de preparo.");return;
  }
  if(draft.source_url&& !/^https:\/\//i.test(draft.source_url)){
   setError("Utilize um endereço HTTPS na referência, ou deixe-o vazio.");return;
  }
  setBusy(true);
  try{
   const {error:saveError}=await supabase.from("cc_food_nutrition_drafts")
    .upsert({food_item_id:selected,...draft},{onConflict:"food_item_id"});
   if(saveError)throw saveError;
   setMessage("Rascunho nutricional salvo. Os valores NÃO foram publicados nem aprovados.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar o rascunho.");}
  finally{setBusy(false);}
 };
 return <section className="cc-food-nutrition-admin" aria-label="Base nutricional em revisão">
  <h3>Base nutricional — revisão de alimentos</h3>
  <p className="detail-note">Registre dados por 100 g usando a descrição e o código exatos da fonte. Estas informações ficam em rascunho administrativo; não aparecem nas fichas públicas e não alimentam cálculos de receitas até a aprovação especializada.</p>
  <label>Alimento do catálogo
   <select value={selected} onChange={e=>setSelected(e.target.value)}>
    {foods.map(f=><option key={f.id} value={f.id}>{f.name}{f.published?"":" · novo / não publicado"}</option>)}
   </select>
  </label>
  {loading?<p role="status">Carregando revisão...</p>:selected&&<form className="cc-tech-form" onSubmit={e=>void save(e)}>
   <div className="cc-tech-fields">
    <label>Estado do alimento na fonte
     <select value={draft.food_state} onChange={e=>patch("food_state",e.target.value as FoodState)}>
      <option value="unspecified">A identificar</option>
      <option value="raw">Cru</option><option value="cooked">Cozido</option>
      <option value="drained">Drenado</option><option value="prepared">Preparado</option>
      <option value="packaged">Industrializado / rótulo</option>
     </select>
    </label>
    <label>Andamento
     <select value={draft.review_status} onChange={e=>patch("review_status",e.target.value as ReviewStatus)}>
      {Object.entries(statusLabel).map(([key,label])=><option key={key} value={key}>{label}</option>)}
     </select>
    </label>
   </div>
   <label>Fonte (TBCA, TACO, rótulo específico ou outra)
    <input value={draft.source_name} maxLength={240} onChange={e=>patch("source_name",e.target.value)} placeholder="Instituição e título da referência"/>
   </label>
   <label>Código, versão e identificação do alimento na fonte
    <input value={draft.source_reference} maxLength={500} onChange={e=>patch("source_reference",e.target.value)} placeholder="Código e edição; espécie, produto, forma de preparo"/>
   </label>
   <label>URL da referência (quando disponível)
    <input value={draft.source_url} maxLength={1000} onChange={e=>patch("source_url",e.target.value)} placeholder="https://..."/>
   </label>
   <h4>Composição por 100 g</h4>
   <div className="cc-nutrient-grid">
    {nutrients.map(({key,label,unit,max})=><label key={key}>{label} ({unit})
     <input type="number" min={0} max={max} step="any" placeholder="Sem valor confirmado"
      value={draft[key]??""}
      onChange={e=>patch(key,e.target.value===""?null:Number(e.target.value))}/>
    </label>)}
   </div>
   <label>Observações técnicas e pendências
    <textarea rows={3} maxLength={4000} value={draft.notes} onChange={e=>patch("notes",e.target.value)}
     placeholder="Ex.: alimento genérico, peso cru/cozido ainda não confirmado, rótulo a conferir"/>
   </label>
   <p className="detail-note">A ausência de um dado não significa zero. Deixe os campos sem evidência em branco. Salvamento não equivale a aprovação.</p>
   {error&&<p role="alert" className="cc-tech-error">{error}</p>}
   {message&&<p role="status" className="cc-tech-success">{message}</p>}
   <button type="submit" className="primary" disabled={busy}>{busy?"Salvando...":"Salvar rascunho nutricional"}</button>
  </form>}
  {!selected&&<p className="detail-note">Nenhum alimento encontrado para revisão.</p>}
  {loading&&error&&<p role="alert">{error}</p>}
 </section>;
}
