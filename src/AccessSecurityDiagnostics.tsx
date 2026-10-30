import {useState} from "react";
import {supabase} from "./lib/supabase";
import {
 CHECK_LABELS,JWT_AUDIT_KEYS,classifyJwtAuditRole,evaluateJwtAudit,
 type AuditObservation,type AuditAssessment,type JwtAuditRole
} from "./lib/betaJwtReadOnlyAudit";

/** Executa somente SELECTs (head/count) e RPCs STABLE de leitura sob a
 * sessão real do Supabase Auth deste navegador. Nenhum token é exibido,
 * exportado, registrado em logs ou fornecido a outra conta.
 */
const ACTIVE_BETA_REFERENCE="0046b050-1367-4cc8-816c-1d145a44e87f";
type Report={
 auditType:"read_only_browser_jwt";
 execution:"browser_supabase_auth";
 role:JwtAuditRole;
 date:string;
 referenceRecipeEnabledAtDesign:"2026-10-30";
 checks:AuditAssessment[];
 totalAlerts:number;
 totalInconclusive:number;
 writeTestsExecuted:false;
 otherUsersSessionsTested:false;
};
function diagnosticReturn(){window.location.assign(window.location.origin+window.location.pathname);}
function denied(err:unknown){
 if(!err||typeof err!=="object")return false;
 const obj=err as {code?:string;status?:number;message?:string};
 return obj.code==="42501"||obj.code==="PGRST301"||obj.status===401||
  obj.status===403||/permission denied|acesso negado|sem permissão/i.test(obj.message??"");
}
export default function AccessSecurityDiagnostics({authenticated}:{authenticated:boolean}){
 const [busy,setBusy]=useState(false);
 const [report,setReport]=useState<Report|null>(null);
 const [error,setError]=useState("");
 const [copied,setCopied]=useState(false);
 const run=async()=>{
  const client=supabase;
  if(!client||busy)return;
  setBusy(true);setError("");setReport(null);setCopied(false);
  try{
   let userId:string|null=null;
   if(authenticated){
    const {data,error}=await client.auth.getUser();
    if(error||!data.user)throw new Error("Não foi possível confirmar a identidade da sessão. Entre novamente.");
    userId=data.user.id;
   }
   let admin:boolean|null=false;
   let betaAccess:boolean|null=false;
   if(userId){
    const [a,b]=await Promise.all([
     client.rpc("cc_is_admin"),
     client.rpc("cc_beta_can_view_recipe",{p_recipe_id:ACTIVE_BETA_REFERENCE})
    ]);
    admin=a.error||typeof a.data!=="boolean"?null:a.data;
    betaAccess=b.error||typeof b.data!=="boolean"?null:b.data;
   }
   const role=classifyJwtAuditRole(Boolean(userId),admin,betaAccess);
   const results=await Promise.all(JWT_AUDIT_KEYS.map(async(key):Promise<AuditObservation>=>{
    if(!userId&&["other_plans","other_favorites","other_preferences"].includes(key)){
     return {key,count:null,error:true,accessDenied:false};
    }
    try{
     if(key==="admin_beta_catalog"){
      const {data,error}=await client.rpc("cc_admin_beta_catalog_overview");
      return {key,count:error?null:(Array.isArray(data)?data.length:null),error:Boolean(error)&&!denied(error),accessDenied:denied(error)};
     }
     if(key==="private_official"){
      const {count,error}=await client.from("recipes").select("id",{count:"exact",head:true})
       .is("owner_user_id",null).eq("published",false);
      return {key,count:count??null,error:Boolean(error)&&!denied(error),accessDenied:denied(error)};
     }
     if(key==="source_records"){
      const {count,error}=await client.from("cc_official_recipe_source_records")
       .select("recipe_id",{count:"exact",head:true});
      return {key,count:count??null,error:Boolean(error)&&!denied(error),accessDenied:denied(error)};
     }
     if(key==="measure_reviews"){
      const {count,error}=await client.from("cc_pilot_ingredient_measure_reviews")
       .select("ingredient_id",{count:"exact",head:true});
      return {key,count:count??null,error:Boolean(error)&&!denied(error),accessDenied:denied(error)};
     }
     const table=key==="other_plans"?"planned_meals":key==="other_favorites"?"favorites":"user_preferences";
     const {count,error}=await client.from(table).select("user_id",{count:"exact",head:true})
      .neq("user_id",userId!);
     return {key,count:count??null,error:Boolean(error)&&!denied(error),accessDenied:denied(error)};
    }catch{
     return {key,count:null,error:true,accessDenied:false};
    }
   }));
   const checks=evaluateJwtAudit(role,results);
   setReport({
    auditType:"read_only_browser_jwt",execution:"browser_supabase_auth",
    role,date:new Date().toISOString(),referenceRecipeEnabledAtDesign:"2026-10-30",
    checks,totalAlerts:checks.filter(c=>c.status==="alerta").length,
    totalInconclusive:checks.filter(c=>c.status==="inconclusivo").length,
    writeTestsExecuted:false,otherUsersSessionsTested:false
   });
  }catch(err){setError(err instanceof Error?err.message:"Diagnóstico indisponível.");}
  finally{setBusy(false);}
 };
 const copy=async()=>{
  if(!report)return;
  try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));setCopied(true);}
  catch{setError("A cópia automática falhou. Utilize o relatório apresentado para conferência.");}
 };
 return <div className="auth-center" style={{padding:"20px",alignItems:"flex-start"}}>
  <section className="auth-card" style={{maxWidth:820,width:"100%",margin:"20px auto"}}>
   <h1>Diagnóstico de acesso · Costa&Costa</h1>
   <p><strong>Pré-lançamento — auditoria de leitura.</strong> Este teste usa a sessão real do navegador, se houver login, e consulta apenas quantidades de registros por meio do Supabase. Não utiliza credenciais administrativas de servidor, não cria usuários e não modifica dados.</p>
   <p>Sessão identificada pela aplicação: <strong>{authenticated?"Autenticada":"Anônima"}</strong>. O papel efetivo será reavaliado pelo Supabase ao executar o teste.</p>
   <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"12px 0"}}>
    <button type="button" className="primary" disabled={busy||!supabase} onClick={()=>void run()}>
     {busy?"Conferindo permissões...":"Executar verificações de leitura"}
    </button>
    <button type="button" className="secondary" onClick={diagnosticReturn}>Voltar ao aplicativo</button>
   </div>
   <p className="detail-note">Os resultados pertencem somente à sessão atual. Para testar outro perfil, encerre esta sessão, entre na outra conta controlada e abra novamente esta página. Não compartilhe senhas, tokens nem informações pessoais.</p>
   {error&&<p role="alert">{error}</p>}
   {report&&<section aria-label="Resultado do diagnóstico de acesso">
    <h2>Resultado da sessão</h2>
    <p>Perfil observado: <strong>{{
     anonymous:"Anônimo",admin:"Administrador",beta_member:"Participante com acesso Beta à receita de referência",
     ordinary:"Usuário sem acesso Beta à receita de referência",unknown:"Perfil inconclusivo"
    }[report.role]}</strong>.</p>
    <p>Alertas: <strong>{report.totalAlerts}</strong>. Verificações inconclusivas: <strong>{report.totalInconclusive}</strong>.</p>
    <ul>{report.checks.map(x=><li key={x.key} style={{marginBottom:10}}>
     <strong>{CHECK_LABELS[x.key]}</strong> · {x.status==="conforme"?"Conforme ao teste":x.status==="alerta"?"ALERTA":"Inconclusivo"}
     {x.count!==null&&<span> · {x.count} registro(s)</span>}
     <small style={{display:"block"}}>{x.description}</small>
    </li>)}</ul>
    <p><strong>Limitações:</strong> nenhuma escrita, exclusão, concorrência, recuperação ou teste de outro usuário foi executado. Um resultado conforme nesta sessão não homologa todas as políticas RLS. O diagnóstico Beta utiliza uma receita de referência que estava habilitada em 30/10/2026; se o administrador a desabilitar, a classificação Beta pode exigir atualização.</p>
    <button type="button" className="secondary" onClick={()=>void copy()}>Copiar relatório sem identificadores pessoais</button>
    {copied&&<p role="status">Relatório sem e-mail, ID de usuário ou token copiado.</p>}
   </section>}
  </section>
 </div>;
}
