import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const source=readFileSync(new URL("../src/lib/betaJwtReadOnlyAudit.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {classifyJwtAuditRole,evaluateJwtAudit,JWT_AUDIT_KEYS}=await import(
 "data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
const sample=(key,count,rest={})=>({key,count,accessDenied:false,error:false,...rest});
assert.equal(classifyJwtAuditRole(false,null,null),"anonymous");
assert.equal(classifyJwtAuditRole(true,true,true),"admin");
assert.equal(classifyJwtAuditRole(true,false,true),"beta_member");
assert.equal(classifyJwtAuditRole(true,false,false),"ordinary");
assert.equal(classifyJwtAuditRole(true,null,false),"unknown");
assert.equal(classifyJwtAuditRole(true,false,null),"unknown");
const eachRole=(role,key,count,expected)=>assert.equal(
 evaluateJwtAudit(role,[sample(key,count)])[0].status,expected,role+" / "+key);
eachRole("ordinary","private_official",0,"conforme");
eachRole("ordinary","private_official",114,"alerta");
eachRole("anonymous","private_official",0,"conforme");
eachRole("anonymous","private_official",1,"alerta");
eachRole("beta_member","private_official",114,"conforme");
eachRole("admin","private_official",120,"conforme");
for(const key of ["source_records","measure_reviews","admin_beta_catalog"]){
 eachRole("ordinary",key,0,"conforme");
 eachRole("ordinary",key,1,"alerta");
 eachRole("beta_member",key,1,"alerta");
 eachRole("anonymous",key,1,"alerta");
 eachRole("admin",key,119,"conforme");
}
for(const key of ["other_plans","other_favorites","other_preferences"]){
 eachRole("ordinary",key,0,"conforme");
 eachRole("ordinary",key,1,"alerta");
 eachRole("admin",key,1,"alerta");
}
assert.equal(evaluateJwtAudit("ordinary",[sample("source_records",null,{error:true})])[0].status,"inconclusivo");
assert.equal(evaluateJwtAudit("ordinary",[sample("source_records",null,{accessDenied:true})])[0].status,"conforme");
assert.equal(evaluateJwtAudit("unknown",[sample("private_official",0)])[0].status,"inconclusivo");
assert.equal(evaluateJwtAudit("ordinary",[sample("private_official",null)])[0].status,"inconclusivo");
assert.equal(evaluateJwtAudit("admin",[sample("private_official",null,{accessDenied:true})])[0].status,"inconclusivo");
assert.equal(evaluateJwtAudit("ordinary",[sample("other_plans",0),sample("other_plans",0)])[1].status,"inconclusivo");
assert.equal(JWT_AUDIT_KEYS.length,7);
assert.equal(new Set(JWT_AUDIT_KEYS).size,7);
const ui=readFileSync(new URL("../src/AccessSecurityDiagnostics.tsx",import.meta.url),"utf8");
assert.match(ui,/auth\.getUser\(\)/);
assert.match(ui,/cc_beta_can_view_recipe/);
assert.match(ui,/cc_is_admin/);
assert.match(ui,/head:true/);
assert.match(ui,/role,date:new Date/);
assert.match(ui,/writeTestsExecuted:false,otherUsersSessionsTested:false/);
assert.doesNotMatch(ui,/\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.upload\(|\.signInWithPassword\(|service_role|\.setSession\(/);
const gate=readFileSync(new URL("../src/AuthGate.tsx",import.meta.url),"utf8");
assert.match(gate,/diagnostico-acesso=1/);
assert.match(gate,/AccessSecurityDiagnostics authenticated=\{false\}/);
assert.match(gate,/AccessSecurityDiagnostics authenticated=\{true\}/);
console.log("OK: 7 leituras controladas; anônimo/comum/beta/admin; consulta negada não vira falso positivo; nenhum comando de escrita.");
