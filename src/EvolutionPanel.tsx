import {useEffect,useMemo,useState,type FormEvent} from "react";
import {supabase} from "./lib/supabase";
import {
 emptyEvolutionDraft,entryToDraft,evaluationLabel,evolutionHabitLabels,
 evolutionScoreOptions,localDateKey,validateEvolutionDraft,
 type EvolutionDraft,type EvolutionEntry,type MoodScore
} from "./lib/evolutionModel";

const scoreFields=[
 {key:"energy_level",title:"Como esteve minha energia?"},
 {key:"wellbeing_level",title:"Como me senti hoje?"},
 {key:"sleep_quality",title:"Como percebi meu descanso?"}
] as const;
const habitFields=Object.entries(evolutionHabitLabels) as Array<[
 "planned_meals"|"took_pause"|"moved_comfortably",string
]>;
const columns="id,user_id,recorded_on,energy_level,wellbeing_level,sleep_quality,planned_meals,took_pause,moved_comfortably,personal_note,created_at,updated_at";
function displayDate(day:string){
 const [year,month,date]=day.split("-");
 return date+"/"+month+"/"+year;
}

/** O histórico é exclusivo da conta autenticada e não é compartilhado. */
export default function EvolutionPanel({userId}:{userId:string}){
 const today=localDateKey(new Date());
 const [date,setDate]=useState(today);
 const [rows,setRows]=useState<EvolutionEntry[]>([]);
 const [draft,setDraft]=useState<EvolutionDraft>(emptyEvolutionDraft);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [ack,setAck]=useState(false);
 const selected=rows.find(r=>r.recorded_on===date);
 const recent=useMemo(()=>[...rows].sort((a,b)=>b.recorded_on.localeCompare(a.recorded_on)).slice(0,30),[rows]);
 useEffect(()=>{
  let active=true;
  async function load(){
   setLoading(true);setError("");setMessage("");setAck(false);
   if(!supabase){if(active){setError("O serviço de dados não está disponível.");setLoading(false);}return;}
   try{
    const {data:{user},error:authError}=await supabase.auth.getUser();
    if(authError||user?.id!==userId)throw new Error("Sessão inválida. Entre novamente para consultar sua evolução.");
    const {data,error:queryError}=await supabase.from("cc_evolution_checkins")
     .select(columns).eq("user_id",userId).order("recorded_on",{ascending:false}).limit(90);
    if(queryError)throw new Error("Não foi possível carregar o histórico privado. Verifique a configuração da Fase 51.");
    if(active){
     const loaded=(data??[]) as EvolutionEntry[];
     setRows(loaded);setDraft(entryToDraft(loaded.find(r=>r.recorded_on===today)));
    }
   }catch(err){
    if(active)setError(err instanceof Error?err.message:"Não foi possível consultar seu histórico.");
   }finally{if(active)setLoading(false);}
  }
  void load();
  return ()=>{active=false;};
 },[userId,today]);

 function changeDate(value:string){
  if(!value||value>today)return;
  setDate(value);setDraft(entryToDraft(rows.find(r=>r.recorded_on===value)));
  setAck(false);setError("");setMessage("");
 }
 async function verifyOwner(){
  if(!supabase)throw new Error("Serviço indisponível.");
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||user?.id!==userId)throw new Error("Sua sessão mudou. Entre novamente.");
 }
 async function save(event:FormEvent){
  event.preventDefault();
  if(loading||saving||!supabase)return;
  const invalid=validateEvolutionDraft(draft,date,today);
  if(invalid){setError(invalid);return;}
  if(!ack){setError("Confirme que deseja registrar essas informações opcionais.");return;}
  setSaving(true);setError("");setMessage("");
  try{
   await verifyOwner();
   const payload={
    user_id:userId,recorded_on:date,
    energy_level:draft.energy_level,wellbeing_level:draft.wellbeing_level,
    sleep_quality:draft.sleep_quality,planned_meals:draft.planned_meals,
    took_pause:draft.took_pause,moved_comfortably:draft.moved_comfortably,
    personal_note:draft.personal_note.trim()||null,updated_at:new Date().toISOString()
   };
   const {data,error:writeError}=await supabase.from("cc_evolution_checkins")
    .upsert(payload,{onConflict:"user_id,recorded_on"}).select(columns).single();
   if(writeError||!data)throw new Error("O registro não foi confirmado pelo servidor. Tente novamente.");
   const updated=data as EvolutionEntry;
   setRows(previous=>[updated,...previous.filter(x=>x.recorded_on!==date)].sort((a,b)=>b.recorded_on.localeCompare(a.recorded_on)).slice(0,90));
   setDraft(entryToDraft(updated));setAck(false);
   setMessage("Registro privado salvo para "+displayDate(date)+". Você pode editá-lo ou excluí-lo quando desejar.");
  }catch(err){
   setError(err instanceof Error?err.message:"Não foi possível salvar.");
  }finally{setSaving(false);}
 }
 async function remove(){
  if(!selected||saving||!supabase)return;
  if(!window.confirm("Excluir definitivamente o registro de "+displayDate(date)+"?"))return;
  setSaving(true);setError("");setMessage("");
  try{
   await verifyOwner();
   const {data,error:deleteError}=await supabase.from("cc_evolution_checkins")
    .delete().eq("id",selected.id).eq("user_id",userId).select("id").single();
   if(deleteError||data?.id!==selected.id)throw new Error("Não foi possível confirmar a exclusão do registro.");
   setRows(current=>current.filter(x=>x.id!==selected.id));
   setDraft(emptyEvolutionDraft());setAck(false);setMessage("Registro excluído.");
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível excluir.");}
  finally{setSaving(false);}
 }
 function scoreInput(field:(typeof scoreFields)[number]){
  return <label key={field.key} className="cc-evo-select">
   {field.title}
   <select disabled={loading||saving} value={draft[field.key]??""}
    onChange={e=>setDraft(p=>({...p,[field.key]:e.target.value===""?null:Number(e.target.value) as MoodScore}))}>
    <option value="">Prefiro não registrar</option>
    {evolutionScoreOptions.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
   </select>
  </label>;
 }
 function habitInput(field:(typeof habitFields)[number]){
  return <label key={field[0]} className="cc-evo-select">{field[1]}
   <select disabled={loading||saving} value={draft[field[0]]===null?"":draft[field[0]]?"yes":"no"}
    onChange={e=>setDraft(p=>({...p,[field[0]]:e.target.value===""?null:e.target.value==="yes"}))}>
    <option value="">Prefiro não registrar</option>
    <option value="yes">Sim</option>
    <option value="no">Não</option>
   </select>
  </label>;
 }
 return <section className="cc-evolution">
  <div className="cc-evo-intro">
   <h2>Sua evolução, no seu ritmo</h2>
   <p>Este é um diário <strong>voluntário e privado</strong> para perceber como você se sente e quais hábitos fazem sentido para sua rotina. Não há metas obrigatórias, pontuação de sucesso ou diagnóstico.</p>
  </div>
  <div className="cc-evo-privacy" role="note">
   <strong>Privacidade:</strong> os registros ficam vinculados à sua conta e não são publicados no perfil de outros usuários. Você escolhe o que registrar e pode apagar cada dia. Não use este diário para informações médicas urgentes.
  </div>
  {error&&<p className="cc-evo-error" role="alert">{error}</p>}
  {message&&<p className="cc-evo-success" role="status">{message}</p>}
  <div className="cc-evo-layout">
   <form className="cc-evo-form" onSubmit={e=>void save(e)}>
    <h3>{selected?"Editar registro do dia":"Novo registro do dia"}</h3>
    <label className="cc-evo-date">Dia do registro
     <input type="date" required max={today} value={date} disabled={loading||saving}
      onChange={e=>changeDate(e.target.value)}/>
    </label>
    <fieldset>
     <legend>Percepções pessoais (opcionais)</legend>
     <div className="cc-evo-input-grid">{scoreFields.map(scoreInput)}</div>
    </fieldset>
    <fieldset>
     <legend>Hábitos que escolhi observar (opcionais)</legend>
     <div className="cc-evo-input-grid">{habitFields.map(habitInput)}</div>
    </fieldset>
    <label className="cc-evo-note">Algo que queira lembrar deste dia (opcional)
     <textarea maxLength={280} rows={3} disabled={loading||saving}
      value={draft.personal_note} onChange={e=>setDraft(p=>({...p,personal_note:e.target.value}))}
      placeholder="Escreva com suas próprias palavras, ou deixe em branco."/>
     <small>{draft.personal_note.length}/280 caracteres</small>
    </label>
    <label className="cc-evo-ack"><input type="checkbox" checked={ack} disabled={loading||saving}
     onChange={e=>setAck(e.target.checked)}/>
     <span>Quero salvar voluntariamente essas percepções pessoais em minha conta. Posso excluí-las depois.</span>
    </label>
    <div className="cc-evo-actions">
     <button type="submit" disabled={loading||saving||!ack}>{saving?"Salvando...":"Salvar registro privado"}</button>
     <button type="button" disabled={loading||saving} onClick={()=>{setDraft(entryToDraft(selected));setAck(false);setError("");setMessage("");}}>Descartar edição</button>
     {selected&&<button type="button" className="danger" disabled={loading||saving} onClick={()=>void remove()}>Excluir este dia</button>}
    </div>
   </form>
   <aside className="cc-evo-history" aria-label="Histórico privado de evolução">
    <h3>Seu histórico recente</h3>
    {loading?<p role="status">Carregando registros privados...</p>:
      recent.length===0?<p>Você ainda não registrou nenhum dia. Comece quando quiser; não existe atraso a recuperar.</p>:
      <>
       <p>Mostrando até 30 registros recentes, sem comparações com outras pessoas.</p>
       <ol>{recent.map(row=><li key={row.id}>
        <button type="button" className={date===row.recorded_on?"selected":""}
         onClick={()=>changeDate(row.recorded_on)}>
         <strong>{displayDate(row.recorded_on)}</strong>
         <span>Energia: {evaluationLabel(row.energy_level)} · Bem-estar: {evaluationLabel(row.wellbeing_level)}</span>
        </button>
       </li>)}</ol>
      </>}
   </aside>
  </div>
  <p className="cc-evo-disclaimer">As avaliações refletem percepções individuais, não indicadores médicos. O acompanhamento profissional, quando necessário, é independente deste diário. Fotos e medidas corporais não fazem parte desta primeira etapa.</p>
 </section>;
}
