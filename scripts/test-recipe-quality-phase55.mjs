import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const read=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
const entry=fileURLToPath(new URL("../src/lib/recipeQualityAudit.ts",import.meta.url));
const compiled=await build({entryPoints:[entry],bundle:true,format:"esm",platform:"node",write:false,logLevel:"silent",outfile:"audit.mjs"});
const {summarizeRecipeQuality}=await import("data:text/javascript;base64,"+Buffer.from(compiled.outputFiles[0].contents).toString("base64"));

const i=(name,quantity=null,mode="unspecified")=>({name,quantity,unit:"un",measure_mode:mode,is_optional:false});
const recipe=(id,title,items,extra={})=>({id,title,published:false,description:"Descrição adequada",instructions:"Preparo escrito em etapas completas",prep_minutes:25,servings:2,recipe_ingredients:items,...extra});
const recipes=[
 recipe("pilot-a","Piloto A",[i("1 xícara de aveia"),i("2 ovos")]),
 recipe("pilot-b","Piloto B",[i("1 colher sopa de azeite")]),
 recipe("tea","Chá",[i("Cúrcuma",1,"measured"),i("A gosto",null,"taste"),i("Leite",null)]),
 recipe("meal","Refeição",[i("Feijão",1,"measured")],{published:true}),
 recipe("bad","Aferição inconsistente",[i("Arroz",null,"measured")],{instructions:""})
];
const sources=[
 {recipe_id:"pilot-a",ingredient_review_status:"needs_structuring",commercial_rights_status:"pending_review"},
 {recipe_id:"pilot-b",ingredient_review_status:"structured_confirmed",commercial_rights_status:"cleared"}
];
const audit=summarizeRecipeQuality(recipes,sources);
assert.equal(audit.total,5);
assert.equal(audit.pilot,2);
assert.equal(audit.other,3);
assert.equal(audit.pilotNeedsMeasures,1);
assert.equal(audit.pilotRightsPending,1);
assert.equal(audit.published,1);
assert.equal(audit.nonpilotUnquantifiedIngredients,2);
assert.equal(audit.nonpilotStrictMeasureErrors,1);
assert.equal(audit.attention.length,2);
assert.deepEqual(audit.attention.map(x=>x.title),["Aferição inconsistente","Chá"]);
assert.match(audit.attention.find(x=>x.id==="tea").reasons.join(" "),/1 ingrediente/);
assert.ok(!audit.attention.some(x=>x.id.startsWith("pilot")));
assert.ok(!audit.attention.some(x=>x.id==="meal"));
assert.ok(!audit.attention.find(x=>x.id==="tea").reasons.some(x=>x.includes("medida(s) marcadas")));
assert.equal(recipes[0].recipe_ingredients[0].quantity,null,"Auditoria nao altera quantidades");

const app=read("../src/AdminRecipes.tsx");
assert.match(app,/summarizeRecipeQuality\(rows,pilotSourceReviews\)/);
assert.match(app,/recipe_id,ingredient_review_status,commercial_rights_status/);
assert.match(app,/Qualidade das receitas · conferência editorial/);
assert.match(app,/Somente leitura/);
assert.match(app,/Ver receitas a conferir/);
assert.match(app,/Este resumo separa o acervo piloto/);
assert.doesNotMatch(read("../src/lib/recipeQualityAudit.ts"),/supabase\.|\.insert\(|\.upsert\(|\.delete\(|\.update\(/);
assert.match(read("../src/styles.css"),/\.cc-quality-audit-grid\{display:grid/);
console.log("PASS F55: piloto preservado, pendencias nao-piloto identificadas, resumo read-only e layout editorial.");
