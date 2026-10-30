import type {AuxiliaryEditorialWorkflowPreview,EditorialGateId} from "./pilotAuxiliaryEditorialWorkflowPreview";

/**
 * DOCUMENTAÇÃO EXECUTÁVEL DE REQUISITOS FUTUROS — NÃO É RBAC.
 * Nenhum resultado desta função pode conceder autorização.
 * cc_is_admin() hoje só delimita a leitura administrativa do piloto.
 */
export type ProposedEditorialRole=
 "source_custodian"|"measure_reviewer"|"food_safety_reviewer"|
 "allergen_reviewer"|"ingredient_reviewer"|"nutrition_reviewer"|
 "rights_reviewer"|"independent_approver";
export type ProposedEditorialTableName=
 "cc_aux_editorial_cases"|"cc_aux_editorial_case_versions"|
 "cc_aux_editorial_role_grants"|"cc_aux_editorial_evidence"|
 "cc_aux_editorial_decision_events";
export type ProposedTableBlueprint={
 name:ProposedEditorialTableName;
 purpose:string;
 keyFields:readonly string[];
 constraints:readonly string[];
 backendOnlyWrites:true;
 migrationExecuted:false;
 rlsImplemented:false;
};
export type ProposedRoleBlueprint={
 role:ProposedEditorialRole;
 gate:EditorialGateId;
 title:string;
 serverVerification:string;
 canActNow:false;
 grantedInDatabase:false;
};
export type ProposedControlBlueprint={
 id:string;
 title:string;
 implementation:"not_implemented";
 gate:"server_only";
 detail:string;
};
export type AuxiliaryAuthorizationBlueprint={
 schemaVersion:1;
 status:"design_only_no_migration";
 recipeId:string;
 sourceHash:string;
 roleBlueprint:readonly ProposedRoleBlueprint[];
 tables:readonly ProposedTableBlueprint[];
 serverControls:readonly ProposedControlBlueprint[];
 proposedCurrentVersion:null;
 proposedActorId:null;
 serverIdentityVerified:false;
 permissionsProvisioned:false;
 databaseTablesCreated:false;
 approvalAllowed:false;
 changesAllowed:false;
 commercialPublicationAllowed:false;
 auditEventsCreated:false;
};

/** Papéis ainda não existentes. Revisão final deve ser de outra pessoa,
 * com permissões e habilitações conferidas pelo servidor.
 */
export const PROPOSED_ROLE_MATRIX:readonly ProposedRoleBlueprint[]=[
 {role:"source_custodian",gate:"source_and_version",title:"Custódia da fonte e versão",serverVerification:"Autenticação e verificação independente de hash, snapshot e estágio piloto.",canActNow:false,grantedInDatabase:false},
 {role:"measure_reviewer",gate:"measurement",title:"Conferência das medidas",serverVerification:"Identidade habilitada e evidência de rendimento/unidade; nenhuma conversão implícita.",canActNow:false,grantedInDatabase:false},
 {role:"food_safety_reviewer",gate:"culinary_safety",title:"Segurança culinária",serverVerification:"Autorização profissional definida; avaliar pasteurização, conservação, descarte e segurança das sobras.",canActNow:false,grantedInDatabase:false},
 {role:"allergen_reviewer",gate:"allergens",title:"Revisão dos alergênicos",serverVerification:"Verificação de papel específico e da versão revisada de ingredientes, contato cruzado e alternativas.",canActNow:false,grantedInDatabase:false},
 {role:"ingredient_reviewer",gate:"ingredient_structuring",title:"Estruturação de ingredientes",serverVerification:"Permissão específica; controlar ingredientes auxiliares e prevenção de dupla contagem.",canActNow:false,grantedInDatabase:false},
 {role:"nutrition_reviewer",gate:"nutrition",title:"Parecer nutricional",serverVerification:"Revisor habilitado e independente dos cálculos de porções/ingredientes.",canActNow:false,grantedInDatabase:false},
 {role:"rights_reviewer",gate:"commercial_rights",title:"Direitos comerciais",serverVerification:"Autorização responsável e comprovação documental dos direitos de uso.",canActNow:false,grantedInDatabase:false},
 {role:"independent_approver",gate:"final_independent_check",title:"Decisão final independente",serverVerification:"Diferente do autor/proponente, controle de conflito de interesse e conferência transacional de todos os pareceres.",canActNow:false,grantedInDatabase:false}
];

