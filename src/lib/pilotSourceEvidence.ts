import {summarizeSourceReconciliation,type CurrentPilotIngredient,type RecipeReconciliation} from "./pilotSourceReconciliation";
import type {BatchItem} from "./pilotMeasureBatch";

/** Evidência de origem; nunca produz mapeamento 1:N nem executa gravações. */
export type OfficialPilotSource={
 recipe_id:string;
 source_document:string;
 entry_number:number;
 source_page:number|null;
 original_title:string;
 original_ingredients:string;
 reference_hash:string;
 use_stage:string;
};
export type HistoricalIngredientEvidence=BatchItem&{
 recipe_id:string;
 source_position:number;
};
export type HistoricalComparison="exact"|"name"|"position"|"both"|"missing";
export type HistoricalEvidenceLine={
 ingredient_id:string;
 source_position:number;
 source_text:string;
 review_status:string;
 current_name:string|null;
 current_position:number|null;
 comparison:HistoricalComparison;
};
export type PilotSourceEvidenceReport={
 official:OfficialPilotSource;
 historical:HistoricalEvidenceLine[];
 untrackedCurrent:CurrentPilotIngredient[];
};
const metrics=["originalExpressions","currentIngredients","exact","nameMismatch",
 "positionMismatch","bothMismatch","missingCurrent","untrackedCurrent"] as const;

/**
 * Exige a mesma fotografia da contagem global por receita. Se dados mudaram
 * desde a pré-análise, interrompe: nenhum vínculo pode ser inferido a partir
 * de leituras incompletas ou cruzadas.
 */
export function buildPilotSourceEvidenceReport(
 recipe:RecipeReconciliation,
 official:OfficialPilotSource|null,
 historicalRows:ReadonlyArray<HistoricalIngredientEvidence>,
 currentRows:ReadonlyArray<CurrentPilotIngredient>
):PilotSourceEvidenceReport{
 if(!official||official.recipe_id!==recipe.recipe_id||
  official.use_stage!=="personal_pilot"||
  !official.original_ingredients.trim()||!official.reference_hash.trim()||
  !official.source_document.trim()){
  throw new Error("Fonte oficial do piloto ausente ou inválida. A evidência não pode ser exibida.");
 }
 if(historicalRows.some(row=>row.recipe_id!==recipe.recipe_id)||
  currentRows.some(row=>row.recipe_id!==recipe.recipe_id)){
  throw new Error("Foram recebidos ingredientes de outra receita. A evidência foi descartada.");
 }
 const snapshot=summarizeSourceReconciliation(historicalRows,currentRows);
 const fresh=snapshot.recipes.find(row=>row.recipe_id===recipe.recipe_id);
 if(!fresh||metrics.some(metric=>fresh[metric]!==recipe[metric])){
  throw new Error("O inventário mudou desde a pré-análise. Atualize o relatório antes de examinar a fonte.");
 }
 const currentMap=new Map(currentRows.map(row=>[row.id,row]));
 const historicalIds=new Set(historicalRows.map(row=>row.ingredient_id));
 const historical:HistoricalEvidenceLine[]=historicalRows.map(row=>{
  const current=currentMap.get(row.ingredient_id);
  const comparison:HistoricalComparison=!current?"missing":
   row.source_text===current.name&&row.source_position===current.position?"exact":
   row.source_text!==current.name&&row.source_position===current.position?"name":
   row.source_text===current.name&&row.source_position!==current.position?"position":"both";
  return {ingredient_id:row.ingredient_id,source_position:row.source_position,
   source_text:row.source_text,review_status:row.review_status,
   current_name:current?.name??null,current_position:current?.position??null,comparison};
 }).sort((a,b)=>a.source_position-b.source_position||a.ingredient_id.localeCompare(b.ingredient_id));
 const untrackedCurrent=currentRows.filter(row=>!historicalIds.has(row.id))
  .sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
 return {official,historical,untrackedCurrent};
}
