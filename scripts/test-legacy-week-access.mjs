import assert from "node:assert/strict";
import {build} from "esbuild";
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
async function importPure(entry){
 const result=await build({
  entryPoints:[fileURLToPath(new URL(entry,import.meta.url))],
  bundle:true,platform:"node",format:"esm",write:false,logLevel:"silent",outfile:"fixture.mjs",
  plugins:[{name:"supabase-stub",setup(ctx){
   ctx.onResolve({filter:/^\.\/supabase$/},()=>({path:"supabase",namespace:"test-stub"}));
   ctx.onLoad({filter:/.*/,namespace:"test-stub"},()=>({contents:"export const supabase=null;",loader:"js"}));
  }}]
 });
 return import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].contents).toString("base64"));
}
const {unavailableMainMeals,editableWeekDraft,readableWeekError}=await importPure("../src/lib/legacyWeekAccess.ts");
const planner=await importPure("../src/lib/planner.ts");
const dates=Array.from({length:7},(_,i)=>new Date(2026,9,26+i,12));
const day=planner.dateKey(dates[0]);
const recipe={id:"available",title:"Ovo",category:"Café da manhã",ingredients:[{name:"ovo",quantity:2,unit:"un"}],minutes:10,servings:1,description:null,instructions:null,imageUrl:null,ownerId:null,imageIsAi:false};
const current={
 [day]:{
  "Café da manhã":{id:"old-private",servings:2,locked:true},
  "Almoço":{id:"old-private-2",servings:2,locked:false},
  "Jantar":{id:"available-dinner",servings:2,locked:true},
  "Lanche da tarde":{id:"optional-original",servings:2,locked:true}
 }
};
const dinner={...recipe,id:"available-dinner",category:"Jantar"};
const old=JSON.stringify(current);
const missing=unavailableMainMeals(current,[recipe,dinner],dates);
assert.equal(missing.length,2);
assert.equal(missing.filter(x=>x.locked).length,1);
const draft=editableWeekDraft(current,missing);
assert.equal(draft[day]["Café da manhã"],undefined);
assert.equal(draft[day]["Almoço"],undefined);
assert.deepEqual(draft[day]["Jantar"],current[day]["Jantar"]);
assert.deepEqual(draft[day]["Lanche da tarde"],current[day]["Lanche da tarde"]);
assert.equal(JSON.stringify(current),old,"O plano original não pode ser mutado antes da confirmação.");
assert.deepEqual(unavailableMainMeals(current,[recipe,dinner,{...recipe,id:"old-private"},{...dinner,id:"old-private-2"}],dates),[]);
assert.match(readableWeekError({code:"P0001",message:"Receita indisponível para este usuário"}),/não está mais disponível/);
assert.match(readableWeekError({message:"Cardápio alterado em outra sessão."}),/outra sessão/);
assert.match(readableWeekError({message:"Uma escolha fixada mudou."}),/fixada/);
assert.match(readableWeekError({code:"42501",message:"Acesso negado"}),/Acesso negado/);
assert.doesNotMatch(readableWeekError({code:"P0001",message:"Receita indisponível para este usuário"}),/Falha de conexão/);
const sql=readFileSync(new URL("../supabase/migrations/20261030173200_cc_replace_week_main_meals_v2_legacy_access.sql",import.meta.url),"utf8");
assert.match(sql,/CREATE OR REPLACE FUNCTION public\.cc_replace_week_main_meals_v2\(/);
assert.match(sql,/p_release_unavailable_locks boolean/);
assert.match(sql,/coalesce\(p_release_unavailable_locks,false\)/);
assert.match(sql,/not exists\s*\(\s*select 1 from public\.recipes/);
assert.match(sql,/Uma escolha fixada mudou/);
assert.match(sql,/v_actual<>p_expected/);
assert.match(sql,/public\.cc_allergy_candidate_ids/);
assert.match(sql,/ON CONFLICT\(meal_plan_id,meal_date,slot\)/i);
assert.match(sql,/is_locked=case/i);
assert.match(sql,/REVOKE ALL ON FUNCTION public\.cc_replace_week_main_meals_v2/);
assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.cc_replace_week_main_meals_v2.*TO authenticated/i);
assert.doesNotMatch(sql,/\bDELETE FROM\b|\bDROP TABLE\b|\bUPDATE public\.recipes\b/i);
const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
assert.match(app,/const missing=unavailableMainMeals\(plan,recipes,days\)/);
assert.match(app,/editableWeekDraft\(plan,missing\)/);
assert.match(app,/missingLocked>0/);
assert.match(app,/const detail=readableWeekError\(err\)/);
assert.match(app,/ATENÇÃO:/);
const api=readFileSync(new URL("../src/lib/planner.ts",import.meta.url),"utf8");
assert.match(api,/rpc\("cc_replace_week_main_meals_v2"/);
assert.match(api,/p_release_unavailable_locks:allowReleaseUnavailableLocks/);
console.log("OK: legado inacessível identificado, fixos válidos preservados, consentimento exigido e mensagem real sem gravação.");
