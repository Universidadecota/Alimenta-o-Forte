import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";

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
 original_ingredients:string;
 original_preparation:string;
 ingredient_review_status:string;
 commercial_rights_status:string;
};
type Ingredient={name:string;quantity:number|null;unit:string};

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
 const [filter,setFilter]=useState<"all"|"pending"|"in_review"|"verified"|"rejected">("all");
 const [loading,setLoading]=useState(true);
 const [detailsLoading,setDetailsLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");

 const load=async()=>{
  if(!supabase)return;
  const client=supabase;
  setLoading(true);setError("");
  try{
   const [catalogResult,reviewResult]=await Promise.all([
    client.rpc("cc_admin_beta_catalog_overview"),
    client.from("cc_recipe_allergen_reviews").select("recipe_id,status,declared_allergens,cross_contact_status,cross_contact_notes,evidence_notes,reviewed_at")
   ]);
   if(catalogResult.error)throw catalogResult.error;
   if(reviewResult.error)throw reviewResult.error;
   setCatalog(((catalogResult.data??[]) as CatalogRecipe[]).filter(row=>row.enabled));
   const next:Record<string,AllergenReview>={};
   for(const review of (reviewResult.data??[]) as AllergenReview[])next[review.recipe_id]=review;
   setReviews(next);
  }catch{
   setError("Não foi possível carregar a fila de revisão. Confira sua permissão administrativa.");
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
     .select("original_ingredients,original_preparation,ingredient_review_status,commercial_rights_status")
     .eq("recipe_id",recipe.recipe_id).maybeSingle(),
    client.from("recipe_ingredients")
     .select("name,quantity,unit").eq("recipe_id",recipe.recipe_id).order("position")
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
  return (filter==="all"||status===filter)&&row.title.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
 });
 const totalByStatus=(status:ReviewStatus)=>catalog.filter(row=>(reviews[row.recipe_id]?.status??"pending")===status).length;
 const existing=selected?reviews[selected.recipe_id]:undefined;
 const editable=selected&&!detailsLoading&&!busy&&existing?.status!=="verified"&&existing?.status!=="rejected";

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
   <button type="button" className="secondary" disabled={busy||loading} onClick={()=>void load()}>Atualizar fila</button>
  </div>
  {loading?<p role="status">Carregando fila...</p>:<p className="detail-note">{visible.length} receitas nos filtros atuais.</p>}
  <div style={{maxHeight:250,overflowY:"auto",marginBottom:16}}>
   {visible.map(row=><button type="button" className="secondary" key={row.recipe_id} disabled={busy} onClick={()=>void choose(row)} style={{display:"flex",width:"100%",gap:8,justifyContent:"space-between",textAlign:"left",marginBottom:4}}>
    <span>{row.title}</span><small>{reviewLabel[reviews[row.recipe_id]?.status??"pending"]}</small>
   </button>)}
  </div>
  {selected&&<div className="cc-admin-pilot-readonly">
   <h4>{selected.title}</h4>
   <p className="detail-note">Situação: {reviewLabel[existing?.status??"pending"]}. O texto original é preservado; esta área não altera receita, preparo nem quantidades.</p>
   {detailsLoading?<p role="status">Carregando detalhes...</p>:<>
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
