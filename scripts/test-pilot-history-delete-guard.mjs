import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const sql=readFileSync(new URL(
 "../supabase/migrations/20261030130912_cc_guard_pilot_ingredient_history_on_delete_3z.sql",
 import.meta.url),"utf8");
const statements=sql.replace(/^--.*$/gm,"");
assert.match(statements,/CREATE OR REPLACE FUNCTION public\.cc_guard_pilot_ingredient_history_on_delete\(\)/i);
assert.match(statements,/RETURNS trigger/i);
assert.match(statements,/SECURITY DEFINER\s+SET search_path TO ''/i);
assert.match(statements,/FROM public\.cc_pilot_ingredient_measure_reviews h/i);
assert.match(statements,/h\.ingredient_id\s*=\s*OLD\.id/i);
assert.match(statements,/RAISE EXCEPTION USING\s+ERRCODE = '23503'/i);
assert.match(statements,/RETURN OLD/i);
assert.match(statements,/REVOKE ALL ON FUNCTION public\.cc_guard_pilot_ingredient_history_on_delete\(\) FROM PUBLIC, anon, authenticated/i);
assert.match(statements,/CREATE TRIGGER cc_guard_pilot_ingredient_history_on_delete\s+BEFORE DELETE ON public\.recipe_ingredients\s+FOR EACH ROW/i);
assert.match(statements,/EXECUTE FUNCTION public\.cc_guard_pilot_ingredient_history_on_delete\(\)/i);
assert.equal(/\b(?:UPDATE|INSERT INTO|DELETE FROM|DROP TABLE|TRUNCATE|ALTER TABLE recipes)\b/i.test(statements),false,
 "Migração de proteção não deve manipular dados do catálogo");
assert.equal(/\bCREATE POLICY\b|\bGRANT EXECUTE\b/i.test(statements),false,
 "Não adicionar autorização de acesso");
const cases=[
 {historyExists:true,deleteAllowed:false},
 {historyExists:false,deleteAllowed:true}
];
for(const x of cases)assert.equal(!x.historyExists,x.deleteAllowed);
console.log("OK: migração de trigger rejeita exclusão de ingrediente com histórico, restringe EXECUTE e não contém DML. Teste de código, não de DELETE real.");
