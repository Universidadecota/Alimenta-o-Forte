import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root=new URL("../",import.meta.url);
const migration=readFileSync(new URL("supabase/migrations/20261024163302_cc_a5_weekly_allergy_server_guard.sql",root),"utf8");
const previous=readFileSync(new URL("supabase/migrations/20261019030000_cc_replace_week_main_meals.sql",root),"utf8");
const suggestions=readFileSync(new URL("src/lib/suggestions.ts",root),"utf8");

assert.match(migration,/create or replace function public\.cc_replace_week_main_meals\(/);
assert.match(migration,/language plpgsql security invoker set search_path=''/);
assert.match(migration,/v_user uuid := \(select auth\.uid\(\)\)/);
assert.match(migration,/select p\.allergies into v_allergies\s+from public\.user_preferences p\s+where p\.user_id=v_user\s+for share;/);
assert.match(migration,/if not found or v_allergies is null then\s+raise exception/);
assert.match(migration,/if cardinality\(v_allergies\)>0 then\s+raise exception/);

// A checagem ocorre ANTES de qualquer escrita; dados faltantes falham fechados.
const guardEnd=migration.indexOf("if cardinality(v_allergies)>0 then");
const firstWrite=migration.indexOf("insert into public.meal_plans(");
assert(guardEnd>0 && firstWrite>guardEnd,"Alergias precisam ser checadas antes do primeiro UPSERT.");
assert.match(migration,/grant execute on function public\.cc_replace_week_main_meals\(date,jsonb,jsonb\)\s+to authenticated;/);

// Nenhuma das garantias transacionais existentes pode desaparecer na A5.1.
for(const marker of [
 "jsonb_array_length(p_meals)<>21",
 "count(distinct (m.meal_date,m.slot))",
 "v_actual<>p_expected",
 "on conflict(meal_plan_id,meal_date,slot)",
 "do update set recipe_id=excluded.recipe_id,servings=excluded.servings"
]){
 assert(previous.includes(marker),`Contrato original mudou: ${marker}`);
 assert(migration.includes(marker),`Regressão na migração A5.1: ${marker}`);
}

assert.match(suggestions,/if\(prefs\.allergies\.length\)throw new Error/,
 "Bloqueio do aplicativo não deve ser removido sem homologação A5/A6.");
assert(!migration.includes("cc_allergen_a4_ingredient_findings"),
 "Uma constatação A4 não deve gerar autorização positiva.");
console.log("OK: contrato A5.1 mantém bloqueio de alergias no servidor antes da escrita e preserva o RPC anterior. Validação estática, não substitui teste SQL transacional.");
