import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
import {classifyMeasure,measureGroups,measureUnitLabel,suggestMeasure,summarizeMeasures,type BatchItem,type BatchResult} from "./lib/pilotMeasureBatch";

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
 recipe_ingredients:{name:string}|{name:string}[]|null;
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
function nestedName(v:{name:string}|{name:string}[]|null):string{
 return Array.isArray(v)?v[0]?.name??"":v?.name??"";
}
function nestedTitle(v:{title:string}|{title:string}[]|null):string{
 return Array.isArray(v)?v[0]?.title??"Receita do piloto":v?.title??"Receita do piloto";
}
export default function PilotIngredientMeasureReview(){
 const [rows,setRows]=useState<Review[]>([]);
 const [status,setStatus]=useState("pending");
 const [search,setSearch]=useState("");
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
 const pageSize=25;
 // Lê todo o inventário em páginas menores que o limite padrão do PostgREST.
 // Nenhuma chamada de análise atualiza receitas, medidas ou notas.
 const analyzeAll=async()=>{
  if(!supabase||batchBusy)return;
  setBatchBusy(true);setBatchProgress(0);setBatchResult(null);setError("");setMessage("");
  try{
   const all:BatchItem[]=[];
   const size=250;
   let expected=0;
   for(let offset=0;offset<expected||offset===0;offset+=size){
    const {data,count,error:readError}=await supabase
     .from("cc_pilot_ingredient_measure_reviews")
     .select("ingredient_id,source_text,review_status",{count:"exact"})
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
   setBatchResult(summarizeMeasures(all));
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível analisar o inventário.");}
  finally{setBatchBusy(false);}
 };
 const load=async()=>{
  if(!supabase)return;
  setLoading(true);setError("");
  try{
   let q=supabase.from("cc_pilot_ingredient_measure_reviews")
    .select("ingredient_id,recipe_id,source_text,source_position,proposed_quantity,proposed_unit,proposed_ingredient,review_status,review_notes,recipes(title),recipe_ingredients(name)",{count:"exact"})
    .order("recipe_id",{ascending:true})
    .order("source_position",{ascending:true})
    .range(page*pageSize,(page+1)*pageSize-1);
   if(status!=="all")q=q.eq("review_status",status);
   if(search.trim())q=q.ilike("source_text","%"+search.trim().replace(/[%_]/g,"")+"%");
   const {data,error:dbError,count}=await q;
   if(dbError)throw dbError;
   setRows((data??[]) as unknown as Review[]);
   setTotal(count??0);
  }catch(err){setError(err instanceof Error?err.message:"Erro ao carregar ingredientes.");}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[page,status,search]);
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
  if(nestedName(row.recipe_ingredients)!==row.source_text){
   setError("O texto do ingrediente mudou desde o inventário. Não é seguro gravar esta proposta.");
   return;
  }
  const numeric=quantity.trim()?Number(quantity.replace(",",".")):null;
  if(mode==="draft"&&(
    numeric==null||!Number.isFinite(numeric)||numeric<=0||numeric>100000
    ||!unit||!ingredient.trim()||ingredient.trim().length>180
  )){
   setError("Para salvar um rascunho, informe quantidade positiva, unidade e nome do ingrediente.");
   return;
  }
  setBusy(true);setError("");setMessage("");
  try{
   const {error:dbError}=await supabase.from("cc_pilot_ingredient_measure_reviews").update({
    proposed_quantity:mode==="draft"?numeric:null,
    proposed_unit:mode==="draft"?unit:null,
    proposed_ingredient:mode==="draft"?ingredient.trim():null,
    review_status:mode,
    review_notes:notes.trim().slice(0,1200),
    reviewed_by:null,
    reviewed_at:null,
    updated_at:new Date().toISOString(),
   }).eq("ingredient_id",row.ingredient_id).eq("source_text",row.source_text);
   if(dbError)throw dbError;
   setActive(null);
   setMessage(mode==="draft"?"Rascunho registrado. Ainda não aprovado para cálculos.":"Ingrediente encaminhado para conferência manual.");
   await load();
  }catch(err){setError(err instanceof Error?err.message:"Falha ao salvar a revisão.");}
  finally{setBusy(false);}
 };
 return <section className="cc-measure-review">
  <p>Inventário das 1.073 expressões originais. Uma proposta registrada aqui <strong>não modifica a receita</strong> e não libera ajustes de porções, somas de compras nem valores nutricionais. Apenas a administração pode consultar e revisar.</p>
  <section className="cc-measure-batch" aria-label="Análise em lote dos ingredientes">
   <div className="cc-measure-batch-header">
    <div>
     <strong>Pré-análise do acervo completo</strong>
     <p>Classifica as expressões em medidas simples, intervalos, alternativas, preparos compostos, opcionais e casos manuais. <strong>Não salva nem aprova nada.</strong></p>
    </div>
    <button type="button" disabled={batchBusy||loading} onClick={()=>void analyzeAll()}>
     {batchBusy?"Analisando…":"Analisar todos os ingredientes"}
    </button>
   </div>
   {batchBusy&&<p role="status">Lidos {batchProgress} registros. Sem alterações no banco.</p>}
   {batchResult&&<div aria-live="polite">
    <p><strong>{batchResult.total} expressões analisadas.</strong> {batchResult.pending} continuam aguardando revisão. {batchResult.otherStatuses} já possuem outro status editorial.</p>
    <div className="cc-measure-batch-grid">
     {measureGroups.map(group=><article className="cc-measure-batch-group" key={group.key}>
      <strong>{batchResult.byGroup[group.key]}</strong>
      <span>{group.label}</span>
      <small>{group.explanation}</small>
      {batchResult.examples[group.key].length>0&&<details>
       <summary>Ver exemplos</summary>
       <ul>{batchResult.examples[group.key].map(entry=><li key={entry.id}>
        <button type="button" className="secondary" onClick={()=>{
         setPage(0);setStatus("all");setSearch(entry.text);setActive(null);
        }}>{entry.text}</button>
        {entry.proposal&&<small> {entry.proposal.quantity} · {measureUnitLabel(entry.proposal.unit)} · {entry.proposal.ingredient}</small>}
       </li>)}</ul>
      </details>}
     </article>)}
    </div>
   </div>}
  </section>
  <div className="cc-measure-filters">
   <label>Situação
    <select value={status} onChange={e=>{setPage(0);setStatus(e.target.value);setActive(null);}}>
     <option value="all">Todas</option>
     {statuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
   </label>
   <label>Pesquisar texto original
    <input value={search} onChange={e=>{setPage(0);setSearch(e.target.value);setActive(null);}} placeholder="Ex.: azeite, ovos, cebola"/>
   </label>
  </div>
  <p aria-live="polite">{loading?"Carregando…":total+" registros na seleção · página "+(page+1)+" de "+Math.max(1,Math.ceil(total/pageSize))}</p>
  {error&&<p role="alert" className="error">{error}</p>}
  {message&&<p role="status">{message}</p>}
  <div className="cc-measure-queue">
   {rows.map(r=>{
    const unchanged=nestedName(r.recipe_ingredients)===r.source_text;
    const proposal=suggestMeasure(r.source_text);
    return <article key={r.ingredient_id} className="cc-measure-row">
     <small>{nestedTitle(r.recipes)} · {statuses.find(([value])=>value===r.review_status)?.[1]??r.review_status}</small>
     <strong>{r.source_text}</strong>
     {!unchanged?<p className="error">Texto alterado depois do inventário: revisão bloqueada.</p>
      :<small>{proposal&&classifyMeasure(r.source_text).group==="simple"?"Leitura sugerida (não aprovada): "+proposal.quantity+" · "+measureUnitLabel(proposal.unit)+" · "+proposal.ingredient:"Sem extração inequívoca: requer conferência manual."}</small>}
     {active===r.ingredient_id&&unchanged?<div className="cc-measure-edit">
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
     </div>:<button type="button" className="secondary" disabled={!unchanged||busy} onClick={()=>begin(r)}>Revisar medida</button>}
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