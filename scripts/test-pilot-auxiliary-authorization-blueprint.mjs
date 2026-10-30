import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const transpile=path=>ts.transpileModule(
 readFileSync(new URL(path,import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const dataUrl=code=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const consumUrl=dataUrl(transpile("../src/lib/pilotAuxiliaryConsumptionModel.ts"));
const draftUrl=dataUrl(transpile("../src/lib/pilotAuxiliaryReviewDraft.ts")
 .replace(/from ["']\.\/pilotAuxiliaryConsumptionModel["']/,()=> 'from "'+consumUrl+'"'));
const [draftLib,workflowLib,design]=await Promise.all([
 import(draftUrl),
 import(dataUrl(transpile("../src/lib/pilotAuxiliaryEditorialWorkflowPreview.ts"))),
 import(dataUrl(transpile("../src/lib/pilotAuxiliaryAuthorizationBlueprint.ts")))
]);
const link={
 mealRecipeId:"recipe-pilot-1",mainBlockKey:"prato",auxiliaryBlockKey:"molho",
 sourceDeclaredYield:"2 a 3 porções",sourceDeclaredUse:null,
 referenceIngredientId:null,referenceIngredientPosition:null,
 referenceIngredientText:null,duplicatePurchaseRisk:false,
 batchYield:null,usedAmount:null,leftover:null,readiness:"pending_measurement",
 shoppingStatus:"blocked",nutritionStatus:"blocked"
};
const draft=draftLib.buildAuxiliaryReviewDraft(link,{
 hash:"hash-piloto",rightsStatus:"pending_review",ingredientReviewStatus:"needs_structuring"
},{
 yieldText:"200",yieldUnit:"ml",useText:"30",useUnit:"ml",
 measurementEvidence:"Teste artificial de medição; não representa receita real.",
 editorialNotes:"Simulação"
});
const workflow=workflowLib.buildAuxiliaryEditorialWorkflowPreview(draft);
assert.ok(workflow);
const result=design.buildAuxiliaryAuthorizationBlueprint(workflow);
assert.ok(result);
assert.equal(result.schemaVersion,1);
assert.equal(result.status,"design_only_no_migration");
assert.equal(result.recipeId,"recipe-pilot-1");
assert.equal(result.sourceHash,"hash-piloto");
assert.equal(result.serverIdentityVerified,false);
assert.equal(result.permissionsProvisioned,false);
assert.equal(result.databaseTablesCreated,false);
assert.equal(result.approvalAllowed,false);
assert.equal(result.changesAllowed,false);
assert.equal(result.commercialPublicationAllowed,false);
assert.equal(result.auditEventsCreated,false);
assert.equal(result.proposedActorId,null);
assert.equal(result.proposedCurrentVersion,null);
assert.equal(result.roleBlueprint.length,8);
assert.equal(new Set(result.roleBlueprint.map(r=>r.role)).size,8);
assert.equal(new Set(result.roleBlueprint.map(r=>r.gate)).size,8);
assert.ok(result.roleBlueprint.every(r=>r.canActNow===false&&r.grantedInDatabase===false));
assert.equal(result.tables.length,5);
assert.equal(new Set(result.tables.map(t=>t.name)).size,5);
assert.ok(result.tables.every(t=>t.backendOnlyWrites===true&&
 t.migrationExecuted===false&&t.rlsImplemented===false));
assert.equal(result.serverControls.length,8);
assert.equal(new Set(result.serverControls.map(c=>c.id)).size,8);
assert.ok(result.serverControls.every(c=>c.implementation==="not_implemented"&&c.gate==="server_only"));
assert.ok(result.tables.find(t=>t.name==="cc_aux_editorial_decision_events")
 .constraints.some(c=>c.includes("UPDATE/DELETE")));
assert.ok(result.tables.find(t=>t.name==="cc_aux_editorial_role_grants")
 .constraints.some(c=>c.includes("Proponente")));
assert.ok(result.serverControls.find(c=>c.id==="version")
 .detail.includes("expected_version"));
for(const tampered of [
 {...workflow,canApprove:true},
 {...workflow,canPublish:true},
 {...workflow,workflowPersisted:true},
 {...workflow,auditRecorded:true},
 {...workflow,requiresServerAuthorization:false},
 {...workflow,requiresImmutableAudit:false},
 {...workflow,requiresIndependentApproval:false},
 {...workflow,proposedEventEnvelope:{...workflow.proposedEventEnvelope,eventId:123}},
 {...workflow,proposedEventEnvelope:{...workflow.proposedEventEnvelope,actorId:"user-1"}},
 {...workflow,proposedEventEnvelope:{...workflow.proposedEventEnvelope,serverTimestamp:"2026-10-30"}},
 {...workflow,recipeId:""},
 {...workflow,sourceReferenceHash:""},
 {...workflow,gates:[]},
 {...workflow,gates:[...workflow.gates,workflow.gates[0]]},
 {...workflow,scope:"permissao_real"}
]){
 assert.equal(design.buildAuxiliaryAuthorizationBlueprint(tampered),null,
 "Prévia manipulada jamais deve produzir projeto com aparência válida");
}
const spoof=workflowLib.buildAuxiliaryEditorialWorkflowPreview({
 ...draft,sourceRightsStatus:"approved",ingredientReviewStatus:"reviewed"
});
const spoofResult=design.buildAuxiliaryAuthorizationBlueprint(spoof);
assert.ok(spoofResult);
assert.equal(spoofResult.permissionsProvisioned,false);
assert.equal(spoofResult.approvalAllowed,false);
assert.ok(spoofResult.roleBlueprint.every(r=>r.canActNow===false));
console.log("OK: 8 papéis, 5 tabelas, 8 controles futuros e nenhum acesso ou evento real; adulterações rejeitadas.");
