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
  || /\(receita abaixo\)/i.test(original)
  || /^\s*(?:\d+(?:\s+\d+\/\d+)?|[½¼¾⅓⅔])\s+x[ií]caras?\s+de\s+chá\s*[.!]?\s*$/i.test(original);
}

/** Uma unidade doméstica subjetiva não é medida de compra validada. */
export function isSubjectiveOriginalMeasure(item:Pick<PilotShoppingItem,"totalLabel"|"sourceText">):boolean{
 const label=(item.totalLabel??item.sourceText).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 return /\b(?:pitadas?|punhados?)\s+de\b/.test(label);
}

/** Um subtotal de ovos comuns não inclui automaticamente gemas e ovos preparados. */
export function hasSeparateEggPreparations(
 item:Pick<PilotShoppingItem,"totalLabel"|"sourceText">,
 all:readonly PilotShoppingItem[]
):boolean{
 if(!/^\s*\d+(?:[,.]\d+)?\s+ovos?\s*$/i.test(item.totalLabel??""))return false;
 return all.some(other=>other!==item
  && /\b(?:ovos?\s+(?:cozid[oa]s?|frit[oa]s?|mexid[oa]s?)|gemas?|claras?)\b/i.test(other.sourceText));
}

/** A descrição de conferência não altera a compra nem o documento de origem. */
export function shoppingReviewReason(item:PilotShoppingItem,all:readonly PilotShoppingItem[]):string|null{
 if(isIncompletePilotReference(item))return "Trecho sem produto identificado; conferir no preparo original.";
 if(hasSeparateEggPreparations(item,all))
  return "Subtotal de ovos sem incluir automaticamente ovos cozidos, gemas ou claras citados à parte.";
 if(isSubjectiveOriginalMeasure(item))
  return "Pitada ou punhado é medida subjetiva: soma literal não define quantidade para comprar.";
 return null;
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
  }else if(item.totalLabel&&!item.ambiguousSource&&!shoppingReviewReason(item,pilot)){
   grouped.consolidatedOriginal.push(item);
  }else{
   grouped.needsChecking.push(item);
  }
 }
 return grouped;
}
