import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration=readFileSync(new URL("../supabase/migrations/20261023193000_cc_allergen_a4_structured_findings.sql",import.meta.url),"utf8");
const panel=readFileSync(new URL("../src/AdminAllergenStructuredFindings.tsx",import.meta.url),"utf8");
const queue=readFileSync(new URL("../src/AdminAllergenReviewQueue.tsx",import.meta.url),"utf8");
const suggestions=readFileSync(new URL("../src/lib/suggestions.ts",import.meta.url),"utf8");

assert.match(migration,/create table if not exists public\.cc_allergen_a4_taxonomy/);
assert.match(migration,/create table if not exists public\.cc_allergen_a4_ingredient_findings/);
assert.match(migration,/references public\.cc_allergen_ingredient_evidence\(id\)/);
assert.match(migration,/finding in \('declared_in_recipe','suspected','undetermined'\)/);
assert.match(migration,/cross_contact_finding in \('not_assessed','possible_reported'\)/);
assert.doesNotMatch(migration,/('absent'|'verified'|'cleared'|'assessed_safe')/i);
assert.match(migration,/source_reference_hash_snapshot is distinct from v_source_hash/);
assert.match(migration,/ingredient_text_snapshot is distinct from v_name/);
assert.match(migration,/v_latest_id is distinct from new\.evidence_id/);
assert.match(migration,/v_evidence\.source_kind <> 'recipe_text'/);
assert.match(migration,/new\.recorded_by := \(select auth\.uid\(\)\)/);
assert.match(migration,/new\.recorded_at := now\(\)/);
assert.match(migration,/enable row level security/);
assert.match(migration,/grant select,insert on public\.cc_allergen_a4_ingredient_findings to authenticated/);
assert.doesNotMatch(migration,/grant (?:update|delete|all) on public\.cc_allergen_a4_ingredient_findings to authenticated/i);
assert.match(migration,/for select to authenticated using/);
assert.match(migration,/for insert to authenticated with check/);
assert.doesNotMatch(migration,/create policy [^\n]+ for (?:update|delete)/i);

assert.match(panel,/cc_allergen_a4_ingredient_findings/);
assert.match(panel,/cc_allergen_a4_taxonomy/);
assert.match(panel,/cc_allergen_ingredient_evidence/);
assert.match(panel,/\.insert\(\{/);
assert.doesNotMatch(panel,/\.update\(|\.delete\(|\.upsert\(/);
assert.match(panel,/["']PGRST205["']/);
assert.match(panel,/Evidência A3B/);
assert.match(panel,/window\.confirm/);
assert.match(panel,/current\.source_reference_hash_snapshot===sourceHash/);
assert.doesNotMatch(panel,/status:"verified"|ingredientClearances|crossContactClearances/);
assert.match(queue,/import AdminAllergenStructuredFindings from "\.\/AdminAllergenStructuredFindings"/);
assert.match(queue,/<AdminAllergenStructuredFindings/);
assert.match(suggestions,/if\(prefs\.allergies\.length && !preliminaryEligibleIds\)/);

console.log("OK: A4 vincula constatações à evidência A3B com RLS e histórico append-only, sem conceder certificação para sugestões.");
