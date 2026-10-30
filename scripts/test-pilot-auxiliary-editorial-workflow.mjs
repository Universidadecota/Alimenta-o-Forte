import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const transpile=file=>ts.transpileModule(
 readFileSync(new URL(file,import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const moduleUrl=code=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const consumptionUrl=moduleUrl(transpile("../src/lib/pilotAuxiliaryConsumptionModel.ts"));
const draftUrl=moduleUrl(transpile("../src/lib/pilotAuxiliaryReviewDraft.ts")
 .replace(/from ["']\.\/pilotAuxiliaryConsumptionModel["']/,()=> 'from "'+consumptionUrl+'"'));
const {buildAuxiliaryReviewDraft}=await import(draftUrl);
const {buildAuxiliaryEditorialWorkflowPreview,PROPOSED_AUDIT_EVENTS}=
 await import(moduleUrl(transpile("../src/lib/pilotAuxiliaryEditorialWorkflowPreview.ts")));

const link={
 mealRecipeId:"recipe-pilot-1",mainBlockKey:"prato",auxiliaryBlockKey:"molho",
 sourceDeclaredYield:"cerca de meia xícara",sourceDeclaredUse:"uma colher de sopa",
 referenceIngredientId:"test-ref",referenceIngredientPosition:1,
 referenceIngredientText:"uma colher de maionese caseira",duplicatePurchaseRisk:true,
 batchYield:null,usedAmount:null,leftover:null,
 readiness:"pending_measurement",shoppingStatus:"blocked",nutritionStatus:"blocked"
};
const source={hash:"hash-original-piloto",rightsStatus:"pending_review",ingredientReviewStatus:"needs_structuring"};
const makeDraft=(inputs={})=>buildAuxiliaryReviewDraft(link,source,{
 yieldText:"",yieldUnit:"ml",useText:"",useUnit:"ml",
 measurementEvidence:"",editorialNotes:"",...inputs
});
const locked=preview=>{
 assert.ok(preview);
 assert.equal(preview.schemaVersion,1);
 assert.equal(preview.scope,"projeto_de_fluxo_somente_leitura");
 assert.equal(preview.auditRecorded,false);
 assert.equal(preview.workflowPersisted,false);
 assert.equal(preview.canApprove,false);
 assert.equal(preview.canPublish,false);
 assert.equal(preview.canWriteIngredients,false);
 assert.equal(preview.canChangeNutrition,false);
 assert.equal(preview.canReleaseShopping,false);
 assert.equal(preview.requiresImmutableAudit,true);
 assert.equal(preview.requiresServerAuthorization,true);
 assert.equal(preview.requiresIndependentApproval,true);
 assert.equal(preview.proposedEventEnvelope.eventId,null);
 assert.equal(preview.proposedEventEnvelope.actorId,null);
 assert.equal(preview.proposedEventEnvelope.serverTimestamp,null);
 assert.equal(preview.proposedEventEnvelope.decision,null);
 assert.equal(preview.gates.length,8);
 assert.equal(new Set(preview.gates.map(g=>g.id)).size,8);
 assert.ok(preview.gates.every(g=>!String(g.status).includes("aprovad")));
 assert.ok(preview.gates.every(g=>g.suggestedResponsibility.includes("proposta")));
 assert.equal(preview.gates.find(g=>g.id==="final_independent_check").status,"bloqueado_por_pendencia");
 assert.equal(preview.gates.find(g=>g.id==="culinary_safety").status,"conferencia_necessaria");
 assert.equal(preview.gates.find(g=>g.id==="allergens").status,"conferencia_necessaria");
 assert.equal(preview.gates.find(g=>g.id==="commercial_rights").status,"bloqueado_por_pendencia");
 assert.equal(preview.gates.find(g=>g.id==="ingredient_structuring").status,"bloqueado_por_pendencia");
};
const empty=buildAuxiliaryEditorialWorkflowPreview(makeDraft());
locked(empty);
assert.equal(empty.gates.find(g=>g.id==="measurement").status,"conferencia_necessaria");
assert.equal(empty.rightsStatusAtPreview,"pending_review");
assert.equal(empty.ingredientReviewStatusAtPreview,"needs_structuring");
const coherent=makeDraft({
 yieldText:"200",useText:"30",
 measurementEvidence:"Medição fictícia para testar fluxo, sem aprovação."
});
const next=buildAuxiliaryEditorialWorkflowPreview(coherent);
locked(next);
assert.equal(next.gates.find(g=>g.id==="measurement").status,"apto_para_conferencia_humana");
assert.equal(coherent.status,"rascunho_nao_homologado");
const noEvidence=buildAuxiliaryEditorialWorkflowPreview(makeDraft({
 yieldText:"200",useText:"30",measurementEvidence:"curto"
}));
locked(noEvidence);
assert.equal(noEvidence.gates.find(g=>g.id==="measurement").status,"conferencia_necessaria");
for(const changed of [
 {...coherent,canApprove:true},
 {...coherent,canPublish:true},
 {...coherent,canCalculateShopping:true},
 {...coherent,canCalculateNutrition:true},
 {...coherent,canAssumeSafeLeftovers:true},
 {...coherent,storedRemotely:true},
 {...coherent,recipeId:""},
 {...coherent,sourceReferenceHash:""},
 {...coherent,mainBlockKey:""},
 {...coherent,auxiliaryBlockKey:""},
 {...coherent,status:"aprovado"}
]){
 assert.equal(buildAuxiliaryEditorialWorkflowPreview(changed),null,
  "Modificação que implique autoridade deve falhar fechada");
}
const untrusted=buildAuxiliaryEditorialWorkflowPreview({
 ...coherent,sourceRightsStatus:"approved",ingredientReviewStatus:"reviewed"
});
locked(untrusted);
assert.equal(untrusted.gates.find(g=>g.id==="commercial_rights").status,"bloqueado_por_pendencia");
assert.equal(untrusted.gates.find(g=>g.id==="ingredient_structuring").status,"bloqueado_por_pendencia");
assert.equal(PROPOSED_AUDIT_EVENTS.length,10);
assert.ok(PROPOSED_AUDIT_EVENTS.includes("reabertura_de_versao"));
console.log("OK: fluxo 8 verificações; medidas só aptas a revisão humana; sem aprovação, persistência ou eventos falsos.");
