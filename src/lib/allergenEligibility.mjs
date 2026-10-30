/**
 * Contrato puro para a futura seleção de receitas para pessoas com alergias.
 * NÃO conectado ao planejador: só resultados produzidos/validados pelo backend
 * poderão alimentar este predicado. O banco Beta ainda não possui as autorizações
 * explícitas exigidas, portanto os registros atuais falham fechados.
 */
const canonical=(value)=>typeof value==="string"&&/^[a-z][a-z0-9_-]*$/.test(value);
const uniqueCodes=(list)=>{
 if(!Array.isArray(list)||list.some(code=>!canonical(code)))return null;
 return new Set(list);
};
const fingerprint=(value)=>typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);

/**
 * @param {{
 *  recipeId:string,
 *  currentSourceFingerprint:string,
 *  allergyCodes:string[],
 *  review:null|undefined|{
 *    recipeId:string,status:string,crossContactStatus:string,
 *    sourceFingerprint:string,ingredientReviewStatus:string,
 *    declaredAllergens:string[],ingredientClearances:string[],crossContactClearances:string[],
 *    reviewedBy:string|null,reviewedAt:string|null,evidenceNotes:string
 *  }
 * }} input
 * @returns {boolean}
 */
export function isEligibleForAllergies({recipeId,currentSourceFingerprint,allergyCodes,review}={}){
 const requested=uniqueCodes(allergyCodes);
 if(!requested||requested.size===0||!review)return false;
 if(typeof recipeId!=="string"||!recipeId||review.recipeId!==recipeId)return false;
 if(!fingerprint(currentSourceFingerprint)||review.sourceFingerprint!==currentSourceFingerprint)return false;
 if(review.status!=="verified"||review.ingredientReviewStatus!=="structured_confirmed")return false;
 if(review.crossContactStatus!=="assessed")return false;
 if(typeof review.reviewedBy!=="string"||!review.reviewedBy.trim())return false;
 if(typeof review.reviewedAt!=="string"||!Number.isFinite(Date.parse(review.reviewedAt)))return false;
 if(typeof review.evidenceNotes!=="string"||review.evidenceNotes.trim().length<10)return false;
 const present=uniqueCodes(review.declaredAllergens);
 const ingredientClearances=uniqueCodes(review.ingredientClearances);
 const crossContactClearances=uniqueCodes(review.crossContactClearances);
 if(!present||!ingredientClearances||!crossContactClearances)return false;
 // Todo alérgeno pedido deve ter exclusão explícita, tanto dos ingredientes
 // como do contato cruzado. A ausência no campo "declarados" não libera nada.
 for(const allergen of requested){
  if(present.has(allergen)||!ingredientClearances.has(allergen)||!crossContactClearances.has(allergen))return false;
 }
 return true;
}
