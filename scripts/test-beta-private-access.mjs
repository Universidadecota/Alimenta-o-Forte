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

// A migração posterior mudou INTENCIONALMENTE a regra: qualquer pessoa autenticada
// pode acessar as receitas habilitadas, mesmo sem constar em cc_beta_members.
// Esta verificação impede que a suíte teste só uma regra antiga já substituída.
const currentSql=readFileSync(new URL("../supabase/migrations/20261019013000_cc_catalog_all_authenticated.sql",import.meta.url),"utf8");
assert.match(currentSql,/create or replace function public\.cc_beta_can_view_recipe/);
assert.match(currentSql,/\(select auth\.uid\(\)\) is not null/);
assert.match(currentSql,/public\.cc_beta_recipe_access a where a\.recipe_id=p_recipe_id and a\.enabled/);
assert.match(currentSql,/s\.use_stage='personal_pilot' and s\.is_plannable=true/);
assert.match(currentSql,/r\.owner_user_id is null and r\.published=false/);
assert.doesNotMatch(currentSql,/cc_beta_members/,
 "A regra vigente não é um bloqueio de inscrição exclusivamente por convite.");
const currentCanView=({authenticated,recipeEnabled,pilot,plannable,official,unpublished})=>
 authenticated&&recipeEnabled&&pilot&&plannable&&official&&unpublished;
assert.equal(currentCanView(allowed),true);
assert.equal(currentCanView({...allowed,memberEnabled:false}),true,
 "Contas autenticadas sem convite também têm acesso ao catálogo liberado.");
for(const field of ["authenticated","recipeEnabled","pilot","plannable","official","unpublished"]){
 assert.equal(currentCanView({...allowed,[field]:false}),false,
  "A política vigente precisa bloquear "+field);
}

// Uma falha de rede ou RLS não pode transformar um onboarding pendente em concluído.
const authGate=readFileSync(new URL("../src/AuthGate.tsx",import.meta.url),"utf8");
assert.doesNotMatch(authGate,/setOnboarding\(error\?["']done["']/,
 "Nunca abrir o app como se o onboarding estivesse concluído após erro de leitura.");
assert.match(authGate,/if\(error\)\{setOnboardingCheckError\(true\);return;\}/,
 "Falha de leitura das preferências deve exibir erro recuperável.");
assert.match(authGate,/setOnboardingRetry\(n=>n\+1\)/,
 "O usuário deve conseguir tentar a consulta novamente.");

console.log("OK: regras beta históricas e vigentes, onboarding com falha segura e checagens estáticas. Testes reais de RLS seguem separados.");
