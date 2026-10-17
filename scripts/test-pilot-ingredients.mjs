import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

async function loadPureTypeScript(path) {
 const source=readFileSync(new URL(path,import.meta.url),"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{
  target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext
 }}).outputText;
 return import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
}
const {parsePilotMeasure,formatPilotTotal}=await loadPureTypeScript("../src/lib/pilotMeasure.ts");
const {splitPilotIngredient}=await loadPureTypeScript("../src/lib/pilotIngredientReview.ts");
const sum=(values)=>{
 const first=parsePilotMeasure(values[0]);
 assert.ok(first,"Primeiro fragmento deve ser medido: "+values[0]);
 let total=0;
 for(const value of values){
  const parsed=parsePilotMeasure(value);
  assert.ok(parsed,"Não interpretado: "+value);
  assert.equal(parsed.key,first.key,"Ingredientes ou unidades não podem ser somados");
  total+=parsed.amount;
 }
 return formatPilotTotal(first,total);
};
assert.equal(sum(["1 colher (sopa) de azeite","2 colheres (sopa) de azeite"]),"3 colheres (sopa) de azeite");
assert.equal(sum(["1 xícara de leite de coco","½ xícara de leite de coco"]),"1 ½ xícaras de leite de coco");
assert.equal(sum(["¼ de xícara de leite de coco","¾ de xícara de leite de coco"]),"1 xícara de leite de coco");
assert.equal(sum(["1 ovo","2 ovos"]),"3 ovos");
assert.equal(sum(["½ cebola","1 cebola"]),"1 ½ cebolas");
assert.equal(sum(["1½ xícara de caldo caseiro","½ xícara de caldo caseiro"]),"2 xícaras de caldo caseiro");
assert.equal(parsePilotMeasure("150g de camarão limpo")?.amount,150);
assert.equal(parsePilotMeasure("200ml de leite de coco")?.unitKey,"mililitro");
assert.notEqual(parsePilotMeasure("1 colher (sopa) de azeite")?.key,parsePilotMeasure("1 colher (chá) de azeite")?.key);
assert.equal(parsePilotMeasure("1 colher (sopa) de azeite ou manteiga"),null);
assert.equal(parsePilotMeasure("1 colher (sopa) de ghee (opcional)"),null);
assert.equal(parsePilotMeasure("1 colher (sopa) de azeite. Salada: ½ pepino"),null);
assert.equal(parsePilotMeasure("1 ovo cozido"),null); // diferente de ovo sem preparo informado
assert.notEqual(parsePilotMeasure("½ xícara de água")?.key,parsePilotMeasure("½ xícara de água gelada")?.key);
const original="1 colher (sopa) de manteiga. Chimichurri: 3 colheres (sopa) de salsinha picada";
const segments=splitPilotIngredient(original);
assert.equal(segments.length,2);
assert.equal(segments[0].text,"1 colher (sopa) de manteiga");
assert.equal(segments[1].section,"Chimichurri");
assert.equal(segments[1].text,"3 colheres (sopa) de salsinha picada");
assert.equal(segments[1].rawFragment,original);
assert.equal(segments[1].wasSplit,true);
const alternative=splitPilotIngredient("1 lata de sardinha em água ou azeite");
assert.equal(alternative.length,1);
assert.equal(alternative[0].requiresChoice,true);
assert.equal(splitPilotIngredient("1 ovo cozido (opcional)")[0].optional,true);
const portion=splitPilotIngredient("1 colher (sopa) de azeite. Por porção: 3 colheres (sopa) de chucrute");
assert.equal(portion.length,2);
assert.equal(portion[1].section,"Por porção");
assert.equal(portion[1].ambiguousCompound,true); // não somar sem saber o número de porções
const salad=splitPilotIngredient("sal. Salada: ½ pepino fatiado");
assert.equal(salad.length,2);
assert.equal(salad[1].text,"½ pepino fatiado");
const nonNumeric=splitPilotIngredient("cebolinha. Salada: folhas de alface");
assert.equal(nonNumeric.length,2);
assert.equal(nonNumeric[1].section,"Salada");
assert.equal(nonNumeric[1].text,"folhas de alface");
const unknown="1 colher (sopa) de azeite. Ingrediente desconhecido: 1 xícara de vegetais";
const unresolved=splitPilotIngredient(unknown);
assert.equal(unresolved.length,1);
assert.equal(unresolved[0].ambiguousCompound,true);
console.log("OK: verificações do parser, frações, alternativas e subtítulos, sem modificar receitas.");
