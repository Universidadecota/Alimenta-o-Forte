import type {AuxiliaryAuthorizationBlueprint} from "./pilotAuxiliaryAuthorizationBlueprint";

/** Matriz de riscos e verificações FUTURAS, derivada da auditoria em leitura
 * das funções existentes em 30/10/2026. Não testa RLS e não executa SQL.
 */
export type MigrationTestKind=
 "authorization"|"versioning"|"audit"|"integration"|"recovery";
export type MigrationTestCase={
 id:string;
 category:MigrationTestKind;
 persona:string;
 procedure:string;
 expected:string;
 status:"not_executed";
};
export type MigrationPhase={
 id:string;
 title:string;
 stage:"design"|"isolated_environment"|"review_required";
 requiredEvidence:readonly string[];
 status:"not_executed";
};
export type ExistingReviewPattern={
 system:string;
 verifiedBehavior:string;
 caveat:string;
};
export type AuxiliaryMigrationRunbook={
 kind:"migration_readiness_design_only";
 sourceHash:string;
 recipeId:string;
 existingPatterns:readonly ExistingReviewPattern[];
 phases:readonly MigrationPhase[];
 tests:readonly MigrationTestCase[];
 missingDecisions:readonly string[];
 migrationsExecuted:false;
 rlsTestsExecuted:false;
 actorRolesGranted:false;
 databaseChangesMade:false;
 approvalEnabled:false;
 publicationEnabled:false;
 productionReleaseApproved:false;
};

/** Evidência confirmada via inspeção SELECT de pg_proc e pg_trigger.
 * A presença de uma rotina não demonstra cobertura de outros produtos.
 */
