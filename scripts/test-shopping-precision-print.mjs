import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

async function compile(relative){
 const result=await build({
  entryPoints:[fileURLToPath(new URL(relative,import.meta.url))],
  platform:"node",format:"esm",bundle:true,write:false,logLevel:"silent",outfile:"isolated.mjs",
  plugins:[{name:"supabase-only-stub",setup(setup){
   setup.onResolve({filter:/^\.\/supabase$/},()=>({path:"supabase",namespace:"stub"}));
   setup.onLoad({namespace:"stub",filter:/.*/},()=>({contents:"export const supabase=null;",loader:"js"}));
  }}]
 });
 return import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].contents).toString("base64"));
}
const {groupShoppingForReview,shoppingReviewReason,isIncompletePilotReference,
 isSubjectiveOriginalMeasure,hasSeparateEggPreparations}=await compile("../src/lib/shoppingReviewGroups.ts");
const {buildWeeklyPrintHtml}=await compile("../src/lib/weeklyPrint.ts");
const base=(name,sourceText,totalLabel,flags={})=>({
 name,sourceText,totalLabel,quantity:1,unit:"un",
 sourceRecipes:["Receita A"],sourceExpressions:[sourceText],sourceRawFragments:[],
 requiresChoice:false,optionalSource:false,ambiguousSource:false,...flags
});
const coconut=base("Piloto · xicara|leite de coco · 2 usos · total 1.25","1 xícara de leite de coco","1¼ xícaras de leite de coco");
coconut.quantity=2;coconut.sourceRecipes=["Receita A","Receita B"];
const egg=base("Piloto · un-ovo · 6 usos · total 16","3 ovos","16 ovos");egg.quantity=6;
const cooked=base("Piloto · 1 ovo cozido","1 ovo cozido",undefined);
const yolk=base("Piloto · 1 gema","1 gema",undefined);
const tea=base("Piloto · xicara|cha · 2 usos","1 xícara de chá.","2 xícaras de chá");
tea.quantity=2;
const pinch=base("Piloto · pitada|sal · 2 usos","1 pitada de sal","2 pitadas de sal");pinch.quantity=2;
const handful=base("Piloto · punhado|rúcula · 2 usos","2 punhados de rúcula","4 punhados de rúcula");handful.quantity=2;
const choice=base("Piloto · vinho ou suco","vinho ou suco",undefined,{requiresChoice:true,quantity:2,sourceRecipes:["Receita A","Receita B"]});
const optional=base("Piloto · pimenta opcional","pimenta opcional",undefined,{optionalSource:true});
const unclear=base("Piloto · colher receita","1 colher (sopa)",undefined);
const pilot=[coconut,egg,cooked,yolk,tea,pinch,handful,choice,optional,unclear];
const before=JSON.stringify(pilot);
const group=groupShoppingForReview([],pilot,[]);
assert.deepEqual(group.consolidatedOriginal,[coconut],"Leite de coco permanece consolidado");
assert.deepEqual(group.needsChecking,[egg,cooked,yolk,pinch,handful],"Ovos e medidas subjetivas exigem conferência");
assert.deepEqual(group.incompleteReference,[tea,unclear],"Xícara genérica de chá não é produto identificado");
assert.deepEqual(group.choicesAndOptional,[choice,optional]);
assert.equal([...group.consolidatedOriginal,...group.needsChecking,
 ...group.incompleteReference,...group.choicesAndOptional].length,pilot.length);
assert.equal(JSON.stringify(pilot),before,"Agrupamento jamais altera dados");
assert.match(shoppingReviewReason(egg,pilot),/Subtotal de ovos/);
assert.equal(hasSeparateEggPreparations(egg,[egg]),false,"Ovos simples sem outro preparo seguem consolidáveis");
assert.equal(hasSeparateEggPreparations(egg,pilot),true);
assert.match(shoppingReviewReason(pinch,pilot),/medida subjetiva/);
assert.equal(isSubjectiveOriginalMeasure(handful),true);
assert.equal(isIncompletePilotReference(tea),true);
assert.equal(isIncompletePilotReference({sourceText:"1 xícara de chá verde"}),false);
assert.equal(isIncompletePilotReference(coconut),false);
assert.deepEqual(groupShoppingForReview([], [coconut,egg], []).consolidatedOriginal,[coconut,egg],
 "Sem gema ou ovo preparado, subtotal literal de ovos pode permanecer consolidado");
const html=buildWeeklyPrintHtml({
 kind:"shopping",days:[],plan:{},recipes:[],
 shopping:[],pilotShopping:pilot,notes:[],purchasedKeys:[]
});
assert.match(html,/<h2>Conferir antes de comprar<\/h2>/);
assert.match(html,/16 ovos/);
assert.match(html,/Subtotal de ovos/);
assert.match(html,/2 xícaras de chá/);
assert.match(html,/Referências incompletas/);
assert.match(html,/<div class="cc-print-decisions">/);
assert.match(html,/<span class="cc-print-tag">Escolher opção<\/span>/);
assert.match(html,/Em: Receita A; Receita B/);
assert.match(html,/cc-print-decision/);
assert.match(html,/<body class="shopping">/);
assert.doesNotMatch(html,/\bNaN\b/);
const stylesheet=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
const screen=readFileSync(new URL("../src/ShoppingListSections.tsx",import.meta.url),"utf8");
assert.match(stylesheet,/\.cc-shopping-decision-body\{display:grid/);
assert.match(stylesheet,/overflow-wrap:anywhere/);
assert.match(screen,/cc-shopping-decision-title/);
assert.match(screen,/cc-shopping-decision-origin/);
assert.match(screen,/cc-shopping-decision-tag/);
assert.match(screen,/purchaseKey\(item\)/);
assert.doesNotMatch(screen,/\.from\("shopping_list_items"\)|\.upsert\(|\.delete\(/);
console.log("OK: 3 categorias, ovos, chá genérico, medidas subjetivas, PDF e preservação do item comprado.");
