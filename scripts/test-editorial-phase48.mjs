import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const result=await build({
 entryPoints:[fileURLToPath(new URL("../src/lib/editorialSourceCases.ts",import.meta.url))],
 bundle:true,platform:"node",format:"esm",write:false,logLevel:"silent",outfile:"test48.mjs"
});
const {buildEditorialFindings}=await import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].contents).toString("base64"));
const recipe=(id,title,ingredients,instructions="Modo de preparo da fonte")=>({
 id,title,ingredients:ingredients.map(name=>({name,quantity:null,unit:"un"})),
 instructions,pilotSource:{sourceDocument:"Documento original.pdf",originalIngredients:ingredients.join(", "),ingredientsReviewed:false}
});
const salad=recipe("salada","Salada de ovos em canoas de endivia",[
 "3 ovos cozidos",
 "1 colher (sopa) de maionese caseira (receita abaixo)",
 "Maionese caseira (rende cerca de ½ xícara; a sobra dura 2 dias na geladeira): 1 gema em temperatura ambiente",
 "¼ de xícara de óleo de abacate"
],"Faça maionese com gema e óleo.");
const omelet=recipe("omelet","Omelete enrolada com nori, cebolinha e gergelim",["3 ovos","1 xícara de chá."],"Sirva com o chá.");
const wrap=recipe("wraps","Wraps de alface com ovos, bacon e abacate",["½ abacate","1 xícara de chá."],"Enrole e sirva com chá.");
const original=JSON.stringify([salad,omelet,wrap]);
const cases=buildEditorialFindings([salad,omelet,wrap]);
assert.equal(cases.length,3);
assert.deepEqual(cases.map(c=>c.id),["mayo-serving","mayo-preparation","tea-unspecified"]);
assert.deepEqual(cases.map(c=>c.evidence.length),[1,1,2]);
assert.deepEqual(cases[2].evidence.map(e=>e.recipeId),["omelet","wraps"]);
assert.match(cases[2].proposal,/tipo de chá não especificado/);
assert.match(cases[1].proposal,/segurança alimentar/);
assert.match(cases[1].caution,/Não confirmar como seguro/);
assert.match(cases[0].issue,/contagem duplicada/);
assert.deepEqual(cases[0].evidence[0].ingredient,salad.ingredients[1].name);
assert.equal(JSON.stringify([salad,omelet,wrap]),original,"Revisão editorial não pode alterar fonte.");
assert.equal(buildEditorialFindings([]).every(c=>c.evidence.length===0),true,"Ausência de fonte não vira afirmação aprovada.");
assert.equal(buildEditorialFindings([omelet]).find(c=>c.id==="mayo-serving")?.evidence.length,0);
const component=readFileSync(fileURLToPath(new URL("../src/AdminEditorialF48.tsx",import.meta.url)),"utf8");
const app=readFileSync(fileURLToPath(new URL("../src/App.tsx",import.meta.url)),"utf8");
assert.match(app,/page==="Administração"&&isAdmin&&<><AdminEditorialF48/);
assert.match(component,/buildEditorialFindings\(recipes\)/);
assert.match(component,/Aprovação editorial pendente/);
assert.match(component,/Abrir receita cadastrada/);
assert.match(component,/Copiar parecer para revisão/);
assert.match(component,/item.evidence.length===0/);
assert.doesNotMatch(component,/\.from\(|\.insert\(|\.delete\(|\.update\(|\.upsert\(|\.rpc\(/);
assert.doesNotMatch(component,/localStorage|sessionStorage/);
console.log("PASS F48: 3 referências rastreáveis, propostas não aprovadas, sem alteração e UI apenas admin.");
