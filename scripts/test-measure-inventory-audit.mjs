import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {execFileSync} from "node:child_process";
const dir=mkdtempSync(join(tmpdir(),"cc-measures-"));
try{
 const input=join(dir,"source.json"),output=join(dir,"report.json");
 writeFileSync(input,JSON.stringify([
 {ingredient_id:"a",recipe_id:"r1",source_position:1,source_text:"150 g de fraldinha",review_status:"pending"},
 {ingredient_id:"b",recipe_id:"r2",source_position:2,source_text:"150 g de fraldinha",review_status:"draft"},
 {ingredient_id:"c",recipe_id:"r3",source_position:1,source_text:"150 a 180 g de fraldinha",review_status:"pending"},
 {ingredient_id:"d",recipe_id:"r3",source_position:2,source_text:"1 colher (sopa) de azeite ou manteiga",review_status:"pending"},
 {ingredient_id:"e",recipe_id:"r3",source_position:3,source_text:"sal",review_status:"confirmed"}
 ]));
 execFileSync(process.execPath,[new URL("./audit-measure-inventory.mjs",import.meta.url).pathname,input,output],{stdio:"pipe"});
 const r=JSON.parse(readFileSync(output,"utf8"));
 assert.equal(r.mode,"dry-run");
 assert.equal(r.inputCount,5);
 assert.equal(r.uniqueIngredientIds,5);
 assert.deepEqual(r.statuses,{pending:3,draft:1,confirmed:1});
 assert.equal(r.byGroup.simple,2);
 assert.equal(r.byGroup.range,1);
 assert.equal(r.byGroup.choice,1);
 assert.equal(r.byGroup.manual,1);
 assert.equal(r.simpleProposalGroups[0].count,2);
 assert.equal(r.simpleProposalGroups[0].examples.length,2);
 assert.equal(r.normalizedDistinctTexts,4);
 assert.equal(r.normalizedTextGroups.reduce((sum,g)=>sum+g.count,0),5);
 writeFileSync(input,JSON.stringify([{ingredient_id:"duplicate",recipe_id:"r1",source_position:1,source_text:"1 ovo",review_status:"pending"},{ingredient_id:"duplicate",recipe_id:"r2",source_position:1,source_text:"2 ovos",review_status:"pending"}]));
 assert.throws(()=>execFileSync(process.execPath,[new URL("./audit-measure-inventory.mjs",import.meta.url).pathname,input,output],{stdio:"pipe"}));
 console.log("OK: auditoria fiel ao parser, agregação, rastreabilidade e duplicações.");
}finally{rmSync(dir,{recursive:true,force:true});}
