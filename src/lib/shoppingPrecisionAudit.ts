import {purchaseKey} from "./shoppingProgress";
import {decisionKind,type ShoppingDecision} from "./shoppingDecisions";
import {hasSeparateEggPreparations,isIncompletePilotReference,isSubjectiveOriginalMeasure} from "./shoppingReviewGroups";
import type {PilotShoppingItem} from "./shopping";

export type PrecisionPriority="source"|"decision"|"quantity";
export type PrecisionReason="reference"|"ambiguous"|"choice"|"optional"|"egg"|"subjective"|"unmeasured";

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
  explanation:"A transcrição não identifica com segurança um produto de supermercado.",
  nextStep:"Conferir os ingredientes e o preparo na receita original; não converter este trecho em compra."
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
  explanation:"Pitada ou punhado não define uma quantidade verificável de compra.",
  nextStep:"Conferir a receita e a embalagem desejada; não atribuir uma conversão automática."
 },
 unmeasured:{
  explanation:"Não foi encontrada uma quantidade consolidada e confiável para este trecho.",
  nextStep:"Verificar a medida e o rendimento na receita original; o número de usos não é a quantidade a comprar."
 }
};

/** Painel de revisão somente leitura: não resolve nem edita entradas do catálogo. */
export function auditShoppingPrecision(items:readonly PilotShoppingItem[],decisions:readonly ShoppingDecision[]):PrecisionIssue[]{
 const found:PrecisionIssue[]=[];
 for(const item of items){
  let reason:PrecisionReason|null=null;
  let priority:PrecisionPriority="quantity";
  const kind=decisionKind(item);
  if(isIncompletePilotReference(item)){
   reason="reference";priority="source";
  }else if(item.ambiguousSource){
   reason="ambiguous";priority="source";
  }else if(kind){
   const decided=decisions.some(d=>d.itemKey===purchaseKey(item)&&d.kind===kind
    &&(d.kind==="optional"||d.selection.trim().length>0));
   if(!decided){reason=kind;priority="decision";}
  }else if(hasSeparateEggPreparations(item,items)){
   reason="egg";
  }else if(isSubjectiveOriginalMeasure(item)){
   reason="subjective";
  }else if(!item.totalLabel){
   reason="unmeasured";
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
