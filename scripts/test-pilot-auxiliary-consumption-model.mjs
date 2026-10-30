import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const transpile=(file)=>ts.transpileModule(
 readFileSync(new URL(file,import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const moduleUrl=(code)=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const auditUrl=moduleUrl(transpile("../src/lib/pilotSauceEditorialAudit.ts"));
const partitionUrl=moduleUrl(transpile("../src/lib/pilotRecipePreparationPartition.ts")
 .replace(/from ["']\.\/pilotSauceEditorialAudit["']/,()=> 'from "'+auditUrl+'"'));
const [audit,part,proposals,model]=await Promise.all([
 import(auditUrl),
 import(partitionUrl),
 import(moduleUrl(transpile("../src/lib/pilotSauceSafetyProposals.ts"))),
 import(moduleUrl(transpile("../src/lib/pilotAuxiliaryConsumptionModel.ts")))
]);
const {buildProposedAuxiliaryLink,simulateAuxiliaryConsumption}=model;
let n=0;
for(const baseline of audit.SAUCE_AUDIT_BASELINES){
 const proposal=proposals.SAUCE_SAFETY_PROPOSALS.find(p=>p.recipeId===baseline.recipeId);
 const source={recipe_id:baseline.recipeId,reference_hash:baseline.sourceHash,
  use_stage:"personal_pilot",original_ingredients:baseline.sourceIngredients,
  original_yield:baseline.originalYield};
 const recipe={id:baseline.recipeId,published:false,servings:baseline.servings};
 const ingredients=baseline.ingredientNames.map((name,position)=>({
  id:baseline.recipeId+"-"+position,recipe_id:baseline.recipeId,
  name,position,quantity:null,unit:"un",measure_mode:"unspecified"
 }));
 const partition=part.getVerifiedPreparationPartition(proposal,source,recipe,ingredients);
 assert.ok(partition);
 const link=buildProposedAuxiliaryLink(baseline.recipeId,partition);
 assert.ok(link);
 assert.equal(link.mealRecipeId,baseline.recipeId);
 assert.equal(link.batchYield,null);
 assert.equal(link.usedAmount,null);
 assert.equal(link.leftover,null);
 assert.equal(link.shoppingStatus,"blocked");
 assert.equal(link.nutritionStatus,"blocked");
 assert.equal(link.readiness,"pending_measurement");
 assert.equal(buildProposedAuxiliaryLink("",partition),null);
 assert.equal(buildProposedAuxiliaryLink(baseline.recipeId,{
  ...partition,shoppingCalculationAllowed:true}),null);
 assert.equal(buildProposedAuxiliaryLink(baseline.recipeId,{
  ...partition,blocks:[...partition.blocks,partition.blocks.find(b=>b.kind==="sauce")]}),null);
 assert.equal(simulateAuxiliaryConsumption(link,{batchYield:null,usedAmount:null}).status,"missing_yield");
 assert.equal(simulateAuxiliaryConsumption(link,{batchYield:{amount:200,unit:"ml"},usedAmount:null}).status,"missing_use");
 assert.equal(simulateAuxiliaryConsumption(link,{batchYield:{amount:200,unit:"ml"},usedAmount:{amount:2,unit:"porcao"}}).status,"unit_mismatch");
 assert.equal(simulateAuxiliaryConsumption(link,{batchYield:{amount:200,unit:"ml"},usedAmount:{amount:210,unit:"ml"}}).status,"used_exceeds_yield");
 for(const amount of [0,-1,NaN,Infinity,1000001]){
  assert.equal(simulateAuxiliaryConsumption(link,{batchYield:{amount,unit:"ml"},usedAmount:{amount:30,unit:"ml"}}).status,"invalid_measurement");
 }
 assert.equal(simulateAuxiliaryConsumption(link,{batchYield:{amount:3,unit:"unidade"},usedAmount:{amount:0.5,unit:"unidade"}}).status,"invalid_measurement");
 const sample=simulateAuxiliaryConsumption(link,{batchYield:{amount:200,unit:"ml"},usedAmount:{amount:30,unit:"ml"}});
 assert.equal(sample.status,"simulated");
 assert.deepEqual(sample.leftover,{amount:170,unit:"ml"});
 assert.equal(sample.hypotheticalOnly,true);
 assert.equal(sample.shoppingStatus,"blocked");
 assert.equal(sample.nutritionStatus,"blocked");
 assert.deepEqual(simulateAuxiliaryConsumption(link,{batchYield:{amount:200,unit:"ml"},usedAmount:{amount:200,unit:"ml"}}).leftover,
  {amount:0,unit:"ml"});
 if(baseline.recipeId==="fd9d66ab-d656-4bac-8ac6-2607ffad8cc4"){
  const ref=ingredients[1];
  assert.equal(link.referenceIngredientId,ref.id);
  assert.equal(link.referenceIngredientPosition,1);
  assert.equal(link.duplicatePurchaseRisk,true);
  assert.ok(link.sourceDeclaredUse?.includes("1 colher"));
  assert.ok(link.sourceDeclaredYield?.includes("½ xícara"));
  // É apenas uma referência ao molho: nunca foi somada a ingredientes como compra.
  assert.equal(ingredients.filter(i=>i.id===ref.id).length,1);
 }else{
  assert.equal(link.referenceIngredientId,null);
  assert.equal(link.duplicatePurchaseRisk,false);
 }
 if(baseline.recipeId==="ccea2f76-a9b0-477a-a5b7-2e4594d2cac7"){
  assert.ok(link.sourceDeclaredYield?.includes("2 a 3"));
  assert.equal(link.sourceDeclaredUse,null);
 }
 n++;
}
assert.equal(n,3);
console.log("OK: 3 vínculos editoriais pendentes, exemplos fictícios de saldo, unidades incompatíveis, excesso e dupla contagem bloqueada.");
