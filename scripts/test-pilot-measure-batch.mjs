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
const reconciliationUrl=url(getJavaScript("../src/lib/pilotSourceReconciliation.ts"));
const {summarizeSourceReconciliation}=await import(reconciliationUrl);
const evidenceCode=getJavaScript("../src/lib/pilotSourceEvidence.ts")
 .replace(/from ["']\.\/pilotSourceReconciliation["']/,()=> 'from "'+reconciliationUrl+'"');
const {buildPilotSourceEvidenceReport}=await import(url(evidenceCode));
const mappingCode=getJavaScript("../src/lib/pilotEditorialMappingHints.ts")
 .replace(/from ["']\.\/pilotIngredientReview["']/,()=> 'from "'+ingredientUrl+'"');
const {buildEditorialMappingHints}=await import(url(mappingCode));
const {classifyEditorialQueueRecipe,summarizeEditorialQueue,filterEditorialQueue,serializeEditorialQueueCsv}=await import(url(getJavaScript("../src/lib/pilotEditorialQueue.ts")));

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

const historical=[
 {ingredient_id:"r1-a",recipe_id:"recipe-one",source_position:0,
  source_text:"pimenta. Molho: 4 tomates maduros",review_status:"pending",recipes:{title:"Receita dividida"}},
 {ingredient_id:"r1-b",recipe_id:"recipe-one",source_position:1,
  source_text:"1 cebola",review_status:"draft",recipes:{title:"Receita dividida"}},
 {ingredient_id:"r1-c",recipe_id:"recipe-one",source_position:3,
  source_text:"1 colher (sopa) de azeite",review_status:"pending",recipes:{title:"Receita dividida"}},
 {ingredient_id:"r1-removed",recipe_id:"recipe-one",source_position:4,
  source_text:"sal",review_status:"pending",recipes:{title:"Receita dividida"}},
 {ingredient_id:"r2-a",recipe_id:"recipe-two",source_position:0,
  source_text:"2 ovos",review_status:"pending",recipes:{title:"Receita sem mudanças"}}
];
const currentIngredients=[
 {id:"r1-a",recipe_id:"recipe-one",name:"pimenta",position:0}, // texto
 {id:"r1-new",recipe_id:"recipe-one",name:"4 tomates maduros",position:1}, // desmembramento 1:N
 {id:"r1-b",recipe_id:"recipe-one",name:"1 cebola",position:2}, // posição
 {id:"r1-c",recipe_id:"recipe-one",name:"azeite",position:4}, // ambos
 {id:"r2-a",recipe_id:"recipe-two",name:"2 ovos",position:0},
 {id:"other",recipe_id:"not-in-pilot",name:"ingrediente alheio",position:0}
];
const reconciliation=summarizeSourceReconciliation(historical,currentIngredients);
assert.deepEqual({
 original:reconciliation.originalExpressions,
 current:reconciliation.currentIngredients,
 exact:reconciliation.exact,
 name:reconciliation.nameMismatch,
 position:reconciliation.positionMismatch,
 both:reconciliation.bothMismatch,
 missing:reconciliation.missingCurrent,
 untracked:reconciliation.untrackedCurrent,
 affected:reconciliation.affectedRecipes
},{original:5,current:5,exact:1,name:1,position:1,both:1,missing:1,untracked:1,affected:1},
 "Histórico divergente, ingredientes desmembrados e outras receitas devem ser contados separadamente");
assert.equal(reconciliation.recipes[0].title,"Receita dividida");
assert.equal(reconciliation.recipes[0].pending,3);
assert.equal(reconciliation.recipes[1].title,"Receita sem mudanças");
assert.equal(reconciliation.recipes[1].exact,1);
assert.throws(()=>summarizeSourceReconciliation([...historical,historical[0]],currentIngredients),/duplicado/);
assert.throws(()=>summarizeSourceReconciliation(historical,[...currentIngredients,currentIngredients[0]]),/duplicado/);
assert.throws(()=>summarizeSourceReconciliation([{...historical[0],recipe_id:undefined}],currentIngredients),/inválidos/);
console.log("OK: conciliação somente de leitura por receita (texto, posição, ambos, 1:N, ausências e integridade).");



const selectedRecipe=reconciliation.recipes[0];
const officialSource={
 recipe_id:"recipe-one",source_document:"Fonte reservada ao piloto",entry_number:17,
 source_page:3,original_title:"Receita dividida",use_stage:"personal_pilot",
 reference_hash:"abcd0123",original_ingredients:"pimenta. Molho: 4 tomates maduros, 1 cebola, azeite, sal"
};
const selectedHistory=historical.filter(row=>row.recipe_id==="recipe-one");
const selectedCurrent=currentIngredients.filter(row=>row.recipe_id==="recipe-one");
const evidence=buildPilotSourceEvidenceReport(selectedRecipe,officialSource,selectedHistory,selectedCurrent);
assert.equal(evidence.official.reference_hash,"abcd0123","O identificador oficial é preservado");
assert.equal(evidence.official.original_ingredients,officialSource.original_ingredients,"O texto oficial é preservado integralmente");
assert.deepEqual(evidence.historical.map(row=>row.comparison),["name","position","both","missing"],
 "A evidência expõe diferenças pelo mesmo ID sem inferência semântica");
assert.equal(evidence.untrackedCurrent.length,1,"O fragmento criado aparece sem vínculo presumido");
assert.equal(evidence.untrackedCurrent[0].name,"4 tomates maduros");
assert.throws(()=>buildPilotSourceEvidenceReport(
 {...selectedRecipe,nameMismatch:selectedRecipe.nameMismatch+1},
 officialSource,selectedHistory,selectedCurrent),/mudou/,
 "Rejeitar evidência de fotografia incompatível com a contagem do painel");
assert.throws(()=>buildPilotSourceEvidenceReport(selectedRecipe,
 {...officialSource,use_stage:"commercial"},selectedHistory,selectedCurrent),/Fonte oficial/,
 "Não abrir fonte fora do piloto pessoal");
assert.throws(()=>buildPilotSourceEvidenceReport(selectedRecipe,
 {...officialSource,recipe_id:"other-recipe"},selectedHistory,selectedCurrent),/Fonte oficial/,
 "Não misturar fonte de outra receita");
assert.throws(()=>buildPilotSourceEvidenceReport(selectedRecipe,
 officialSource,selectedHistory,[...selectedCurrent,currentIngredients.at(-1)]),/outra receita/,
 "Não misturar ingredientes atuais de outra receita");
assert.throws(()=>buildPilotSourceEvidenceReport(selectedRecipe,
 officialSource,selectedHistory.slice(1),selectedCurrent),/mudou/,
 "A listagem histórica incompleta não pode ser exibida");
console.log("OK: evidências oficiais read-only por receita, sem inferência 1:N ou exibição de fotografia parcial.");

const mapping=buildEditorialMappingHints(evidence);
assert.equal(mapping.literalSplits.length,1,"Somente o desmembramento literal inequívoco gera hipótese");
assert.equal(mapping.literalSplits[0].historical_source,"pimenta. Molho: 4 tomates maduros");
assert.deepEqual(mapping.literalSplits[0].current_parts.map(part=>part.kind),["same_id","new_id"]);
assert.deepEqual(mapping.literalSplits[0].current_parts.map(part=>part.name),["pimenta","4 tomates maduros"]);
assert.equal(mapping.relocated.length,1,"Reordenação com texto preservado é listada separadamente");
assert.equal(mapping.relocated[0].source_text,"1 cebola");
assert.equal(mapping.unresolvedText.length,2,"Alterações não literais e ausências continuam pendentes");
assert.equal(mapping.stillUnlinked.length,0,"Novo ID contemplado permanece apenas como hipótese técnica");

assert.equal(buildEditorialMappingHints({
 ...evidence,official:{...evidence.official,original_ingredients:"1 cebola, azeite, sal"}
}).literalSplits.length,0,"Sem expressão na fonte oficial não há hipótese");

assert.equal(buildEditorialMappingHints({
 ...evidence,official:{...evidence.official,original_ingredients:
 "pimenta. Molho: 4 tomates maduros, pimenta. Molho: 4 tomates maduros"}
}).literalSplits.length,0,"Expressão duplicada na fonte impede hipótese");

assert.equal(buildEditorialMappingHints({
 ...evidence,untrackedCurrent:[...evidence.untrackedCurrent,
 {...evidence.untrackedCurrent[0],id:"duplicate-new",position:7}]
}).literalSplits.length,0,"Novo ingrediente com múltiplos IDs textualmente iguais é ambíguo");

assert.equal(buildEditorialMappingHints({
 ...evidence,untrackedCurrent:evidence.untrackedCurrent.map(row=>({...row,position:12}))
}).literalSplits.length,0,"Fragmentos não contíguos não são vinculados");

const annotated={
 official:{...officialSource,original_ingredients:"pimenta chili a gosto. Salada: 2 tomates"},
 historical:[{ingredient_id:"historic-annotated",source_text:"pimenta chili a gosto. Salada: 2 tomates",
  source_position:0,current_name:"pimenta chili a gosto",current_position:0,comparison:"name",review_status:"pending"}],
 untrackedCurrent:[{id:"new-annotated",recipe_id:"recipe-one",position:1,name:"2 tomates (salada)"}]
};
assert.equal(buildEditorialMappingHints(annotated).literalSplits.length,0,
 "Anotação editorial não literal requer revisão, jamais reconciliação automática");
assert.equal(buildEditorialMappingHints(annotated).stillUnlinked.length,1);
console.log("OK: mapa de hipóteses literais conservadoras sem vínculos 1:N persistidos nem aprovações.");


// A fila organiza as divergências já detectadas, sem alterar relações.
const queueRecipe=(recipe_id,changes={})=>({
 recipe_id,title:recipe_id,originalExpressions:2,currentIngredients:2,exact:2,
 nameMismatch:0,positionMismatch:0,bothMismatch:0,
 missingCurrent:0,untrackedCurrent:0,pending:0,...changes
});
const editorialFixtures=[
 queueRecipe("equal"),
 queueRecipe("position",{positionMismatch:2}),
 queueRecipe("text",{nameMismatch:1,positionMismatch:1}),
 queueRecipe("both",{bothMismatch:1}),
 queueRecipe("untracked",{untrackedCurrent:1,bothMismatch:1}),
 queueRecipe("missing",{missingCurrent:1,untrackedCurrent:1,nameMismatch:1})
];
assert.equal(classifyEditorialQueueRecipe(editorialFixtures[0]),null);
assert.equal(classifyEditorialQueueRecipe(editorialFixtures[1]),"position_only");
assert.equal(classifyEditorialQueueRecipe(editorialFixtures[2]),"text_change");
assert.equal(classifyEditorialQueueRecipe(editorialFixtures[3]),"text_change");
assert.equal(classifyEditorialQueueRecipe(editorialFixtures[4]),"untracked_current");
assert.equal(classifyEditorialQueueRecipe(editorialFixtures[5]),"source_gap");
const editorialQueue=summarizeEditorialQueue(editorialFixtures);
assert.equal(editorialQueue.entries.length,5,"Uma ocorrência por receita divergente");
assert.deepEqual(editorialQueue.counts,{
 source_gap:1,untracked_current:1,text_change:2,position_only:1
});
assert.deepEqual(filterEditorialQueue(editorialQueue.entries,"all","risk_first")
 .map(entry=>entry.recipe.recipe_id),["missing","untracked","text","both","position"]);
assert.deepEqual(filterEditorialQueue(editorialQueue.entries,"all","simplest_first")
 .map(entry=>entry.recipe.recipe_id),["position","both","text","untracked","missing"]);
assert.deepEqual(filterEditorialQueue(editorialQueue.entries,"text_change","risk_first")
 .map(entry=>entry.recipe.recipe_id),["text","both"]);
assert.equal(filterEditorialQueue(editorialQueue.entries,"source_gap","risk_first").length,1);
assert.equal(filterEditorialQueue(editorialQueue.entries,"position_only","risk_first").length,1);
assert.equal(editorialFixtures.length,6,"Inventário de entrada permanece intacto");
console.log("OK: fila editorial priorizada, filtros e ordenação sem aprovação ou vínculo.");


// Exportação privada: filtro, ordem, UTF-8/Excel e neutralização de fórmulas.
const csvFiltered=serializeEditorialQueueCsv(
 filterEditorialQueue(editorialQueue.entries,"position_only","risk_first")
);
assert.ok(csvFiltered.startsWith("\uFEFF"),"CSV inclui BOM para leitura em UTF-8");
assert.ok(csvFiltered.includes('"Prioridade editorial";"Receita";"ID da receita"'));
assert.ok(csvFiltered.includes('"Somente posição";"position";"position"'));
assert.equal(csvFiltered.trim().split("\r\n").length,2,
 "Exportação contém cabeçalho e somente a receita do filtro escolhido");
assert.ok(!csvFiltered.includes('"missing"'),"Outras categorias não vazam para o arquivo filtrado");
const hostileQueue=summarizeEditorialQueue([queueRecipe("excel",{
 title:" =2+2;\"teste\"\nlinha",nameMismatch:1
})]);
const hostileCsv=serializeEditorialQueueCsv(hostileQueue.entries);
assert.ok(hostileCsv.includes('"\' =2+2;""teste""\nlinha"'),
 "Aspas, delimitador e quebra de linha são preservados sem ativar fórmula");
assert.equal(hostileQueue.entries.length,1,"CSV não modifica a fila original");
console.log("OK: CSV da fila filtrada com BOM, escaping e proteção contra fórmulas.");
