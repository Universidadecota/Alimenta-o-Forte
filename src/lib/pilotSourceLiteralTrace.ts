import type {CurrentPilotIngredient} from "./pilotSourceReconciliation";
import type {PilotSourceEvidenceReport} from "./pilotSourceEvidence";

export type LiteralSourceTraceStatus="unique"|"ambiguous"|"not_found";
export type UntrackedLiteralSourceTrace={
 ingredient:CurrentPilotIngredient;
 status:LiteralSourceTraceStatus;
 occurrences:number;
};
export type LiteralSourceTraceReport={
 items:UntrackedLiteralSourceTrace[];
 counts:Record<LiteralSourceTraceStatus,number>;
};

/**
 * Verifica somente a presença textual literal no documento oficial.
 * Não sugere equivalência por ID, fragmentação 1:N nem aprovação editorial.
 * Não normaliza acentos/capitalização ou altera a fonte preservada.
 */
export function traceUntrackedIngredientsToSource(
 report:Pick<PilotSourceEvidenceReport,"official"|"untrackedCurrent">
):LiteralSourceTraceReport{
 const source=report.official.original_ingredients;
 const isBoundary=(character:string)=>!character||/[\s,;:.!?()[\]{}]/u.test(character);
 const countOccurrences=(fragment:string)=>{
  if(fragment.length<3)return 0;
  let count=0;
  for(let index=source.indexOf(fragment);index>=0;index=source.indexOf(fragment,index+1)){
   if(isBoundary(source[index-1]??"")&&
    isBoundary(source[index+fragment.length]??"")){
    count++;
   }
  }
  return count;
 };
 const counts:Record<LiteralSourceTraceStatus,number>={
  unique:0,ambiguous:0,not_found:0
 };
 const items=report.untrackedCurrent.map(ingredient=>{
  const occurrences=countOccurrences(ingredient.name.trim());
  const status:LiteralSourceTraceStatus=occurrences===0?"not_found":
   occurrences===1?"unique":"ambiguous";
  counts[status]++;
  return {ingredient,status,occurrences};
 });
 return {items,counts};
}
