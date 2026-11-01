import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const entry=fileURLToPath(new URL("../src/lib/shoppingReviewGroups.ts",import.meta.url));
const compiled=await build({entryPoints:[entry],bundle:true,format:"esm",platform:"node",write:false,logLevel:"silent",outfile:"groups.mjs"});
const {groupShoppingForReview,isIncompletePilotReference}=await import(
 "data:text/javascript;base64,"+Buffer.from(compiled.outputFiles[0].contents).toString("base64")
);
const base=(name,sourceText,totalLabel,flags={})=>({
 name,quantity:1,unit:"un",sourceText,totalLabel,
 sourceRecipes:["Receita original A"],sourceExpressions:[sourceText],
 sourceRawFragments:[],requiresChoice:false,optionalSource:false,
 ambiguousSource:false,...flags
});
const coconut=base("Piloto · xicara|leite de coco · 2 usos · total 1.25","1 xícara de leite de coco","1¼ xícaras de leite de coco");
coconut.quantity=2;coconut.sourceRecipes.push("Receita original B");coconut.sourceExpressions.push("¼ de xícara de leite de coco");
const checking=base("Piloto · 1 abacate maduro","1 abacate maduro",undefined);
const dubious=base("Piloto · molho com texto ambíguo","vinagrete: azeite; limão",undefined,{ambiguousSource:true});
const incomplete=base("Piloto · referência","Molho Caesar (receita abaixo)",undefined);
const choice=base("Piloto · alternativa","leite comum ou leite vegetal",undefined,{requiresChoice:true});
const optional=base("Piloto · opcional","pimenta opcional",undefined,{optionalSource:true});
const structured=[{name:"Arroz",quantity:300,unit:"g"}];
const notes=[{name:"Sal",description:"a gosto"}];
const pilot=[coconut,checking,dubious,incomplete,choice,optional];
const snapshot=JSON.stringify({structured,pilot,notes});
const grouped=groupShoppingForReview(structured,pilot,notes);

assert.equal(grouped.structured[0],structured[0]);
assert.deepEqual(grouped.consolidatedOriginal,[coconut]);
assert.deepEqual(grouped.needsChecking,[checking,dubious]);
assert.deepEqual(grouped.incompleteReference,[incomplete]);
assert.deepEqual(grouped.choicesAndOptional,[choice,optional]);
assert.deepEqual(grouped.notes,notes);
assert.equal(grouped.consolidatedOriginal[0],coconut,"Preservar identidade original da marcação de compra");
assert.equal(grouped.consolidatedOriginal[0].quantity,2,"Usos nunca se transformam em medida de compra");
assert.equal(grouped.consolidatedOriginal[0].name,"Piloto · xicara|leite de coco · 2 usos · total 1.25");
assert.equal(JSON.stringify({structured,pilot,notes}),snapshot,"Classificação não muta fontes ou quantidades");
assert.equal(
 [...grouped.consolidatedOriginal,...grouped.needsChecking,...grouped.incompleteReference,...grouped.choicesAndOptional].length,
 pilot.length,"Cada item pertence a um e somente um grupo"
);
assert.ok(isIncompletePilotReference({sourceText:"1 xícara"}));
assert.ok(isIncompletePilotReference({sourceText:"Molho Caesar (receita abaixo)"}));
assert.ok(!isIncompletePilotReference({sourceText:"1 xícara de leite de coco"}));
assert.ok(!isIncompletePilotReference({sourceText:"1 abacate maduro"}));
assert.deepEqual(groupShoppingForReview([],[],[]),{
 structured:[],consolidatedOriginal:[],needsChecking:[],incompleteReference:[],choicesAndOptional:[],notes:[]
});

const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/ShoppingListSections.tsx",import.meta.url),"utf8");
const print=readFileSync(new URL("../src/lib/weeklyPrint.ts",import.meta.url),"utf8");
const progress=readFileSync(new URL("../src/lib/shoppingProgress.ts",import.meta.url),"utf8");
assert.match(app,/<ShoppingListSections shopping=\{shopping\}/);
assert.match(ui,/groupShoppingForReview\(shopping,pilotShopping,notes\)/);
assert.match(ui,/purchaseKey\(item\)/);
assert.match(ui,/onToggle\(item\)/);
assert.match(ui,/Conferir antes de comprar/);
assert.match(ui,/Medidas consolidadas/);
assert.match(ui,/Alternativas e opcionais/);
assert.match(ui,/sourceRecipes\.join\("; "\)/);
assert.match(print,/groupShoppingForReview\(shopping,pilotShopping,notes\)/);
assert.match(print,/purchasedKeys\.includes\(purchaseKey\(item\)\)/);
assert.match(print,/sourceExpressions\.join\(" \+ "\)/);
assert.match(progress,/normalizedName\(item\.name\) \+ "\|" \+ normalizedUnit\(item\.unit\)/);
assert.doesNotMatch(ui,/\.from\("shopping_list_items"\)|\.upsert\(|\.delete\(/);
assert.doesNotMatch(print,/\.upsert\(|\.delete\(/);
console.log("OK: três grupos sem perda, soma inventada ou modificação da marcação original, também no PDF.");
