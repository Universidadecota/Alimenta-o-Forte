import {useEffect,useState,type FormEvent} from "react";
import {supabase} from "./lib/supabase";

type ReviewStatus="pending"|"in_review"|"awaiting_specialist";
type YieldUnit="porcoes"|"copos"|"unidades"|"g"|"ml";
type Sheet={
 source_title:string|null;
 source_page:number|null;
 reference_yield_quantity:number|null;
 reference_yield_unit:YieldUnit|null;
 ingredient_notes:string;
 preparation_notes:string;
 nutrition_reference_notes:string;
 allergen_evidence_notes:string;
 review_status:ReviewStatus;
};
type AllergenReview={status:string;cross_contact_status:string;reviewed_at:string|null};
const initial:Sheet={
 source_title:null,source_page:null,reference_yield_quantity:null,reference_yield_unit:null,
 ingredient_notes:"",preparation_notes:"",nutrition_reference_notes:"",
 allergen_evidence_notes:"",review_status:"pending"
};
const reviewLabels:Record<ReviewStatus,string>={
 pending:"Pendente",
 in_review:"Em revisão editorial",
 awaiting_specialist:"Aguardando profissional responsável"
};
type Props={recipeId:string;recipeTitle:string;referenceServings:number;ingredientCount:number};
export default function RecipeTechnicalSheet({recipeId,recipeTitle,referenceServings,ingredientCount}:Props){
 const [sheet,setSheet]=useState<Sheet>({...initial});
 const [allergens,setAllergens]=useState<AllergenReview|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  setSheet({...initial});setAllergens(null);setLoading(true);setError("");setMessage("");
  if(!supabase){setLoading(false);setError("Supabase indisponível.");return;}
  const client=supabase;
  void (async()=>{
   try{
    const [technical,allergenReview]=await Promise.all([
     client.from("cc_recipe_technical_sheets").select("source_title,source_page,reference_yield_quantity,reference_yield_unit,ingredient_notes,preparation_notes,nutrition_reference_notes,allergen_evidence_notes,review_status").eq("recipe_id",recipeId).maybeSingle(),
     client.from("cc_recipe_allergen_reviews").select("status,cross_contact_status,reviewed_at").eq("recipe_id",recipeId).maybeSingle()
    ]);
    if(technical.error)throw technical.error;
    if(allergenReview.error)throw allergenReview.error;
    if(active){
     setSheet(technical.data?{
      ...initial,...technical.data,
      source_page:technical.data.source_page==null?null:Number(technical.data.source_page),
      reference_yield_quantity:technical.data.reference_yield_quantity==null?null:Number(technical.data.reference_yield_quantity)
     } as Sheet:{...initial});
     setAllergens(allergenReview.data??null);
    }
   }catch(e){
    if(active)setError(e instanceof Error?e.message:"Não foi possível consultar a ficha técnica.");
   }finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[recipeId]);
 const patch=<K extends keyof Sheet,>(key:K,value:Sheet[K])=>{setSheet(s=>({...s,[key]:value}));setMessage("");};
 const save=async(e:FormEvent)=>{
  e.preventDefault();
  if(!supabase||busy)return;
  setError("");setMessage("");
  const yieldAmount=sheet.reference_yield_quantity;
  if((yieldAmount===null)!==(sheet.reference_yield_unit===null)){
   setError("Preencha quantidade e unidade do rendimento juntas, ou deixe ambas vazias.");return;
  }
  if(yieldAmount!==null&&(!Number.isFinite(yieldAmount)||yieldAmount<=0)){
   setError("O rendimento deve ser um número positivo.");return;
  }
  setBusy(true);
  try{
   const {error:saveError}=await supabase.from("cc_recipe_technical_sheets").upsert(
    {recipe_id:recipeId,...sheet},
    {onConflict:"recipe_id"}
   );
   if(saveError)throw saveError;
   setMessage("Ficha técnica editorial salva. Informações nutricionais e alergênicos continuam sem aprovação.");
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar a ficha técnica.");}
  finally{setBusy(false);}
 };
 return <section className="cc-tech-sheet" aria-label={"Ficha técnica de "+recipeTitle}>
  <h3>Ficha técnica editorial</h3>
  <p className="detail-note">Receita oficial: <strong>{recipeTitle}</strong> · {referenceServings} {referenceServings===1?"porção de referência":"porções de referência"} · {ingredientCount} ingredientes.</p>
  <p className="detail-note">Esta ficha registra fontes e pendências. Não representa validação nutricional nem garantia de segurança para alergias.</p>
  <div className="cc-tech-review">
   <strong>Revisão de alergênicos: {allergens?allergens.status==="verified"?"Registro revisado — avaliar evidências e validade":allergens.status:"Não registrada"}</strong>
   <span>Contato cruzado: {allergens?.cross_contact_status==="unknown"||!allergens?"não avaliado":allergens.cross_contact_status==="possible"?"possível": "registrado — conferir evidências"}. Nenhuma receita é considerada automaticamente segura.</span>
  </div>
  {loading?<p role="status">Carregando ficha técnica…</p>:<>
   <form onSubmit={e=>void save(e)} className="cc-tech-form">
    <label>Fonte original
     <input maxLength={240} minLength={2} placeholder="Livro, publicação ou documentação" value={sheet.source_title??""} onChange={e=>patch("source_title",e.target.value||null)}/>
    </label>
    <div className="cc-tech-fields">
     <label>Página da fonte
      <input type="number" min={1} max={10000} placeholder="Não informada" value={sheet.source_page??""} onChange={e=>patch("source_page",e.target.value===""?null:Number(e.target.value))}/>
     </label>
     <label>Quantidade de rendimento na fonte
      <input type="number" step="any" min="0.001" max={100000} placeholder="A verificar" value={sheet.reference_yield_quantity??""} onChange={e=>patch("reference_yield_quantity",e.target.value===""?null:Number(e.target.value))}/>
     </label>
     <label>Unidade do rendimento
      <select value={sheet.reference_yield_unit??""} onChange={e=>patch("reference_yield_unit",e.target.value===""?null:e.target.value as YieldUnit)}>
       <option value="">Não informada</option><option value="copos">Copos</option>
       <option value="porcoes">Porções</option><option value="unidades">Unidades</option>
       <option value="g">Gramas</option><option value="ml">Mililitros</option>
      </select>
     </label>
    </div>
    <p className="detail-note">O rendimento da fonte serve para conferência. Salvar esta ficha não altera o rendimento usado no Cardápio ou na lista de Compras.</p>
    <label>Pendências de ingredientes e medidas
     <textarea rows={3} maxLength={5000} value={sheet.ingredient_notes} onChange={e=>patch("ingredient_notes",e.target.value)}/>
    </label>
    <label>Pendências do modo de preparo
     <textarea rows={3} maxLength={5000} value={sheet.preparation_notes} onChange={e=>patch("preparation_notes",e.target.value)}/>
    </label>
    <label>Fontes e pendências nutricionais
     <textarea rows={3} maxLength={5000} value={sheet.nutrition_reference_notes} onChange={e=>patch("nutrition_reference_notes",e.target.value)} placeholder="Referência consultada, edição, método, itens ainda não validados"/>
    </label>
    <label>Pendências de alergênicos, rótulos e contato cruzado
     <textarea rows={3} maxLength={5000} value={sheet.allergen_evidence_notes} onChange={e=>patch("allergen_evidence_notes",e.target.value)}/>
    </label>
    <label>Andamento editorial
     <select value={sheet.review_status} onChange={e=>patch("review_status",e.target.value as ReviewStatus)}>
      {Object.entries(reviewLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select>
    </label>
    <p className="detail-note">Para aprovar alergênicos será necessário utilizar o processo próprio de revisão com evidências. Não existe opção de declarar esta receita segura nesta ficha.</p>
    {error&&<p role="alert" className="cc-tech-error">{error}</p>}
    {message&&<p role="status" className="cc-tech-success">{message}</p>}
    <button type="submit" className="primary" disabled={busy}>{busy?"Salvando ficha…":"Salvar ficha técnica"}</button>
   </form>
  </>}
 </section>;
}
