import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const transpile=path=>ts.transpileModule(
 readFileSync(new URL(path,import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const asUrl=code=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const design=await import(asUrl(transpile("../src/lib/pilotAuxiliaryAuthorizationBlueprint.ts")));
const runbook=await import(asUrl(transpile("../src/lib/pilotAuxiliaryMigrationRunbook.ts")));
const gateNames=design.PROPOSED_ROLE_MATRIX.map(x=>x.gate);
const preview={
 schemaVersion:1,scope:"projeto_de_fluxo_somente_leitura",
 draftStatus:"rascunho_nao_homologado",recipeId:"fixture-recipe",
 sourceReferenceHash:"fixture-source-hash",rightsStatusAtPreview:"pending_review",
 ingredientReviewStatusAtPreview:"needs_structuring",
 gates:gateNames.map(id=>({id,title:id,status:"bloqueado_por_pendencia",evidence:"teste",suggestedResponsibility:"função proposta"})),
 proposedEventEnvelope:{eventKind:"not_recorded",eventId:null,actorId:null,serverTimestamp:null,recipeId:"fixture-recipe",sourceHash:"fixture-source-hash",expectedVersion:null,previousVersion:null,newVersion:null,decision:null,evidenceReference:null},
 requiresIndependentApproval:true,requiresServerAuthorization:true,requiresImmutableAudit:true,
 auditRecorded:false,workflowPersisted:false,canApprove:false,canPublish:false,
 canWriteIngredients:false,canChangeNutrition:false,canReleaseShopping:false
};
const blueprint=design.buildAuxiliaryAuthorizationBlueprint(preview);
assert.ok(blueprint);
const plan=runbook.buildAuxiliaryMigrationRunbook(blueprint);
assert.ok(plan);
assert.equal(plan.kind,"migration_readiness_design_only");
assert.equal(plan.recipeId,"fixture-recipe");
assert.equal(plan.sourceHash,"fixture-source-hash");
assert.equal(plan.phases.length,5);
assert.equal(plan.tests.length,14);
assert.equal(plan.existingPatterns.length,5);
assert.equal(new Set(plan.phases.map(x=>x.id)).size,5);
assert.equal(new Set(plan.tests.map(x=>x.id)).size,14);
assert.ok(plan.phases.every(x=>x.status==="not_executed"));
assert.ok(plan.tests.every(x=>x.status==="not_executed"));
assert.ok(plan.phases.some(x=>x.id==="03_isolated_schema"&&x.stage==="isolated_environment"));
assert.ok(plan.tests.some(x=>x.id==="stale_expected_version"&&x.category==="versioning"));
assert.ok(plan.tests.some(x=>x.id==="duplicate_idempotency"&&x.category==="versioning"));
assert.ok(plan.tests.some(x=>x.id==="author_cannot_finalize"&&x.category==="authorization"));
assert.ok(plan.tests.some(x=>x.id==="rollback_restore"&&x.category==="recovery"));
assert.ok(plan.tests.some(x=>x.id==="event_immutability"&&x.category==="audit"));
assert.ok(plan.tests.some(x=>x.id==="no_auto_publish"&&x.category==="integration"));
assert.ok(plan.existingPatterns.some(x=>x.system==="Revisão de variantes nutricionais"&&x.verifiedBehavior.includes("FOR UPDATE")));
assert.ok(plan.existingPatterns.some(x=>x.system==="Revisão de alergênicos"&&x.caveat.includes("separação autor/aprovador")));
for(const flag of ["migrationsExecuted","rlsTestsExecuted","actorRolesGranted","databaseChangesMade","approvalEnabled","publicationEnabled","productionReleaseApproved"]){
 assert.equal(plan[flag],false);
}
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,approvalAllowed:true}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,commercialPublicationAllowed:true}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,databaseTablesCreated:true}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,permissionsProvisioned:true}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,serverIdentityVerified:true}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,auditEventsCreated:true}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,recipeId:""}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,sourceHash:""}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,proposedActorId:"forjado"}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,proposedCurrentVersion:1}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,tables:[]}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,roleBlueprint:[]}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,serverControls:[]}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,tables:[{...blueprint.tables[0],migrationExecuted:true},...blueprint.tables.slice(1)]}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,roleBlueprint:[{...blueprint.roleBlueprint[0],grantedInDatabase:true},...blueprint.roleBlueprint.slice(1)]}),null);
assert.equal(runbook.buildAuxiliaryMigrationRunbook({...blueprint,serverControls:[{...blueprint.serverControls[0],implementation:"implemented"},...blueprint.serverControls.slice(1)]}),null);
console.log("OK: plano 5 etapas, 14 cenários futuros e 5 padrões existentes; todos não executados, nenhuma permissão ou migração habilitada.");
