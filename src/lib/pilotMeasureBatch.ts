import {parsePilotMeasure} from "./pilotMeasure";
import {splitPilotIngredient} from "./pilotIngredientReview";

/**
 * Classificação conservadora, apenas de leitura, de uma expressão COMPLETA
 * do inventário. Não escolhe alternativas, não atualiza o Supabase e não
 * autoriza porções, compras ou nutrição.
 */
export type MeasureGroup="simple"|"range"|"choice"|"compound"|"optional"|"manual";
export const measureGroups:ReadonlyArray<{key:MeasureGroup;label:string;explanation:string}>=[
 {key:"simple",label:"Medida identificada",explanation:"Sugestão direta para conferência editorial; não aprovada."},
 {key:"range",label:"Intervalo de medidas",explanation:"Ex.: 150 a 180 g. Não escolher um valor automaticamente."},
 {key:"choice",label:"Alternativas",explanation:"O texto contém 'ou'; requer escolha, sem substituição automática."},
 {key:"compound",label:"Preparos compostos",explanation:"Um fragmento menciona várias partes da receita; revisar cada parte."},
 {key:"optional",label:"Opcionais e a gosto",explanation:"O uso ou a quantidade depende de decisão do usuário."},
 {key:"manual",label:"Outras medidas para revisão",explanation:"Não foi possível identificar com segurança uma medida única."},
];
export type MeasureProposal={quantity:number;unit:string;ingredient:string};
export type BatchItem={ingredient_id:string;source_text:string;review_status:string};
export type BatchGroupSample={id:string;text:string;proposal:MeasureProposal|null};
export type BatchResult={
 total:number;
 byGroup:Record<MeasureGroup,number>;
 examples:Record<MeasureGroup,BatchGroupSample[]>;
 pending:number;
 otherStatuses:number;
};
const unitLabels:Record<string,string>={
 g:"g",kg:"kg",ml:"ml",l:"L",
 colher_cha:"colher (chá)",colher_sopa:"colher (sopa)",
 xicara:"xícara",dente:"dente",fatia:"fatia",pitada:"pitada",
 ramo:"ramo",lata:"lata",copo:"copo",unidade:"unidade",
 punhado:"punhado",ovo:"ovo",cebola:"cebola",tomate:"tomate",
};
const keyToUnit:Record<string,string>={
 grama:"g",quilograma:"kg",mililitro:"ml",litro:"l",
 "colher-cha":"colher_cha","colher-sopa":"colher_sopa",
};
export function measureUnitLabel(unit:string):string{return unitLabels[unit]??unit;}
export function suggestMeasure(text:string):MeasureProposal|null{
 const parsed=parsePilotMeasure(text);
 if(!parsed)return null;
 const key=parsed.unitKey.startsWith("un-")?parsed.unitKey.slice(3):keyToUnit[parsed.unitKey]??parsed.unitKey;
 if(!(key in unitLabels))return null;
 return {quantity:parsed.amount,unit:key,ingredient:parsed.ingredient};
}
export function classifyMeasure(text:string):{group:MeasureGroup;proposal:MeasureProposal|null}{
 const s=text.trim();
 const parts=splitPilotIngredient(s);
 if(parts.length>1||/:\s*\S/u.test(s)||/;/.test(s))return {group:"compound",proposal:null};
 if(/(?:^|[\s(])\d+(?:,\d+)?\s+a\s+\d+(?:,\d+)?\s*(?:kg|g|ml|l|colher|xícara)/iu.test(s))
  return {group:"range",proposal:null};
 if(/\bou\b/iu.test(s))return {group:"choice",proposal:null};
 if(/\b(?:opcional|a gosto|quanto bastar|se preferir|se desejar|se precisar)\b/iu.test(s))
  return {group:"optional",proposal:null};
 const proposal=suggestMeasure(s);
 return proposal?{group:"simple",proposal}:{group:"manual",proposal:null};
}
export function summarizeMeasures(items:ReadonlyArray<BatchItem>,sampleSize=4):BatchResult{
 const groups=measureGroups.map(g=>g.key);
 const byGroup=Object.fromEntries(groups.map(group=>[group,0])) as Record<MeasureGroup,number>;
 const examples=Object.fromEntries(groups.map(group=>[group,[]])) as Record<MeasureGroup,BatchGroupSample[]>;
 let pending=0;
 for(const row of items){
  const classified=classifyMeasure(row.source_text);
  byGroup[classified.group]++;
  if(row.review_status==="pending")pending++;
  const bucket=examples[classified.group];
  if(bucket.length<sampleSize&&!bucket.some(entry=>entry.text===row.source_text)){
   bucket.push({id:row.ingredient_id,text:row.source_text,proposal:classified.proposal});
  }
 }
 return {total:items.length,byGroup,examples,pending,otherStatuses:items.length-pending};
}