export const PROPOSED_TABLE_BLUEPRINTS:readonly ProposedTableBlueprint[]=[
 {
  name:"cc_aux_editorial_cases",
  purpose:"Identificar receita + bloco auxiliar e ponteiro da versão ativa, sem aplicar aprovação diretamente às receitas.",
  keyFields:["id uuid PK","recipe_id uuid FK recipes","auxiliary_block_key text","created_by uuid auth.uid","current_version integer","workflow_state text","created_at timestamptz"],
  constraints:["Unique(recipe_id,auxiliary_block_key) ativo, com histórico de reaberturas","Ponteiro de versão alterado apenas em procedimento transacional de servidor","Sem permissão de escrita direta a anon/authenticated"],
  backendOnlyWrites:true,migrationExecuted:false,rlsImplemented:false
 },
 {
  name:"cc_aux_editorial_case_versions",
  purpose:"Fotografia imutável da proposta: valores, unidades, método, fonte, ingredientes e autoria.",
  keyFields:["case_id uuid FK","version integer","recipe_snapshot_hash text","source_reference_hash text","auxiliary_ingredients_hash text","proposed_payload jsonb","created_by uuid","created_at timestamptz"],
  constraints:["PK(case_id,version)","Snapshot canônico conferido contra registros atuais no servidor","Sem UPDATE/DELETE no fluxo normal; mudanças por nova versão"],
  backendOnlyWrites:true,migrationExecuted:false,rlsImplemented:false
 },
 {
  name:"cc_aux_editorial_role_grants",
  purpose:"Responsabilidades explicitamente autorizadas e com escopo, separadas de cc_admin_members.",
  keyFields:["grant_id uuid PK","user_id uuid","role_code text","scope text","granted_by uuid","valid_from timestamptz","expires_at timestamptz"],
  constraints:["Papéis concedidos por administrador habilitado, não por parâmetro do navegador","Proponente e aprovador final distintos","Escopos e validade revalidados em cada decisão"],
  backendOnlyWrites:true,migrationExecuted:false,rlsImplemented:false
 },
 {
  name:"cc_aux_editorial_evidence",
  purpose:"Referências de evidência, versões e integridade sem armazenar arquivos sensíveis em payload aberto.",
  keyFields:["evidence_id uuid PK","case_id uuid","version integer","evidence_kind text","digest_sha256 text","storage_object_ref text","submitted_by uuid","created_at timestamptz"],
  constraints:["Storage privado com política restrita","Hash de conteúdo e vínculo a versão específica","Retenção e acesso auditáveis definidos antes da implementação"],
  backendOnlyWrites:true,migrationExecuted:false,rlsImplemented:false
 },
 {
  name:"cc_aux_editorial_decision_events",
  purpose:"Linha do tempo append-only de submissões, pareceres, rejeições e decisões, sem editar o passado.",
  keyFields:["event_id bigint PK","case_id uuid","version integer","event_type text","actor_user_id uuid","reviewer_role text","decision text","evidence_id uuid","expected_version integer","created_at timestamptz"],
  constraints:["Somente inserção via RPC SECURITY DEFINER restrita, com search_path explícito","Rejeitar autoaprovação e versão obsoleta em transação","Proibir UPDATE/DELETE inclusive em RPCs de negócio","Idempotência por chave da ação e auditabilidade de reabertura"],
  backendOnlyWrites:true,migrationExecuted:false,rlsImplemented:false
 }
];

