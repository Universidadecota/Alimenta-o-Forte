import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const queue=readFileSync(new URL("../src/AdminAllergenReviewQueue.tsx",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
const suggestions=readFileSync(new URL("../src/lib/suggestions.ts",import.meta.url),"utf8");
const migration=readFileSync(new URL("../supabase/migrations/20261012010000_cc_recipe_allergen_reviews.sql",import.meta.url),"utf8");

assert.match(app,/import AdminAllergenReviewQueue from "\.\/AdminAllergenReviewQueue"/);
assert.match(app,/page==="Administração"&&isAdmin&&[\s\S]*?<AdminAllergenReviewQueue\/>/);
assert.match(queue,/cc_admin_beta_catalog_overview/);
assert.match(queue,/cc_recipe_allergen_reviews/);
assert.match(queue,/status:"in_review"/);
assert.match(queue,/cross_contact_status:"unknown"/);
assert.doesNotMatch(queue,/status:"verified"/,"Triagem não pode aprovar automaticamente.");
assert.match(queue,/A marca “Verificada” não pode ser concedida aqui/);
for(const id of ["cc-review-allergens","cc-review-evidence","cc-review-cross-contact"]){
 assert.match(queue,new RegExp('htmlFor="'+id+'"'),"Rótulo acessível ausente: "+id);
 assert.match(queue,new RegExp('id="'+id+'" style=\\{\\{display:"block",width:"100%",minWidth:0,boxSizing:"border-box"'),"Campo precisa ocupar toda a largura disponível: "+id);
}
assert.match(queue,/minHeight:112,resize:"vertical"/,"Notas de evidência devem permitir leitura e redimensionamento.");
assert.match(queue,/minHeight:90,resize:"vertical"/,"Notas de contato cruzado devem permitir leitura e redimensionamento.");
assert.match(suggestions,/if\(prefs\.allergies\.length\)throw new Error/);
assert.match(migration,/cc_allergen_reviews_admin_insert/);
assert.match(migration,/cc_allergen_reviews_admin_update/);
assert.match(migration,/enable row level security/);
console.log("OK: fila restrita, formulário legível e acessível, sem aprovação; sugestões ainda bloqueadas.");
