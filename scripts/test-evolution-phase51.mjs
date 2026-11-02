import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const bundled=await build({
 entryPoints:[fileURLToPath(new URL("../src/lib/evolutionModel.ts",import.meta.url))],
 platform:"node",bundle:true,format:"esm",outfile:"evolution-tests.mjs",write:false,logLevel:"silent"
});
const model=await import("data:text/javascript;base64,"+Buffer.from(bundled.outputFiles[0].contents).toString("base64"));
const sample=model.emptyEvolutionDraft();
const today="2026-11-02";
assert.match(model.validateEvolutionDraft(sample,today,today),/pelo menos uma/);
assert.equal(model.validateEvolutionDraft({...sample,energy_level:3},today,today),null);
assert.equal(model.validateEvolutionDraft({...sample,planned_meals:false},today,today),null,"Um hábito negado é um registro válido, não uma falha.");
assert.equal(model.validateEvolutionDraft({...sample,personal_note:"Fiz uma pausa"},today,today),null);
assert.match(model.validateEvolutionDraft({...sample,energy_level:6},today,today),/1 e 5/);
assert.match(model.validateEvolutionDraft({...sample,personal_note:"x".repeat(281)},today,today),/280/);
assert.match(model.validateEvolutionDraft({...sample,wellbeing_level:4},"2026-11-03",today),/dias futuros/);
assert.equal(model.validLocalDate("2026-02-29"),false);
assert.equal(model.validLocalDate("2024-02-29"),true);
assert.equal(model.localDateKey(new Date(2026,10,2,12)),"2026-11-02");
assert.deepEqual(model.entryToDraft({energy_level:5,planned_meals:false,personal_note:"Meu dia"}),{
 energy_level:5,wellbeing_level:null,sleep_quality:null,
 planned_meals:false,took_pause:null,moved_comfortably:null,personal_note:"Meu dia"
});
assert.equal(model.evaluationLabel(null),"Não informado");
const path=(name)=>readFileSync(fileURLToPath(new URL(name,import.meta.url)),"utf8");
const ui=path("../src/EvolutionPanel.tsx"),app=path("../src/App.tsx");
const migration=path("../supabase/migrations/20261102193000_cc_evolution_private_checkins_phase51.sql");
assert.match(app,/\["Evolução",Activity\]/);
assert.match(app,/page==="Evolução"&&\(userId/);
assert.match(ui,/supabase\.auth\.getUser\(\)/);
assert.match(ui,/user\?\.id!==userId/);
assert.match(ui,/\.eq\("user_id",userId\)/);
assert.match(ui,/\.upsert\(payload,\{onConflict:"user_id,recorded_on"\}\)/);
assert.match(ui,/\.delete\(\)\.eq\("id",selected\.id\)\.eq\("user_id",userId\)/);
assert.doesNotMatch(ui,/window\.confirm\(/,"A exclusão não deve bloquear o main thread com prompt síncrono");
assert.match(ui,/<dialog ref=\{deleteDialogRef\}/);
assert.match(ui,/dialog\.showModal\(\)/);
assert.match(ui,/onCancel=\{e=>\{e\.preventDefault\(\)/);
assert.match(ui,/Sim, excluir registro/);
assert.match(ui,/if\(!confirmDelete\|\|!selected\|\|saving/);
assert.match(ui,/if\(!ack\)/);
assert.doesNotMatch(ui,/localStorage|sessionStorage|console\.log|service_role/);
assert.match(migration,/enable row level security/);
assert.match(migration,/revoke all on public\.cc_evolution_checkins from public,anon,authenticated/);
assert.match(migration,/grant select,insert,update,delete on public\.cc_evolution_checkins to authenticated/);
assert.match(migration,/constraint cc_evolution_checkins_user_day_unique unique \(user_id,recorded_on\)/);
assert.match(migration,/for select to authenticated using \(\(select auth\.uid\(\)\)=user_id\)/);
assert.match(migration,/for insert to authenticated with check \(/);
assert.match(migration,/for update to authenticated using \(\(select auth\.uid\(\)\)=user_id\)/);
assert.match(migration,/for delete to authenticated using \(\(select auth\.uid\(\)\)=user_id\)/);
assert.doesNotMatch(migration,/security definer|grant .* to anon|policy .*using \(true\)/i);
console.log("PASS F51: validação dos registros, opt-in, acesso individual, exclusão e RLS por usuário.");
