import {useState,type FormEvent} from "react";
import {supabase} from "./lib/supabase";
import type {FoodPreferences} from "./lib/suggestions";
import {
 allergiesChanged,normalizeProfilePreferences,preferencesEqual,profileAllergens,
 profileAvoids,profileChoices,profileGoals,profileLikes,validateProfilePreferences
} from "./lib/profilePreferences";

type Props={
 userId:string;
 email:string;
 initial:FoodPreferences;
 onSaved:(updated:FoodPreferences)=>void;
 onOpenCardapio:()=>void;
};

const labels={
 liked_foods:"Alimentos e estilos de que gosta",
 disliked_foods:"Alimentos que prefere evitar",
 allergies:"Alergias e intolerâncias declaradas"
} as const;

/**
 * Não troca login, não reescreve cardápios nem modifica dados de outras pessoas.
 * O usuário autenticado e a RLS do Supabase validam novamente o proprietário.
 */
export default function UserProfile({userId,email,initial,onSaved,onOpenCardapio}:Props){
 const [baseline,setBaseline]=useState<FoodPreferences>(()=>normalizeProfilePreferences(initial));
 const [draft,setDraft]=useState<FoodPreferences>(()=>normalizeProfilePreferences(initial));
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [acknowledge,setAcknowledge]=useState(false);
 const changed=!preferencesEqual(draft,baseline);
 const allergyChanged=allergiesChanged(draft,baseline);
 const toggle=(field:"liked_foods"|"disliked_foods"|"allergies",value:string)=>{
  setDraft(p=>({...p,[field]:p[field].includes(value)?p[field].filter(item=>item!==value):[...p[field],value]}));
  setAcknowledge(false);setMessage("");setError("");
 };
 const reset=()=>{
  setDraft(normalizeProfilePreferences(baseline));
  setAcknowledge(false);setError("");setMessage("");
 };
 async function save(event:FormEvent){
  event.preventDefault();
  if(!supabase||busy||!changed)return;
  const payload=normalizeProfilePreferences(draft);
  const invalid=validateProfilePreferences(payload);
  if(invalid){setError(invalid);return;}
  if(allergyChanged&&!acknowledge){
   setError("Confirme que irá revisar as refeições antigas antes de salvar a alteração de alergias.");
   return;
  }
  setBusy(true);setError("");setMessage("");
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(authError||!user||user.id!==userId)
    throw new Error("Sua sessão mudou. Entre novamente e recarregue o perfil.");
   // Falhar em caso de mudança em outro dispositivo, em vez de sobrescrevê-la.
   const {data:latest,error:loadError}=await supabase.from("user_preferences")
    .select("goal,liked_foods,disliked_foods,allergies,household_size,cooking_minutes")
    .eq("user_id",userId).single();
   if(loadError||!latest)throw new Error("Não foi possível reler suas preferências. Nenhuma alteração foi enviada.");
   const server=normalizeProfilePreferences(latest);
   if(!preferencesEqual(server,baseline))
    throw new Error("O perfil foi alterado em outra sessão. Recarregue a página antes de salvar.");
   const {data:updated,error:saveError}=await supabase.from("user_preferences")
    .update({
     goal:payload.goal,liked_foods:payload.liked_foods,
     disliked_foods:payload.disliked_foods,allergies:payload.allergies,
     household_size:payload.household_size,cooking_minutes:payload.cooking_minutes
    }).eq("user_id",userId)
    .select("goal,liked_foods,disliked_foods,allergies,household_size,cooking_minutes")
    .single();
   if(saveError||!updated)throw saveError??new Error("A gravação não foi confirmada pelo servidor.");
   const saved=normalizeProfilePreferences(updated);
   setBaseline(saved);setDraft(saved);setAcknowledge(false);
   onSaved(saved);
   setMessage(allergyChanged
    ?"Preferências salvas. Revise todas as refeições existentes: nenhuma foi revalidada automaticamente para as novas alergias."
    :"Suas preferências foram salvas e já serão usadas nas próximas sugestões.");
  }catch(err){
   setError(err instanceof Error?err.message:"Não foi possível salvar. Nenhuma confirmação foi recebida.");
  }finally{setBusy(false);}
 }
 function group(field:"liked_foods"|"disliked_foods"|"allergies",standard:readonly string[]){
  return <fieldset className="cc-profile-group">
   <legend>{labels[field]}</legend>
   <div className="cc-profile-chips">{profileChoices(standard,draft[field]).map(item=><button
    type="button" key={item} aria-pressed={draft[field].includes(item)}
    className={draft[field].includes(item)?"is-selected":""}
    disabled={busy} onClick={()=>toggle(field,item)}>{item}</button>)}</div>
  </fieldset>;
 }
 return <section className="cc-profile" aria-label="Suas preferências e rotina">
  <div className="cc-profile-intro">
   <h2>Seu perfil alimentar</h2>
   <p>Atualize suas preferências a qualquer momento. Elas orientam as próximas sugestões, mas não alteram seu cardápio ou suas receitas automaticamente.</p>
  </div>
  <div className="cc-profile-account"><span>Conta conectada</span><strong>{email||"Sessão autenticada"}</strong>
   <small>O e-mail e a senha são gerenciados no acesso à conta, não nesta tela.</small></div>
  <form onSubmit={e=>void save(e)} className="cc-profile-form">
   <fieldset className="cc-profile-group">
    <legend>Qual é seu objetivo?</legend>
    <div className="cc-profile-chips">{profileGoals.map(([id,label])=><button type="button"
     key={id} className={draft.goal===id?"is-selected":""}
     aria-pressed={draft.goal===id} disabled={busy}
     onClick={()=>{setDraft(p=>({...p,goal:id}));setMessage("");}}>{label}</button>)}</div>
   </fieldset>
   {group("liked_foods",profileLikes)}
   <p className="cc-profile-choice-notice" role="note">
    <strong>Atenção:</strong> “Sem lactose” e “Sem glúten” nesta seção indicam preferências de alimentação, não uma certificação das receitas.
    Se houver alergia ou intolerância, declare-a também na seção específica abaixo e confira ingredientes, rótulos e preparo.
   </p>
   {group("disliked_foods",profileAvoids)}
   {group("allergies",profileAllergens)}
   <div className="cc-profile-allergy-notice" role="note">
    <strong>Importante sobre alergias:</strong> nenhum cardápio já salvo será reavaliado ou substituído automaticamente. Sugestões futuras passam por pré-triagem, sem garantia de ausência de alergênicos, derivados ou contato cruzado. Confira rótulos e preparo.
    {draft.allergies.includes("Outros")&&<p>Com “Outros” selecionado, a geração automática pode ficar bloqueada até que o alergênico seja identificado de forma segura.</p>}
   </div>
   <fieldset className="cc-profile-group">
    <legend>Sua rotina</legend>
    <div className="cc-profile-numbers">
     <label>Pessoas em casa
      <input type="number" inputMode="numeric" min={1} max={20} step={1}
       value={draft.household_size} disabled={busy}
       onChange={e=>setDraft(p=>({...p,household_size:Number(e.target.value)}))}/>
     </label>
     <label>Tempo disponível para cozinhar (minutos)
      <input type="number" inputMode="numeric" min={5} max={360} step={1}
       value={draft.cooking_minutes} disabled={busy}
       onChange={e=>setDraft(p=>({...p,cooking_minutes:Number(e.target.value)}))}/>
     </label>
    </div>
    <p>O número de pessoas influencia apenas receitas com medidas estruturadas. As receitas piloto mantêm o rendimento original até serem revisadas.</p>
   </fieldset>
   {allergyChanged&&<label className="cc-profile-ack">
    <input type="checkbox" checked={acknowledge} disabled={busy}
     onChange={e=>setAcknowledge(e.target.checked)}/>
    <span>Entendo que preciso conferir novamente os ingredientes e as refeições já planejadas antes de consumi-las.</span>
   </label>}
   {error&&<p role="alert" className="cc-profile-error">{error}</p>}
   {message&&<p role="status" className="cc-profile-success">{message}</p>}
   <div className="cc-profile-actions">
    <button type="submit" className="primary" disabled={busy||!changed||(allergyChanged&&!acknowledge)}>
     {busy?"Salvando...":"Salvar preferências"}
    </button>
    <button type="button" className="secondary" disabled={busy||!changed} onClick={reset}>
     Descartar alterações
    </button>
    <button type="button" className="secondary" disabled={busy} onClick={onOpenCardapio}>
     Abrir cardápio
    </button>
   </div>
   {changed&&<p className="cc-profile-unsaved" role="status">Há alterações não salvas.</p>}
  </form>
  <p className="cc-profile-disclaimer">Esta etapa edita somente suas preferências existentes; não altera receitas, compras, dados nutricionais ou permissões. Exportação e exclusão de dados serão tratadas na etapa específica de privacidade.</p>
 </section>;
}
