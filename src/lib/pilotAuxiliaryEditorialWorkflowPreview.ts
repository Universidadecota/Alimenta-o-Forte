import type {AuxiliaryReviewDraft} from "./pilotAuxiliaryReviewDraft";

/**
 * Fluxo de responsabilidade FUTURO: rótulos de função, não papéis existentes.
 * A plataforma atualmente só verifica acesso administrativo via cc_is_admin.
 * Nunca usar esta prévia cliente como decisão de autorização.
 */
export type EditorialGateId=
 "source_and_version"|"measurement"|"culinary_safety"|
 "allergens"|"ingredient_structuring"|"nutrition"|
 "commercial_rights"|"final_independent_check";
export type EditorialGateStatus=
 "conferencia_necessaria"|"apto_para_conferencia_humana"|"bloqueado_por_pendencia";
export type EditorialGate={
 id:EditorialGateId;
 title:string;
 suggestedResponsibility:string;
 status:EditorialGateStatus;
 evidence:string;
};
export type EditorialAuditEventShape={
 /** Não é um evento real; define os campos para um futuro registro no servidor. */
 eventKind:"not_recorded";
 eventId:null;
 actorId:null;
 serverTimestamp:null;
 recipeId:string;
 sourceHash:string;
 expectedVersion:null;
 previousVersion:null;
 newVersion:null;
 decision:null;
 evidenceReference:null;
};
export type AuxiliaryEditorialWorkflowPreview={
 schemaVersion:1;
 scope:"projeto_de_fluxo_somente_leitura";
 draftStatus:"rascunho_nao_homologado";
 recipeId:string;
 sourceReferenceHash:string;
 rightsStatusAtPreview:string;
 ingredientReviewStatusAtPreview:string;
 gates:readonly EditorialGate[];
 proposedEventEnvelope:EditorialAuditEventShape;
 requiresIndependentApproval:true;
 requiresServerAuthorization:true;
 requiresImmutableAudit:true;
 auditRecorded:false;
 workflowPersisted:false;
 canApprove:false;
 canPublish:false;
 canWriteIngredients:false;
 canChangeNutrition:false;
 canReleaseShopping:false;
};

export const PROPOSED_AUDIT_EVENTS=[
 "submissao_para_analise",
 "devolucao_para_correcao",
 "parecer_de_medidas",
 "parecer_de_seguranca_culinaria",
 "parecer_de_alergenicos",
 "parecer_de_ingredientes",
 "parecer_nutricional",
 "parecer_de_direitos",
 "decisao_independente_final",
 "reabertura_de_versao"
] as const;

/** Avaliação pura dos bloqueios atuais.
 *
 * Somente o passo matemático pode ficar apto a ser EXAMINADO por um humano.
 * Nenhuma etapa pode ficar aprovada, incluindo com números aparentemente
 * válidos, e nenhuma função cria evento, assinatura ou permissão.
 */
