import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {collectAllergenTriageHints} from "../src/lib/allergenTriageHints.mjs";

const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
const onboarding=read("../src/Onboarding.tsx");
const seed=read("../docs/qa/20261024_gergelim_taxonomia_a4_controlado.sql");
const suggestions=read("../src/lib/suggestions.ts");
const gate=read("../src/lib/allergenEligibility.mjs");

assert.match(onboarding,/const allergens=\[[^\]]*"Gergelim"/,
 "Onboarding deve permitir selecionar alergia a gergelim sem substituir outras opções");
const isHint=(value)=>collectAllergenTriageHints(value).hints.some(h=>h.code==="gergelim");
for(const ingredient of ["gergelim", "óleo de sésamo", "pasta de tahine", "sesame seeds"])
 assert.equal(isHint(ingredient),true,`Pista ausente: ${ingredient}`);
assert.equal(isHint("sementes de abóbora"),false,"Não inventar gergelim em outras sementes");
assert.match(seed,/values \('gergelim','Gergelim \(sésamo\)'\)/);
assert.doesNotMatch(seed,/insert into public\.cc_recipe_allergen_reviews|update public\.cc_recipe_allergen_reviews/i);
assert.match(suggestions,/if\(prefs\.allergies\.length\)throw new Error/,
 "Qualquer alergia cadastrada ainda deve bloquear sugestões semanais");
assert.match(gate,/review\.status!=="verified"/,
 "Sem classificação final não pode haver elegibilidade automática");
console.log("OK: gergelim no formulário, pistas A3 e taxonomia A4; sem liberar cardápios para alergias.");
