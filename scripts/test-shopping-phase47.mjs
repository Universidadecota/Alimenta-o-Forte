import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

async function compile(relative){
 const result=await build({
  entryPoints:[fileURLToPath(new URL(relative,import.meta.url))],
  platform:"node",format:"esm",bundle:true,write:false,logLevel:"silent",outfile:"phase47.mjs",
  plugins:[{name:"supabase-stub",setup(setup){
   setup.onResolve({filter:/^\.\/supabase$/},()=>({path:"supabase",namespace:"stub"}));
   setup.onLoad({namespace:"stub",filter:/.*/},()=>({contents:"export const supabase=null;",loader:"js"}));
  }}]
 });
 return import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].contents).toString("base64"));
}
const {auditShoppingPrecision,precisionCounts}=await compile("../src/lib/shoppingPrecisionAudit.ts");
const {purchaseKey}=await compile("../src/lib/shoppingProgress.ts");
const {buildWeeklyPrintHtml}=await compile("../src/lib/weeklyPrint.ts");
const make=(sourceText,extra={})=>({
 name:"Piloto · "+sourceText,quantity:1,unit:"un",sourceText,
 sourceRecipes:["Receita A"],sourceExpressions:[sourceText],
 sourceRawFragments:[],requiresChoice:false,optionalSource:false,ambiguousSource:false,...extra
});
const tea=make("1 xícara de chá.",{quantity:2,sourceRecipes:["Receita A","Receita B"]});
const maionese=make("1 colher (sopa) de maionese caseira (receita abaixo)");
const ambiguity=make("2 colheres de azeite e água",{ambiguousSource:true,
 sourceRawFragments:["2 colheres de azeite e água"]});
const choice=make("1 colher (sopa) de banha de porco ou azeite",{requiresChoice:true});
const optional=make("1 ovo cozido (opcional)",{optionalSource:true});
const egg=make("3 ovos",{totalLabel:"16 ovos",quantity:6});
const yolk=make("1 gema");
const subjective=make("1 pitada de sal");
const noMeasure=make("pimenta a gosto");
const avocado=make("1 abacate maduro");
const onion=make("1 cebola");
const lemon=make("suco de 1 limão");
const tomato=make("1 tomate em cubos");
const coconut=make("1 xícara de leite de coco",{totalLabel:"1¼ xícaras de leite de coco",quantity:2,
 name:"Piloto · xicara|leite de coco · 2 usos · total 1.25"});
const olive=make("1 colher (sopa) de azeite",{totalLabel:"13 colheres (sopa) de azeite",quantity:10,
 name:"Piloto · colher-sopa|azeite · 10 usos · total 13"});
const pilot=[tea,maionese,ambiguity,choice,optional,egg,yolk,subjective,noMeasure,tomato,avocado,onion,lemon,coconut,olive];
const before=JSON.stringify(pilot);
const unresolved=auditShoppingPrecision(pilot,[]);
assert.deepEqual(precisionCounts(unresolved),{source:3,decision:2,quantity:3});
assert.deepEqual(unresolved.slice(0,3).map(x=>x.reason).sort(),["ambiguous","linkedRecipe","reference"],
 "Um texto sem produto, um preparo complementar e uma expressão ambígua exigem conferência prioritária");
assert.ok(unresolved.slice(0,3).every(x=>x.priority==="source"));
assert.ok(unresolved.slice(3,5).every(x=>x.priority==="decision"));
assert.equal(unresolved.find(x=>x.key===purchaseKey(tea))?.usages,2);
assert.deepEqual(unresolved.find(x=>x.key===purchaseKey(tea))?.recipes,["Receita A","Receita B"]);
assert.deepEqual(unresolved.find(x=>x.key===purchaseKey(ambiguity))?.originalFragments,
 ["2 colheres de azeite e água"]);
