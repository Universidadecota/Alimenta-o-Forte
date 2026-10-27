import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {build} from "esbuild";
import {fileURLToPath} from "node:url";

const root=new URL("../",import.meta.url);
const app=readFileSync(new URL("src/App.tsx",root),"utf8");
const planner=readFileSync(new URL("src/lib/planner.ts",root),"utf8");
const migration=readFileSync(new URL("supabase/migrations/20261027200000_cc_weekly_manual_pins_beta.sql",root),"utf8");
const result=await build({
 entryPoints:[fileURLToPath(new URL("src/lib/suggestions.ts",root))],
 bundle:true,platform:"node",format:"esm",write:false,logLevel:"silent",outfile:"test-weekly-pins.mjs",
 plugins:[{name:"supabase-stub",setup(context){
  context.onResolve({filter:/^\.\/supabase$/},()=>({path:"supabase",namespace:"test-stub"}));
  context.onLoad({filter:/.*/,namespace:"test-stub"},()=>({contents:"export const supabase=null;",loader:"js"}));
 }}]
});
const {proposeWeek,defaultPreferences}=await import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].contents).toString("base64"));
const slots=["Café da manhã","Almoço","Jantar"];
const kinds=["Café da manhã","Almoço","Jantar"];
const recipes=kinds.flatMap((category,i)=>[1,2].map(j=>({
 id:`${i}-${j}`,title:`Receita ${i}-${j}`,category,ingredients:[{name:"tomate"}],
 minutes:10,servings:2,pilotSource:undefined
})));
const days=Array.from({length:7},(_,i)=>new Date(2026,9,26+i,12));
const key=day=>[day.getFullYear(),String(day.getMonth()+1).padStart(2,"0"),String(day.getDate()).padStart(2,"0")].join("-");
const current={
 [key(days[0])]:{"Almoço":{id:"1-1",servings:5,locked:true},"Jantar":{id:"2-1",servings:2,locked:false}},
 [key(days[1])]:{"Café da manhã":{id:"0-2",servings:2,locked:true}}
};
const next=proposeWeek(recipes,defaultPreferences,days,current);
assert.deepEqual(next[key(days[0])]["Almoço"],current[key(days[0])]["Almoço"],"Escolha fixa e porções não podem mudar");
assert.deepEqual(next[key(days[1])]["Café da manhã"],current[key(days[1])]["Café da manhã"]);
assert.equal(next[key(days[0])]["Jantar"].locked,false,"Sugestões são renováveis");
assert.notEqual(next[key(days[0])]["Jantar"].id,"2-1","Uma sugestão deve ser substituída quando há alternativa");
assert.equal(days.reduce((sum,d)=>sum+slots.filter(slot=>Boolean(next[key(d)]?.[slot]?.id)).length,0),21);

const allLocked=Object.fromEntries(days.map(day=>[key(day),Object.fromEntries(slots.map((slot,i)=>[slot,{id:recipes[i*2].id,servings:3,locked:true}]))]));
const allPreserved=proposeWeek([],defaultPreferences,days,allLocked);
assert.deepEqual(allPreserved,allLocked,"Semana inteiramente fixada não necessita de receitas elegíveis");

const allergyPrefs={...defaultPreferences,allergies:["soja"]};
const candidates=new Set(recipes.map(recipe=>recipe.id).filter(id=>id!=="1-1"));
const allergyProposal=proposeWeek(recipes,allergyPrefs,days,current,candidates);
assert.equal(allergyProposal[key(days[0])]["Almoço"].id,"1-1","Escolha manual permanece identificada como não verificada");
for(const day of days)for(const slot of slots)if(!allergyProposal[key(day)][slot].locked){
 assert.ok(candidates.has(allergyProposal[key(day)][slot].id),"Sugestões automáticas devem passar pela triagem");
}

assert.match(migration,/add column if not exists is_locked boolean not null default false/i);
assert.match(migration,/current_meal\.is_locked/);
assert.match(migration,/coalesce\(existing\.is_locked,false\)/);
assert.match(migration,/security invoker/i);
assert.doesNotMatch(migration,/do update set [^;]*is_locked\s*=/i);
assert.match(planner,/is_locked:true/);
assert.match(planner,/\.select\("meal_date,slot,recipe_id,servings,is_locked"\)/);
assert.match(app,/cardFavoritesOnly/);
assert.match(app,/setMealLocked\(/);
assert.match(app,/"Liberar"|Fixada · Liberar/);
assert.match(app,/\.filter\(r=>!cardFavoritesOnly\|\|favoriteIds\.has\(r\.id\)\|\|r\.id===current\?\.id\)/);
console.log("OK: favoritos no cardápio, escolhas manuais fixadas, renovação parcial e alerta de alergias preservados.");
