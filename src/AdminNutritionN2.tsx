import {useEffect,useMemo,useState} from "react";
import {supabase} from "./lib/supabase";

type N2Row={
 recipe_id:string;recipe_title:string;recipe_category:string;original_yield:string;
 ingredient_count:number;ingredient_id:string;ingredient_position:number;ingredient_text:string;
 measure_status:string;measure_quantity:number|null;measure_unit:string|null;measure_ingredient:string|null;
 food_item_id:string|null;nutrition_variant_id:string|null;match_status:string;
 total_mass_g:number|null;mass_evidence:string;match_notes:string;variant_status:string;
};
type Food={id:string;name:string};
type Variant={id:string;food_item_id:string;variant_name:string;food_state:string;review_status:string};
type Note={ingredient_id:string;triage_status:string;review_note:string};
type Draft={
 foodId:string;variantId:string;mass:string;massEvidence:string;matchNotes:string;
 triageStatus:string;reviewNote:string;
};
const triageOptions=[
 {value:"pending",label:"Pendente de triagem"},
 {value:"need_mass",label:"Falta aferir massa ou volume"},
 {value:"need_food",label:"Alimento equivalente ainda não cadastrado"},
 {value:"ambiguous_or_optional",label:"Texto ambíguo, alternativa ou ingrediente a gosto"},
 {value:"candidate_documented",label:"Candidato registrado; aguarda validação"},
] as const;
function createDraft(row:N2Row,note:Note|undefined):Draft{
 return {
  foodId:row.food_item_id??"",variantId:row.nutrition_variant_id??"",
  mass:row.total_mass_g==null?"":String(row.total_mass_g),
  massEvidence:row.mass_evidence??"",matchNotes:row.match_notes??"",
  triageStatus:note?.triage_status??"pending",reviewNote:note?.review_note??"",
 };
}
export default function AdminNutritionN2(){
 const [rows,setRows]=useState<N2Row[]>([]);
 const [foods,setFoods]=useState<Food[]>([]);
 const [variants,setVariants]=useState<Variant[]>([]);
 const [notes,setNotes]=useState<Note[]>([]);
 const [drafts,setDrafts]=useState<Record<string,Draft>>({});
 const [selectedRecipe,setSelectedRecipe]=useState("");
 const [loading,setLoading]=useState(true);
 const [busyId,setBusyId]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const load=async()=>{
  if(!supabase)return;
  setLoading(true);setError("");
  try{
   const [queue,foodResults,variantResults,noteResults]=await Promise.all([
    supabase.rpc("cc_beta_n2_p1_queue"),
    supabase.from("food_items").select("id,name").eq("published",true).order("name"),
    supabase.from("cc_food_nutrition_variants").select("id,food_item_id,variant_name,food_state,review_status").order("variant_name"),
    supabase.from("cc_n2_ingredient_review_notes").select("ingredient_id,triage_status,review_note")
   ]);
   if(queue.error||foodResults.error||variantResults.error||noteResults.error)
    throw queue.error??foodResults.error??variantResults.error??noteResults.error;
   const nextRows=(queue.data??[]) as N2Row[];
   const nextNotes=(noteResults.data??[]) as Note[];
   const notesById=new Map(nextNotes.map(n=>[n.ingredient_id,n]));
   setRows(nextRows);setFoods((foodResults.data??[]) as Food[]);
   setVariants((variantResults.data??[]) as Variant[]);setNotes(nextNotes);
   setDrafts(Object.fromEntries(nextRows.map(r=>[r.ingredient_id,createDraft(r,notesById.get(r.ingredient_id))])));
   setSelectedRecipe(current=>nextRows.some(r=>r.recipe_id===current)?current:(nextRows[0]?.recipe_id??""));
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar a fila N2.");}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[]);
 const recipeOptions=useMemo(()=>{
  const seen=new Set<string>();
  return rows.filter(row=>{if(seen.has(row.recipe_id))return false;seen.add(row.recipe_id);return true;});
 },[rows]);
 const recipeRows=rows.filter(row=>row.recipe_id===selectedRecipe);
 const documented=rows.filter(row=>row.match_status==="candidate").length;
 const reviewed=notes.filter(note=>note.triage_status!=="pending").length;
 const patch=(ingredientId:string,change:Partial<Draft>)=>{
  setDrafts(previous=>({...previous,[ingredientId]:{...previous[ingredientId],...change}}));
  setMessage("");
 };
 const saveTriage=async(row:N2Row)=>{
  if(!supabase||busyId)return;
  const draft=drafts[row.ingredient_id];
  if(!draft)return;
  if(draft.triageStatus!=="pending"&&draft.reviewNote.trim().length<12){
   setError("Informe uma justificativa de pelo menos 12 caracteres para a situação escolhida.");return;
  }
  setBusyId(row.ingredient_id);setError("");setMessage("");
  const {error:saveError}=await supabase.from("cc_n2_ingredient_review_notes").upsert({
   ingredient_id:row.ingredient_id,triage_status:draft.triageStatus,
   review_note:draft.reviewNote.trim(),
  },{onConflict:"ingredient_id"});
  if(saveError)setError("Não foi possível salvar esta triagem. Verifique sua permissão.");
  else{setMessage("Triagem registrada, sem aprovar medidas ou nutrientes.");await load();}
  setBusyId(null);
 };
 const saveCandidate=async(row:N2Row)=>{
  if(!supabase||busyId)return;
  const draft=drafts[row.ingredient_id];
  if(!draft?.foodId){setError("Escolha um alimento da biblioteca antes de registrar o candidato.");return;}
  if(draft.variantId&&!variants.some(v=>v.id===draft.variantId&&v.food_item_id===draft.foodId)){
   setError("A variante não pertence ao alimento selecionado.");return;
  }
  const value=draft.mass.trim()===""?null:Number(draft.mass.replace(",","."));
  if(value!==null&&(!Number.isFinite(value)||value<=0||value>1000000)){
   setError("A massa deve ser positiva e inferior a 1.000.000 g.");return;
  }
  if(value!==null&&draft.massEvidence.trim().length<15){
   setError("Informe como a massa foi aferida (mínimo de 15 caracteres). Não converta xícaras ou fatias por aproximação.");return;
  }
  if(draft.matchNotes.trim().length<12){
   setError("Explique o motivo da associação candidata (mínimo de 12 caracteres).");return;
  }
  if(!window.confirm("Salvar apenas um VÍNCULO CANDIDATO? Isso não valida o ingrediente, a massa, a variante ou a nutrição da receita."))return;
  setBusyId(row.ingredient_id);setError("");setMessage("");
  const {error:saveError}=await supabase.from("cc_recipe_ingredient_food_links").upsert({
   ingredient_id:row.ingredient_id,food_item_id:draft.foodId,
   nutrition_variant_id:draft.variantId||null,match_status:"candidate",
   total_mass_g:value,
   mass_evidence:value===null?"":draft.massEvidence.trim(),
   match_notes:draft.matchNotes.trim(),
  },{onConflict:"ingredient_id"});
  if(saveError)setError("Não foi possível salvar o candidato. Verifique os campos e as permissões.");
  else{setMessage("Vínculo salvo como CANDIDATO. Continua sem aprovação nutricional.");await load();}
  setBusyId(null);
 };
 return <section className="detail-panel cc-n2-admin">
  <h3>Nutrição das receitas — Etapa N2</h3>
  <p className="detail-note">Triagem restrita ao administrador. As nove receitas P1 continuam com seus ingredientes originais. Esta área registra hipóteses e evidências, mas <strong>não permite publicar valores nutricionais nem confirmar associações automaticamente.</strong></p>
  <div className="cc-n2-stats">
   <span><strong>{recipeOptions.length}</strong> receitas prioritárias</span>
   <span><strong>{rows.length}</strong> ingredientes</span>
   <span><strong>{documented}</strong> vínculos candidatos</span>
   <span><strong>{reviewed}</strong> triagens registradas</span>
  </div>
  <button type="button" className="secondary" disabled={loading||busyId!==null} onClick={()=>void load()}>Atualizar fila N2</button>
  {loading&&<p role="status" className="detail-note">Carregando a fila administrativa...</p>}
  {error&&<p role="alert" className="cc-n2-error">{error}</p>}
  {message&&<p role="status" className="cc-n2-success">{message}</p>}
  {!loading&&recipeOptions.length===0&&<p className="detail-note">Nenhuma receita da fila P1 disponível.</p>}
  {recipeOptions.length>0&&<>
   <label htmlFor="cc-n2-recipe">Escolha uma receita para revisar</label>
   <select id="cc-n2-recipe" value={selectedRecipe} onChange={e=>setSelectedRecipe(e.target.value)}>
    {recipeOptions.map(row=><option key={row.recipe_id} value={row.recipe_id}>{row.recipe_title} · {row.ingredient_count} ingredientes</option>)}
   </select>
   <p className="detail-note"><strong>Rendimento conforme receita:</strong> {recipeRows[0]?.original_yield}. Isso não representa peso líquido aferido.</p>
   <div className="cc-n2-ingredients">{recipeRows.map((row,index)=>{
    const draft=drafts[row.ingredient_id]??createDraft(row,undefined);
    const filtered=variants.filter(v=>v.food_item_id===draft.foodId);
    return <details className="cc-n2-row" key={row.ingredient_id} open={index===0}>
     <summary><span>{index+1}. {row.ingredient_text}</span><small>{row.match_status==="candidate"?"Candidato registrado":"Sem vínculo"} · medida {row.measure_status}</small></summary>
     <div className="cc-n2-row-body">
      <p className="detail-note">Ingrediente original preservado. Revisão da medida: <strong>{row.measure_status}</strong>. Nenhum valor nutricional está aprovado.</p>
      <fieldset className="cc-n2-fields">
       <legend>1. Registrar pendência editorial</legend>
       <label>Situação da triagem
        <select value={draft.triageStatus} onChange={e=>patch(row.ingredient_id,{triageStatus:e.target.value})}>
         {triageOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
       </label>
       <label>Evidência ou justificativa
        <textarea rows={2} maxLength={2000} value={draft.reviewNote} onChange={e=>patch(row.ingredient_id,{reviewNote:e.target.value})} placeholder="Ex.: pesar a porção preparada; ingrediente alternativo ainda não definido."/>
       </label>
       <button className="secondary" type="button" disabled={busyId!==null} onClick={()=>void saveTriage(row)}>Salvar triagem</button>
      </fieldset>
      <fieldset className="cc-n2-fields">
       <legend>2. Vínculo candidato com a biblioteca</legend>
       <label>Alimento correspondente (hipótese)
        <select value={draft.foodId} onChange={e=>patch(row.ingredient_id,{foodId:e.target.value,variantId:""})}>
         <option value="">Ainda não identificado</option>
         {foods.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
       </label>
       <label>Variante e preparo da fonte
        <select value={draft.variantId} onChange={e=>patch(row.ingredient_id,{variantId:e.target.value})} disabled={!draft.foodId}>
         <option value="">Variante ainda não escolhida</option>
         {filtered.map(v=><option value={v.id} key={v.id}>{v.variant_name} · {v.review_status}</option>)}
        </select>
       </label>
       <label>Massa efetivamente aferida (g) — opcional enquanto não medida
        <input type="number" min="0.001" max="1000000" step="any" value={draft.mass} onChange={e=>patch(row.ingredient_id,{mass:e.target.value})} placeholder="Não preencher por estimativa"/>
       </label>
       <label>Como a massa foi medida/comprovada?
        <textarea rows={2} maxLength={1000} value={draft.massEvidence} onChange={e=>patch(row.ingredient_id,{massEvidence:e.target.value})} placeholder="Descreva a pesagem e o rendimento real. Não presumir conversões."/>
       </label>
       <label>Justificativa do vínculo e preparo
        <textarea rows={2} maxLength={2000} value={draft.matchNotes} onChange={e=>patch(row.ingredient_id,{matchNotes:e.target.value})} placeholder="Descreva correspondência, diferenças e o que falta confirmar."/>
       </label>
       <button type="button" className="secondary" disabled={busyId!==null||!draft.foodId} onClick={()=>void saveCandidate(row)}>Salvar vínculo como candidato</button>
      </fieldset>
     </div>
    </details>;
   })}</div>
  </>}
  <p className="detail-note">Só um revisor nutricional credenciado poderá confirmar vínculos após verificação da medida, massa, preparo e fonte. Os registros TACO/USDA usados pelo aplicativo ainda aguardam revisão especializada.</p>
 </section>;
}
