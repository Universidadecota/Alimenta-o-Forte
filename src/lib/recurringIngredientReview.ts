import type {PilotShoppingItem} from "./shopping";
import {isIncompletePilotReference} from "./shoppingReviewGroups";

/**
 * Fase 46: triagem editorial de itens repetidos em apresentações diferentes.
 * Não é um somador, nem uma lista definitiva de supermercado.
 * Não modifica o item original, sua quantidade, a chave de compra ou a receita.
 */
export type RecurringIngredientReview={
 id:string;
 label:string;
 variants:readonly {description:string;uses:number}[];
};

const clean=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .toLocaleLowerCase("pt-BR").trim().replace(/\s+/g," ");

function familyOf(raw:string):{id:string;label:string}|null{
 const t=clean(raw);
 // Detecta apenas inícios inequívocos. Expressões com alternativas e opcionais
 // são excluídas previamente e não participam da conferência automática.
 const n=t.replace(/^(?:\d+(?:[,.]\d+)?|[½¼¾⅓⅔]|\d+\s*[½¼¾⅓⅔])\s+(?:de\s+)?/u,"");
 if(/^(?:ovos?\b|gemas?\b|claras?\b)/.test(n))return {id:"ovos",label:"Ovos, claras e gemas"};
 if(/^cebola\s+roxa\b/.test(n))return {id:"cebola-roxa",label:"Cebola roxa"};
 if(/^cebola\b/.test(n))return {id:"cebola",label:"Cebola"};
 if(/^abacate\b/.test(n))return {id:"abacate",label:"Abacate"};
 if(/^pepino\b/.test(n))return {id:"pepino",label:"Pepino"};
 if(/^tomates?\b/.test(n))return {id:"tomate",label:"Tomate"};
 if(/^(?:limao\b|limoes\b|suco(?:\s+e\s+raspas)?\s+de\s+(?:\d+|[½¼¾⅓⅔])\s+lim(?:ao|oes)\b)/.test(n))
  return {id:"limao",label:"Limão"};
 if(/^(?:(?:colher(?:es)?\s*(?:\(\s*(?:sopa|cha)\s*\)|de\s+(?:sopa|cha))\s+de\s+)?azeite\b)/.test(n))
  return {id:"azeite",label:"Azeite"};
 if(/^(?:(?:colher(?:es)?\s*(?:\(\s*(?:sopa|cha)\s*\)|de\s+(?:sopa|cha))\s+de\s+)?manteiga\b)/.test(n))
  return {id:"manteiga",label:"Manteiga"};
 return null;
}

/**
 * Um mesmo alimento em várias preparações não autoriza soma de porções.
 * Os nomes são ilustrações da fonte, com a quantidade original quando
 * totalLabel existe. "uses" é frequência, não unidades para comprar.
 */
export function recurringIngredientReviews(items:readonly PilotShoppingItem[]):RecurringIngredientReview[]{
 const map=new Map<string,{label:string;variants:Map<string,{description:string;uses:number}>}>();
 for(const item of items){
  if(item.requiresChoice||item.optionalSource||item.ambiguousSource||isIncompletePilotReference(item))continue;
  const family=familyOf(item.sourceText);
  if(!family)continue;
  const group=map.get(family.id)??{label:family.label,variants:new Map()};
  const description=item.totalLabel??item.sourceText.trim();
  const key=clean(description);
  const old=group.variants.get(key);
  // Agrupamento puramente visual; duas linhas iguais não são somadas.
  if(!old)group.variants.set(key,{description,uses:item.quantity});
  map.set(family.id,group);
 }
 return [...map.entries()].filter(([,group])=>group.variants.size>=2)
  .map(([id,group])=>({id,label:group.label,variants:[...group.variants.values()]}))
  .sort((a,b)=>a.label.localeCompare(b.label,"pt-BR"));
}
