import {useCallback,useEffect,useState,type FormEvent} from "react";
import {supabase} from "./lib/supabase";

type CaseStatus="requested"|"changes_requested"|"approved"|"invalidated";
type ReviewCase={
 status:CaseStatus;requested_at:string;request_notes:string;
 reviewed_at:string|null;decision_notes:string;
};
type ReviewEvent={id:number;event_type:CaseStatus;event_at:string;note:string};
const statusLabel:Record<CaseStatus,string>={
 requested:"Solicitação enviada — aguardando responsável",
 changes_requested:"Correções solicitadas pelo profissional",
 approved:"Parecer favorável registrado — ainda não publicado",
 invalidated:"Parecer ou solicitação invalidado por alteração da variante"
};
const eventLabel:Record<CaseStatus,string>={
 requested:"Solicitação",changes_requested:"Correções solicitadas",
 approved:"Parecer registrado",invalidated:"Invalidado por alteração"
};
const formatDate=(date:string)=>new Date(date).toLocaleString("pt-BR");

export default function FoodNutritionReviewPanel({
 variantId,hasUnsavedChanges
}:{variantId:string;hasUnsavedChanges:boolean}){
 const [current,setCurrent]=useState<ReviewCase|null>(null);
 const [events,setEvents]=useState<ReviewEvent[]>([]);
 const [note,setNote]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const load=useCallback(async()=>{
  if(!supabase)return;
  const [requestResult,eventsResult]=await Promise.all([
   supabase.from("cc_food_nutrition_review_cases")
    .select("status,requested_at,request_notes,reviewed_at,decision_notes")
    .eq("variant_id",variantId).maybeSingle(),
   supabase.from("cc_food_nutrition_review_events")
    .select("id,event_type,event_at,note").eq("variant_id",variantId)
    .order("id",{ascending:false}).limit(10)
  ]);
  if(requestResult.error)throw requestResult.error;
  if(eventsResult.error)throw eventsResult.error;
  return {case:requestResult.data as ReviewCase|null,
   history:(eventsResult.data??[]) as ReviewEvent[]};
 },[variantId]);
 useEffect(()=>{
  let active=true;
  setLoading(true);setError("");setCurrent(null);setEvents([]);setNote("");setMessage("");
  void load().then(data=>{
   if(active&&data){setCurrent(data.case);setEvents(data.history);}
  }).catch(e=>{
   if(active)setError(e instanceof Error?e.message:"Falha ao consultar histórico.");
  }).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[load]);
 const request=async(event:FormEvent)=>{
  event.preventDefault();
  if(!supabase||busy||hasUnsavedChanges||note.trim().length<12)return;
  setBusy(true);setError("");setMessage("");
  try{
   const {error:requestError}=await supabase.rpc("cc_request_food_nutrition_review",{
    p_variant_id:variantId,p_note:note.trim()
   });
   if(requestError)throw requestError;
   const data=await load();
   if(data){setCurrent(data.case);setEvents(data.history);}
   setNote("");
   setMessage("Solicitação registrada. Aguardando profissional credenciado; nenhum dado foi publicado.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível solicitar revisão.");}
  finally{setBusy(false);}
 };
 return <section className="cc-nutrition-review-panel" aria-label="Revisão técnica nutricional">
  <h4>Revisão técnica e histórico</h4>
  <p className="detail-note">Preparação editorial e parecer técnico são responsabilidades diferentes. Solicitar revisão não publica nutrientes nem autoriza alegações sobre alergênicos.</p>
  {loading?<p role="status">Consultando solicitações...</p>:<>
   <div className="cc-tech-review">
    <strong>{current?statusLabel[current.status]:"Nenhuma solicitação formal registrada"}</strong>
    {current&&<p>Enviada em {formatDate(current.requested_at)}. {current.request_notes}</p>}
    {current?.reviewed_at&&<p>Parecer em {formatDate(current.reviewed_at)}: {current.decision_notes}</p>}
   </div>
   {hasUnsavedChanges&&<p className="cc-tech-error">Salve as alterações da variante antes de solicitar revisão.</p>}
   {(!current||current.status==="invalidated"||current.status==="changes_requested")&&
    <form className="cc-tech-form" onSubmit={e=>void request(e)}>
     <label>Motivo e escopo da revisão
      <textarea rows={3} maxLength={2000} minLength={12}
       placeholder="Ex.: conferir a transcrição da TACO, a identificação da variedade e o significado de Tr para sódio."
       value={note} onChange={e=>setNote(e.target.value)}/>
     </label>
     <button type="submit" className="primary"
      disabled={busy||hasUnsavedChanges||note.trim().length<12}>
      {busy?"Registrando...":"Solicitar revisão técnica"}
     </button>
    </form>}
   {(current?.status==="requested"||current?.status==="approved")&&
    <p className="detail-note">O parecer só pode ser registrado por profissional com credenciais verificadas. A publicação nutricional continua separada e bloqueada nesta fase.</p>}
   {events.length>0&&<details className="cc-nutrition-review-history">
    <summary>Histórico de revisões ({events.length} registros recentes)</summary>
    <ol>{events.map(entry=><li key={entry.id}>
     <strong>{eventLabel[entry.event_type]}</strong> · {formatDate(entry.event_at)}
     <p>{entry.note}</p>
    </li>)}</ol>
   </details>}
  </>}
  {error&&<p role="alert" className="cc-tech-error">{error}</p>}
  {message&&<p role="status" className="cc-tech-success">{message}</p>}
 </section>;
}
