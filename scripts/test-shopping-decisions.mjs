import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

async function compile(relative){
 const result=await build({
  entryPoints:[fileURLToPath(new URL(relative,import.meta.url))],
  bundle:true,platform:"node",format:"esm",write:false,logLevel:"silent",outfile:"test.mjs",
  plugins:[{name:"supabase-stub",setup(setup){
   setup.onResolve({filter:/^\.\/supabase$/},()=>({path:"supabase",namespace:"stub"}));
   setup.onLoad({namespace:"stub",filter:/.*/},()=>({contents:"export const supabase = null;",loader:"js"}));
  }}]
 });
 return import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].contents).toString("base64"));
}
const {decisionKind,validateShoppingDecision,decisionDescription}=await compile("../src/lib/shoppingDecisions.ts");
const {purchaseKey}=await compile("../src/lib/shoppingProgress.ts");
const {buildWeeklyPrintHtml}=await compile("../src/lib/weeklyPrint.ts");
const base=(sourceText,kind)=>({
 name:"Piloto · "+sourceText,quantity:1,unit:"un",sourceText,
 sourceRecipes:["Receita A"],sourceExpressions:[sourceText],sourceRawFragments:[],
 requiresChoice:kind==="choice",optionalSource:kind==="optional",ambiguousSource:false
});
const choice=base("1 colher de azeite ou banha","choice");
const optional=base("1 ovo cozido (opcional)","optional");
const unchanged=JSON.stringify([choice,optional]);
const chosen={itemKey:purchaseKey(choice),kind:"choice",selection:"azeite"};
const included={itemKey:purchaseKey(optional),kind:"optional",included:true};
const skipped={...included,included:false};
assert.equal(decisionKind(choice),"choice");
assert.equal(decisionKind(optional),"optional");
assert.doesNotThrow(()=>validateShoppingDecision(choice,chosen));
assert.doesNotThrow(()=>validateShoppingDecision(optional,included));
assert.throws(()=>validateShoppingDecision(choice,{...chosen,selection:" "}));
assert.throws(()=>validateShoppingDecision(choice,{...chosen,itemKey:purchaseKey(optional)}));
assert.throws(()=>validateShoppingDecision(optional,chosen));
assert.match(decisionDescription(choice,[]),/Pendente/);
assert.match(decisionDescription(choice,[chosen]),/azeite/);
assert.match(decisionDescription(optional,[included]),/incluído/);
assert.match(decisionDescription(optional,[skipped]),/não incluído/);
const dates=Array.from({length:7},(_,i)=>new Date(2026,10,2+i));
const html=buildWeeklyPrintHtml({
 kind:"shopping",days:dates,plan:{},recipes:[],shopping:[],
 pilotShopping:[choice,optional],notes:[],purchasedKeys:[],decisions:[chosen,skipped]
});
assert.match(html,/Escolha registrada: azeite/);
assert.match(html,/Opcional não incluído/);
assert.match(html,/Decidido/);
assert.match(html,/1 colher de azeite ou banha/);
assert.doesNotMatch(html,/undefined|NaN/);
const attack={...chosen,selection:'<img src=x onerror="alert(1)">'};
const escaped=buildWeeklyPrintHtml({
 kind:"shopping",days:dates,plan:{},recipes:[],shopping:[],
 pilotShopping:[choice],notes:[],purchasedKeys:[],decisions:[attack]
});
assert.doesNotMatch(escaped,/<img src=x onerror/);
assert.match(escaped,/&lt;img src=x/);
assert.equal(JSON.stringify([choice,optional]),unchanged,"Decidir não modifica as receitas ou a lista original");
const panel=readFileSync(fileURLToPath(new URL("../src/ShoppingDecisionsPanel.tsx",import.meta.url)),"utf8");
assert.match(panel,/<button type="button" className="cc-shopping-decision-tag cc-shopping-decision-toggle"/);
assert.match(panel,/aria-expanded=\{editing\} onClick=\{\(\)=>setEditing\(open=>!open\)\}/);
assert.match(panel,/kind==="choice"&&editing&&<form/);
assert.match(panel,/kind==="optional"&&editing&&<>/);
assert.match(panel,/Salvar escolha/);
assert.match(panel,/Não incluir/);
assert.match(panel,/Limpar decisão/);
const sql=readFileSync(fileURLToPath(new URL("../supabase/migrations/20261101183756_cc_shopping_decisions_phase45.sql",import.meta.url)),"utf8");
assert.match(sql,/enable row level security/i);
assert.match(sql,/revoke all on table public\.cc_shopping_decisions from public,anon,authenticated/i);
assert.match(sql,/auth\.uid\(\)\)=user_id/i);
assert.doesNotMatch(sql,/grant\s+\w+\s+on\s+public\.cc_shopping_decisions\s+to\s+anon/i);
console.log("PASS fase45: escolhas, opcionais, isolamento, PDF, XSS e migração.");
