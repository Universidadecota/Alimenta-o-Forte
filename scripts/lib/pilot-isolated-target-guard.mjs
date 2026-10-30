/**
 * Fase 3X - barreira de PREPARAÇÃO de ambiente isolado.
 *
 * Somente valida valores; nunca abre conexão, lê chaves, executa SQL,
 * cria projeto, concede permissões ou declara testes de RLS como aprovados.
 * Este módulo não substitui controles do Supabase/Postgres.
 */
export const OPERATIONAL_SUPABASE_REF="gclhailalyrokvmkwllm";
export const LOCAL_CONFIRMATION="CONFIRMO_FIXTURES_SINTETICAS_LOCAIS";
export const ISOLATED_SCENARIO_IDS=Object.freeze([
 "anon_no_access","standard_no_access","admin_no_specialty",
 "specialist_only_own_gate","author_cannot_finalize",
 "independent_final_gate","expired_revoked_role",
 "stale_expected_version","duplicate_idempotency","changed_source",
 "event_immutability","private_evidence","no_auto_publish",
 "rollback_restore"
]);
export const SYNTHETIC_PERSONAS=Object.freeze([
 "anon","authenticated_standard","admin_without_specialty",
 "measure_reviewer","independent_approver","case_author",
 "revoked_specialist","cross_case_user","isolated_test_operator"
]);

const deny=(reason)=>({allowed:false,kind:null,reason});
const allow=(kind)=>({allowed:true,kind,reason:"preflight_config_only_no_connection"});
const isCleanUrl=(parsed)=>
 parsed.username===""&&parsed.password===""&&parsed.search===""&&
 parsed.hash===""&&(parsed.pathname==="/"||parsed.pathname==="");

export function validateIsolatedTarget(config){
 const mode=config?.mode??"";
 const address=config?.url??"";
 if(typeof address!=="string"||!address.trim())return deny("missing_isolated_url");
 let parsed;
 try{parsed=new URL(address);}
 catch{return deny("malformed_url");}
 if(!isCleanUrl(parsed))return deny("url_must_not_include_auth_or_path");
 if(mode==="local"){
  if(parsed.protocol!=="http:"||
   !["127.0.0.1","localhost"].includes(parsed.hostname)||
   parsed.port!=="54321")return deny("local_must_use_loopback_54321");
  if(config.projectRef||config.approvedProjectRef)return deny("local_must_not_use_project_ref");
  if(config.confirmation!==LOCAL_CONFIRMATION)return deny("missing_local_confirmation");
  return allow("loopback_local");
 }
 if(mode==="remote-test"){
  const projectRef=config.projectRef??"";
  if(typeof projectRef!=="string"||!/^[a-z]{20}$/.test(projectRef))
   return deny("missing_or_invalid_project_ref");
  if(projectRef===OPERATIONAL_SUPABASE_REF||
   parsed.hostname===OPERATIONAL_SUPABASE_REF+".supabase.co")
   return deny("operational_project_is_forbidden");
  if(parsed.protocol!=="https:"||parsed.port!==""||
   parsed.hostname!==projectRef+".supabase.co")
   return deny("remote_url_must_match_test_project_ref");
  if(config.approvedProjectRef!==projectRef)return deny("distinct_test_project_allowlist_required");
  if(config.confirmation!=="CONFIRMO_TESTE_ISOLADO_"+projectRef)
   return deny("missing_remote_confirmation");
  return allow("separate_remote_project_candidate");
 }
 return deny("unsupported_mode");
}

/**
 * Este manifesto NUNCA promove cenários a PASS e nunca acessa dados.
 * Mesmo um URL válido é apenas candidato: a prova de isolamento, as
 * credenciais de teste, a RLS e as evidências continuam pendentes.
 */
export function makeIsolatedReadinessReport(config,scenarioIds=ISOLATED_SCENARIO_IDS){
 const target=validateIsolatedTarget(config);
 if(!Array.isArray(scenarioIds)||scenarioIds.length!==14||
  new Set(scenarioIds).size!==14||
  ISOLATED_SCENARIO_IDS.some(id=>!scenarioIds.includes(id)))
  return {kind:"isolated_preflight",target:{allowed:false,kind:null,reason:"scenario_matrix_mismatch"},
   networkConnections:0,queriesExecuted:0,migrationsExecuted:0,rlsTestsExecuted:0,
   canExecuteDatabaseTests:false,scenarios:[]};
 return {
  kind:"isolated_preflight",
  target,
  networkConnections:0,
  queriesExecuted:0,
  migrationsExecuted:0,
  rlsTestsExecuted:0,
  canExecuteDatabaseTests:false,
  scenarios:scenarioIds.map(id=>({
   id,status:target.allowed?"prepared_not_executed":"blocked_no_isolated_target",
   databaseEvidence:null
  }))
 };
}