export const VERIFIED_REVIEW_PATTERNS:readonly ExistingReviewPattern[]=[
 {
  system:"Revisão de variantes nutricionais",
  verifiedBehavior:"cc_request_food_nutrition_review exige cc_is_admin(), valida entrada e bloqueia a variante FOR UPDATE; cc_decide_food_nutrition_review exige revisor credenciado, impede solicitante=aprovador, confere snapshot, bloqueia a variante e o caso, escreve evento.",
  caveat:"O escopo real é cc_food_nutrition_variants; não concede aprovação a preparos auxiliares."
 },
 {
  system:"Invalidação de revisão nutricional",
  verifiedBehavior:"O trigger cc_fnrc_variant_invalidate chama cc_invalidate_nutrition_review_on_edit quando o snapshot da variante é alterado e registra evento de invalidação.",
  caveat:"Aplica-se a variantes nutricionais, não à futura versão editorial do molho."
 },
 {
  system:"Revisão de alergênicos",
  verifiedBehavior:"cc_allergen_review_guard atribui auth.uid() e data à marca verified; alteração em recipe_ingredients dispara cc_allergen_ingredients_invalidate para voltar a pending.",
  caveat:"Não há evidência de separação autor/aprovador nessa rotina; não reutilizar como aprovação independente do molho."
 },
 {
  system:"Inventário histórico de medidas",
  verifiedBehavior:"cc_protect_pilot_measure_review_source rejeita mudança de ID, receita, texto e posição originais na linha histórica; há eventos de revisão de medida.",
  caveat:"Verificações históricas não substituem versionamento, medidas de molho nem aprovação profissional."
 },
 {
  system:"Permissões atuais",
  verifiedBehavior:"cc_is_admin() consulta cc_admin_members por auth.uid(). Funções de revisão nutricional usam SECURITY DEFINER com search_path vazio e EXECUTE para authenticated/service_role; trigger functions críticas não têm EXECUTE direto para authenticated na amostra auditada.",
  caveat:"Administração não equivale a habilitação profissional. SECURITY DEFINER exige auditoria de GRANT EXECUTE, schema, search_path e identidade a cada função nova."
 }
];
export const MIGRATION_PHASES:readonly MigrationPhase[]=[
 {
  id:"01_baseline",
  title:"Fotografia e plano de recuperação",
  stage:"design",
  requiredEvidence:[
   "Inventariar schema, policies, grants, triggers, função e dependências de receitas e revisões existentes.",
   "Conferir backup/restauração em ambiente isolado; definir ponto de retorno, proprietário e janela de manutenção, sem apagar histórico."
  ],
  status:"not_executed"
 },
 {
  id:"02_policy",
  title:"Governança de papéis, fontes e versões",
  stage:"review_required",
  requiredEvidence:[
   "Atribuir responsáveis por segurança culinária, alergênicos, nutrição, direitos e aprovação final independente.",
   "Fechar critérios de evidência/escopo/validade e reabrir decisão quando a fonte ou ingrediente mudar.",
   "Aprovar explicitamente DDL, privilégio mínimo, RLS, concessões e rollback antes de executar qualquer migração."
  ],
  status:"not_executed"
 },
 {
  id:"03_isolated_schema",
  title:"Protótipo aditivo em base de teste separada",
  stage:"isolated_environment",
  requiredEvidence:[
   "Criar, somente na base de teste e após aprovação, as cinco entidades versionadas; habilitar RLS e revogar escrita direta.",
   "Construir RPCs sob revisão com auth.uid(), papéis reais, controle esperado de versão e evento append-only.",
   "Manter receitas, origem e campos publicados intactos. Não copiar dados pessoais de produção sem autorização."
  ],
  status:"not_executed"
 },
 {
  id:"04_adversarial_tests",
  title:"Matriz de perfis, concorrência e recuperação",
  stage:"isolated_environment",
  requiredEvidence:[
   "Executar cenários autenticados de negativo/positivo por função, com sujeitos de teste distintos.",
   "Simular submissões paralelas e repetidas, edição de fonte, revogação e tentativa de alterar o histórico.",
   "Ensaiar recuperação em backup de teste e conferir que nenhum parecer publica receitas."
  ],
  status:"not_executed"
 },
 {
  id:"05_gate",
  title:"Relatório de homologação e decisão separada",
  stage:"review_required",
  requiredEvidence:[
   "Anexar resultados reais de RLS, RPCs, diff, scanner e restauração; documentar falhas e correções.",
   "Obter aprovação explícita da migração em produção; habilitar fluxos e publicação em etapas distintas.",
   "Manter estado não publicado até segurança, receitas, medidas, alergênicos e direitos serem validados."
  ],
  status:"not_executed"
 }
];
export const MIGRATION_TEST_MATRIX:readonly MigrationTestCase[]=[
 {id:"anon_no_access",category:"authorization",persona:"anon",procedure:"SELECT/INSERT/UPDATE/EXECUTE nas entidades futuras",expected:"Acesso e execução negados",status:"not_executed"},
 {id:"standard_no_access",category:"authorization",persona:"authenticated sem função",procedure:"Listar caso de outro usuário; enviar parecer; escrever em eventos",expected:"Acesso/parecer negados sem divulgação de dados",status:"not_executed"},
 {id:"admin_no_specialty",category:"authorization",persona:"administrador sem credencial técnica",procedure:"Aprovar segurança ou nutrição",expected:"Negado mesmo que cc_is_admin() seja true",status:"not_executed"},
 {id:"specialist_only_own_gate",category:"authorization",persona:"revisor de medida habilitado",procedure:"Parecer de medidas e tentativa de parecer de direitos",expected:"Somente operação do escopo autorizado, se evidência válida",status:"not_executed"},
 {id:"author_cannot_finalize",category:"authorization",persona:"proponente e aprovador coincidentes",procedure:"Decisão final com todas as etapas prontas",expected:"Rejeitar autoaprovação no servidor",status:"not_executed"},
 {id:"independent_final_gate",category:"authorization",persona:"aprovador independente autorizado",procedure:"Parecer final com fonte e todos os gates válidos",expected:"Somente evento editorial autorizado, sem publicar receitas",status:"not_executed"},
 {id:"expired_revoked_role",category:"authorization",persona:"especialista revogado ou expirado",procedure:"Tentar emitir parecer com sessão antiga",expected:"Negar após validação de grant atual no banco",status:"not_executed"},
 {id:"stale_expected_version",category:"versioning",persona:"dois revisores concorrentes",procedure:"Alterar mesma versão com expected_version igual",expected:"Só uma transação avança; outra recebe conflito",status:"not_executed"},
 {id:"duplicate_idempotency",category:"versioning",persona:"cliente reenviando pedido",procedure:"Repetir evento com mesma chave idempotente",expected:"Um único efeito e nenhuma dupla aprovação",status:"not_executed"},
 {id:"changed_source",category:"versioning",persona:"editor após revisão",procedure:"Alterar ingrediente, instrução ou hash de origem",expected:"Parecer antigo invalidado/reaberto em nova versão",status:"not_executed"},
 {id:"event_immutability",category:"audit",persona:"authenticated e administrador",procedure:"UPDATE/DELETE e tentativa de forjar actor_id ou created_at",expected:"Bloquear alterações de eventos e usar identidade/hora do servidor",status:"not_executed"},
 {id:"private_evidence",category:"audit",persona:"usuário não autorizado",procedure:"Ler evidência/Storage de outra receita",expected:"Negado, inclusive link público e leitura cross-case",status:"not_executed"},
 {id:"no_auto_publish",category:"integration",persona:"aprovador editorial",procedure:"Concluir parecer final",expected:"recipes.published, compras, nutrição e alérgenos não são alterados por parecer",status:"not_executed"},
 {id:"rollback_restore",category:"recovery",persona:"operador de teste",procedure:"Falha entre evento e avanço de versão; testar backup/restore",expected:"Transação íntegra; recuperável sem apagar histórico",status:"not_executed"}
];

