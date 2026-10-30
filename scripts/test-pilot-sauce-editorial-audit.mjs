import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

function load(path){
 const raw=readFileSync(new URL(path,import.meta.url),"utf8");
 const compiled=ts.transpileModule(raw,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}
 }).outputText;
 return import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
}

const {SAUCE_AUDIT_BASELINES,getVerifiedSauceAudit}=await load("../src/lib/pilotSauceEditorialAudit.ts");
const {SAUCE_SAFETY_PROPOSALS}=await load("../src/lib/pilotSauceSafetyProposals.ts");
assert.equal(SAUCE_AUDIT_BASELINES.length,3);
const expectedCounts=[16,15,14];
let total=0;
for(const baseline of SAUCE_AUDIT_BASELINES){
 const proposal=SAUCE_SAFETY_PROPOSALS.find(item=>item.recipeId===baseline.recipeId);
 assert.ok(proposal,"Proposta editorial necessária para confronto");
 const recipe={id:baseline.recipeId,published:false,servings:baseline.servings};
 const source={recipe_id:baseline.recipeId,reference_hash:baseline.sourceHash,
  original_yield:baseline.originalYield,original_ingredients:baseline.sourceIngredients,
  use_stage:"personal_pilot"};
 const ingredients=baseline.ingredientNames.map((name,position)=>({
  recipe_id:baseline.recipeId,name,position,
  quantity:null,unit:"un",measure_mode:"unspecified"
 }));
 const result=getVerifiedSauceAudit(proposal,source,recipe,ingredients);
 assert.ok(result,"A fotografia íntegra deve permitir a leitura");
 assert.equal(result.sourceIngredientCount,ingredients.length);
 assert.equal(result.structurallyUnmeasuredCount,ingredients.length);
 assert.equal(result.servings,1);
 assert.ok(result.issues.length>=4);
 assert.ok(result.ingredientsForAllergyReview.length>=3);
 total+=ingredients.length;
 assert.equal(getVerifiedSauceAudit(proposal,{...source,original_ingredients:source.original_ingredients+" editada"},recipe,ingredients),null);
 assert.equal(getVerifiedSauceAudit(proposal,{...source,reference_hash:"outro"},recipe,ingredients),null);
 assert.equal(getVerifiedSauceAudit(proposal,{...source,original_yield:"Porção: 2"},recipe,ingredients),null);
 assert.equal(getVerifiedSauceAudit(proposal,{...source,use_stage:"commercial"},recipe,ingredients),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,{...recipe,published:true},ingredients),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,{...recipe,servings:2},ingredients),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,recipe,ingredients.slice(1)),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,recipe,[
  {...ingredients[0],name:ingredients[0].name+" extra"},...ingredients.slice(1)]),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,recipe,[
  {...ingredients[0],position:1},...ingredients.slice(1)]),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,recipe,[
  {...ingredients[0],quantity:1},...ingredients.slice(1)]),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,recipe,[
  {...ingredients[0],measure_mode:"quantity"},...ingredients.slice(1)]),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,recipe,[
  {...ingredients[0],unit:"g"},...ingredients.slice(1)]),null);
 assert.equal(getVerifiedSauceAudit(proposal,source,recipe,[
  {...ingredients[0],recipe_id:"outra-receita"},...ingredients.slice(1)]),null);
}
assert.equal(total,45);
assert.deepEqual(SAUCE_AUDIT_BASELINES.map(x=>x.ingredientNames.length),expectedCounts);
const caesar=SAUCE_AUDIT_BASELINES.find(x=>x.recipeId==="ccea2f76-a9b0-477a-a5b7-2e4594d2cac7");
assert.ok(caesar.issues.some(x=>x.includes("2 a 3 porções")));
const salad=SAUCE_AUDIT_BASELINES.find(x=>x.recipeId==="fd9d66ab-d656-4bac-8ac6-2607ffad8cc4");
assert.ok(salad.issues.some(x=>x.includes("contagem dupla")));
assert.equal(salad.ingredientNames.filter(x=>x==="suco de ½ limão").length,2);
console.log("OK: 3 receitas/45 ingredientes, auditoria bloqueada para dados alterados e sem escrita no banco.");
