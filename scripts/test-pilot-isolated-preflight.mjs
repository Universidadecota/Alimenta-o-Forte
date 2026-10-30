import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {
 OPERATIONAL_SUPABASE_REF,LOCAL_CONFIRMATION,ISOLATED_SCENARIO_IDS,
 SYNTHETIC_PERSONAS,validateIsolatedTarget,makeIsolatedReadinessReport
} from "./lib/pilot-isolated-target-guard.mjs";

const compiled=ts.transpileModule(
 readFileSync(new URL("../src/lib/pilotAuxiliaryMigrationRunbook.ts",import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const url="data:text/javascript;base64,"+Buffer.from(compiled).toString("base64");
const {MIGRATION_TEST_MATRIX}=await import(url);
const ids=MIGRATION_TEST_MATRIX.map(x=>x.id);
assert.equal(ids.length,14);
assert.deepEqual(ISOLATED_SCENARIO_IDS,[...ids],
 "A matriz offline deve seguir exatamente os 14 cenários da Fase 3W");
assert.ok(SYNTHETIC_PERSONAS.length>=8);
const local={
 mode:"local",url:"http://127.0.0.1:54321",
 projectRef:"",approvedProjectRef:"",
 confirmation:LOCAL_CONFIRMATION
};
const remoteRef="abcdefghijklmnopqrst";
const remote={
 mode:"remote-test",url:"https://"+remoteRef+".supabase.co",
 projectRef:remoteRef,approvedProjectRef:remoteRef,
 confirmation:"CONFIRMO_TESTE_ISOLADO_"+remoteRef
};
assert.deepEqual(validateIsolatedTarget(local),
 {allowed:true,kind:"loopback_local",reason:"preflight_config_only_no_connection"});
assert.equal(validateIsolatedTarget({...local,url:"http://localhost:54321"}).allowed,true);
assert.equal(validateIsolatedTarget(remote).allowed,true);
for(const x of [
 {},
 {...local,mode:""},
 {...local,confirmation:""},
 {...local,confirmation:"CONFIRMO_PRODUCAO"},
 {...local,url:"http://127.0.0.1:54322"},
 {...local,url:"http://0.0.0.0:54321"},
 {...local,url:"http://127.0.0.2:54321"},
 {...local,url:"https://127.0.0.1:54321"},
 {...local,url:"http://localhost:54321/test"},
 {...local,url:"http://user:password@localhost:54321"},
 {...local,url:"http://localhost:54321?role=service_role"},
 {...local,projectRef:remoteRef},
 {...remote,projectRef:OPERATIONAL_SUPABASE_REF,approvedProjectRef:OPERATIONAL_SUPABASE_REF,
  url:"https://"+OPERATIONAL_SUPABASE_REF+".supabase.co",
  confirmation:"CONFIRMO_TESTE_ISOLADO_"+OPERATIONAL_SUPABASE_REF},
 {...remote,url:"https://"+OPERATIONAL_SUPABASE_REF+".supabase.co"},
 {...remote,url:"http://"+remoteRef+".supabase.co"},
 {...remote,approvedProjectRef:""},
 {...remote,confirmation:""},
 {...remote,url:"https://evil."+remoteRef+".supabase.co"},
 {...remote,url:"https://"+remoteRef+".supabase.co.evil.example"},
 {...remote,url:"https://"+remoteRef+".supabase.co/?x=1"},
 {...remote,url:"https://"+remoteRef+".supabase.co:8443"},
 {...remote,projectRef:"invalid"},
 {...remote,mode:"other"}
]){
 const check=validateIsolatedTarget(x);
 assert.equal(check.allowed,false,JSON.stringify(x));
}
for(const config of [{},local,remote]){
 const report=makeIsolatedReadinessReport(config,ids);
 assert.equal(report.kind,"isolated_preflight");
 assert.equal(report.networkConnections,0);
 assert.equal(report.queriesExecuted,0);
 assert.equal(report.migrationsExecuted,0);
 assert.equal(report.rlsTestsExecuted,0);
 assert.equal(report.canExecuteDatabaseTests,false);
 assert.equal(report.scenarios.length,14);
 assert.deepEqual(report.scenarios.map(x=>x.id),ids);
 assert.ok(report.scenarios.every(x=>x.databaseEvidence===null));
 assert.ok(report.scenarios.every(x=>
  x.status===(report.target.allowed?"prepared_not_executed":"blocked_no_isolated_target")));
}
const invalidMatrix=makeIsolatedReadinessReport(local,[...ids,ids[0]]);
assert.equal(invalidMatrix.target.allowed,false);
assert.equal(invalidMatrix.scenarios.length,0);
assert.equal(invalidMatrix.canExecuteDatabaseTests,false);
const missingScenario=makeIsolatedReadinessReport(local,ids.slice(1));
assert.equal(missingScenario.target.allowed,false);
console.log("OK: alvo operacional bloqueado, URL isolada validada sem conexão e 14 cenários marcados não executados.");
