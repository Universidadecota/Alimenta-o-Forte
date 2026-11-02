import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const root=fileURLToPath(new URL("../",import.meta.url));
const matrix=JSON.parse(readFileSync(resolve(root,"docs/qa/20261102_fase49_aceite_prompt_mestre.json"),"utf8"));
const report=readFileSync(resolve(root,"docs/qa/20261102_fase49_auditoria_prompt_mestre.md"),"utf8");

assert.equal(matrix.version,1);
assert.equal(matrix.phase,49);
assert.equal(matrix.checks.length,14,"O Prompt Mestre exige exatamente 14 cenarios de aceite.");
assert.deepEqual(matrix.checks.map(x=>x.id),Array.from({length:14},(_,i)=>i+1));
assert.match(matrix.verdict_rule,/apenas por análise estática/);
assert.ok(matrix.checks.every(x=>["presente","parcial","ausente"].includes(x.implementation)));
assert.ok(matrix.checks.every(x=>x.verification?.length&&x.next_test?.length));
assert.ok(matrix.checks.every(x=>Array.isArray(x.evidence)&&x.evidence.length));

for(const item of matrix.checks){
 for(const ref of item.evidence){
  const file=ref.trim();
  if(file.startsWith("src/")||file.startsWith("scripts/")||file.startsWith("docs/")){
   assert.ok(existsSync(resolve(root,file)),"Evidencia não encontrada no repo: "+file);
  }
 }
}
for(let i=1;i<=21;i++){
 assert.match(report,new RegExp("\\| "+i+" \\|"),"Falta a área "+i+" na tabela das 21 seções.");
}
for(const required of [
 "Evolução","Jornada 30 dias","Assistente Costa&Costa","PWA","LGPD",
 "7","121","35","dois usuários","Fase 48","beta gratuito"
]){
 assert.ok(report.toLocaleLowerCase("pt-BR").includes(required.toLocaleLowerCase("pt-BR")),"Falta o tópico: "+required);
}
assert.ok(!matrix.checks.some(x=>x.verification.toLowerCase().includes("14/14 aprovado")));
console.log("PASS F49: 21 áreas, 14 critérios com evidências existentes, sem homologação E2E inventada.");
