import type {CurrentPilotIngredient} from "./pilotSourceReconciliation";
import type {PilotSourceEvidenceReport} from "./pilotSourceEvidence";

export type LiteralSourceTraceStatus="unique"|"annotated"|"ambiguous"|"not_found";
export type UntrackedLiteralSourceTrace={
 ingredient:CurrentPilotIngredient;
 status:LiteralSourceTraceStatus;
 occurrences:number;
 matchedFragment:string|null;
};
export type LiteralSourceTraceReport={
 items:UntrackedLiteralSourceTrace[];
 counts:Record<LiteralSourceTraceStatus,number>;
};

/**
 * Rastreio local e conservador no documento oficial:
 * - presença literalmente idêntica com limites de expressão;
 * - secundariamente, texto-base com única anotação contextual terminal.
 * Não prova identidade por ID, relação 1:N ou correção culinária.
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
  unique:0,annotated:0,ambiguous:0,not_found:0
 };
 const items=report.untrackedCurrent.map(ingredient=>{
  const original=ingredient.name.trim();
  let occurrences=countOccurrences(original);
  let matchedFragment:string|null=occurrences>0?original:null;
  let status:LiteralSourceTraceStatus=occurrences===1?"unique":
   occurrences>1?"ambiguous":"not_found";
  if(status==="not_found"){
   // Somente rótulos editoriais de preparo, nunca medidas ou alternativas.
   const annotated=original.match(/^(.*?)\s+\(([^()]*)\)$/u);
   const note=annotated?.[2]?.trim().toLocaleLowerCase("pt-BR")??"";
   if(annotated&&note.length<=65&&
    /\b(salada|molho|maionese|acompanhamento)\b/u.test(note)&&
    !/[0-9¼½¾,;/]/u.test(note)){
    const base=annotated[1].trim();
    if(countOccurrences(base)===1){
     occurrences=1;
     matchedFragment=base;
     status="annotated";
    }
   }
  }
  counts[status]++;
  return {ingredient,status,occurrences,matchedFragment};
 });
 return {items,counts};
}
