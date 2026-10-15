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
 collaboration_status:string;
 cfm_screenshot_registration_status:string;
 cfm_screenshot_specialty_status:string;
 cfm_screenshot_date:string|null;
};
const credentialLabel:Record<string,string>={
 pending_official_check:"Validação documental e credenciamento interno ainda pendentes",
 crm_verified:"CRM verificado; especialidade aguardando RQE",
 specialty_verified:"Credenciais profissionais verificadas",
 rejected:"Verificação não concluída"
};
const collaborationLabel:Record<string,string>={
 not_contacted:"Ainda não convidada para colaborar",
 invited_pending_negotiation:"Convidada para colaborar — negociação ainda não concluída",
 agreed:"Colaboração acordada",
 declined:"Convite de colaboração recusado"
};
const invitationLabel:Record<string,string>={
 not_invited:"Sem convite de acesso ao aplicativo",invited:"Convite de acesso pendente",
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
    .select("id,display_name,registration_region,registration_number,claimed_specialty,consent_reported,credential_status,invitation_status,rqe_number,auth_user_id,contact_email,contact_verified_at,collaboration_status,cfm_screenshot_registration_status,cfm_screenshot_specialty_status,cfm_screenshot_date")
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
  <p className="detail-note">Área administrativa de acompanhamento. O convite para negociar uma colaboração é diferente de aceitar formalmente a proposta ou receber acesso ao aplicativo. Nenhuma conta é ativada pelo pré-cadastro.</p>
  {loading?<p role="status">Consultando cadastro...</p>:candidates.map(candidate=>
   <article key={candidate.id} className="cc-tech-review">
    <strong>{candidate.display_name} · CRM-{candidate.registration_region} {candidate.registration_number}</strong>
    <p>Área informada: {candidate.claimed_specialty||"Não informada"}</p>
    <p><strong>Negociação:</strong> {collaborationLabel[candidate.collaboration_status]??"Situação não informada"}</p>
    <p><strong>CFM (captura fornecida):</strong> {candidate.cfm_screenshot_registration_status==="regular"?"Inscrição regular":candidate.cfm_screenshot_registration_status==="irregular"?"Inscrição não regular":"Sem evidência cadastrada"}.
    {candidate.cfm_screenshot_specialty_status==="none_registered"?" Médico sem especialidade registrada.":candidate.cfm_screenshot_specialty_status==="registered"?" Especialidade indicada na consulta: conferir RQE.":""}
    {candidate.cfm_screenshot_date?" Consulta apresentada em "+new Date(candidate.cfm_screenshot_date+"T12:00:00").toLocaleDateString("pt-BR")+".":""}</p>
    <p><strong>Credenciamento interno:</strong> {credentialLabel[candidate.credential_status]??"Situação profissional a confirmar"}. A captura não libera pareceres.</p>
    <p>{invitationLabel[candidate.invitation_status]??"Situação de acesso a confirmar"}</p>
    <p><strong>Acordo concluído:</strong> {candidate.consent_reported?"aceite informado pelo responsável":"não; negociação pendente"}.</p>
    <p>RQE: {candidate.rqe_number??"não cadastrado"}. Conta vinculada: {candidate.auth_user_id?"sim":"não"}.</p>
    <p>E-mail indicado para convite: {candidate.contact_email??"não informado"}.</p>
    <p>Confirmação do e-mail: {candidate.contact_verified_at?"verificada":"pendente"}. O cadastro não envia mensagens automaticamente.</p>
   </article>
  )}
  {!loading&&!error&&candidates.length===0&&<p className="detail-note">Nenhum profissional indicado.</p>}
  {error&&<p role="alert" className="cc-tech-error">{error}</p>}
  <p className="detail-note">Próximas etapas: concluir a negociação e definir o escopo clínico; confirmar dados atuais no CFM antes do credenciamento formal; obter o e-mail escolhido pela médica; preparar convite individual para acesso apenas após o acordo. Sem especialidade registrada na consulta apresentada, não divulgar título de especialista nem conceder aprovação nutricional.</p>
 </section>;
}