export function buildAuxiliaryEditorialWorkflowPreview(
 draft:AuxiliaryReviewDraft
):AuxiliaryEditorialWorkflowPreview|null{
 if(draft.schemaVersion!==1||
  draft.status!=="rascunho_nao_homologado"||
  draft.storedRemotely!==false||
  draft.canApprove!==false||draft.canPublish!==false||
  draft.canCalculateShopping!==false||draft.canCalculateNutrition!==false||
  draft.canAssumeSafeLeftovers!==false||
  !draft.recipeId.trim()||!draft.sourceReferenceHash.trim()||
  !draft.mainBlockKey.trim()||!draft.auxiliaryBlockKey.trim())return null;
 const hasMeasureEvidence=
  draft.editorialStage==="apto_para_analise_humana"&&
  draft.providedMeasurement.comparisonStatus==="simulated"&&
  draft.measurementEvidence.trim().length>=15&&
  draft.providedMeasurement.batchYield!==null&&
  draft.providedMeasurement.usedAmount!==null;
 const measurementStatus:EditorialGateStatus=hasMeasureEvidence
  ?"apto_para_conferencia_humana":"conferencia_necessaria";
 const rightsPending=draft.sourceRightsStatus!=="approved";
 const ingredientsPending=draft.ingredientReviewStatus!=="reviewed";
 // Os valores de status acima NÃO são aceitos como prova de homologação.
 // Mesmo quando coincidem com essas palavras, etapas continuam pendentes.
 const gates:EditorialGate[]=[
  {
   id:"source_and_version",
   title:"Origem, versão e integridade",
   suggestedResponsibility:"Administração técnica (função proposta)",
   status:"conferencia_necessaria",
   evidence:"Revalidar no servidor ID da receita, hash da fonte, versão do preparo, estágio privado e fotografias de ingredientes antes de receber decisão."
  },
  {
   id:"measurement",
   title:"Rendimento, uso e eventuais sobras",
   suggestedResponsibility:"Revisor de medidas / culinária (função proposta)",
   status:measurementStatus,
   evidence:hasMeasureEvidence
    ?"Há dois valores compatíveis e uma descrição de medição no rascunho; é necessário validar método, rendimento efetivo e unidade presencialmente."
    :"Faltam quantidades coerentes e/ou evidência suficiente para iniciar conferência de rendimento; não converter unidades automaticamente."
  },
  {
   id:"culinary_safety",
   title:"Segurança do preparo e conservação",
   suggestedResponsibility:"Responsável por segurança alimentar (função proposta)",
   status:"conferencia_necessaria",
   evidence:"Revisar uso de gema pasteurizada para preparo sem cocção, condições higiênicas, conservação, descarte e validade. Diferença aritmética não prova sobra segura."
  },
  {
   id:"allergens",
   title:"Alergênicos e substituições",
   suggestedResponsibility:"Revisor de alergênicos (função proposta)",
   status:"conferencia_necessaria",
   evidence:"Conferir ovo, peixe, gergelim e outros ingredientes caso a caso, alternativas e contato cruzado; nenhuma ausência de risco foi comprovada."
  },
  {
   id:"ingredient_structuring",
   title:"Composição e estruturação dos ingredientes",
   suggestedResponsibility:"Revisor de ingredientes / medidas (função proposta)",
   status:ingredientsPending?"bloqueado_por_pendencia":"conferencia_necessaria",
   evidence:"Estado cadastrado: "+draft.ingredientReviewStatus+
    ". Validar os componentes do molho e a referência ao molho pronto, sem duplicar compras."
  },
  {
   id:"nutrition",
   title:"Nutrição e porcionamento",
   suggestedResponsibility:"Revisor nutricional habilitado (função proposta)",
   status:"conferencia_necessaria",
   evidence:"Confirmar quantidade consumida, rendimento, ingredientes e dados nutricionais; a ficha não autoriza cálculos reais."
  },
  {
   id:"commercial_rights",
   title:"Direitos de uso e publicação",
   suggestedResponsibility:"Responsável pelos direitos do catálogo (função proposta)",
   status:rightsPending?"bloqueado_por_pendencia":"conferencia_necessaria",
   evidence:"Estado cadastrado: "+draft.sourceRightsStatus+
    ". A liberação comercial não pode ser deduzida de uma prévia local."
  },
  {
   id:"final_independent_check",
   title:"Decisão independente e rastreabilidade",
   suggestedResponsibility:"Administrador master / aprovador distinto (funções propostas)",
   status:"bloqueado_por_pendencia",
   evidence:"Exigir revisão de todos os pareceres, separação entre autor e aprovador, controle de versão no servidor e evento auditável imutável."
  }
 ];
 return {
  schemaVersion:1,
  scope:"projeto_de_fluxo_somente_leitura",
  draftStatus:"rascunho_nao_homologado",
  recipeId:draft.recipeId,
  sourceReferenceHash:draft.sourceReferenceHash,
  rightsStatusAtPreview:draft.sourceRightsStatus,
  ingredientReviewStatusAtPreview:draft.ingredientReviewStatus,
  gates,
  proposedEventEnvelope:{
   eventKind:"not_recorded",eventId:null,actorId:null,serverTimestamp:null,
   recipeId:draft.recipeId,sourceHash:draft.sourceReferenceHash,
   expectedVersion:null,previousVersion:null,newVersion:null,
   decision:null,evidenceReference:null
  },
  requiresIndependentApproval:true,requiresServerAuthorization:true,
  requiresImmutableAudit:true,auditRecorded:false,workflowPersisted:false,
  canApprove:false,canPublish:false,canWriteIngredients:false,
  canChangeNutrition:false,canReleaseShopping:false
 };
}
