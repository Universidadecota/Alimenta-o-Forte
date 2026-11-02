import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const built=await build({
 entryPoints:[fileURLToPath(new URL("../src/lib/profilePreferences.ts",import.meta.url))],
 bundle:true,format:"esm",platform:"node",write:false,logLevel:"silent",outfile:"test50.mjs"
});
const model=await import("data:text/javascript;base64,"+Buffer.from(built.outputFiles[0].contents).toString("base64"));
const {allergiesChanged,normalizeProfilePreferences,preferencesEqual,validateProfilePreferences,profileChoices}=model;
const baseline=normalizeProfilePreferences({
 goal:"eat_better",liked_foods:["Frutas","Verduras"],disliked_foods:["Peixe"],
 allergies:["Leite"],household_size:2,cooking_minutes:40
});
assert.equal(validateProfilePreferences(baseline),null);
assert.ok(preferencesEqual(baseline,normalizeProfilePreferences({...baseline,liked_foods:["Verduras","Frutas"]})));
assert.equal(allergiesChanged(baseline,normalizeProfilePreferences({...baseline,allergies:["Leite"]})),false);
assert.equal(allergiesChanged(baseline,normalizeProfilePreferences({...baseline,allergies:["Glúten","Leite"]})),true);
assert.equal(allergiesChanged(baseline,normalizeProfilePreferences({...baseline,allergies:[]})),true);
assert.equal(validateProfilePreferences({...baseline,household_size:0}).includes("1 a 20"),true);
assert.equal(validateProfilePreferences({...baseline,household_size:21}).includes("1 a 20"),true);
assert.equal(validateProfilePreferences({...baseline,household_size:2.5}).includes("1 a 20"),true);
assert.equal(validateProfilePreferences({...baseline,cooking_minutes:4}).includes("5 e 360"),true);
assert.equal(validateProfilePreferences({...baseline,cooking_minutes:361}).includes("5 e 360"),true);
assert.match(validateProfilePreferences({...baseline,goal:"invalid"}),/objetivo/);
assert.equal(normalizeProfilePreferences({household_size:undefined,cooking_minutes:undefined}).household_size,1);
assert.equal(normalizeProfilePreferences({household_size:undefined,cooking_minutes:undefined}).cooking_minutes,40);
assert.deepEqual(profileChoices(["Leite"],["Ingrediente personalizado"]),["Leite","Ingrediente personalizado"]);
assert.deepEqual(normalizeProfilePreferences({...baseline,allergies:[" Leite ","Leite"]}).allergies,["Leite"]);
const app=readFileSync(fileURLToPath(new URL("../src/App.tsx",import.meta.url)),"utf8");
const profile=readFileSync(fileURLToPath(new URL("../src/UserProfile.tsx",import.meta.url)),"utf8");
const css=readFileSync(fileURLToPath(new URL("../src/styles.css",import.meta.url)),"utf8");
assert.match(app,/\["Perfil",UserRound\]/);
assert.match(app,/page==="Perfil"/);
assert.match(app,/<UserProfile key=\{userId\}/);
assert.match(app,/onSaved=\{updated=>\{setPreferences\(updated\)/);
assert.match(profile,/supabase\.auth\.getUser\(\)/);
assert.match(profile,/user\.id!==userId/);
assert.match(profile,/\.eq\("user_id",userId\)\.single\(\)/);
assert.match(profile,/if\(!preferencesEqual\(server,baseline\)\)/);
assert.match(profile,/if\(allergyChanged&&!acknowledge\)/);
assert.match(profile,/if\(allergyChanged&&!acknowledge\)/);
assert.match(profile,/\.update\(\{/);
assert.doesNotMatch(profile,/\.delete\(|\.insert\(|\.upsert\(|\.rpc\(/);
assert.doesNotMatch(profile,/localStorage|sessionStorage/);
assert.match(profile,/nenhum cardápio já salvo será reavaliado/i);
assert.match(css,/\.mobile-nav\{overflow-x:auto/);
console.log("PASS F50: valores, RLS no fluxo, alergias, rascunho, navegação e sem alteração de cardápio.");
