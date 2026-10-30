import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const js=ts.transpileModule(
 readFileSync(new URL("../src/lib/pilotEditorialBatch.ts",import.meta.url),"utf8"),
 {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}
).outputText;
const {collectEditorialBatch}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));

const draft=(i)=>({
 ingredient_id:String(i),source_text:"1 colher (chá) de azeite",
 original_name:"1 colher (chá) de azeite",review_status:"draft",
 proposed_quantity:1,proposed_unit:"colher_cha",proposed_ingredient:"azeite",
 updated_at:"2026-10-17T20:00:00.000Z"
});
const choice=(action,note="Medida conferida no texto original")=>({acknowledged:true,action,note});
const rows=Array.from({length:6},(_,i)=>draft(i+1));
const choices={
 "1":choice("confirm"),
 "2":choice("return","O ingrediente exige conferência manual")
};
let saved=collectEditorialBatch(rows,choices);
assert.equal(saved.length,2);
assert.deepEqual(saved.map(row=>row.action),["confirm","return"]);
assert.ok(saved.every(row=>row.note.length>=8));
assert.equal(saved[0].expected_updated_at,rows[0].updated_at);
assert.equal(saved[0].source_text,rows[0].original_name);
assert.throws(()=>collectEditorialBatch(rows,{}),/Selecione entre 1 e 5/);
assert.throws(()=>collectEditorialBatch(rows,{"1":{acknowledged:true,action:"",note:"Checado no original"}}),/decisão exige conferência/i);
assert.throws(()=>collectEditorialBatch(rows,{"1":choice("confirm","curto")}),/justificativa própria/i);
assert.throws(()=>collectEditorialBatch(rows,{"1":{acknowledged:false,action:"confirm",note:"Medida conferida no texto original"}}),/Selecione entre 1 e 5/);
assert.throws(()=>collectEditorialBatch(rows,Object.fromEntries(rows.map(row=>[row.ingredient_id,choice("confirm")]))),/Selecione entre 1 e 5/);
assert.throws(()=>collectEditorialBatch([draft(1),draft(1)],{"1":choice("confirm")}),/repetido/i);
assert.throws(()=>collectEditorialBatch([{...draft(1),original_name:"fonte alterada"}],{"1":choice("confirm")}),/rascunho não está mais apto/i);
assert.throws(()=>collectEditorialBatch([{...draft(1),review_status:"confirmed"}],{"1":choice("confirm")}),/rascunho não está mais apto/i);
assert.throws(()=>collectEditorialBatch([{...draft(1),updated_at:""}],{"1":choice("confirm")}),/incompleta/i);
console.log("OK: seleção e justificativa por ingrediente, até 5 decisões, fonte e versão protegidas.");
