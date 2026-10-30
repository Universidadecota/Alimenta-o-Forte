import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const transpile=(path)=>ts.transpileModule(
 readFileSync(new URL(path,import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const asUrl=(code)=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const traceUrl=asUrl(transpile("../src/lib/pilotSourceLiteralTrace.ts"));
const focusCode=transpile("../src/lib/pilotSourceEditorialFocus.ts")
 .replace(/from ["']\.\/pilotSourceLiteralTrace["']/,()=> 'from "'+traceUrl+'"');
const {buildSourceEditorialFocus}=await import(asUrl(focusCode));
const makeRow=(id,name,position)=>({id,recipe_id:"test-recipe",name,position});

const report={
 official:{original_ingredients:"Molho: maionese com 1 gema, pimenta, sal. Salada: 2 tomates, pimenta."},
 historical:[],
 untrackedCurrent:[
  makeRow("a","2 tomates (salada)",0),
  makeRow("b","pimenta",1),
  makeRow("c","cebola (acompanhamento)",2),
  makeRow("d","sal",3)
 ]
};
const result=buildSourceEditorialFocus(report);
assert.equal(result.recipeRequiresEggSauceReview,true,"Gema em molho de maionese sinaliza conferência");
assert.deepEqual(result.cases.map(entry=>entry.ingredient.id),["c","b","a"],
 "Sem trecho, texto repetido e anotação contextual priorizados nessa ordem");
assert.deepEqual(result.cases.map(entry=>entry.status),["not_found","ambiguous","annotated"]);
assert.ok(result.cases.every(entry=>entry.requiresSafetyContext));
assert.equal(result.cases[2].matchedFragment,"2 tomates");
assert.equal(result.cases.some(entry=>entry.ingredient.id==="d"),false,
 "Texto literal único é excluído da fila focada");
assert.equal(report.untrackedCurrent.length,4,"Entradas originais preservadas");
assert.equal(buildSourceEditorialFocus({...report,official:{original_ingredients:"1 gema, pimenta"}})
 .recipeRequiresEggSauceReview,false,"Gema isolada não basta para inferir molho");
assert.equal(buildSourceEditorialFocus({...report,official:{original_ingredients:"Molho Caesar: 1 gema, pimenta"}})
 .recipeRequiresEggSauceReview,true,"Molho Caesar com gema também sinaliza revisão");
const noDiscrepancies=buildSourceEditorialFocus({
 official:{original_ingredients:"Molho: azeite e sal"},historical:[],
 untrackedCurrent:[makeRow("e","azeite",0)]
});
assert.equal(noDiscrepancies.cases.length,0);
assert.equal(noDiscrepancies.recipeRequiresEggSauceReview,false);
console.log("OK: triagem editorial priorizada, alerta de revisão de gema, casos literais excluídos e sem gravações.");
