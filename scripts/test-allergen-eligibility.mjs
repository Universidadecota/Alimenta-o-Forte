import assert from "node:assert/strict";
import {isEligibleForAllergies} from "../src/lib/allergenEligibility.mjs";

const sourceFingerprint="a".repeat(64);
const validReview={
 recipeId:"recipe-1",
 status:"verified",
 crossContactStatus:"assessed",
 sourceFingerprint,
 ingredientReviewStatus:"structured_confirmed",
 declaredAllergens:["ovo"],
 ingredientClearances:["soja","gluten"],
 crossContactClearances:["soja","gluten"],
 reviewedBy:"responsavel-editorial",
 reviewedAt:"2026-10-23T12:00:00Z",
 evidenceNotes:"Rótulos, fornecedor e processo avaliados por pessoa qualificada."
};
const input={recipeId:"recipe-1",currentSourceFingerprint:sourceFingerprint,allergyCodes:["soja"],review:validReview};
assert.equal(isEligibleForAllergies(input),true,"Apenas amostra sintética com cobertura completa deve ser elegível.");
const reject=(name,overrides)=>{
 assert.equal(isEligibleForAllergies({...input,...overrides}),false,name);
};
const reviewReject=(name,overrides)=>reject(name,{review:{...validReview,...overrides}});
reject("Sem avaliação", {review:null});
reject("Sem alergia pedida", {allergyCodes:[]});
reject("Texto livre sem taxonomia", {allergyCodes:["leite e derivados"]});
reject("Código não canônico", {allergyCodes:["Soja"]});
reject("Código desconhecido na cobertura", {allergyCodes:["amendoim"]});
reject("Mais de uma alergia exige cobertura em ambas", {allergyCodes:["soja","ovo"]});
reject("ID da receita divergente", {recipeId:"recipe-2"});
reject("Receita alterada invalida revisão", {currentSourceFingerprint:"b".repeat(64)});
reject("Fingerprint ausente é insuficiente", {currentSourceFingerprint:""});
reviewReject("Sem revisão final", {status:"in_review"});
reviewReject("Pendente não serve", {status:"pending"});
reviewReject("Rejeitada não serve", {status:"rejected"});
reviewReject("Ingrediente ainda não validado", {ingredientReviewStatus:"needs_structuring"});
reviewReject("Contato desconhecido não serve", {crossContactStatus:"unknown"});
reviewReject("Contato possível não serve", {crossContactStatus:"possible"});
reviewReject("Sem responsável", {reviewedBy:null});
reviewReject("Sem data", {reviewedAt:null});
reviewReject("Sem evidências", {evidenceNotes:""});
reviewReject("Falta exclusão explícita nos ingredientes", {ingredientClearances:[]});
reviewReject("Falta exclusão explícita do contato cruzado", {crossContactClearances:[]});
reviewReject("Alérgeno comprovadamente presente", {declaredAllergens:["soja"]});
reviewReject("Conflito mesmo quando há exclusão registrada", {declaredAllergens:["ovo","soja"]});
reviewReject("Campo de cobertura ausente", {ingredientClearances:undefined});
reviewReject("Lista inválida de códigos", {crossContactClearances:["soja","Leite"]});
console.log("OK: contrato fail-closed de alergênicos rejeita avaliações ausentes, conflitantes, incompletas ou obsoletas. NÃO integrado ao gerador.");
