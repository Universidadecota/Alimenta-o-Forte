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
export type BatchItem={ingredient_id:string;source_text:string;review_status:string;recipe_id?:string;source_position?:number;recipes?:{title:string}|{title:string}[]|null;recipe_ingredients?:{name:string;position:number}|{name:string;position:number}[]|null};
/** Somente a fonte que ainda corresponde exatamente ao ingrediente atual entra no lote rápido. */
export function isMeasureSourceAligned(row:BatchItem):boolean{
 const current=Array.isArray(row.recipe_ingredients)?row.recipe_ingredients[0]:row.recipe_ingredients;
 return Boolean(current&&row.source_text===current.name&&
  Number.isInteger(row.source_position)&&row.source_position===current.position);
}
export type BatchGroupSample={id:string;text:string;proposal:MeasureProposal|null};
export type DraftCandidate={ingredient_id:string;source_text:string;quantity:number;unit:string;ingredient:string;recipe_id:string;recipe_title:string;source_position:number};
function batchRecipeTitle(recipes:BatchItem["recipes"]):string{
 const recipe=Array.isArray(recipes)?recipes[0]:recipes;
 return recipe?.title?.trim()??"";
}
/** Apenas gera proposta local de até 20 itens pendentes; nunca grava rascunhos. */
export function prepareDraftCandidates(items:ReadonlyArray<BatchItem>,limit=20):DraftCandidate[]{
 const cap=Math.max(0,Math.min(20,Math.floor(limit)));
 return items.filter(row=>row.review_status==="pending"&&isMeasureSourceAligned(row)&&Boolean(row.recipe_id)&&
  Number.isInteger(row.source_position)&&row.source_position!>=0&&Boolean(batchRecipeTitle(row.recipes)))
  .map(row=>({row,result:classifyMeasure(row.source_text)}))
  .filter(({row,result})=>{
   const proposed=result.proposal;
   // Limites e precisão equivalentes à RPC/NUMERIC(12,4).
   return result.group==="simple"&&proposed!==null&&
    proposed.quantity>0&&proposed.quantity<=100000&&
    Math.abs(proposed.quantity*10000-Math.round(proposed.quantity*10000))<1e-7&&
    proposed.ingredient.trim().length>=2&&proposed.ingredient.trim().length<=180&&
    row.source_text.length>=2;
  })
  .map(({row,result})=>({
   ingredient_id:row.ingredient_id,
   recipe_id:row.recipe_id!,
   recipe_title:batchRecipeTitle(row.recipes),
   source_position:row.source_position!,
   source_text:row.source_text,
   quantity:result.proposal!.quantity,
   unit:result.proposal!.unit,
   ingredient:result.proposal!.ingredient
  }))
  .sort((a,b)=>a.source_text.localeCompare(b.source_text,"pt-BR")||
   a.recipe_title.localeCompare(b.recipe_title,"pt-BR")||
   a.source_position-b.source_position||a.ingredient_id.localeCompare(b.ingredient_id))
  .slice(0,cap);
}
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
 // "Maionese caseira" não informa o processo nem o uso de ovos pasteurizados.
 // Mesmo com quantidade explícita, esta expressão exige conferência individual.
 if(/\bmaionese\s+caseira\b/iu.test(s))return {group:"manual",proposal:null};
 const proposal=suggestMeasure(s);
 return proposal?{group:"simple",proposal}:{group:"manual",proposal:null};
}
export function summarizeMeasures(items:ReadonlyArray<BatchItem>,sampleSize=4):BatchResult{
 const groups=measureGroups.map(g=>g.key);
 const byGroup=Object.fromEntries(groups.map(group=>[group,0])) as Record<MeasureGroup,number>;
 const examples:Record<MeasureGroup,BatchGroupSample[]>={simple:[],range:[],choice:[],compound:[],optional:[],manual:[]};
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
