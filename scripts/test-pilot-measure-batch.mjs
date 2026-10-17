import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const getJavaScript=(path)=>ts.transpileModule(
 readFileSync(new URL(path,import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const url=(js)=>"data:text/javascript;base64,"+Buffer.from(js).toString("base64");
const measurementUrl=url(getJavaScript("../src/lib/pilotMeasure.ts"));
const ingredientUrl=url(getJavaScript("../src/lib/pilotIngredientReview.ts"));
const batchCode=getJavaScript("../src/lib/pilotMeasureBatch.ts")
 .replace(/from ["']\.\/pilotMeasure["']/,()=> 'from "'+measurementUrl+'"')
 .replace(/from ["']\.\/pilotIngredientReview["']/,()=> 'from "'+ingredientUrl+'"');
const {classifyMeasure,measureUnitLabel,suggestMeasure,summarizeMeasures}=await import(url(batchCode));

assert.deepEqual(suggestMeasure("150 g de fraldinha"),{quantity:150,unit:"g",ingredient:"fraldinha"});
assert.equal(classifyMeasure("150 g de fraldinha").group,"simple");
assert.equal(classifyMeasure("150 a 180 g de fraldinha").group,"range");
assert.equal(classifyMeasure("1 colher (sopa) de azeite ou manteiga").group,"choice");
assert.equal(classifyMeasure("1 colher (chá) de manteiga. Chimichurri: 3 colheres (sopa) de salsinha picada").group,"compound");
assert.equal(classifyMeasure("1 ovo (opcional)").group,"optional");
assert.equal(classifyMeasure("sal").group,"manual");
assert.equal(classifyMeasure("½ xícara de água gelada").group,"simple");
assert.equal(classifyMeasure("suco de ½ limão").group,"manual");
assert.equal(classifyMeasure("1 xícara de caldo caseiro (ou água)").group,"choice");
assert.equal(classifyMeasure("1 filé de truta (150 a 180 g)").group,"range");
assert.equal(measureUnitLabel("colher_sopa"),"colher (sopa)");
assert.equal(measureUnitLabel("colher_cha"),"colher (chá)");
assert.equal(measureUnitLabel("xicara"),"xícara");

const sample=["150 g de fraldinha","150 a 180 g de fraldinha",
 "1 colher (sopa) de azeite ou manteiga",
 "1 colher (chá) de manteiga. Chimichurri: 3 colheres (sopa) de salsinha picada",
 "1 ovo (opcional)","sal"];
const summary=summarizeMeasures(sample.map((source_text,i)=>({
 ingredient_id:String(i),source_text,review_status:"pending"
})),2);
assert.equal(summary.total,6);
assert.equal(summary.pending,6);
assert.deepEqual(Object.values(summary.byGroup).sort((a,b)=>a-b),[1,1,1,1,1,1]);
assert.equal(summary.examples.simple[0].proposal?.ingredient,"fraldinha");
assert.equal(summary.otherStatuses,0);
console.log("OK: agrupamento conservador em lote e unidades legíveis, sem gravar medidas.");
