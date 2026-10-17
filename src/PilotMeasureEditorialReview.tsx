import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
import {measureUnitLabel} from "./lib/pilotMeasureBatch";

type Draft={
 ingredient_id:string;
 source_text:string;
 review_status:"draft";
 proposed_quantity:number;
 proposed_unit:string;
 proposed_ingredient:string;
 review_notes:string;
 updated_at:string;
 recipes:{title:string}|{title:string}[]|null;
 recipe_ingredients:{name:string}|{name:string}[]|null;
};
type History={
 id:number;
 action:string;
 old_status:string;
 new_status:string;
 source_text:string;
 decision_note:string;
 created_at:string;
};
function nestedText(v:{title:string}|{title:string}[]|null):string{
 return Array.isArray(v)?v[0]?.title??"Receita sem título":v?.title??"Receita sem título";
}
function originalName(v:{name:string}|{name:string}[]|null):string{
 return Array.isArray(v)?v[0]?.name??"":v?.name??"";
}
/**
 * Decisão editorial separada. Confirmação não implica segurança nutricional ou alergênica.
 * Nunca chama UPDATE direto na tabela de medidas.
 */
export default function PilotMeasureEditorialReview(){
 const [rows,setRows]=useState<Draft[]>([]);
 const [history,setHistory]=useState<History[]>([]);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [acknowledged,setAcknowledged]=useState(false);
 const [note,setNote]=useState("");
 const load=async()=>{
  if(!supabase)return;
  setLoading(true);setError("");
  try{
   const [draftQuery,eventQuery]=await Promise.all([
    supabase.from("cc_pilot_ingredient_measure_reviews")
     .select("ingredient_id,source_text,review_status,proposed_quantity,proposed_unit,proposed_ingredient,review_notes,updated_at,recipes(title),recipe_ingredients(name)")
     .eq("review_status","draft").order("updated_at",{ascending:false}).limit(20),
    supabase.from("cc_pilot_measure_review_events")
     .select("id,action,old_status,new_status,source_text,decision_note,created_at")
     .order("created_at",{ascending:false}).limit(10)
   ]);
   if(draftQuery.error)throw draftQuery.error;
   if(eventQuery.error)throw eventQuery.error;
   setRows((draftQuery.data??[]) as unknown as Draft[]);
   setHistory((eventQuery.data??[]) as History[]);
  }catch(err){setError(err instanceof Error?err.message:"Falha ao carregar a revisão editorial.");}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[]);
 const openDraft=(id:string)=>{
  setSelectedId(id===selectedId?null:id);
  setAcknowledged(false);
  setNote("");
  setError("");setMessage("");
 };
 const decide=async(row:Draft,action:"confirm"|"return")=>{
  if(!supabase||busy||!acknowledged)return;
  if(originalName(row.recipe_ingredients)!==row.source_text){
   setError("Fonte divergente: a proposta não pode ser confirmada.");return;
  }
  if(note.trim().length<8){
   setError("Registre a justificativa editorial (mínimo de 8 caracteres).");return;
  }
  const label=action==="confirm"?"CONFIRMAR EDITORIALMENTE":"DEVOLVER À REVISÃO MANUAL";
  const okay=window.confirm(label+" a medida da receita "+nestedText(row.recipes)+"?\n\n"+
   row.source_text+"\nProposta: "+row.proposed_quantity+" · "+measureUnitLabel(row.proposed_unit)+" · "+row.proposed_ingredient+
   "\n\nIsso NÃO altera receita, porções, compras, alergênicos ou nutrição.");
  if(!okay)return;
  setBusy(true);setError("");setMessage("");
  try{
   const {data,error:dbError}=await supabase.rpc("cc_decide_pilot_measure_draft",{
    p_id:row.ingredient_id,
    p_source_text:row.source_text,
    p_expected_updated_at:row.updated_at,
    p_expected_quantity:row.proposed_quantity,
    p_expected_unit:row.proposed_unit,
    p_expected_ingredient:row.proposed_ingredient,
    p_action:action,
    p_note:note.trim()
   });
   if(dbError)throw dbError;
   if(data!==(action==="confirm"?"confirmed":"needs_manual_review"))
    throw new Error("Retorno inesperado. Atualize antes de realizar outra ação.");
   setSelectedId(null);setAcknowledged(false);setNote("");
   setMessage(action==="confirm"?"Medida confirmada somente no fluxo editorial. Nenhum cálculo foi habilitado."
    :"Medida devolvida para revisão manual. A proposta anterior ficou registrada no histórico.");
   await load();
  }catch(err){setError(err instanceof Error?err.message:"Falha ao registrar a decisão. Nenhuma nova tentativa automática será feita.");}
  finally{setBusy(false);}
 };
 return <section className="cc-measure-editorial" aria-label="Conferência editorial dos rascunhos">
  <div className="cc-measure-editorial-head">
   <div><h4>Conferência editorial dos rascunhos</h4>
    <p>Revise a receita e a proposta antes de tomar uma decisão. Uma confirmação aqui é <strong>culinária e editorial</strong>, nunca médica, nutricional ou de alergênicos.</p></div>
   <button type="button" className="secondary" disabled={busy||loading} onClick={()=>void load()}>{loading?"Carregando…":"Atualizar rascunhos"}</button>
  </div>
  {error&&<p role="alert" className="error">{error}</p>}
  {message&&<p role="status">{message}</p>}
  {loading?<p>Carregando rascunhos…</p>:rows.length===0?<p>Nenhum rascunho disponível para conferência.</p>:
   <div className="cc-measure-editorial-list">
    {rows.map(row=>{
     const sameSource=originalName(row.recipe_ingredients)===row.source_text;
     return <article className="cc-measure-editorial-row" key={row.ingredient_id}>
      <small>{nestedText(row.recipes)} · rascunho editorial</small>
      <strong>{row.source_text}</strong>
      <p>Proposta: <strong>{row.proposed_quantity} · {measureUnitLabel(row.proposed_unit)} · {row.proposed_ingredient}</strong></p>
      {!sameSource&&<p role="alert" className="error">O ingrediente original diverge do inventário; decisão bloqueada.</p>}
      <button type="button" className="secondary" disabled={busy||!sameSource}
       onClick={()=>openDraft(row.ingredient_id)}>{selectedId===row.ingredient_id?"Fechar conferência":"Conferir proposta"}</button>
      {selectedId===row.ingredient_id&&sameSource&&<div className="cc-measure-editorial-decision">
       <p><strong>Texto original:</strong> {row.source_text}</p>
       <p><strong>Medida estruturada:</strong> {row.proposed_quantity} · {measureUnitLabel(row.proposed_unit)} · {row.proposed_ingredient}</p>
       <p><strong>Observação do rascunho:</strong> {row.review_notes||"Não informada"}</p>
       <label>Justificativa editorial
        <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={1200} rows={2}
         placeholder="Descreva a conferência com o texto original ou o motivo da devolução."/>
       </label>
       <label className="cc-measure-editorial-ack">
        <input type="checkbox" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/>
        <span>Conferi manualmente o ingrediente, a quantidade e a unidade. Entendo que esta decisão não autoriza cálculos nutricionais, alergênicos nem alterações na receita.</span>
       </label>
       <div className="cc-measure-actions">
        <button type="button" disabled={busy||!acknowledged||note.trim().length<8}
         onClick={()=>void decide(row,"confirm")}>Confirmar medida editorial</button>
        <button type="button" className="secondary" disabled={busy||!acknowledged||note.trim().length<8}
         onClick={()=>void decide(row,"return")}>Devolver para revisão manual</button>
       </div>
      </div>}
     </article>;
    })}
   </div>}
  <details className="cc-measure-editorial-history">
   <summary>Histórico das decisões editoriais ({history.length} últimas ações)</summary>
   {history.length===0?<p>Nenhuma decisão registrada nesta fase.</p>:
    <ul>{history.map(item=><li key={item.id}>
     <strong>{item.source_text}</strong> — {item.old_status} → {item.new_status}
     <small>{new Date(item.created_at).toLocaleString("pt-BR")} · {item.decision_note||"Sem nota"}</small>
    </li>)}</ul>}
  </details>
 </section>;
}