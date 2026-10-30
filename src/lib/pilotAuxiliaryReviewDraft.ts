import {
 simulateAuxiliaryConsumption,
 type AuxiliaryConsumptionLink,
 type AuxiliaryMeasureUnit,
 type AuxiliaryQuantity,
 type AuxiliarySimulation
} from "./pilotAuxiliaryConsumptionModel";

/**
 * Apenas ficha local, não homologada. Nenhuma opção daqui pode conceder
 * aprovação, publicar receitas ou enviar medidas à lista de compras.
 */
export type AuxiliaryReviewInputs={
 yieldText:string;
 yieldUnit:AuxiliaryMeasureUnit;
 useText:string;
 useUnit:AuxiliaryMeasureUnit;
 measurementEvidence:string;
 editorialNotes:string;
};
export type AuxiliaryInputStatus="missing"|"invalid"|"provided";
export type AuxiliaryReviewDraft={
 schemaVersion:1;
 status:"rascunho_nao_homologado";
 editorialStage:"pendente"|"apto_para_analise_humana";
 recipeId:string;
 sourceReferenceHash:string;
 sourceRightsStatus:string;
 ingredientReviewStatus:string;
 mainBlockKey:string;
 auxiliaryBlockKey:string;
 originalYieldDeclaration:string|null;
 originalUseDeclaration:string|null;
 sourceReferenceIngredientId:string|null;
 duplicatePurchaseRisk:boolean;
 providedMeasurement:{
  batchYield:AuxiliaryQuantity|null;
  usedAmount:AuxiliaryQuantity|null;
  yieldInputStatus:AuxiliaryInputStatus;
  useInputStatus:AuxiliaryInputStatus;
  yieldOriginalText:string;
  useOriginalText:string;
  differenceHypothetical:AuxiliaryQuantity|null;
  comparisonStatus:AuxiliarySimulation["status"]|"invalid_measurement";
 };
 measurementEvidence:string;
 editorialNotes:string;
 remainingDecisions:readonly string[];
 canPublish:false;
 canApprove:false;
 canCalculateShopping:false;
 canCalculateNutrition:false;
 canAssumeSafeLeftovers:false;
 storedRemotely:false;
};
const MAX_MEASURE=64;
const MAX_NOTE=2000;
export const REQUIRED_EDITORIAL_DECISIONS=[
 "Conferir rendimento efetivo por lote e a quantidade realmente aplicada à refeição, com unidade e evidência de medição.",
 "Revisar separadamente o rendimento e a utilização dos ingredientes do molho, evitando contagem dupla do produto pronto.",
 "Homologar segurança do preparo, pasteurização adequada, conservação, descarte e condições de eventual sobra.",
 "Revisar alergênicos, substituições, contato cruzado e informações ao usuário.",
 "Conferir direitos comerciais da fonte, informações nutricionais e as unidades dos ingredientes antes de liberar qualquer cálculo.",
 "Registrar decisão editorial versionada em fluxo próprio, com responsável e trilha de auditoria, antes de alterar dados."
] as const;

function readQuantity(text:string,unit:AuxiliaryMeasureUnit):
 {status:AuxiliaryInputStatus;value:AuxiliaryQuantity|null}{
 const raw=text.trim();
 if(raw==="")return {status:"missing",value:null};
 if(raw.length>MAX_MEASURE||!/^(?:[0-9]{1,7})(?:[.,][0-9]{1,6})?$/u.test(raw)){
  return {status:"invalid",value:null};
 }
 const amount=Number(raw.replace(",","."));
 if(!Number.isFinite(amount)||amount<=0||amount>1000000||
   !["g","ml","unidade","porcao"].includes(unit)||
   (unit==="unidade"&&!Number.isInteger(amount))){
  return {status:"invalid",value:null};
 }
 return {status:"provided",value:{amount,unit}};
}

/** Constrói um artefato local que SEMPRE permanece em rascunho não aprovado.
 * A análise matemática usa números informados pelo revisor, nunca a redação
 * histórica "½ xícara" ou "2 a 3 porções" como se fossem quantidades exatas.
 */
export function buildAuxiliaryReviewDraft(
 link:AuxiliaryConsumptionLink,
 reference:{hash:string;rightsStatus:string;ingredientReviewStatus:string},
 inputs:AuxiliaryReviewInputs
):AuxiliaryReviewDraft{
 const yieldValue=readQuantity(inputs.yieldText,inputs.yieldUnit);
 const usedValue=readQuantity(inputs.useText,inputs.useUnit);
 const invalid=yieldValue.status==="invalid"||usedValue.status==="invalid";
 const simulation=invalid?null:simulateAuxiliaryConsumption(link,{
  batchYield:yieldValue.value,usedAmount:usedValue.value
 });
 const status=invalid?"invalid_measurement":simulation?.status??"invalid_measurement";
 const evidence=inputs.measurementEvidence.trim().slice(0,MAX_NOTE);
 const notes=inputs.editorialNotes.trim().slice(0,MAX_NOTE);
 const wellFormed=status==="simulated"&&evidence.length>=15&&
  reference.hash.trim().length>0&&link.mealRecipeId.trim().length>0;
 return {
  schemaVersion:1,
  status:"rascunho_nao_homologado",
  editorialStage:wellFormed?"apto_para_analise_humana":"pendente",
  recipeId:link.mealRecipeId,
  sourceReferenceHash:reference.hash.trim(),
  sourceRightsStatus:reference.rightsStatus,
  ingredientReviewStatus:reference.ingredientReviewStatus,
  mainBlockKey:link.mainBlockKey,
  auxiliaryBlockKey:link.auxiliaryBlockKey,
  originalYieldDeclaration:link.sourceDeclaredYield,
  originalUseDeclaration:link.sourceDeclaredUse,
  sourceReferenceIngredientId:link.referenceIngredientId,
  duplicatePurchaseRisk:link.duplicatePurchaseRisk,
  providedMeasurement:{
   batchYield:yieldValue.value,
   usedAmount:usedValue.value,
   yieldInputStatus:yieldValue.status,
   useInputStatus:usedValue.status,
   yieldOriginalText:inputs.yieldText.slice(0,MAX_MEASURE),
   useOriginalText:inputs.useText.slice(0,MAX_MEASURE),
   differenceHypothetical:simulation?.status==="simulated"?simulation.leftover:null,
   comparisonStatus:status
  },
  measurementEvidence:evidence,
  editorialNotes:notes,
  remainingDecisions:REQUIRED_EDITORIAL_DECISIONS,
  canPublish:false,canApprove:false,
  canCalculateShopping:false,canCalculateNutrition:false,
  canAssumeSafeLeftovers:false,storedRemotely:false
 };
}
