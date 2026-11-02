import {purchaseKey} from "./shoppingProgress";
import {decisionKind,type ShoppingDecision} from "./shoppingDecisions";
import {hasSeparateEggPreparations,isIncompletePilotReference,isSubjectiveOriginalMeasure} from "./shoppingReviewGroups";
import type {PilotShoppingItem} from "./shopping";

export type PrecisionPriority="source"|"decision"|"quantity";
export type PrecisionReason="reference"|"linkedRecipe"|"ambiguous"|"choice"|"optional"|"egg"|"subjective"|"literal"|"unmeasured";

export type PrecisionIssue={
 key:string;
 priority:PrecisionPriority;
 reason:PrecisionReason;
 title:string;
 explanation:string;
 nextStep:string;
 usages:number;
 recipes:readonly string[];
 originalFragments:readonly string[];
};

const titles:Record<PrecisionReason,{explanation:string;nextStep:string}>={
 reference:{
  explanation:"O trecho não identifica qual produto foi medido (por exemplo, 'xícaras de chá' sem dizer do quê).",
  nextStep:"Consultar a receita e o preparo originais para identificar o alimento antes de comprar."
 },
 linkedRecipe:{
  explanation:"O ingrediente é identificado, mas remete a um preparo caseiro complementar; a medida sozinha não descreve seus componentes.",
  nextStep:"Consultar a receita complementar e seus ingredientes antes de definir a compra, sem somar automaticamente à receita principal."
 },
 ambiguous:{
  explanation:"Trecho composto ou ambíguo: não é possível atribuir a medida com segurança.",
  nextStep:"Conferir o texto original completo e identificar os produtos separadamente, sem alterar a receita automaticamente."
 },
 choice:{
  explanation:"A receita apresenta alternativas, mas ainda não foi registrada uma escolha.",
  nextStep:"Utilizar o botão Escolher opção na seção Alternativas e opcionais."
 },
 optional:{
  explanation:"O ingrediente é opcional e ainda não foi decidido se será utilizado.",
  nextStep:"Usar Decidir opcional, escolhendo Incluir ou Não incluir."
 },
 egg:{
  explanation:"O subtotal de ovos não inclui automaticamente ovos preparados, gemas ou claras citados à parte.",
  nextStep:"Conferir todas as preparações da receita antes de estimar quantos ovos comprar."
 },
 subjective:{
  explanation:"Pitada ou punhado é uma medida subjetiva e não indica diretamente quanto comprar.",
  nextStep:"Conferir o preparo e a embalagem desejada; não atribuir uma conversão automática."
 },
 literal:{
  explanation:"A receita informa uma quantidade literal. O que falta conferir é a soma de preparos diferentes e o rendimento, não a existência da medida.",
  nextStep:"Conferir repetições e rendimentos nas receitas de origem; não somar medidas ou unidades incompatíveis."
 },
 unmeasured:{
  explanation:"O produto é identificável, mas o trecho não informa uma quantidade de compra verificável.",
  nextStep:"Conferir a medida e o rendimento na receita original; o número de usos não equivale à quantidade a comprar."
 }
};

/**
 * Distingue uma medida literal identificável de uma expressão "a gosto".
 * Reconhece apenas numerais explícitos: não estima rendimento nem converte unidades.
 * A quantidade pode estar no início ou após um preparo (ex.: suco de 1 limão).
 */
export function hasLiteralMeasure(sourceText:string):boolean{
 const text=sourceText.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
 return /(?:^|\s)(?:\d+(?:[,.]\d+)?|[½¼¾⅓⅔]|\d+\s*[½¼¾⅓⅔])(?=\s|$)/u.test(text);
}

/** Painel de revisão somente leitura: não resolve nem edita entradas do catálogo. */
export function auditShoppingPrecision(items:readonly PilotShoppingItem[],decisions:readonly ShoppingDecision[]):PrecisionIssue[]{
 const found:PrecisionIssue[]=[];
 for(const item of items){
  let reason:PrecisionReason|null=null;
  let priority:PrecisionPriority="quantity";
  const kind=decisionKind(item);
  if(isIncompletePilotReference(item)){
   reason=/\(receita abaixo\)/i.test(item.sourceText)?"linkedRecipe":"reference";priority="source";
  }else if(item.ambiguousSource){
   reason=/\bmaionese caseira\b.*\brende\b/i.test(item.sourceText)?"linkedRecipe":"ambiguous";priority="source";
  }else if(kind){
   const decided=decisions.some(d=>d.itemKey===purchaseKey(item)&&d.kind===kind
    &&(d.kind==="optional"||d.selection.trim().length>0));
   if(!decided){reason=kind;priority="decision";}
  }else if(hasSeparateEggPreparations(item,items)){
   reason="egg";
  }else if(isSubjectiveOriginalMeasure(item)){
   reason="subjective";
  }else if(!item.totalLabel){
   reason=hasLiteralMeasure(item.sourceText)?"literal":"unmeasured";
  }
  if(!reason)continue;
  found.push({
   key:purchaseKey(item),priority,reason,title:item.totalLabel??item.sourceText,
   explanation:titles[reason].explanation,nextStep:titles[reason].nextStep,
   usages:item.quantity,recipes:[...item.sourceRecipes],
   originalFragments:[...item.sourceRawFragments]
  });
 }
 const priorityRank:Record<PrecisionPriority,number>={source:0,decision:1,quantity:2};
 return found.sort((a,b)=>priorityRank[a.priority]-priorityRank[b.priority]
  ||a.title.localeCompare(b.title,"pt-BR")||a.key.localeCompare(b.key,"pt-BR"));
}
export function precisionCounts(issues:readonly PrecisionIssue[]):Record<PrecisionPriority,number>{
 return issues.reduce((counts,item)=>({...counts,[item.priority]:counts[item.priority]+1}),
  {source:0,decision:0,quantity:0});
}
