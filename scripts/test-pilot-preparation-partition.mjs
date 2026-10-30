import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const transpile=(path)=>ts.transpileModule(
 readFileSync(new URL(path,import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const moduleUrl=(code)=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const auditUrl=moduleUrl(transpile("../src/lib/pilotSauceEditorialAudit.ts"));
const source=transpile("../src/lib/pilotRecipePreparationPartition.ts")
 .replace(/from ["']\.\/pilotSauceEditorialAudit["']/,()=> 'from "'+auditUrl+'"');
const {PILOT_PREPARATION_LAYOUTS,getVerifiedPreparationPartition}=await import(moduleUrl(source));
const {SAUCE_AUDIT_BASELINES}=await import(auditUrl);
const {SAUCE_SAFETY_PROPOSALS}=await import(moduleUrl(transpile("../src/lib/pilotSauceSafetyProposals.ts")));

const expectedSizes={
 "bc72828c-22ad-4201-9672-86e754eabe9c":[8,4,4],
 "ccea2f76-a9b0-477a-a5b7-2e4594d2cac7":[8,7],
 "fd9d66ab-d656-4bac-8ac6-2607ffad8cc4":[10,4]
};
assert.equal(PILOT_PREPARATION_LAYOUTS.length,3);
for(const baseline of SAUCE_AUDIT_BASELINES){
 const proposal=SAUCE_SAFETY_PROPOSALS.find(p=>p.recipeId===baseline.recipeId);
 assert.ok(proposal);
 const source={
  recipe_id:baseline.recipeId,reference_hash:baseline.sourceHash,
  original_yield:baseline.originalYield,original_ingredients:baseline.sourceIngredients,
  use_stage:"personal_pilot"
 };
 const recipe={id:baseline.recipeId,published:false,servings:baseline.servings};
 const ingredients=baseline.ingredientNames.map((name,position)=>({
  id:"test-"+position,recipe_id:baseline.recipeId,name,position,
  quantity:null,unit:"un",measure_mode:"unspecified"
 }));
 const partition=getVerifiedPreparationPartition(proposal,source,recipe,ingredients);
 assert.ok(partition);
 assert.deepEqual(partition.blocks.map(b=>b.ingredients.length),expectedSizes[baseline.recipeId]);
 assert.equal(partition.blocks.reduce((sum,b)=>sum+b.ingredients.length,0),ingredients.length);
 assert.deepEqual(partition.blocks.flatMap(b=>b.ingredients.map(i=>i.position)),
  ingredients.map(i=>i.position),"Cada posição ocorre exatamente uma vez e na ordem original");
 assert.equal(new Set(partition.blocks.flatMap(b=>b.ingredients.map(i=>i.id))).size,ingredients.length);
 assert.equal(partition.blocks.filter(b=>b.kind==="main").length,1);
 assert.equal(partition.blocks.filter(b=>b.kind==="sauce").length,1);
 assert.equal(partition.mealServings,1);
 assert.equal(partition.shoppingCalculationAllowed,false);
 assert.equal(partition.nutritionCalculationAllowed,false);
 assert.ok(partition.warnings.length>=3);
 assert.equal(getVerifiedPreparationPartition(proposal,source,recipe,
  ingredients.map((i,index)=>index===0?{...i,quantity:1}:i)),null,
  "Alterações de medidas impedem reutilizar a classificação antiga");
 assert.equal(getVerifiedPreparationPartition(proposal,source,
  {...recipe,published:true},ingredients),null);
 assert.equal(getVerifiedPreparationPartition(proposal,source,recipe,
  ingredients.slice(1)),null,"Ingrediente ausente não pode ser ocultado silenciosamente");
 assert.equal(getVerifiedPreparationPartition(proposal,source,recipe,
  ingredients.map((i,index)=>index===0?{...i,id:ingredients[1].id}:i)),null,
  "IDs duplicados impedem divisão segura");
 assert.equal(getVerifiedPreparationPartition(proposal,
  {...source,original_ingredients:"Fonte alterada"},recipe,ingredients),null);
 const sauce=partition.blocks.find(b=>b.kind==="sauce");
 assert.ok(sauce.ingredients.length>=4);
 if(recipe.id==="ccea2f76-a9b0-477a-a5b7-2e4594d2cac7"){
  assert.ok(sauce.declaredYield.includes("2 a 3"));
  assert.equal(sauce.usedInMeal,null,"Quantidade consumida não é presumida");
 }
 if(recipe.id==="fd9d66ab-d656-4bac-8ac6-2607ffad8cc4"){
  const main=partition.blocks.find(b=>b.kind==="main");
  assert.equal(main.referencedAtPosition,1);
  assert.ok(main.ingredients[1].name.includes("maionese caseira"));
  assert.ok(sauce.declaredYield.includes("½ xícara"));
  assert.ok(sauce.usedInMeal.includes("1 colher"));
  assert.equal(partition.blocks.flatMap(b=>b.ingredients)
   .filter(i=>i.name==="suco de ½ limão").length,2);
 }
}
console.log("OK: mapa editorial 3 receitas/45 ingredientes; nenhum omitido ou duplicado; sem soma de compras ou nutrição.");
