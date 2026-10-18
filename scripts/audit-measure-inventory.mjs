import {readFileSync,writeFileSync} from "node:fs";
import ts from "typescript";
import {pathToFileURL} from "node:url";

// Read-only offline audit. Pass a local JSON array; this script never connects to Supabase.
const input=process.argv[2];
const output=process.argv[3];
if(!input||!output){console.error("Usage: node scripts/audit-measure-inventory.mjs input.json report.json");process.exit(2);}
const transpile=(relative)=>ts.transpileModule(readFileSync(new URL(relative,import.meta.url),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}).outputText;
const dataUrl=(code)=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const parser=dataUrl(transpile("../src/lib/pilotMeasure.ts"));
const ingredient=dataUrl(transpile("../src/lib/pilotIngredientReview.ts"));
const batch=transpile("../src/lib/pilotMeasureBatch.ts")
 .replace(/from ["']\.\/pilotMeasure["']/, 'from "'+parser+'"')
 .replace(/from ["']\.\/pilotIngredientReview["']/, 'from "'+ingredient+'"');
const {classifyMeasure,measureGroups}=await import(dataUrl(batch));
const rows=JSON.parse(readFileSync(input,"utf8"));
if(!Array.isArray(rows))throw Error("Expected an array of ingredient rows");
const byGroup=Object.fromEntries(measureGroups.map(x=>[x.key,0]));
const statuses={},groups=new Map(),seen=new Set();
const anomalies=[];
for(const [i,row] of rows.entries()){
 if(!row||typeof row.ingredient_id!=="string"||typeof row.source_text!=="string"||typeof row.review_status!=="string")throw Error("Invalid row at "+i);
 if(seen.has(row.ingredient_id))throw Error("Duplicate ingredient_id: "+row.ingredient_id);
 seen.add(row.ingredient_id);
 const {group,proposal}=classifyMeasure(row.source_text);
 byGroup[group]++;
 statuses[row.review_status]=(statuses[row.review_status]??0)+1;
 if(!row.source_text.trim())anomalies.push({id:row.ingredient_id,reason:"empty text"});
 const fingerprint=proposal?JSON.stringify([proposal.quantity,proposal.unit,proposal.ingredient.normalize("NFC").trim().toLocaleLowerCase("pt-BR")]):null;
 if(group==="simple"&&fingerprint){
  const entry=groups.get(fingerprint)??{proposal,count:0,examples:[]};
  entry.count++;
  if(entry.examples.length<4)entry.examples.push({ingredient_id:row.ingredient_id,recipe_id:row.recipe_id??null,source_position:row.source_position??null,source_text:row.source_text,review_status:row.review_status});
  groups.set(fingerprint,entry);
 }
}
const report={mode:"dry-run",inputCount:rows.length,uniqueIngredientIds:seen.size,statuses,byGroup,anomalies,simpleProposalGroups:[...groups.values()].sort((a,b)=>b.count-a.count),warning:"Suggestions only; no editorial approval or database writes."};
writeFileSync(output,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({inputCount:report.inputCount,statuses,byGroup,groupCount:groups.size,anomalies:anomalies.length},null,2));
