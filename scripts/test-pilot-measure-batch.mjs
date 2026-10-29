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
const {classifyMeasure,measureUnitLabel,suggestMeasure,summarizeMeasures,prepareDraftCandidates,isMeasureSourceAligned}=await import(url(batchCode));

assert.deepEqual(suggestMeasure("150 g de fraldinha"),{quantity:150,unit:"g",ingredient:"fraldinha"});
assert.equal(classifyMeasure("150 g de fraldinha").group,"simple");
assert.equal(classifyMeasure("150 a 180 g de fraldinha").group,"range");
assert.equal(classifyMeasure("1 colher (sopa) de azeite ou manteiga").group,"choice");
assert.equal(classifyMeasure("1 colher (chá) de manteiga. Chimichurri: 3 colheres (sopa) de salsinha picada").group,"compound");
assert.equal(classifyMeasure("1 ovo (opcional)").group,"optional");
assert.equal(classifyMeasure("sal").group,"manual");
assert.equal(classifyMeasure("½ xícara de água gelada").group,"simple");
assert.equal(classifyMeasure("suco de ½ limão").group,"manual");
assert.equal(classifyMeasure("1 colher (sopa) de maionese caseira").group,"manual",
 "Maionese caseira exige conferência de preparo, mesmo com quantidade legível");
assert.equal(classifyMeasure("1 colher (chá) de gergelim").group,"simple");
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
const offered=[
 ...Array.from({length:25},(_,i)=>({ingredient_id:String(i),recipe_id:"recipe-"+i,source_position:i%10,recipes:{title:"Receita "+i},source_text:"150 g de fraldinha",review_status:"pending",recipe_ingredients:{name:"150 g de fraldinha",position:i%10}})),
 {ingredient_id:"exclude1",source_text:"150 a 180 g de fraldinha",review_status:"pending"},
 {ingredient_id:"exclude2",source_text:"1 colher (sopa) de azeite ou manteiga",review_status:"pending"},
 {ingredient_id:"exclude3",source_text:"150 g de fraldinha",review_status:"draft"}
];
const candidates=prepareDraftCandidates(offered);
assert.equal(candidates.length,20,"A prévia nunca pode ultrapassar vinte");
assert.equal(candidates.every(item=>item.quantity===150&&item.unit==="g"),true);
assert.equal(candidates.every(item=>item.source_text==="150 g de fraldinha"),true);
assert.equal(candidates.every(item=>item.recipe_title.startsWith("Receita ")&&item.recipe_id.startsWith("recipe-")),true);
assert.equal(candidates.every(item=>Number.isInteger(item.source_position)),true);
assert.equal(prepareDraftCandidates([{ingredient_id:"unknown",source_position:0,source_text:"150 g de fraldinha",review_status:"pending",recipe_ingredients:{name:"150 g de fraldinha",position:0}}]).length,0,
 "Não exibir candidatos sem receita identificada");
assert.equal(prepareDraftCandidates([{ingredient_id:"missingTitle",recipe_id:"recipe-1",source_position:0,recipes:{title:""},source_text:"150 g de fraldinha",review_status:"pending",recipe_ingredients:{name:"150 g de fraldinha",position:0}}]).length,0,
 "Não oferecer proposta sem título da receita");
assert.equal(prepareDraftCandidates(offered,3).length,3);
assert.equal(prepareDraftCandidates(offered,0).length,0);
assert.equal(prepareDraftCandidates(offered,999).length,20);
assert.equal(prepareDraftCandidates(offered.filter(x=>x.review_status!=="pending")).length,0);
const samplesForRecipe=[
 "1 colher (chá) de gergelim","1 punhado de rúcula",
 "1 colher (sopa) de azeite","1 colher (chá) de gergelim",
 "1 colher (sopa) de cebolinha"
].map((source_text,i)=>({ingredient_id:"sample-"+i,recipe_id:"sample-recipe",source_position:i,
 recipes:{title:"Receitas de atum em revisão"},source_text,review_status:"pending",recipe_ingredients:{name:source_text,position:i}}));
assert.equal(prepareDraftCandidates(samplesForRecipe).length,5,
 "Cinco expressões objetivas continuam elegíveis apenas para rascunho");
assert.equal(prepareDraftCandidates([{ingredient_id:"mayo",recipe_id:"sample-recipe",source_position:5,
 recipes:{title:"Patê de atum"},source_text:"1 colher (sopa) de maionese caseira",review_status:"pending",recipe_ingredients:{name:"1 colher (sopa) de maionese caseira",position:5}}]).length,0,
 "Não preparar maionese caseira para lote rápido");
const aligned={ingredient_id:"aligned",recipe_id:"recipe-ok",source_position:2,
 recipes:{title:"Receita íntegra"},source_text:"1 colher (chá) de gergelim",
 review_status:"pending",recipe_ingredients:{name:"1 colher (chá) de gergelim",position:2}};
assert.equal(isMeasureSourceAligned(aligned),true);
assert.equal(isMeasureSourceAligned({...aligned,recipe_ingredients:{name:"gergelim",position:2}}),false,
 "Bloquear texto original que não corresponde ao ingrediente exibido");
assert.equal(isMeasureSourceAligned({...aligned,recipe_ingredients:{name:aligned.source_text,position:3}}),false,
 "Bloquear mudanças de posição decorrentes de divisão editorial");
assert.equal(isMeasureSourceAligned({...aligned,recipe_ingredients:null}),false,
 "Ausência da origem atual falha de forma conservadora");
assert.equal(prepareDraftCandidates([
 {...aligned,recipe_ingredients:{name:aligned.source_text,position:3}},
 {...aligned,ingredient_id:"alterado",recipe_ingredients:{name:"gergelim",position:2}}
]).length,0,"Nenhum rascunho rápido quando texto ou posição divergem");
assert.equal(prepareDraftCandidates([aligned]).length,1,
 "Fonte alinhada continua elegível para revisão de rascunho");
console.log("OK: prévia de até 20 propostas com origem e posição íntegros, sem aprovar nem gravar.");

