/** Auditoria superficial, somente de leitura, executada com a sessão do browser.
 * Não simula JWT, não concede papéis nem substitui testes de penetração.
 */
export type JwtAuditRole="anonymous"|"admin"|"ordinary"|"unknown";
export type AuditKey=
 "private_official"|"source_records"|"measure_reviews"|
 "admin_beta_catalog"|"other_plans"|"other_favorites"|"other_preferences";
export type AuditObservation={key:AuditKey;count:number|null;accessDenied:boolean;error:boolean};
export type AuditAssessment={key:AuditKey;status:"conforme"|"alerta"|"inconclusivo";description:string;count:number|null};
const EXTERNAL_KEYS:readonly AuditKey[]=["source_records","measure_reviews","admin_beta_catalog"];
const OWNER_KEYS:readonly AuditKey[]=["other_plans","other_favorites","other_preferences"];
export const CHECK_LABELS:Record<AuditKey,string>={
 private_official:"Receitas oficiais privadas acessíveis",
 source_records:"Fontes administrativas",
 measure_reviews:"Revisões editoriais históricas",
 admin_beta_catalog:"Consulta administrativa do catálogo privado",
 other_plans:"Cardápios pertencentes a outras contas",
 other_favorites:"Favoritos pertencentes a outras contas",
 other_preferences:"Preferências pertencentes a outras contas"
};
export function classifyJwtAuditRole(
 authenticated:boolean,
 admin:boolean|null
):JwtAuditRole{
 if(!authenticated)return "anonymous";
 if(admin===null)return "unknown";
 return admin?"admin":"ordinary";
}
export function evaluateJwtAudit(
 role:JwtAuditRole,
 observations:readonly AuditObservation[]
):AuditAssessment[]{
 const seen=new Set<AuditKey>();
 return observations.map(obs=>{
  const result=(status:AuditAssessment["status"],description:string):AuditAssessment=>({
   key:obs.key,status,description,count:obs.error||obs.accessDenied?null:obs.count
  });
  if(seen.has(obs.key))return result("inconclusivo","Consulta duplicada no relatório.");
  seen.add(obs.key);
  if(role==="unknown")return result("inconclusivo","Não foi possível confirmar o perfil com o servidor.");
  if(obs.error&&!obs.accessDenied)return result("inconclusivo","A consulta falhou; não interpretar falha técnica como acesso negado.");
  if(role==="admin"){
   if(obs.accessDenied)return result("inconclusivo","A consulta foi recusada para a conta administrativa; conferir grants e políticas.");
   if(obs.count===null)return result("inconclusivo","Consulta sem contagem verificável.");
   if(OWNER_KEYS.includes(obs.key)&&obs.count!==0)
    return result("alerta","Uma conta acessou registros com outro titular.");
   return result("conforme",OWNER_KEYS.includes(obs.key)?
    "Nenhum registro pertencente a outro titular retornou nesta consulta.":
    "A consulta foi permitida; a contagem não certifica a segurança integral.");
  }
  if(obs.key==="private_official"){
   if(obs.accessDenied)return result("conforme","A leitura privada foi bloqueada.");
   if(obs.count===null)return result("inconclusivo","Sem contagem verificável.");
   return obs.count===0?result("conforme","Nenhuma receita oficial privada acessível."):
    result("alerta","Conta comum acessou receitas oficiais privadas.");
  }
  if(EXTERNAL_KEYS.includes(obs.key)){
   if(obs.accessDenied)return result("conforme","Leitura administrativa bloqueada.");
   if(obs.count===null)return result("inconclusivo","Sem contagem verificável.");
   return obs.count===0?result("conforme","Nenhum registro administrativo retornou."):
    result("alerta","Conta sem perfil administrativo recebeu registros administrativos.");
  }
  if(OWNER_KEYS.includes(obs.key)){
   if(obs.accessDenied)return result("conforme","Consulta a outro titular foi bloqueada.");
   if(obs.count===null)return result("inconclusivo","Sem contagem verificável.");
   return obs.count===0?result("conforme","Nenhum registro de outro titular retornou."):
    result("alerta","Consulta retornou registros de outro titular.");
  }
  return result("inconclusivo","Cenário não reconhecido.");
 });
}
export const JWT_AUDIT_KEYS:readonly AuditKey[]=[
 "private_official","source_records","measure_reviews",
 "admin_beta_catalog","other_plans","other_favorites","other_preferences"
];
