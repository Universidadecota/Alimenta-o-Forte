import {useEffect,useRef,useState} from "react";
import {supabase} from "./lib/supabase";
import PilotMeasureEditorialReview from "./PilotMeasureEditorialReview";
import PilotMeasureSourceEvidence from "./PilotMeasureSourceEvidence";
import {classifyMeasure,measureGroups,measureUnitLabel,suggestMeasure,summarizeMeasures,prepareDraftCandidates,isMeasureSourceAligned,type DraftCandidate,type BatchItem,type BatchResult} from "./lib/pilotMeasureBatch";
import {summarizeSourceReconciliation,type CurrentPilotIngredient,type PilotSourceReconciliation,type RecipeReconciliation} from "./lib/pilotSourceReconciliation";

type Review={
 ingredient_id:string;
 recipe_id:string;
 source_text:string;
 source_position:number;
 proposed_quantity:number|null;
 proposed_unit:string|null;
 proposed_ingredient:string|null;
 review_status:"pending"|"draft"|"confirmed"|"needs_manual_review";
 review_notes:string;
 recipes:{title:string}|{title:string}[]|null;
 recipe_ingredients:{name:string;position:number}|{name:string;position:number}[]|null;
};
const statuses=[
 ["pending","Aguardando revisão"],["draft","Rascunho de medida"],
 ["needs_manual_review","Conferência manual"],["confirmed","Confirmada editorialmente"],
] as const;
const units=[
 ["g","gramas"],["kg","quilogramas"],["ml","mililitros"],["l","litros"],
 ["colher_cha","colher (chá)"],["colher_sopa","colher (sopa)"],["xicara","xícara"],
 ["dente","dente"],["fatia","fatia"],["pitada","pitada"],["ramo","ramo"],
 ["lata","lata"],["copo","copo"],["unidade","unidade"],["punhado","punhado"],
 ["ovo","ovo"],["cebola","cebola"],["tomate","tomate"],
] as const;
function nestedTitle(v:{title:string}|{title:string}[]|null):string{
 return Array.isArray(v)?v[0]?.title??"Receita do piloto":v?.title??"Receita do piloto";
}
export default function PilotIngredientMeasureReview(){
 const [rows,setRows]=useState<Review[]>([]);
 const [status,setStatus]=useState("pending");
 const [search,setSearch]=useState("");
 const [recipeSearch,setRecipeSearch]=useState("");
 const [page,setPage]=useState(0);
 const [total,setTotal]=useState(0);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [active,setActive]=useState<string|null>(null);
 const [quantity,setQuantity]=useState("");
 const [unit,setUnit]=useState("");
 const [ingredient,setIngredient]=useState("");
 const [notes,setNotes]=useState("");
 const [batchBusy,setBatchBusy]=useState(false);
 const [batchProgress,setBatchProgress]=useState(0);
 const [batchResult,setBatchResult]=useState<BatchResult|null>(null);
 const [sourceMismatchCount,setSourceMismatchCount]=useState<number|null>(null);
 const [reconciliation,setReconciliation]=useState<PilotSourceReconciliation|null>(null);
 const [evidenceRecipe,setEvidenceRecipe]=useState<RecipeReconciliation|null>(null);
 const evidenceAnchorRef=useRef<HTMLDivElement>(null);
 const globalToolsRef=useRef<HTMLDetailsElement>(null);
 const [draftCandidates,setDraftCandidates]=useState<DraftCandidate[]>([]);
 const [selectedDraftIds,setSelectedDraftIds]=useState<string[]>([]);
 const [scopedSelectedDraftIds,setScopedSelectedDraftIds]=useState<string[]>([]);
 const [draftSaving,setDraftSaving]=useState(false);
 const [editorialRefreshKey,setEditorialRefreshKey]=useState(0);
 const pageSize=25;
 const latestLoad=useRef(0);
 // Lê todo o inventário em páginas menores que o limite padrão do PostgREST.
 // Nenhuma chamada de análise atualiza receitas, medidas ou notas.
 const analyzeAll=async()=>{
  if(!supabase||batchBusy||draftSaving)return;
  setBatchBusy(true);setBatchProgress(0);setBatchResult(null);setSourceMismatchCount(null);setReconciliation(null);setEvidenceRecipe(null);
  setDraftCandidates([]);setSelectedDraftIds([]);setError("");setMessage("");
  try{
   const all:BatchItem[]=[];
   const size=250;
   let expected=0;
   for(let offset=0;offset<expected||offset===0;offset+=size){
    const {data,count,error:readError}=await supabase
     .from("cc_pilot_ingredient_measure_reviews")
     .select("ingredient_id,recipe_id,source_position,source_text,review_status,recipes(title),recipe_ingredients(name,position)",{count:"exact"})
     .order("ingredient_id",{ascending:true})
     .range(offset,offset+size-1);
    if(readError)throw readError;
    if(offset===0)expected=count??0;
    if(expected>10000)throw new Error("Inventário maior que o limite de análise. Solicite paginação adicional.");
    all.push(...((data??[]) as BatchItem[]));
    setBatchProgress(all.length);
    if(expected>0&&(data??[]).length===0)break;
   }
   if(all.length!==expected)throw new Error("A leitura foi incompleta. Nenhum resultado parcial foi aplicado; tente novamente.");
   // A conciliação considera somente as receitas realmente presentes no inventário.
   // A contagem exata por página bloqueia publicação de resultados incompletos.
   const recipeIds=[...new Set(all.map(row=>row.recipe_id).filter((id):id is string=>Boolean(id)))];
   const current:CurrentPilotIngredient[]=[];
   let currentExpected=0;
   if(recipeIds.length>0){
    for(let offset=0;offset<currentExpected||offset===0;offset+=size){
     const {data,count,error:readError}=await supabase
      .from("recipe_ingredients")
      .select("id,recipe_id,name,position",{count:"exact"})
      .in("recipe_id",recipeIds)
      .order("id",{ascending:true})
      .range(offset,offset+size-1);
     if(readError)throw readError;
     if(offset===0)currentExpected=count??0;
     if(currentExpected>10000)throw new Error("Catálogo atual maior que o limite de conciliação.");
     current.push(...((data??[]) as CurrentPilotIngredient[]));
     if(currentExpected>0&&(data??[]).length===0)break;
    }
   }
   if(current.length!==currentExpected||all.length>0&&currentExpected===0)throw new Error("A leitura dos ingredientes atuais foi incompleta. Nenhum relatório parcial foi aplicado.");
   const summary=summarizeMeasures(all);
   const reconciliationSnapshot=summarizeSourceReconciliation(all,current);
   if(reconciliationSnapshot.exact!==all.filter(isMeasureSourceAligned).length){
    throw new Error("As duas leituras do catálogo divergiram. Refazer a análise antes de qualquer decisão editorial.");
   }
   setReconciliation(reconciliationSnapshot);
   setSourceMismatchCount(reconciliationSnapshot.nameMismatch+
    reconciliationSnapshot.positionMismatch+reconciliationSnapshot.bothMismatch+
    reconciliationSnapshot.missingCurrent);
   const candidateList=prepareDraftCandidates(all,20);
   setDraftCandidates(candidateList);
   setBatchResult(summary);
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível analisar o inventário.");}
  finally{setBatchBusy(false);}
 };
 // Cada seleção é explícita; lote transacional com limite de 20 no servidor.
 const saveDraftBatch=async(candidates:ReadonlyArray<DraftCandidate>,selectedIds:ReadonlyArray<string>)=>{
  if(!supabase||batchBusy||draftSaving)return;
  const selected=candidates.filter(entry=>selectedIds.includes(entry.ingredient_id));
  if(selected.length===0||selected.length>20){setError("Selecione entre 1 e 20 ingredientes.");return;}
  const selectedDescription=selected.map(entry=>
   "• "+entry.recipe_title+" · ingrediente "+(entry.source_position+1)+": "+entry.source_text+
   " → "+entry.quantity+" "+measureUnitLabel(entry.unit)+" de "+entry.ingredient
  ).join("\n");
  const confirmed=window.confirm("Salvar "+selected.length+" medidas como RASCUNHO editorial?\n\n"+
   selectedDescription+"\n\n"+
   "Nenhuma medida será aprovada. Receitas, ingredientes originais, compras, porções e nutrição não serão alterados.\n\n"+
   "Confira a receita e a medida de cada ocorrência antes de prosseguir.");
  if(!confirmed)return;
  setDraftSaving(true);setError("");setMessage("");
  try{
   const {data,error:dbError}=await supabase.rpc("cc_save_pilot_measure_drafts_batch",{
    p_items:selected.map(entry=>({
     ingredient_id:entry.ingredient_id,source_text:entry.source_text,
     quantity:entry.quantity,unit:entry.unit,ingredient:entry.ingredient
    }))
   });
   if(dbError)throw dbError;
   if(data!==selected.length)throw new Error("Número de registros salvo diferente da seleção. Recarregue antes de continuar.");
   setBatchResult(null);setReconciliation(null);setEvidenceRecipe(null);setDraftCandidates([]);setSelectedDraftIds([]);setScopedSelectedDraftIds([]);setActive(null);
   setMessage(data+" rascunhos salvos. Nenhuma medida foi confirmada. Atualize a pré-análise para outras propostas.");
   setEditorialRefreshKey(key=>key+1);
   await load();
  }catch(err){setError(err instanceof Error?err.message:"Erro ao salvar lote. O servidor cancelou o lote se houve divergência.");}
  finally{setDraftSaving(false);}
 };
 const load=async()=>{
  if(!supabase)return;
  const runId=++latestLoad.current;
  setLoading(true);setError("");
  try{
   let q=supabase.from("cc_pilot_ingredient_measure_reviews")
    .select("ingredient_id,recipe_id,source_text,source_position,proposed_quantity,proposed_unit,proposed_ingredient,review_status,review_notes,recipes!inner(title),recipe_ingredients(name,position)",{count:"exact"})
    .order("recipe_id",{ascending:true})
    .order("source_position",{ascending:true})
    .range(page*pageSize,(page+1)*pageSize-1);
   if(status!=="all")q=q.eq("review_status",status);
   if(search.trim())q=q.ilike("source_text","%"+search.trim().replace(/[%_]/g,"")+"%");
   if(recipeSearch.trim())q=q.ilike("recipes.title","%"+recipeSearch.trim().replace(/[%_]/g,"")+"%");
   const {data,error:dbError,count}=await q;
   if(runId!==latestLoad.current)return;
   if(dbError)throw dbError;
   setRows((data??[]) as unknown as Review[]);
   setTotal(count??0);
  }catch(err){if(runId===latestLoad.current)setError(err instanceof Error?err.message:"Erro ao carregar ingredientes.");}
  finally{if(runId===latestLoad.current)setLoading(false);}
 };
 useEffect(()=>{void load();},[page,status,search,recipeSearch]);
 useEffect(()=>{setScopedSelectedDraftIds([]);},[page,status,search,recipeSearch]);
 useEffect(()=>{if(evidenceRecipe)evidenceAnchorRef.current?.scrollIntoView({behavior:"smooth",block:"start"});},[evidenceRecipe]);
 const begin=(r:Review)=>{
  const proposal=suggestMeasure(r.source_text);
  setActive(r.ingredient_id);
  setQuantity(r.proposed_quantity!=null?String(r.proposed_quantity):proposal?String(proposal.quantity):"");
  setUnit(r.proposed_unit??proposal?.unit??"");
  setIngredient(r.proposed_ingredient??proposal?.ingredient??"");
  setNotes(r.review_notes??"");
  setMessage("");setError("");
 };
 const save=async(row:Review,mode:"draft"|"needs_manual_review")=>{
  if(!supabase||busy)return;
  if(!isMeasureSourceAligned(row)){
   setError("O texto ou a posição mudou desde o inventário. É necessária conciliação editorial antes do rascunho.");
   return;
  }
  const numeric=quantity.trim()?Number(quantity.replace(",",".")):null;
  if(mode==="draft"&&(
    numeric==null||!Number.isFinite(numeric)||numeric<=0||numeric>100000
    ||Math.abs(numeric*10000-Math.round(numeric*10000))>1e-7
    ||!unit||!ingredient.trim()||ingredient.trim().length>180
  )){
   setError("Para salvar um rascunho, informe quantidade positiva, unidade e nome do ingrediente.");
   return;
  }
  if(mode==="needs_manual_review"&&notes.trim().length<8){
   setError("Informe o motivo da conferência manual (pelo menos 8 caracteres).");return;
  }
  if(row.review_status==="confirmed"){
   setError("Medidas confirmadas são somente leitura.");return;
  }
  setBusy(true);setError("");setMessage("");
  try{
   const {error:dbError}=await supabase.rpc("cc_save_pilot_measure_draft_single",{
    p_id:row.ingredient_id,
    p_source_text:row.source_text,
    p_quantity:mode==="draft"?numeric:null,
    p_unit:mode==="draft"?unit:null,
    p_ingredient:mode==="draft"?ingredient.trim():null,
    p_notes:notes.trim(),
    p_status:mode,
   });
   if(dbError)throw dbError;
   setActive(null);
   setMessage(mode==="draft"?"Rascunho registrado. Ainda não aprovado para cálculos.":"Ingrediente encaminhado para conferência manual.");
   setEditorialRefreshKey(key=>key+1);
   await load();
  }catch(err){setError(err instanceof Error?err.message:"Falha ao salvar a revisão.");}
  finally{setBusy(false);}
 };
 const scopedSummary=recipeSearch.trim()&&!loading&&!error&&rows.length>0?summarizeMeasures(rows):null;
 const scopedDraftCandidates=scopedSummary?prepareDraftCandidates(rows,20):[];
 return <section className="cc-measure-review">
  <p>Inventário editorial das expressões de origem. A contagem atual é exibida na pré-análise global. Uma proposta registrada aqui <strong>não modifica a receita</strong> e não libera ajustes de porções, somas de compras nem valores nutricionais. Apenas a administração pode consultar e revisar.</p>
  <details className="cc-measure-toolbox" ref={globalToolsRef}>
   <summary><strong>Ferramentas globais</strong> · pré-análise e conferência de rascunhos (expandir)</summary>
  <section className="cc-measure-batch" aria-label="Análise em lote dos ingredientes">
   <div className="cc-measure-batch-header">
    <div>
     <strong>Pré-análise do acervo completo</strong>
     <p>Classifica as expressões em medidas simples, intervalos, alternativas, preparos compostos, opcionais e casos manuais. <strong>Não salva nem aprova nada.</strong></p>
    </div>
    <button type="button" disabled={batchBusy||draftSaving||loading} onClick={()=>void analyzeAll()}>
     {batchBusy?"Analisando…":"Analisar todos os ingredientes"}
    </button>
   </div>
   {batchBusy&&<p role="status">Lidos {batchProgress} registros. Sem alterações no banco.</p>}
   {batchResult&&<div aria-live="polite">
    <p><strong>{batchResult.total} expressões analisadas.</strong> {batchResult.pending} continuam aguardando revisão. {batchResult.otherStatuses} já possuem outro status editorial.</p>
    {sourceMismatchCount!==null&&<p><strong>{sourceMismatchCount} expressões sem correspondência exata de texto e posição no ingrediente atual.</strong> Não entram na lista de rascunhos rápidos e exigem conciliação editorial.</p>}
    <div className="cc-measure-batch-grid">
     {measureGroups.map(group=><article className="cc-measure-batch-group" key={group.key}>
      <strong>{batchResult.byGroup[group.key]}</strong>
      <span>{group.label}</span>
      <small>{group.explanation}</small>
      {batchResult.examples[group.key].length>0&&<details>
       <summary>Ver exemplos</summary>
       <ul>{batchResult.examples[group.key].map(entry=><li key={entry.id}>
        <button type="button" className="secondary" onClick={()=>{
         setPage(0);setStatus("all");setSearch(entry.text);setRecipeSearch("");setActive(null);
        }}>{entry.text}</button>
        {entry.proposal&&<small> {entry.proposal.quantity} · {measureUnitLabel(entry.proposal.unit)} · {entry.proposal.ingredient}</small>}
       </li>)}</ul>
      </details>}
     </article>)}
    </div>
    {reconciliation&&<section className="cc-measure-draft-preview" aria-label="Conciliação técnica das medidas por receita">
     <h4>Conciliação técnica por receita · somente leitura</h4>
     <p>Comparação pontual entre as fichas históricas e os ingredientes atuais. <strong>Não decide equivalências, não aprova medidas e não altera o banco.</strong> Um desmembramento pode explicar várias diferenças; requer verificação editorial.</p>
     <div className="cc-measure-batch-grid">
      <article className="cc-measure-batch-group"><strong>{reconciliation.originalExpressions}</strong><span>Expressões no inventário histórico</span></article>
      <article className="cc-measure-batch-group"><strong>{reconciliation.currentIngredients}</strong><span>Ingredientes atuais do mesmo piloto</span></article>
      <article className="cc-measure-batch-group"><strong>{reconciliation.exact}</strong><span>Vínculos exatamente alinhados</span></article>
      <article className="cc-measure-batch-group"><strong>{reconciliation.nameMismatch}</strong><span>Diferença apenas de texto</span></article>
      <article className="cc-measure-batch-group"><strong>{reconciliation.positionMismatch}</strong><span>Diferença apenas de posição</span></article>
      <article className="cc-measure-batch-group"><strong>{reconciliation.bothMismatch}</strong><span>Diferença de texto e posição</span></article>
      <article className="cc-measure-batch-group"><strong>{reconciliation.missingCurrent}</strong><span>Históricos sem ingrediente atual correspondente</span></article>
      <article className="cc-measure-batch-group"><strong>{reconciliation.untrackedCurrent}</strong><span>Ingredientes atuais sem ficha histórica correspondente</span></article>
     </div>
     <details>
      <summary><strong>Examinar {reconciliation.affectedRecipes} receitas com diferenças</strong> ({reconciliation.recipes.length} receitas do piloto)</summary>
      <p>Use “Examinar fonte” para abrir a evidência oficial, histórica e atual. “Ver histórico” filtra a revisão individual. Nenhuma dessas ações altera dados.</p>
      <div ref={evidenceAnchorRef}>{evidenceRecipe&&<PilotMeasureSourceEvidence key={evidenceRecipe.recipe_id} recipe={evidenceRecipe} onClose={()=>setEvidenceRecipe(null)}/>}</div>
      <div style={{overflowX:"auto"}}>
       <table>
        <thead><tr><th>Receita</th><th>Texto</th><th>Posição</th><th>Ambos</th><th>Sem atual</th><th>Sem histórico</th><th>Ação</th></tr></thead>
        <tbody>{reconciliation.recipes.filter(recipe=>
         recipe.nameMismatch+recipe.positionMismatch+recipe.bothMismatch+
         recipe.missingCurrent+recipe.untrackedCurrent>0
        ).map(recipe=><tr key={recipe.recipe_id}>
         <td>{recipe.title}</td>
         <td>{recipe.nameMismatch}</td><td>{recipe.positionMismatch}</td>
         <td>{recipe.bothMismatch}</td><td>{recipe.missingCurrent}</td>
         <td>{recipe.untrackedCurrent}</td>
         <td><div className="cc-measure-actions">
          <button type="button" className="secondary" onClick={()=>setEvidenceRecipe(recipe)}>Examinar fonte</button>
          <button type="button" className="secondary" onClick={()=>{
           setPage(0);setStatus("all");setSearch("");setRecipeSearch(recipe.title);setActive(null);setEvidenceRecipe(null);
           globalToolsRef.current?.removeAttribute("open");
          }}>Ver histórico</button>
         </div></td>
        </tr>)}</tbody>
       </table>
      </div>
     </details>
     <p><small>As diferenças são classificações técnicas por ID, texto e posição; não são uma proposta automática de migração 1:N. Decisões de conciliação exigirão registro de origem e aprovação específica.</small></p>
    </section>}
    <section className="cc-measure-draft-preview" aria-label="Prévia para salvar rascunhos em lote">
     <h4>Preparar até 20 rascunhos de medidas simples</h4>
     <p>Estas são as próximas expressões classificadas como medidas simples que continuam pendentes. <strong>Nenhuma está selecionada por padrão.</strong> Confira cada item. Salvar rascunho não significa aprovar a medida.</p>
     {draftCandidates.length>0?<div className="cc-measure-draft-list">
      {draftCandidates.map(entry=><label key={entry.ingredient_id} className="cc-measure-draft-item">
       <input type="checkbox" checked={selectedDraftIds.includes(entry.ingredient_id)}
        disabled={draftSaving} onChange={event=>{
         const checked=event.target.checked;
         setSelectedDraftIds(ids=>checked?[...ids,entry.ingredient_id]:ids.filter(id=>id!==entry.ingredient_id));
        }}/>
       <span><small><strong>Receita: {entry.recipe_title} · ingrediente {entry.source_position+1}</strong></small>
        <strong>{entry.source_text}</strong>
        <small>Proposta não aprovada: {entry.quantity} · {measureUnitLabel(entry.unit)} · {entry.ingredient}</small>
       </span>
      </label>)}
     </div>:<p>Nenhuma expressão simples pendente nesta prévia.</p>}
     <div className="cc-measure-actions">
      <button className="secondary" type="button" disabled={draftSaving||draftCandidates.length===0}
       onClick={()=>setSelectedDraftIds(draftCandidates.map(entry=>entry.ingredient_id))}>Marcar as {draftCandidates.length} visíveis</button>
      <button className="secondary" type="button" disabled={draftSaving||selectedDraftIds.length===0}
       onClick={()=>setSelectedDraftIds([])}>Desmarcar todas</button>
      <button type="button" disabled={draftSaving||batchBusy||selectedDraftIds.length===0||selectedDraftIds.length>20}
       onClick={()=>void saveDraftBatch(draftCandidates,selectedDraftIds)}>{draftSaving?"Salvando…":"Revisar e salvar "+selectedDraftIds.length+" como rascunho"+(selectedDraftIds.length===1?"":"s")}</button>
     </div>
    </section>
   </div>}
  </section>
  <PilotMeasureEditorialReview refreshKey={editorialRefreshKey} onDecisionSaved={()=>{
   // Após confirmar/devolver, atualize contagem e fila; não reaproveite prévia anterior.
   setBatchResult(null);setReconciliation(null);setEvidenceRecipe(null);setDraftCandidates([]);setSelectedDraftIds([]);
   void load();
  }}/>
  </details>
  <h3>Revisão individual por receita</h3>
  <p>Filtre por título e situação para revisar as medidas. Nenhuma proposta é aprovada automaticamente.</p>
  <div className="cc-measure-filters">
   <label>Situação
    <select value={status} onChange={e=>{setPage(0);setStatus(e.target.value);setActive(null);}}>
     <option value="all">Todas</option>
     {statuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
   </label>
   <label>Pesquisar receita pelo título
    <input value={recipeSearch} onChange={e=>{setPage(0);setRecipeSearch(e.target.value);setActive(null);}} placeholder="Ex.: atum, moqueca" aria-label="Filtrar medidas pelo nome da receita"/>
   </label>
   <label>Pesquisar texto original
    <input value={search} onChange={e=>{setPage(0);setSearch(e.target.value);setActive(null);}} placeholder="Ex.: azeite, ovos, cebola"/>
   </label>
  </div>
  <p aria-live="polite">{loading?"Carregando…":total+" registros na seleção · página "+(page+1)+" de "+Math.max(1,Math.ceil(total/pageSize))}</p>
  {error&&<p role="alert" className="error">{error}</p>}
  {message&&<p role="status">{message}</p>}
  {scopedSummary&&<section className="cc-measure-batch" aria-label="Pré-análise dos ingredientes filtrados">
   <strong>Pré-análise da seleção · {scopedSummary.total} ingredientes nesta página</strong>
   <p>O filtro encontrou {total} registros. As categorias abaixo consideram apenas esta página de até {pageSize} itens. <strong>A pré-análise não salva nem aprova.</strong> Somente medidas marcadas e confirmadas podem ser registradas como rascunho.</p>
   <ul>
    {measureGroups.filter(group=>scopedSummary.byGroup[group.key]>0).map(group=><li key={group.key}>
     {group.label}: <strong>{scopedSummary.byGroup[group.key]}</strong>
    </li>)}
   </ul>
   {scopedDraftCandidates.length>0&&<details>
    <summary>Selecionar entre {scopedDraftCandidates.length} leituras sugeridas (não aprovadas)</summary>
    <p>Marque individualmente somente as propostas conferidas. Nenhuma é pré-selecionada. Salvar rascunho não equivale a confirmação editorial.</p>
    <div className="cc-measure-draft-list">
     {scopedDraftCandidates.map(entry=><label key={entry.ingredient_id} className="cc-measure-draft-item">
      <input type="checkbox" checked={scopedSelectedDraftIds.includes(entry.ingredient_id)}
       disabled={draftSaving||batchBusy} onChange={event=>{
        setScopedSelectedDraftIds(ids=>event.target.checked?[...ids,entry.ingredient_id]:ids.filter(id=>id!==entry.ingredient_id));
       }}/>
      <span><small><strong>{entry.recipe_title} · ingrediente {entry.source_position+1}</strong></small>
       <strong>{entry.source_text}</strong>
       <small>Proposta: {entry.quantity} · {measureUnitLabel(entry.unit)} · {entry.ingredient}</small>
      </span>
     </label>)}
    </div>
    <div className="cc-measure-actions">
     <button type="button" disabled={draftSaving||batchBusy||scopedSelectedDraftIds.length===0||scopedSelectedDraftIds.length>20}
      onClick={()=>void saveDraftBatch(scopedDraftCandidates,scopedSelectedDraftIds)}>
      {draftSaving?"Salvando…":"Conferir e salvar "+scopedSelectedDraftIds.length+" como rascunho"+(scopedSelectedDraftIds.length===1?"":"s")}
     </button>
     <button type="button" className="secondary" disabled={draftSaving||scopedSelectedDraftIds.length===0}
      onClick={()=>setScopedSelectedDraftIds([])}>Limpar seleção</button>
    </div>
   </details>}
   <p><small>Leitura textual não equivale a validação de alergênicos, segurança alimentar, nutrição ou ajuste de porções. A decisão editorial continua individual.</small></p>
  </section>}
  <div className="cc-measure-queue">
   {rows.map(r=>{
    const unchanged=isMeasureSourceAligned(r);
    const proposal=suggestMeasure(r.source_text);
    return <article key={r.ingredient_id} className="cc-measure-row">
     <small>{nestedTitle(r.recipes)} · {statuses.find(([value])=>value===r.review_status)?.[1]??r.review_status}</small>
     <strong>{r.source_text}</strong>
     {!unchanged?<p className="error">Texto ou posição diferente do inventário: revisão bloqueada até conciliação editorial.</p>
      :<small>{proposal&&classifyMeasure(r.source_text).group==="simple"?"Leitura sugerida (não aprovada): "+proposal.quantity+" · "+measureUnitLabel(proposal.unit)+" · "+proposal.ingredient:"Sem extração inequívoca: requer conferência manual."}</small>}
     {active===r.ingredient_id&&unchanged&&r.review_status!=="confirmed"?<div className="cc-measure-edit">
      <p>Confira a expressão original antes de registrar. A medida permanecerá em rascunho.</p>
      <label>Quantidade
       <input value={quantity} onChange={e=>setQuantity(e.target.value)} inputMode="decimal" placeholder="Ex.: 1,5"/>
      </label>
      <label>Unidade
       <select value={unit} onChange={e=>setUnit(e.target.value)}>
        <option value="">Escolha</option>
        {units.map(([value,label])=><option value={value} key={value}>{label}</option>)}
       </select>
      </label>
      <label>Ingrediente identificado
       <input maxLength={180} value={ingredient} onChange={e=>setIngredient(e.target.value)} placeholder="Ex.: fraldinha"/>
      </label>
      <label>Observação editorial
       <textarea value={notes} maxLength={1200} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Opcional; registrar dúvidas sem alterar o texto original."/>
      </label>
      <div className="cc-measure-actions">
       <button type="button" disabled={busy} onClick={()=>void save(r,"draft")}>Salvar como rascunho</button>
       <button type="button" className="secondary" disabled={busy} onClick={()=>void save(r,"needs_manual_review")}>Exige revisão manual</button>
       <button type="button" className="secondary" disabled={busy} onClick={()=>setActive(null)}>Cancelar</button>
      </div>
     </div>:r.review_status==="confirmed"?<small>Confirmada editorialmente · somente leitura. Sem liberação nutricional.</small>:<button type="button" className="secondary" disabled={!unchanged||busy} onClick={()=>begin(r)}>Revisar medida</button>}
    </article>;
   })}
   {!loading&&rows.length===0&&<p>Nenhum ingrediente encontrado para este filtro.</p>}
  </div>
  <div className="cc-measure-actions">
   <button type="button" className="secondary" disabled={page===0||loading} onClick={()=>{setActive(null);setPage(v=>Math.max(0,v-1));}}>Anterior</button>
   <button type="button" className="secondary" disabled={(page+1)*pageSize>=total||loading} onClick={()=>{setActive(null);setPage(v=>v+1);}}>Próxima</button>
  </div>
 </section>;
}