import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const source=readFileSync(new URL("../src/lib/pilotSauceSafetyProposals.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{
 target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext
}}).outputText;
const uri="data:text/javascript;base64,"+Buffer.from(js).toString("base64");
const {SAUCE_SAFETY_PROPOSALS,getVerifiedSauceProposal}=await import(uri);

assert.equal(SAUCE_SAFETY_PROPOSALS.length,3);
assert.equal(new Set(SAUCE_SAFETY_PROPOSALS.map(x=>x.recipeId)).size,3);
for(const proposal of SAUCE_SAFETY_PROPOSALS){
 assert.ok(proposal.title.length>10);
 assert.ok(proposal.proposedIngredientNote.includes("pasteurizad"),
  "A substituição deve identificar gema pasteurizada");
 assert.ok(proposal.proposedPreparation.includes("pasteurizad"));
 assert.ok(proposal.proposedPreparation.toLowerCase().includes("refrigera"));
 assert.ok(proposal.reviewChecklist.length>=3);
 assert.ok(!proposal.proposedPreparation.includes("até 2 dias"),
  "Validade original arbitrária não deve ser herdada");
 const sourceSnapshot={
  recipe_id:proposal.recipeId,reference_hash:proposal.sourceHash,
  use_stage:"personal_pilot",original_ingredients:"Documento original preservado, gema"
 };
 const recipeSnapshot={id:proposal.recipeId,published:false,
  instructions:proposal.expectedCurrentInstructions};
 assert.equal(getVerifiedSauceProposal(sourceSnapshot,recipeSnapshot),proposal);
 assert.equal(getVerifiedSauceProposal({...sourceSnapshot,reference_hash:"alterado"},recipeSnapshot),null,
  "Fonte divergente deve ocultar prévia");
 assert.equal(getVerifiedSauceProposal({...sourceSnapshot,use_stage:"commercial"},recipeSnapshot),null,
  "Fase fora do piloto deve ocultar prévia");
 assert.equal(getVerifiedSauceProposal(sourceSnapshot,{...recipeSnapshot,published:true}),null,
  "Receita publicada não deve mostrar prévia como se ainda estivesse em revisão");
 assert.equal(getVerifiedSauceProposal(sourceSnapshot,{...recipeSnapshot,instructions:"Outra versão"}),null,
  "Versão divergente deve ocultar prévia");
 assert.equal(getVerifiedSauceProposal(sourceSnapshot,{...recipeSnapshot,id:"id-errado"}),null);
 assert.equal(getVerifiedSauceProposal({...sourceSnapshot,original_ingredients:""},recipeSnapshot),null);
}
const eggs=SAUCE_SAFETY_PROPOSALS.find(x=>x.recipeId==="fd9d66ab-d656-4bac-8ac6-2607ffad8cc4");
assert.ok(eggs.proposedIngredientNote.includes("dois")||eggs.proposedIngredientNote.includes("outro"),
 "Dois usos de meio limão devem continuar separados");
console.log("OK: propostas 3/3, snapshot de fonte e preparo, não publicação, conservação e regressão textual.");