assert.match(unresolved.find(x=>x.reason==="egg")?.explanation??"",/não inclui automaticamente/);
assert.match(unresolved.find(x=>x.reason==="subjective")?.nextStep??"",/não atribuir uma conversão/);
assert.equal(unresolved.find(x=>x.key===purchaseKey(maionese))?.reason,"linkedRecipe");
assert.equal(unresolved.find(x=>x.key===purchaseKey(tea))?.reason,"reference");
assert.equal(unresolved.find(x=>x.key===purchaseKey(noMeasure))?.reason,"unmeasured");
assert.ok(!unresolved.some(x=>[yolk,tomato,avocado,onion,lemon].some(item=>x.key===purchaseKey(item))),
 "1 gema, 1 tomate, 1 abacate, 1 cebola e suco de 1 limão são quantidades literais, não faltas de quantidade");
assert.ok(!unresolved.some(x=>x.key===purchaseKey(coconut)||x.key===purchaseKey(olive)),
 "Somas literais já consolidadas não são marcadas como falta de quantidade");
const resolved=[
 {itemKey:purchaseKey(choice),kind:"choice",selection:"azeite"},
 {itemKey:purchaseKey(optional),kind:"optional",included:true}
];
assert.deepEqual(precisionCounts(auditShoppingPrecision(pilot,resolved)),
 {source:3,decision:0,quantity:3},"As decisões persistidas não são exibidas como pendentes");
assert.deepEqual(precisionCounts(auditShoppingPrecision(pilot,[resolved[0],{...resolved[1],included:false}])),
 {source:3,decision:0,quantity:3},"Um opcional recusado também foi decidido");
assert.deepEqual(precisionCounts(auditShoppingPrecision(pilot,[
 {itemKey:purchaseKey(tea),kind:"choice",selection:"outro item"}
])),{source:3,decision:2,quantity:3},"Não aceitar decisão de outro item");
assert.equal(JSON.stringify(pilot),before,"A triagem nunca modifica ingredientes, receitas ou quantidades");
const days=Array.from({length:7},(_,i)=>new Date(2026,10,2+i));
const pdf=buildWeeklyPrintHtml({
 kind:"shopping",days,plan:{},recipes:[],shopping:[],pilotShopping:pilot,
 notes:[],purchasedKeys:[purchaseKey(coconut),purchaseKey(olive)],
 decisions:resolved
});
assert.equal((pdf.match(/<span class="square">✓<\/span>/g)||[]).length,2,
 "Compras restauradas permanecem no HTML impresso");
assert.match(pdf,/Escolha registrada: azeite/);
assert.match(pdf,/Opcional incluído por decisão do usuário/);
assert.match(pdf,/1¼ xícaras de leite de coco/);
assert.match(pdf,/13 colheres \(sopa\) de azeite/);
const panel=readFileSync(fileURLToPath(new URL("../src/ShoppingPrecisionPanel.tsx",import.meta.url)),"utf8");
const parent=readFileSync(fileURLToPath(new URL("../src/ShoppingListSections.tsx",import.meta.url)),"utf8");
assert.match(panel,/auditShoppingPrecision\(items,decisions\)/);
assert.match(panel,/headings\[issue.reason\]/,"Cada pendência deve indicar seu motivo específico");
assert.match(panel,/aria-pressed=\{filter===option.id\}/);
assert.match(panel,/showAll\?selected:selected\.slice\(0,12\)/);
assert.match(panel,/Fonte:/);
assert.match(panel,/Nenhuma informação é alterada automaticamente/);
assert.match(parent,/<ShoppingPrecisionPanel items=\{pilotShopping\} decisions=\{decisions\}/);
assert.doesNotMatch(panel,/\.upsert\(|\.delete\(|\.insert\(|\.update\(|onSaveDecision/);
assert.doesNotMatch(parent,/\.from\("shopping_list_items"\)|\.upsert\(|\.delete\(/);
console.log("PASS F47: prioridades, decisões, rastreabilidade, segurança e impressão de compras intactas.");
