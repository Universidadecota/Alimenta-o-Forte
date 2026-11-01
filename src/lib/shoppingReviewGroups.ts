import type {PilotShoppingItem,ShoppingItem,ShoppingNote} from "./shopping";

/**
 * Organiza apenas a apresentação. Não converte medidas, não altera as
 * quantidades originais ou identidades usadas nas marcações de comprado.
 */
export type ShoppingReviewGroups={
 structured:ShoppingItem[];
 consolidatedOriginal:PilotShoppingItem[];
 needsChecking:PilotShoppingItem[];
 incompleteReference:PilotShoppingItem[];
 choicesAndOptional:PilotShoppingItem[];
 notes:ShoppingNote[];
};

export function isIncompletePilotReference(item:Pick<PilotShoppingItem,"sourceText">):boolean{
 const original=item.sourceText.trim();
 return /^(?:[0-9]+|[½¼¾⅓⅔])\s*(?:x[ií]cara|colher(?:es)?)(?:\s+\([^)]*\))?\s*\.?$/i.test(original)
  || /\(receita abaixo\)/i.test(original);
}

/**
 * "Consolidada" significa exclusivamente soma de expressões literais
 * compatíveis. Não significa rendimento ou quantidade de compra homologada.
 * Toda entrada do piloto é classificada uma única vez e mantém seu objeto.
 */
export function groupShoppingForReview(
 structured:ShoppingItem[],
 pilot:PilotShoppingItem[],
 notes:ShoppingNote[]
):ShoppingReviewGroups{
 const grouped:ShoppingReviewGroups={
  structured,consolidatedOriginal:[],needsChecking:[],incompleteReference:[],
  choicesAndOptional:[],notes
 };
 for(const item of pilot){
  if(item.requiresChoice||item.optionalSource){
   grouped.choicesAndOptional.push(item);
  }else if(isIncompletePilotReference(item)){
   grouped.incompleteReference.push(item);
  }else if(item.totalLabel&&!item.ambiguousSource){
   grouped.consolidatedOriginal.push(item);
  }else{
   grouped.needsChecking.push(item);
  }
 }
 return grouped;
}
