import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../supabase/migrations/20261018190000_cc_beta_private_catalog_access.sql",import.meta.url),"utf8");
const required=[
 /cc_beta_members/,/cc_beta_recipe_access/,
 /m\.user_id=\(select auth\.uid\(\)\) and m\.enabled/,
 /a\.recipe_id=p_recipe_id and a\.enabled/,
 /s\.use_stage='personal_pilot' and s\.is_plannable=true/,
 /r\.owner_user_id is null and r\.published=false/,
 /revoke all on public\.cc_beta_members, public\.cc_beta_recipe_access from anon, authenticated/,
 /grant execute on function public\.cc_beta_can_view_recipe\(uuid\) to authenticated/,
 /grant execute on function public\.cc_beta_recipe_sources\(\) to authenticated/,
 /for select to authenticated using \(public\.cc_beta_can_view_recipe\(id\)\)/,
 /for select to authenticated using \(public\.cc_beta_can_view_recipe\(recipe_id\)\)/
];
for(const pattern of required)assert.match(sql,pattern,"Falta proteção beta: "+pattern);
assert.doesNotMatch(sql,/\b(?:insert\s+into|update\s+public\.recipes|set\s+published\s*=\s*true)\b/i,"Migração não pode liberar usuários ou receitas automaticamente");
console.log("OK: proteções estáticas da migração beta verificadas. NÃO substitui testes RLS reais com duas contas.");