/** Não confundir planejamento com aprovação. Falha fechada se o blueprint
 * tiver qualquer sinal de autorização, tabelas ou eventos reais.
 */
export function buildAuxiliaryMigrationRunbook(
 blueprint:AuxiliaryAuthorizationBlueprint
):AuxiliaryMigrationRunbook|null{
 if(blueprint.schemaVersion!==1||
  blueprint.status!=="design_only_no_migration"||
  !blueprint.recipeId?.trim()||!blueprint.sourceHash?.trim()||
  blueprint.databaseTablesCreated!==false||
  blueprint.permissionsProvisioned!==false||
  blueprint.serverIdentityVerified!==false||
  blueprint.approvalAllowed!==false||
  blueprint.changesAllowed!==false||
  blueprint.commercialPublicationAllowed!==false||
  blueprint.auditEventsCreated!==false||
  blueprint.proposedActorId!==null||blueprint.proposedCurrentVersion!==null||
  blueprint.tables.length!==5||
  blueprint.roleBlueprint.length!==8||
  blueprint.serverControls.length!==8||
  blueprint.tables.some(t=>t.migrationExecuted!==false||t.rlsImplemented!==false||t.backendOnlyWrites!==true)||
  blueprint.roleBlueprint.some(r=>r.grantedInDatabase!==false||r.canActNow!==false)||
  blueprint.serverControls.some(c=>c.implementation!=="not_implemented"||c.gate!=="server_only"))return null;
 return {
  kind:"migration_readiness_design_only",
  sourceHash:blueprint.sourceHash,recipeId:blueprint.recipeId,
  existingPatterns:VERIFIED_REVIEW_PATTERNS,
  phases:MIGRATION_PHASES,tests:MIGRATION_TEST_MATRIX,
  missingDecisions:[
   "Atribuir responsáveis por cada especialidade e validar independência entre autor e aprovador.",
   "Aprovar definição final do schema, RLS, grants, RPCs, retenção e revogação.",
   "Definir ambiente separado para testes, plano de backup e restauração verificável.",
   "Homologar medidas, conservação, alergênicos e direitos antes de permitir publicação.",
   "Aprovar separadamente qualquer migração e posterior ativação comercial."
  ],
  migrationsExecuted:false,rlsTestsExecuted:false,
  actorRolesGranted:false,databaseChangesMade:false,
  approvalEnabled:false,publicationEnabled:false,productionReleaseApproved:false
 };
}
