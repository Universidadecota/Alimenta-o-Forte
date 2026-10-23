import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
import AdminAllergenIngredientEvidence from "./AdminAllergenIngredientEvidence";
import {collectAllergenTriageHints,type AllergenTriageHints} from "./lib/allergenTriageHints.mjs";

type CatalogRecipe={recipe_id:string;title:string;enabled:boolean};
type ReviewStatus="pending"|"in_review"|"verified"|"rejected";
type AllergenReview={
 recipe_id:string;
 status:ReviewStatus;
 declared_allergens:string[];
 cross_contact_status:"unknown"|"possible"|"assessed";
 cross_contact_notes:string;
 evidence_notes:string;
 reviewed_at:string|null;
};
type Source={
 reference_hash:string;
 original_ingredients:string;
 original_preparation:string;
 ingredient_review_status:string;
 commercial_rights_status:string;
};
type Ingredient={id:string;name:string;position:number;quantity:number|null;unit:string};

const reviewLabel:Record<ReviewStatus,string>={
 pending:"Pendente",in_review:"Em revisão",verified:"Verificada (editorial)",rejected:"Rejeitada"
};

export default function AdminAllergenReviewQueue(){
 const [catalog,setCatalog]=useState<CatalogRecipe[]>([]);
 const [reviews,setReviews]=useState<Record<string,AllergenReview>>({});
 const [selected,setSelected]=useState<CatalogRecipe|null>(null);
 const [source,setSource]=useState<Source|null>(null);
 const [ingredients,setIngredients]=useState<Ingredient[]>([]);
 const [allergenDraft,setAllergenDraft]=useState("");
 const [evidenceDraft,setEvidenceDraft]=useState("");
 const [contactDraft,setContactDraft]=useState("");
 const [search,setSearch]=useState("");
 const [hints,setHints]=useState<Record<string,AllergenTriageHints>>({});
 const [hintState,setHintState]=useState<"loading"|"ready"|"error">("loading");
 const [hintFilter,setHintFilter]=useState<"all"|"with"|"without"|"missing">("all");
 const [filter,setFilter]=useState<"all"|"pending"|"in_review"|"verified"|"rejected">("all");
 const [loading,setLoading]=useState(true);
 const [detailsLoading,setDetailsLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");

 const load=async()=>{
  if(!supabase)return;
  const client=supabase;
  setLoading(true);setError("");setHintState("loading");setHints({});
  try{
   const [catalogResult,reviewResult]=await Promise.all([
    client.rpc("cc_admin_beta_catalog_overview"),
    client.from("cc_recipe_allergen_reviews").select("recipe_id,status,declared_allergens,cross_contact_status,cross_contact_notes,evidence_notes,reviewed_at")
   ]);
   if(catalogResult.error)throw catalogResult.error;
   if(reviewResult.error)throw reviewResult.error;
   const enabled=((catalogResult.data??[]) as CatalogRecipe[]).filter(row=>row.enabled);
   setCatalog(enabled);
   const next:Record<string,AllergenReview>={};
   for(const review of (reviewResult.data??[]) as AllergenReview[])next[review.recipe_id]=review;
   setReviews(next);
   // Apenas leitura administrativa dos textos originais; 30 IDs por lote evitam URLs extensas.
   // Falha nas pistas NÃO bloqueia a fila original e jamais declara receita segura.
   try{
    const nextHints:Record<string,AllergenTriageHints>={};
    for(const row of enabled)nextHints[row.recipe_id]=collectAllergenTriageHints(null);
    const chunks:string[][]=[];
    for(let i=0;i<enabled.length;i+=30)chunks.push(enabled.slice(i,i+30).map(row=>row.recipe_id));
    const results=await Promise.all(chunks.map(ids=>client.from("cc_official_recipe_source_records")
     .select("recipe_id,original_ingredients").in("recipe_id",ids)));
    for(const result of results){
     if(result.error)throw result.error;
     for(const row of (result.data??[]) as Array<{recipe_id:string;original_ingredients:string|null}>){
      nextHints[row.recipe_id]=collectAllergenTriageHints(row.original_ingredients);
     }
    }
    setHints(nextHints);setHintState("ready");
   }catch{
    setHints({});setHintState("error");
   }
  }catch{
   setError("Não foi possível carregar a fila de revisão. Confira sua permissão administrativa.");
   setHintState("error");
  }finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[]);

 const choose=async(recipe:CatalogRecipe)=>{
  if(!supabase||busy)return;
  const client=supabase;
  setSelected(recipe);setSource(null);setIngredients([]);setDetailsLoading(true);
  setError("");setMessage("");
  const existing=reviews[recipe.recipe_id];
  setAllergenDraft((existing?.declared_allergens??[]).join(", "));
  setEvidenceDraft(existing?.evidence_notes??"");
  setContactDraft(existing?.cross_contact_notes??"");
  try{
   const [sourceResult,ingredientResult]=await Promise.all([
    client.from("cc_official_recipe_source_records")
     .select("reference_hash,original_ingredients,original_preparation,ingredient_review_status,commercial_rights_status")
     .eq("recipe_id",recipe.recipe_id).maybeSingle(),
    client.from("recipe_ingredients")
     .select("id,name,quantity,unit,position").eq("recipe_id",recipe.recipe_id).order("position")
   ]);
   if(sourceResult.error)throw sourceResult.error;
   if(ingredientResult.error)throw ingredientResult.error;
   setSource(sourceResult.data as Source|null);
   setIngredients((ingredientResult.data??[]) as Ingredient[]);
  }catch{
   setError("Não foi possível carregar os ingredientes da receita selecionada.");
  }finally{setDetailsLoading(false);}
 };

 const saveDraft=async()=>{
  if(!supabase||!selected||busy||detailsLoading)return;
  const client=supabase;
  const current=reviews[selected.recipe_id];
  if(current?.status==="verified"||current?.status==="rejected"){
   setError("Esta avaliação tem decisão registrada. Reabertura exige procedimento editorial específico.");
   return;
  }
  if(evidenceDraft.trim().length<10){
   setError("Registre pelo menos 10 caracteres descrevendo a fonte, as dúvidas ou o trabalho de revisão.");
   return;
  }
  if(!window.confirm("Salvar apenas uma TRIAGEM EM REVISÃO? Nenhum alimento será declarado seguro e o bloqueio de sugestões para alérgicos continuará ativo."))return;
  setBusy(true);setError("");setMessage("");
  const declared=[...new Set(allergenDraft.split(",").map(v=>v.trim()).filter(Boolean))];
  const {data,error:saveError}=await client.from("cc_recipe_allergen_reviews").upsert({
   recipe_id:selected.recipe_id,
   status:"in_review",
   declared_allergens:declared,
   cross_contact_status:"unknown",
   cross_contact_notes:contactDraft.trim(),
   evidence_notes:evidenceDraft.trim()
  },{onConflict:"recipe_id"}).select("recipe_id,status,declared_allergens,cross_contact_status,cross_contact_notes,evidence_notes,reviewed_at").single();
  if(saveError){
   setError("Não foi possível salvar a triagem. Nenhuma aprovação de segurança foi concedida.");
  }else if(data){
   setReviews(currentReviews=>({...currentReviews,[selected.recipe_id]:data as AllergenReview}));
   setMessage("Triagem salva como Em revisão. Elegibilidade para sugestões continua BLOQUEADA.");
  }
  setBusy(false);
 };

 const visible=catalog.filter(row=>{
  const status=reviews[row.recipe_id]?.status??"pending";
  const hint=hints[row.recipe_id];
  const matched=hintFilter==="all"||hintState!=="ready"||
   (hintFilter==="with"&&Boolean(hint?.hints.length||hint?.composedTerms.length))||
   (hintFilter==="without"&&Boolean(hint?.sourceAvailable)&&!hint?.hints.length&&!hint?.composedTerms.length)||
   (hintFilter==="missing"&&!hint?.sourceAvailable);
  return matched&&(filter==="all"||status===filter)&&row.title.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
 });
 const totalByStatus=(status:ReviewStatus)=>catalog.filter(row=>(reviews[row.recipe_id]?.status??"pending")===status).length;
 const existing=selected?reviews[selected.recipe_id]:undefined;
 const editable=selected&&!detailsLoading&&!busy&&existing?.status!=="verified"&&existing?.status!=="rejected";
 const selectedHints=selected?hints[selected.recipe_id]:undefined;
 const countHinted=catalog.filter(row=>{
  const item=hints[row.recipe_id];return Boolean(item?.hints.length||item?.composedTerms.length);
 }).length;
 const countNoSource=catalog.filter(row=>!hints[row.recipe_id]?.sourceAvailable).length;
 const copyHints=()=>{
  if(!editable||!selectedHints?.hints.length)return;
  const values=[...allergenDraft.split(",").map(v=>v.trim()).filter(Boolean)];
  const seen=new Set(values.map(v=>v.toLocaleLowerCase("pt-BR")));
  for(const item of selectedHints.hints){
   if(!seen.has(item.code)){values.push(item.code);seen.add(item.code);}
  }
  setAllergenDraft(values.join(", "));
  setMessage("Pistas copiadas apenas para este formulário. Confira manualmente antes de salvar; nenhuma receita foi aprovada.");
 };

 return <section className="detail-panel" style={{marginTop:20}} aria-label="Fila de revisão editorial de alergênicos">
  <h3>Triagem editorial de alergênicos · Beta</h3>
  <p className="detail-note">Fila administrativa das receitas habilitadas no Beta. Registros iniciados aqui são apenas rascunhos de investigação: ausência de termos não demonstra ausência de alergênicos. Nenhuma triagem habilita sugestões automáticas.</p>
  <div className="notice" role="status">
   <strong>Proteção alimentar mantida:</strong> a revisão exige avaliação específica de derivados, rótulos, fornecedores e contato cruzado. A aprovação final não é feita neste painel.
  </div>
  <p className="detail-note">{catalog.length} receitas no Beta · {totalByStatus("pending")} pendentes · {totalByStatus("in_review")} em revisão · {totalByStatus("verified")} verificadas · {totalByStatus("rejected")} rejeitadas.</p>
  <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:12}}>
   <input aria-label="Buscar na fila de alergênicos" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar receita..." style={{flex:"1 1 220px",minWidth:0}}/>
   <select aria-label="Filtrar revisão de alergênicos" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}>
    <option value="all">Todos os estados</option>
    <option value="pending">Pendentes</option>
    <option value="in_review">Em revisão</option>
    <option value="verified">Verificadas</option>
    <option value="rejected">Rejeitadas</option>
   </select>
   <select aria-label="Filtrar pistas textuais não conclusivas" disabled={hintState!=="ready"} value={hintFilter} onChange={e=>setHintFilter(e.target.value as typeof hintFilter)}>
    <option value="all">Todas as pistas</option>
    <option value="with">Com pistas para investigar</option>
    <option value="without">Sem termos encontrados (não liberadas)</option>
    <option value="missing">Sem origem textual</option>
   </select>
   <button type="button" className="secondary" disabled={busy||loading} onClick={()=>void load()}>Atualizar fila</button>
  </div>
  {hintState==="ready"&&<p className="detail-note" role="status">Pré-triagem textual: {countHinted} receitas com pistas para investigar · {catalog.length-countHinted-countNoSource} sem termos encontrados · {countNoSource} sem texto de origem. <strong>Nenhum desses números significa segurança alimentar.</strong></p>}
  {hintState==="error"&&<p role="status" className="detail-note">Pistas indisponíveis nesta consulta; a fila editorial permanece acessível e sem aprovações automáticas.</p>}
  {loading?<p role="status">Carregando fila...</p>:<p className="detail-note">{visible.length} receitas nos filtros atuais.</p>}
  <div style={{maxHeight:250,overflowY:"auto",marginBottom:16}}>
   {visible.map(row=><button type="button" className="secondary" key={row.recipe_id} disabled={busy} onClick={()=>void choose(row)} style={{display:"flex",width:"100%",gap:8,justifyContent:"space-between",textAlign:"left",marginBottom:4}}>
    <span>{row.title}</span><span style={{display:"grid",gap:3,textAlign:"right",flexShrink:0}}>
     <small>{reviewLabel[reviews[row.recipe_id]?.status??"pending"]}</small>
     {hintState==="ready"&&<small>{!hints[row.recipe_id]?.sourceAvailable?"Sem fonte":(hints[row.recipe_id].hints.length+hints[row.recipe_id].composedTerms.length)>0?"Pistas textuais":"Sem pistas ≠ seguro"}</small>}
    </span>
   </button>)}
  </div>
  {selected&&<div className="cc-admin-pilot-readonly">
   <h4>{selected.title}</h4>
   <p className="detail-note">Situação: {reviewLabel[existing?.status??"pending"]}. O texto original é preservado; esta área não altera receita, preparo nem quantidades.</p>
   {detailsLoading?<p role="status">Carregando detalhes...</p>:<>
    {hintState==="ready"&&<div className="notice" style={{marginBottom:12}}>
     <strong>Pré-triagem assistida — apenas pistas, sem conclusão de segurança</strong>
     {selectedHints?.sourceAvailable?selectedHints.hints.length||selectedHints.composedTerms.length?
      <ul>{selectedHints.hints.map(item=><li key={item.code}>{item.label}: termos “{item.terms.join(", ")}”</li>)}
       {selectedHints.composedTerms.map(term=><li key={term}>Ingrediente composto “{term}”: verificar rótulo e fornecedor.</li>)}</ul>:
      <p>Nenhum termo localizado. Isso NÃO indica ausência de alergênicos, derivados ou contato cruzado.</p>:
      <p>Texto de origem não localizado nesta pré-triagem. Não considerar receita liberada.</p>}
     {editable&&Boolean(selectedHints?.hints.length)&&<button type="button" className="secondary" onClick={copyHints}>Copiar pistas para o rascunho (sem salvar)</button>}
    </div>}
    <details open>
     <summary>Ingredientes originais e transcritos</summary>
     {source?<pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{source.original_ingredients}</pre>:<p>Fonte original não localizada.</p>}
     {ingredients.length>0&&<ul>{ingredients.map((item,index)=><li key={index}>{item.name}</li>)}</ul>}
    </details>
    <details>
     <summary>Preparo original e pendências</summary>
     <p>Revisão de medidas: {source?.ingredient_review_status??"não informada"} · Direitos: {source?.commercial_rights_status??"não informado"}.</p>
     <pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{source?.original_preparation??"Não encontrado"}</pre>
    </details>
    <AdminAllergenIngredientEvidence key={selected.recipe_id} recipeId={selected.recipe_id} sourceHash={source?.reference_hash??""} ingredients={ingredients} editable={Boolean(editable)}/>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr)",gap:6,marginTop:18}}>
     <label htmlFor="cc-review-allergens">Suspeitas de alergênicos ou derivados (separadas por vírgula)</label>
     <input id="cc-review-allergens" style={{display:"block",width:"100%",minWidth:0,boxSizing:"border-box"}} value={allergenDraft} disabled={!editable} onChange={e=>setAllergenDraft(e.target.value)} placeholder="Ex.: soja, leite — apenas hipóteses"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr)",gap:6,marginTop:14}}>
     <label htmlFor="cc-review-evidence">Fontes e pendências da análise</label>
     <textarea id="cc-review-evidence" style={{display:"block",width:"100%",minWidth:0,boxSizing:"border-box",minHeight:112,resize:"vertical"}} value={evidenceDraft} disabled={!editable} onChange={e=>setEvidenceDraft(e.target.value)} rows={4} placeholder="Documentos conferidos, informação ausente, fornecedor, rótulo..."/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr)",gap:6,marginTop:14}}>
     <label htmlFor="cc-review-cross-contact">Pendências de contato cruzado</label>
     <textarea id="cc-review-cross-contact" style={{display:"block",width:"100%",minWidth:0,boxSizing:"border-box",minHeight:90,resize:"vertical"}} value={contactDraft} disabled={!editable} onChange={e=>setContactDraft(e.target.value)} rows={3} placeholder="Ex.: utensílios, fabricação, fornecedor ou ambiente a esclarecer"/>
    </div>
    <p className="detail-note">Ao salvar, o status será “Em revisão” e o contato cruzado continuará “Desconhecido”. A marca “Verificada” não pode ser concedida aqui.</p>
    <button type="button" className="primary" disabled={!editable} onClick={()=>void saveDraft()}>{busy?"Salvando...":"Salvar triagem pendente"}</button>
   </>}
  </div>}
  {error&&<p role="alert">{error}</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
