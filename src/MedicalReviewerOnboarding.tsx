import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";

type MedicalCandidate={
 id:string;
 display_name:string;
 registration_region:string;
 registration_number:string;
 claimed_specialty:string;
 consent_reported:boolean;
 credential_status:string;
 invitation_status:string;
 rqe_number:string|null;
 contact_email:string|null;
 contact_verified_at:string|null;
 auth_user_id:string|null;
};
const credentialLabel:Record<string,string>={
 pending_official_check:"CRM e especialidade aguardando verificação oficial",
 crm_verified:"CRM verificado; especialidade aguardando RQE",
 specialty_verified:"Credenciais profissionais verificadas",
 rejected:"Verificação não concluída"
};
const invitationLabel:Record<string,string>={
 not_invited:"Sem convite enviado",invited:"Convite pendente",
 active:"Acesso ativo",suspended:"Acesso suspenso"
};

export default function MedicalReviewerOnboarding(){
 const [candidates,setCandidates]=useState<MedicalCandidate[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  const client=supabase;
  if(!client){setError("Supabase indisponível.");setLoading(false);return;}
  void (async()=>{
   const {data,error:loadError}=await client
    .from("cc_medical_reviewer_onboarding")
    .select("id,display_name,registration_region,registration_number,claimed_specialty,consent_reported,credential_status,invitation_status,rqe_number,auth_user_id,contact_email,contact_verified_at")
    .eq("onboarding_status","candidate").order("created_at",{ascending:true});
   if(!active)return;
   if(loadError)setError(loadError.message);
   else setCandidates((data??[]) as MedicalCandidate[]);
   setLoading(false);
  })();
  return()=>{active=false;};
 },[]);
 return <section className="cc-medical-onboarding" aria-label="Credenciamento de revisores médicos">
  <h3>Profissionais médicos — credenciamento</h3>
  <p className="detail-note">Área administrativa de acompanhamento. A concordância relatada para participar do projeto não confirma situação do CRM ou título de especialista. Nenhuma conta é ativada pelo pré-cadastro.</p>
  {loading?<p role="status">Consultando cadastro...</p>:candidates.map(candidate=>
   <article key={candidate.id} className="cc-tech-review">
    <strong>{candidate.display_name} · CRM-{candidate.registration_region} {candidate.registration_number}</strong>
    <p>Área informada: {candidate.claimed_specialty||"Não informada"}</p>
    <p>{credentialLabel[candidate.credential_status]??"Situação profissional a confirmar"}</p>
    <p>{invitationLabel[candidate.invitation_status]??"Situação de acesso a confirmar"}</p>
    <p>Concordância para participar: {candidate.consent_reported?"informada pelo responsável do aplicativo":"não registrada"}.</p>
    <p>RQE: {candidate.rqe_number??"aguardando conferência"}. Conta vinculada: {candidate.auth_user_id?"sim":"não"}.</p>
    <p>E-mail indicado para convite: {candidate.contact_email??"não informado"}.</p>
    <p>Confirmação do e-mail: {candidate.contact_verified_at?"verificada":"pendente"}. O cadastro não envia mensagens automaticamente.</p>
   </article>
  )}
  {!loading&&!error&&candidates.length===0&&<p className="detail-note">Nenhum profissional indicado.</p>}
  {error&&<p role="alert" className="cc-tech-error">{error}</p>}
  <p className="detail-note">Próximas etapas: conferir CRM e RQE no cadastro oficial do CFM; validar o e-mail profissional diretamente com a médica; criar o convite individual; autenticar a conta; ativar exclusivamente a função de revisão médica. A aprovação nutricional permanece separada e depende do responsável habilitado.</p>
 </section>;
}