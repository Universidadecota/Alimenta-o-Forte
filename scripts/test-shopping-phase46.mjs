import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

async function compile(relative){
 const result=await build({
  entryPoints:[fileURLToPath(new URL(relative,import.meta.url))],
  platform:"node",format:"esm",bundle:true,write:false,logLevel:"silent",outfile:"phase46.mjs",
  plugins:[{name:"supabase-stub",setup(setup){
   setup.onResolve({filter:/^\.\/supabase$/},()=>({path:"supabase",namespace:"stub"}));
   setup.onLoad({namespace:"stub",filter:/.*/},()=>({contents:"export const supabase=null;",loader:"js"}));
  }}]
 });
 return import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].contents).toString("base64"));
}
const {recurringIngredientReviews}=await compile("../src/lib/recurringIngredientReview.ts");
const {buildWeeklyPrintHtml}=await compile("../src/lib/weeklyPrint.ts");
const {purchaseKey}=await compile("../src/lib/shoppingProgress.ts");
const item=(raw,totalLabel,extra={})=>({
 name:"Piloto · "+raw,sourceText:raw,totalLabel,quantity:1,unit:"un",
 sourceExpressions:[raw],sourceRawFragments:[],sourceRecipes:["Receita A"],
 requiresChoice:false,optionalSource:false,ambiguousSource:false,...extra
});
const eggs=item("3 ovos","16 ovos",{quantity:6});
const yolk=item("1 gema",undefined);
const cooked=item("1 ovo cozido",undefined);
const tomato=item("1 tomate","3 tomates",{quantity:3});
const slicedTomato=item("½ tomate fatiado",undefined);
const cucumber=item("½ pepino",undefined);
const cucumber2=item("½ pepino em cubos",undefined);
const onion=item("1 cebola",undefined);
const redOnion=item("¼ de cebola roxa",undefined);
const coconut=item("1 xícara de leite de coco","1¼ xícaras de leite de coco",{quantity:2,
 name:"Piloto · xicara|leite de coco · 2 usos · total 1.25"});
const oil=item("1 colher (sopa) de azeite","13 colheres (sopa) de azeite",{quantity:10,
 name:"Piloto · colher-sopa|azeite · 10 usos · total 13"});
const oilTea=item("1 colher (chá) de azeite","2 colheres (chá) de azeite",{quantity:2});
const oilChoice=item("1 colher (sopa) de banha de porco ou azeite",undefined,{requiresChoice:true});
const optional=item("1 ovo cozido (opcional)",undefined,{optionalSource:true});
const incomplete=item("1 xícara de chá.",undefined);
const pilot=[eggs,yolk,cooked,tomato,slicedTomato,cucumber,cucumber2,
 onion,redOnion,coconut,oil,oilTea,oilChoice,optional,incomplete];
const immutable=JSON.stringify(pilot);
const reviews=recurringIngredientReviews(pilot);
assert.deepEqual(reviews.map(x=>x.id),["azeite","ovos","pepino","tomate"]);
assert.deepEqual(reviews.find(x=>x.id==="ovos")?.variants.map(x=>x.description),
 ["16 ovos","1 gema","1 ovo cozido"]);
assert.deepEqual(reviews.find(x=>x.id==="azeite")?.variants.map(x=>x.description),
 ["13 colheres (sopa) de azeite","2 colheres (chá) de azeite"]);
assert.equal(reviews.some(x=>x.id==="cebola"||x.id==="cebola-roxa"),false,
 "Cebola comum e roxa não podem ser somadas nem fundidas");
assert.equal(reviews.some(x=>x.id==="coco"),false);
assert.equal(reviews.some(x=>x.id==="cha"),false);
assert.equal(JSON.stringify(pilot),immutable,"Quaisquer conferências não alteram receitas nem chaves");
const dates=Array.from({length:7},(_,i)=>new Date(2026,10,2+i));
const html=buildWeeklyPrintHtml({
 kind:"shopping",days:dates,plan:{},recipes:[],shopping:[],
 pilotShopping:pilot,notes:[],
 purchasedKeys:[purchaseKey(coconut),purchaseKey(oil)],
 decisions:[],
});
assert.match(html,/Conferência de apresentações distintas/);
assert.match(html,/Ovos, claras e gemas \(3\)/);
assert.match(html,/Azeite \(2\)/);
assert.match(html,/Não somar automaticamente/);
assert.match(html,/1¼ xícaras de leite de coco/);
assert.match(html,/13 colheres \(sopa\) de azeite/);
assert.equal((html.match(/<span class="square">✓<\/span>/g)||[]).length,2,
 "Leite de coco e azeite continuam marcados no documento");
assert.match(html,/Em: Receita A/,"Rastreabilidade permanece na impressão");
const sheet=readFileSync(fileURLToPath(new URL("../src/ShoppingListSections.tsx",import.meta.url)),"utf8");
assert.match(sheet,/<details className="cc-quantity-review"/);
assert.match(sheet,/recurringIngredientReviews\(pilotShopping\)/);
assert.match(sheet,/As entradas completas continuam nas seções abaixo/);
const printer=readFileSync(fileURLToPath(new URL("../src/lib/weeklyPrint.ts",import.meta.url)),"utf8");
assert.match(printer,/@page\{size:A4;margin:13mm 14mm\}/,"Outras exportações preservam margem A4");
assert.match(printer,/Fase 46: impressão mais compacta/);
assert.match(printer,/\.shopping \.item\{padding:2px 0/);
assert.doesNotMatch(printer,/\.shopping\s*\{[^}]*break-before:/);
assert.doesNotMatch(sheet,/\.from\("shopping_list_items"\)|\.upsert\(|\.delete\(/);
console.log("PASS fase46: grupos recorrentes sem soma, dados intactos e impressão compacta com compras preservadas.");
