import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const code=readFileSync(new URL("../src/lib/officialIngredientWrites.ts",import.meta.url),"utf8");
const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {buildOfficialIngredientWrites}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
const original=[
 {id:"11111111-1111-4111-8111-111111111111",position:0,name:"Tomate",quantity:2,unit:"un",measure_mode:"measured",is_optional:false},
 {id:"22222222-2222-4222-8222-222222222222",position:1,name:"Azeite",quantity:10,unit:"ml",measure_mode:"measured",is_optional:true}
];
const current=[
 {id:original[0].id,name:"Tomate",quantity:3,unit:"un",measureMode:"measured",optional:false},
 {id:original[1].id,name:"Azeite",quantity:10,unit:"ml",measureMode:"measured",optional:true},
 {name:"Sal a gosto",quantity:null,unit:"un",measureMode:"taste",optional:false}
];
const writes=buildOfficialIngredientWrites(current,original);
assert.equal(writes.length,3);
assert.equal(writes[0].id,original[0].id);
assert.equal(writes[0].quantity,3);
assert.equal(writes[0].expected_quantity,2);
assert.equal(writes[0].expected_position,0);
assert.equal(writes[0].expected_name,"Tomate");
assert.equal(writes[0].expected_mode,"measured");
assert.equal(writes[1].expected_optional,true);
assert.equal(writes[2].id,null);
assert.equal(writes[2].quantity,null);
assert.equal("expected_name" in writes[2],false);
assert.equal(buildOfficialIngredientWrites([{name:"Ovo",quantity:1,unit:"un"}],null)[0].id,null);
assert.throws(()=>buildOfficialIngredientWrites([{...current[0]},{...current[0]}],original),/repetidos/);
assert.throws(()=>buildOfficialIngredientWrites([{...current[0],id:"33333333-3333-4333-8333-333333333333"}],original),/Recarregue/);
assert.throws(()=>buildOfficialIngredientWrites([{name:"Outro",quantity:1,unit:"un"}],original),/preservar/);
assert.throws(()=>buildOfficialIngredientWrites([],original),/1 a 40/);
assert.throws(()=>buildOfficialIngredientWrites(Array.from({length:41},()=>current[0]),null),/1 a 40/);
assert.throws(()=>buildOfficialIngredientWrites(current,[original[0],original[0]]),/inconsistente/);
const reordered=buildOfficialIngredientWrites([current[1],current[0]],original);
assert.equal(reordered[0].expected_position,1);
assert.equal(reordered[1].expected_position,0);
const sql=readFileSync(new URL("../docs/qa/20261030_sql_reconciliacao_edicao_oficial_fase40.sql",import.meta.url),"utf8");
assert.match(sql,/FOR UPDATE/i);
assert.match(sql,/expected_position/);
assert.match(sql,/expected_quantity/);
assert.match(sql,/v_old\.name IS DISTINCT FROM/);
assert.match(sql,/v_has_links/);
assert.match(sql,/cc_pilot_ingredient_measure_reviews/);
assert.match(sql,/cc_recipe_ingredient_food_links/);
assert.match(sql,/DELETE FROM public\.recipe_ingredients ri\s+WHERE ri\.recipe_id=v_id AND NOT \(ri\.id=ANY\(v_seen\)\)/i);
assert.doesNotMatch(sql,/delete from public\.recipe_ingredients where recipe_id=v_id\s*;/i);
assert.match(sql,/public\.cc_is_admin\(\)/);
console.log("OK: preservação de IDs, snapshot otimista, inclusão, reordenação, duplicidade e restrições SQL.");