export const PROPOSED_SERVER_CONTROLS:readonly ProposedControlBlueprint[]=[
 {id:"auth",title:"Autorização real",implementation:"not_implemented",gate:"server_only",detail:"auth.uid() autenticado e escopo do papel conferidos no servidor; cc_is_admin() isolado não concede aprovação técnica."},
 {id:"least_privilege",title:"Privilégio mínimo e RLS",implementation:"not_implemented",gate:"server_only",detail:"Tabelas novas com RLS ativa e política de leitura auditável; sem grants de escrita direta ou acesso anon a dados do fluxo."},
 {id:"version",title:"Concorrência e versão",implementation:"not_implemented",gate:"server_only",detail:"expected_version, bloqueio de caso e revalidação transacional da fonte, preparo, ingredientes, pareceres e direitos."},
 {id:"separation",title:"Segregação de funções",implementation:"not_implemented",gate:"server_only",detail:"Aprovador final diferente de quem apresentou a versão; verificações de conflitos de papéis no banco."},
 {id:"append_only",title:"Imutabilidade e evidências",implementation:"not_implemented",gate:"server_only",detail:"Eventos somente acrescentados e arquivos privados identificados por digest e referência de versão."},
 {id:"no_auto_publish",title:"Publicação separada",implementation:"not_implemented",gate:"server_only",detail:"Parecer nunca executa UPDATE de recipes.published, ingredients ou cálculos; liberar catálogo exige processo próprio."},
 {id:"revocation",title:"Expiração, revogação e reabertura",implementation:"not_implemented",gate:"server_only",detail:"Revogar grants, bloquear tokens antigos e reabrir por novos eventos; não apagar pareceres anteriores."},
 {id:"idempotency",title:"Duplicidade e recuperação",implementation:"not_implemented",gate:"server_only",detail:"Chave idempotente por ação, falha segura em repetição e teste de rollback/recuperação em ambiente de teste."}
];

/** Somente aceita o objeto que demonstra ausência de aprovação real;
 * o resultado tem TODAS as permissões e migrações explicitamente falsas.
 */
export function buildAuxiliaryAuthorizationBlueprint(
 preview:AuxiliaryEditorialWorkflowPreview
):AuxiliaryAuthorizationBlueprint|null{
 if(preview.schemaVersion!==1||
  preview.scope!=="projeto_de_fluxo_somente_leitura"||
  preview.draftStatus!=="rascunho_nao_homologado"||
  preview.auditRecorded!==false||preview.workflowPersisted!==false||
  preview.canApprove!==false||preview.canPublish!==false||
  preview.canWriteIngredients!==false||preview.canChangeNutrition!==false||
  preview.canReleaseShopping!==false||
  preview.requiresServerAuthorization!==true||
  preview.requiresIndependentApproval!==true||
  preview.requiresImmutableAudit!==true||
  preview.proposedEventEnvelope.eventKind!=="not_recorded"||
  preview.proposedEventEnvelope.eventId!==null||
  preview.proposedEventEnvelope.actorId!==null||
  preview.proposedEventEnvelope.serverTimestamp!==null||
  !preview.recipeId?.trim()||!preview.sourceReferenceHash?.trim()||
  preview.gates.length!==PROPOSED_ROLE_MATRIX.length||
  new Set(preview.gates.map(g=>g.id)).size!==PROPOSED_ROLE_MATRIX.length||
  PROPOSED_ROLE_MATRIX.some(role=>!preview.gates.some(g=>g.id===role.gate)))return null;
 return {
  schemaVersion:1,status:"design_only_no_migration",
  recipeId:preview.recipeId,sourceHash:preview.sourceReferenceHash,
  roleBlueprint:PROPOSED_ROLE_MATRIX,
  tables:PROPOSED_TABLE_BLUEPRINTS,
  serverControls:PROPOSED_SERVER_CONTROLS,
  proposedCurrentVersion:null,proposedActorId:null,
  serverIdentityVerified:false,permissionsProvisioned:false,
  databaseTablesCreated:false,approvalAllowed:false,changesAllowed:false,
  commercialPublicationAllowed:false,auditEventsCreated:false
 };
}
