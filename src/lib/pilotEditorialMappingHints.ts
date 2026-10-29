import {splitPilotIngredient} from "./pilotIngredientReview";
import type {PilotSourceEvidenceReport,HistoricalEvidenceLine} from "./pilotSourceEvidence";
import type {CurrentPilotIngredient} from "./pilotSourceReconciliation";

/** Hipóteses locais: não são vínculos editoriais confirmados. */
export type LiteralSplitHint={
 historical_id:string;
 historical_source:string;
 historical_position:number;
 current_parts:Array<{id:string;name:string;position:number;kind:"same_id"|"new_id"}>;
};
export type EditorialMappingHints={
 literalSplits:LiteralSplitHint[];
 relocated:HistoricalEvidenceLine[];
 unresolvedText:HistoricalEvidenceLine[];
 stillUnlinked:CurrentPilotIngredient[];
};

/**
 * Comparação textual estrita (sem aproximação semântica). Não retira acentos,
 * não resolve alternativas e não altera o documento oficial.
 */
function key(value:string):string{
 return value.normalize("NFC").toLocaleLowerCase("pt-BR")
  .replace(/\s+/gu," ").trim().replace(/[.;\s]+$/gu,"");
}

/**
 * Só oferece hipótese quando cada pedaço aparece literalmente uma vez na
 * fonte, um deles preserva o ID histórico e os novos IDs são exclusivos,
 * com posições contíguas. Casos ambíguos continuam sem sugestão.
 */
export function buildEditorialMappingHints(report:PilotSourceEvidenceReport):EditorialMappingHints{
 const original=key(report.official.original_ingredients);
 const possible:LiteralSplitHint[]=[];
 for(const historical of report.historical){
  if(!["name","both"].includes(historical.comparison)||
   historical.current_name==null||historical.current_position==null)continue;
  const parts=splitPilotIngredient(historical.source_text);
  if(parts.length<2||parts.length>4||!parts.every(part=>
   part.wasSplit&&!part.requiresChoice&&!part.optional&&!part.ambiguousCompound))continue;
  const literal=key(historical.source_text);
  if(!literal||original.indexOf(literal)<0||
   original.indexOf(literal)!==original.lastIndexOf(literal))continue;
  if(key(parts[0].text)!==key(historical.current_name))continue;
  const matches:LiteralSplitHint["current_parts"]=[{
   id:historical.ingredient_id,name:historical.current_name,
   position:historical.current_position,kind:"same_id"
  }];
  let valid=true;
  for(let i=1;i<parts.length;i++){
   const segmentKey=key(parts[i].text);
   const found=report.untrackedCurrent.filter(current=>key(current.name)===segmentKey);
   if(!segmentKey||found.length!==1||found[0].position!==historical.current_position+i){
    valid=false;break;
   }
   matches.push({id:found[0].id,name:found[0].name,position:found[0].position,kind:"new_id"});
  }
  if(valid&&new Set(matches.map(item=>item.id)).size===matches.length){
   possible.push({historical_id:historical.ingredient_id,historical_source:historical.source_text,
    historical_position:historical.source_position,current_parts:matches});
  }
 }
 // Se um novo ID serviria a duas hipóteses, ambas ficam pendentes.
 const usage=new Map<string,number>();
 for(const candidate of possible){
  for(const item of candidate.current_parts.filter(part=>part.kind==="new_id")){
   usage.set(item.id,(usage.get(item.id)??0)+1);
  }
 }
 const literalSplits=possible.filter(candidate=>candidate.current_parts.every(part=>
  part.kind==="same_id"||usage.get(part.id)===1))
  .sort((a,b)=>a.historical_position-b.historical_position);
 const resolvedHistorical=new Set(literalSplits.map(item=>item.historical_id));
 const resolvedNew=new Set(literalSplits.flatMap(item=>
  item.current_parts.filter(part=>part.kind==="new_id").map(part=>part.id)));
 return {
  literalSplits,
  relocated:report.historical.filter(item=>item.comparison==="position"),
  unresolvedText:report.historical.filter(item=>
   (item.comparison==="name"||item.comparison==="both"||item.comparison==="missing")&&
   !resolvedHistorical.has(item.ingredient_id)),
  stillUnlinked:report.untrackedCurrent.filter(item=>!resolvedNew.has(item.id))
 };
}
