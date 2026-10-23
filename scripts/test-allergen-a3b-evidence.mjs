import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration=readFileSync(new URL("../supabase/migrations/20261023185000_cc_allergen_ingredient_evidence_a3b.sql",import.meta.url),"utf8");
const panel=readFileSync(new URL("../src/AdminAllergenIngredientEvidence.tsx",import.meta.url),"utf8");
const queue=readFileSync(new URL("../src/AdminAllergenReviewQueue.tsx",import.meta.url),"utf8");
const suggestions=readFileSync(new URL("../src/lib/suggestions.ts",import.meta.url),"utf8");

assert.match(migration,/create table if not exists public\.cc_allergen_ingredient_evidence/);
assert.match(migration,/ingredient_id uuid not null references public\.recipe_ingredients\(id\)/);
assert.match(migration,/ingredient_text_snapshot := v_name/);
assert.match(migration,/source_reference_hash_snapshot := coalesce\(v_source_hash,''\)/);
assert.match(migration,/recorded_by := \(select auth\.uid\(\)\)/);
assert.match(migration,/new\.recorded_at := now\(\)/);
assert.match(migration,/enable row level security/);
assert.match(migration,/grant select,insert on public\.cc_allergen_ingredient_evidence to authenticated/);
assert.doesNotMatch(migration,/grant (?:update|delete|all) on public\.cc_allergen_ingredient_evidence to authenticated/i);
assert.match(migration,/for select to authenticated using/);
assert.match(migration,/for insert to authenticated with check/);
assert.doesNotMatch(migration,/create policy [^\n]+ for (?:update|delete)/i);
assert.match(migration,/evidence_state in \('investigating','awaiting_supplier'\)/);
assert.doesNotMatch(migration,/evidence_state in \([^)]*verified/i);
assert.match(migration,/new\.recipe_id is distinct from v_recipe_id/);
assert.match(migration,/r\.owner_user_id,r\.archived_at/);

assert.match(panel,/cc_allergen_ingredient_evidence/);
assert.match(panel,/\.insert\(\{/);
assert.doesNotMatch(panel,/\.update\(|\.delete\(|\.upsert\(/);
assert.match(panel,/["']PGRST205["']/);
assert.match(panel,/Estrutura A3B ainda não ativada no banco principal/);
assert.match(panel,/window\.confirm/);
assert.match(panel,/isStale/);
assert.doesNotMatch(panel,/status:"verified"|cross_contact_status:"assessed"|ingredientClearances/);

assert.match(queue,/import AdminAllergenIngredientEvidence from "\.\/AdminAllergenIngredientEvidence"/);
assert.match(queue,/select\("id,name,quantity,unit,position"\)/);
assert.match(queue,/reference_hash/);
assert.match(queue,/<AdminAllergenIngredientEvidence/);

assert.match(suggestions,/if\(prefs\.allergies\.length\)throw new Error/);
console.log("OK: A3B somente historico administrativo append-only, RLS e snapshots; gerador ainda bloqueado.");
