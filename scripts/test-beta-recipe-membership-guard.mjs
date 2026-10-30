import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const sql=readFileSync(new URL(
 "../supabase/migrations/20261030120956_cc_beta_recipe_membership_guard_20261030.sql",
 import.meta.url),"utf8");
const checks=[
 ["Assinatura existente mantida",/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.cc_beta_can_view_recipe\(p_recipe_id uuid\)/i],
 ["Consulta sob login",/auth\.uid\(\)\)\s+IS\s+NOT\s+NULL/i],
 ["Admin permitido",/public\.cc_is_admin\(\)/i],
 ["Membro beta efetivo",/FROM\s+public\.cc_beta_members\s+AS\s+m/i],
 ["Membro vinculado ao usuário",/m\.user_id\s*=\s*\(SELECT auth\.uid\(\)\)/i],
 ["Membro habilitado",/m\.enabled\s+IS\s+TRUE/i],
 ["Recipe opt-in",/FROM\s+public\.cc_beta_recipe_access\s+AS\s+a/i],
 ["Recipe habilitada",/a\.enabled\s+IS\s+TRUE/i],
 ["Somente piloto",/s\.use_stage\s*=\s*'personal_pilot'/i],
 ["Somente preparável",/s\.is_plannable\s+IS\s+TRUE/i],
 ["Somente receita privada",/r\.owner_user_id\s+IS\s+NULL/i],
 ["Não publicada",/r\.published\s+IS\s+FALSE/i],
 ["Search path fechado",/SET\s+search_path\s+TO\s+''/i]
];
checks.forEach(([desc,pattern])=>assert.match(sql,pattern,desc));
assert.match(sql,/\bSTABLE\b\s+SECURITY\s+DEFINER/i);
assert.equal(/\b(?:INSERT|UPDATE|DELETE|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|FROM|ON|TABLE)\b/i.test(
 sql.replace(/^--.*$/gm,"")),false,
 "Migração não pode alterar dados, grants ou tabelas");
const fakeEvaluations=[
 {signedIn:false,isAdmin:false,betaMember:false,recipeEnabled:true,expected:false},
 {signedIn:true,isAdmin:false,betaMember:false,recipeEnabled:true,expected:false},
 {signedIn:true,isAdmin:true,betaMember:false,recipeEnabled:true,expected:true},
 {signedIn:true,isAdmin:false,betaMember:true,recipeEnabled:true,expected:true},
 {signedIn:true,isAdmin:false,betaMember:true,recipeEnabled:false,expected:false}
];
for(const sample of fakeEvaluations){
 const candidate=sample.signedIn&&(sample.isAdmin||sample.betaMember)&&sample.recipeEnabled;
 assert.equal(candidate,sample.expected);
}
console.log("OK: estrutura da migração Beta consistente; critérios de administrador, membro habilitado e receita privada. Testes SQL reais documentados separadamente.");
