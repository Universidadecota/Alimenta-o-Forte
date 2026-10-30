import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const transpile=path=>ts.transpileModule(
 readFileSync(new URL(path,import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const asModule=code=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const consumption=asModule(transpile("../src/lib/pilotAuxiliaryConsumptionModel.ts"));
const proposalText=transpile("../src/lib/pilotAuxiliaryReviewDraft.ts")
 .replace(/from ["']\.\/pilotAuxiliaryConsumptionModel["']/,()=> 'from "'+consumption+'"');
const {buildAuxiliaryReviewDraft,REQUIRED_EDITORIAL_DECISIONS}=await import(asModule(proposalText));
const baseLink={
 mealRecipeId:"receita-de-teste",mainBlockKey:"prato",auxiliaryBlockKey:"maionese",
 sourceDeclaredYield:"cerca de ½ xícara",sourceDeclaredUse:"1 colher (sopa)",
 referenceIngredientId:"id-ingrediente",referenceIngredientPosition:1,
 referenceIngredientText:"1 colher de maionese caseira",duplicatePurchaseRisk:true,
 batchYield:null,usedAmount:null,leftover:null,
 readiness:"pending_measurement",shoppingStatus:"blocked",nutritionStatus:"blocked"
};
const ref={hash:"hash-testemunha",rightsStatus:"pending_review",ingredientReviewStatus:"needs_structuring"};
const input={
 yieldText:"",yieldUnit:"ml",
 useText:"",useUnit:"ml",
 measurementEvidence:"",editorialNotes:""
};
const draft=values=>buildAuxiliaryReviewDraft(baseLink,ref,{...input,...values});
const assertLocked=doc=>{
 assert.equal(doc.schemaVersion,1);
 assert.equal(doc.status,"rascunho_nao_homologado");
 assert.equal(doc.canApprove,false);
 assert.equal(doc.canPublish,false);
 assert.equal(doc.canCalculateShopping,false);
 assert.equal(doc.canCalculateNutrition,false);
 assert.equal(doc.canAssumeSafeLeftovers,false);
 assert.equal(doc.storedRemotely,false);
 assert.equal(doc.duplicatePurchaseRisk,true);
 assert.equal(doc.sourceReferenceIngredientId,"id-ingrediente");
 assert.equal(doc.sourceReferenceHash,"hash-testemunha");
 assert.equal(doc.sourceRightsStatus,"pending_review");
 assert.equal(doc.ingredientReviewStatus,"needs_structuring");
 assert.ok(doc.remainingDecisions.length>=6);
};
let d=draft({});
assertLocked(d);
assert.equal(d.editorialStage,"pendente");
assert.equal(d.providedMeasurement.comparisonStatus,"missing_yield");
assert.equal(d.providedMeasurement.differenceHypothetical,null);
assert.equal(d.providedMeasurement.yieldInputStatus,"missing");
assert.equal(d.providedMeasurement.useInputStatus,"missing");
d=draft({yieldText:"200",useText:"30",measurementEvidence:"Lote medido com utensílio calibrado."});
assertLocked(d);
assert.equal(d.editorialStage,"apto_para_analise_humana");
assert.equal(d.providedMeasurement.comparisonStatus,"simulated");
assert.deepEqual(d.providedMeasurement.batchYield,{amount:200,unit:"ml"});
assert.deepEqual(d.providedMeasurement.usedAmount,{amount:30,unit:"ml"});
assert.deepEqual(d.providedMeasurement.differenceHypothetical,{amount:170,unit:"ml"});
d=draft({yieldText:"2,5",useText:"1,5",measurementEvidence:"Medição em recipiente graduado."});
assertLocked(d);
assert.deepEqual(d.providedMeasurement.differenceHypothetical,{amount:1,unit:"ml"});
assert.equal(d.editorialStage,"apto_para_analise_humana");
d=draft({yieldText:"200",useText:"30",measurementEvidence:"curta"});
assert.equal(d.editorialStage,"pendente","Medida matemática isolada não conclui evidência editorial");
for(const invalid of ["0","-1","1e10","½","Infinity","NaN","1.2.3","2000000"]){
 d=draft({yieldText:invalid,useText:"30",measurementEvidence:"Texto longo de evidência de aferição"});
 assert.equal(d.providedMeasurement.yieldInputStatus,"invalid",invalid);
 assert.equal(d.providedMeasurement.comparisonStatus,"invalid_measurement");
 assert.equal(d.providedMeasurement.differenceHypothetical,null);
 assertLocked(d);
}
d=draft({yieldText:"200",useText:"210",measurementEvidence:"Medição de bancada com unidade igual."});
assert.equal(d.providedMeasurement.comparisonStatus,"used_exceeds_yield");
assert.equal(d.editorialStage,"pendente");
d=draft({yieldText:"200",useText:"2",useUnit:"porcao",measurementEvidence:"Medição de bancada com unidade diferente."});
assert.equal(d.providedMeasurement.comparisonStatus,"unit_mismatch");
assert.equal(d.editorialStage,"pendente");
d=draft({yieldText:"200",useText:"30",yieldUnit:"unidade",measurementEvidence:"Medição de bancada por unidade inteira."});
assert.equal(d.providedMeasurement.comparisonStatus,"unit_mismatch");
d=draft({yieldText:"1,5",useText:"1",yieldUnit:"unidade",useUnit:"unidade",measurementEvidence:"Medição de bancada por unidade inteira."});
assert.equal(d.providedMeasurement.yieldInputStatus,"invalid");
d=draft({yieldText:"200",useText:"30",measurementEvidence:"E".repeat(2500),editorialNotes:"N".repeat(2500)});
assert.equal(d.measurementEvidence.length,2000);
assert.equal(d.editorialNotes.length,2000);
d=buildAuxiliaryReviewDraft(baseLink,{...ref,hash:""},{
 ...input,yieldText:"200",useText:"30",measurementEvidence:"Medição com evidência verificada"
});
assert.equal(d.editorialStage,"pendente");
assert.equal(d.canPublish,false);
assert.equal(REQUIRED_EDITORIAL_DECISIONS.length,d.remainingDecisions.length);
console.log("OK: ficha não homologada, evidência mínima, estados reais pendentes, validade de entradas e bloqueio permanente de publicação/compras.");
