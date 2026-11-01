import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

// Regressão: uma leitura com uma compra válida e outra divergente
// filtra a lista em tela, mas NUNCA apaga o registro divergente no banco.
const purchasedRows=[
 {name:"Piloto · leite de coco",unit:"un",quantity:2},
 {name:"Piloto · azeite",unit:"un",quantity:10}
];
let deletes=0, reads=0, weeklyQueries=0;
globalThis.__ccShoppingReadTest={
 from(table){
  if(table==="shopping_lists"){
   weeklyQueries++;
   return {select(){return {eq(){return this;},maybeSingle:async()=>({data:{id:"week-list"},error:null})}}};
  }
  if(table==="shopping_list_items"){
   return {
    select(){return {eq(){return this;},order(){return this;},
     range:async()=>{reads++;return {data:purchasedRows,error:null};}
    };},
    delete(){deletes++;throw new Error("Uma leitura não pode apagar compras");}
   };
  }
  throw new Error("Tabela não esperada: "+table);
 }
};
const compiled=await build({
 entryPoints:[fileURLToPath(new URL("../src/lib/shoppingProgress.ts",import.meta.url))],
 bundle:true,platform:"node",format:"esm",write:false,logLevel:"silent",outfile:"test.mjs",
 plugins:[{name:"supabase-fake",setup(setup){
  setup.onResolve({filter:/^\.\/supabase$/},()=>({path:"supabase",namespace:"test"}));
  setup.onLoad({namespace:"test",filter:/.*/},()=>({
   contents:"export const supabase=globalThis.__ccShoppingReadTest;",loader:"js"
  }));
 }}]
});
const {loadPurchasedKeys,purchaseKey}=await import(
 "data:text/javascript;base64,"+Buffer.from(compiled.outputFiles[0].contents).toString("base64")
);
const current=[{name:"Piloto · leite de coco",unit:"un",quantity:2}];
const keys=await loadPurchasedKeys("user-a","2026-11-02",current);
assert.deepEqual(keys,[purchaseKey(current[0])]);
assert.equal(deletes,0,"Somente abrir Compras nunca deve executar DELETE");
assert.equal(reads,1);
assert.equal(weeklyQueries,1);
assert.deepEqual(await loadPurchasedKeys("user-a","2026-11-02",[]),[]);
assert.equal(deletes,0,"Nem uma lista momentaneamente vazia deve apagar compras");
const source=readFileSync(fileURLToPath(new URL("../src/lib/shoppingProgress.ts",import.meta.url)),"utf8");
const loadBody=source.split("export async function loadPurchasedKeys")[1].split("export async function savePurchasedItem")[0];
assert.doesNotMatch(loadBody,/\.delete\s*\(/,"loadPurchasedKeys jamais apaga dados");
assert.match(loadBody,/!valid \|\| valid\.has\(key\)/);
console.log("PASS: leitura de compras não destrutiva, filtro de divergências e nenhuma exclusão automática.");
