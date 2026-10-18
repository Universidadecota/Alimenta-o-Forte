import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../supabase/migrations/20261018190000_cc_beta_private_catalog_access.sql",import.meta.url),"utf8");
const required=[
 /cc_beta_members/,/cc_beta_recipe_access/,
 /alter table public\.cc_beta_members enable row level security/,
 /alter table public\.cc_beta_recipe_access enable row level security/,
 /returns boolean language sql stable security definer/,
 /language sql stable security definer set search_path/,
 /revoke all on function public\.cc_beta_can_view_recipe\(uuid\) from public, anon/,
 /revoke all on function public\.cc_beta_recipe_sources\(\) from public, anon/,
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

 // Matriz de cenários simulados, equivalente à conjunção da função SQL.
 // É um teste unitário de regras: NÃO representa autenticação efetiva no Supabase.
const canView=({authenticated,memberEnabled,recipeEnabled,pilot,plannable,official,unpublished})=>
 authenticated&&memberEnabled&&recipeEnabled&&pilot&&plannable&&official&&unpublished;
const allowed={authenticated:true,memberEnabled:true,recipeEnabled:true,pilot:true,plannable:true,official:true,unpublished:true};
assert.equal(canView(allowed),true,"Participante autorizado deve enxergar receita liberada");
for(const field of Object.keys(allowed)){
 assert.equal(canView({...allowed,[field]:false}),false,
  "Negar acesso quando "+field+" não satisfaz a política");
}
assert.equal(canView({...allowed,memberEnabled:false}),false,"Revogação deve bloquear leitura");
assert.equal(canView({...allowed,recipeEnabled:false}),false,"Receita não liberada deve permanecer oculta");
assert.equal(canView({...allowed,authenticated:false}),false,"Visitante anônimo deve ser bloqueado");

console.log("OK: proteções estáticas da migração beta verificadas. NÃO substitui testes RLS reais com duas contas.");
