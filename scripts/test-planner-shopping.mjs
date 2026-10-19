import assert from "node:assert/strict";
import {build} from "esbuild";
import {fileURLToPath} from "node:url";

// Estes são testes puros: o Supabase é substituído por um stub em memória.
// Nenhum acesso à rede, banco, autenticação ou Storage é realizado.
async function importPure(entry){
 const outfile="test-fixture.mjs";
 const result=await build({
  entryPoints:[fileURLToPath(new URL(entry,import.meta.url))],
  bundle:true,platform:"node",format:"esm",write:false,logLevel:"silent",outfile,
  plugins:[{
   name:"supabase-stub",
   setup(context){
    context.onResolve({filter:/^\.\/supabase$/},()=>({path:"supabase",namespace:"test-stub"}));
    context.onLoad({filter:/.*/,namespace:"test-stub"},()=>({
     contents:"export const supabase = null;",
     loader:"js"
    }));
   }
  }]
 });
 return import("data:text/javascript;base64,"+
  Buffer.from(result.outputFiles[0].contents).toString("base64"));
}
const planner=await importPure("../src/lib/planner.ts");
const shopping=await importPure("../src/lib/shopping.ts");
const suggest=await importPure("../src/lib/suggestions.ts");
const progress=await importPure("../src/lib/shoppingProgress.ts");
const day=new Date(2026,9,18,12);
const monday=planner.startOfWeek(day);
assert.equal(planner.dateKey(monday),"2026-10-12");
assert.deepEqual(planner.daySlots,[
 "Café da manhã","Lanche da manhã","Almoço","Lanche da tarde","Jantar","Ceia"
]);
const makeMeal=(id,category,ingredients,kind,servings=1)=>({
 id,title:id,category,minutes:20,servings,ingredients,description:null,
 instructions:null,imageUrl:null,ownerId:null,imageIsAi:false,
 ...(kind?{pilotSource:{kind,sourceMeal:"",originalIngredients:"",
  originalTime:"",originalYield:"",sourceDocument:"",ingredientsReviewed:false}}:{})
});
const ingredient=(name,quantity,unit="un",extra={})=>({name,quantity,unit,...extra});
const salad=makeMeal("salada","Almoço",[], "salad");
const supper=makeMeal("ceia","Lanche",[], "supper");
const snack=makeMeal("lanche","Lanche",[], "snack");
const sauce=makeMeal("molho","Almoço",[], "sauce");
const breakfast=makeMeal("café","Café da manhã",[]);
assert.equal(planner.recipeFitsSlot(salad,"Almoço"),true);
assert.equal(planner.recipeFitsSlot(salad,"Jantar"),true);
assert.equal(planner.recipeFitsSlot(salad,"Ceia"),false);
assert.equal(planner.recipeFitsSlot(supper,"Ceia"),true);
assert.equal(planner.recipeFitsSlot(supper,"Lanche da tarde"),false);
assert.equal(planner.recipeFitsSlot(snack,"Lanche da manhã"),true);
assert.equal(planner.recipeFitsSlot(snack,"Lanche da tarde"),true);
assert.equal(planner.recipeFitsSlot(snack,"Ceia"),false);
assert.equal(planner.recipeFitsSlot(sauce,"Almoço"),false);
assert.equal(planner.recipeFitsSlot(breakfast,"Café da manhã"),true);
assert.equal(planner.recipeFitsSlot(breakfast,"Jantar"),false);

const pilot=makeMeal("piloto","Lanche",[
 ingredient("1 xícara de leite de coco",null,"un",{measureMode:"unspecified"}),
 ingredient("½ xícara de leite de coco",null,"un",{measureMode:"unspecified"}),
 ingredient("1 colher (sopa) de azeite",null,"un",{measureMode:"unspecified"}),
 ingredient("1 colher (chá) de azeite",null,"un",{measureMode:"unspecified"}),
 ingredient("1 colher (sopa) de azeite ou manteiga",null,"un",{measureMode:"unspecified"})
],"supper");
const dayKey=planner.dateKey(monday);
const pilotPlan={[dayKey]:{"Ceia":{id:pilot.id,servings:4}}};
const pilotList=shopping.collectPilotShopping([monday],pilotPlan,[pilot]);
assert.equal(pilotList.length,4,"Unidades diferentes e alternativas não devem se misturar");
const coconut=pilotList.find(x=>x.totalLabel?.includes("leite de coco"));
assert.ok(coconut);
assert.equal(coconut.totalLabel,"1 ½ xícaras de leite de coco");
assert.equal(coconut.quantity,2,"Duas ocorrências originais");
assert.equal(pilotList.filter(x=>x.sourceText.includes("azeite")&&!x.requiresChoice).length,2);
assert.ok(pilotList.some(x=>x.sourceText.includes("ou manteiga")&&x.requiresChoice));
assert.equal(shopping.consolidateShopping([monday],pilotPlan,[pilot]).length,0,
 "Receitas piloto não estruturadas não podem entrar no total em gramas");
assert.equal(shopping.shoppingNotes([monday],pilotPlan,[pilot]).length,0,
 "Os ingredientes piloto são exibidos pela lista literal, sem duplicação");

const regular=makeMeal("principal","Almoço",[
 ingredient("Arroz",100,"g"),
 ingredient("Banana",1,"un"),
 ingredient("Azeite",1,"colher_sopa",{optional:true}),
 ingredient("Sal",null,"g",{measureMode:"taste"}),
 ingredient("Água",null,"ml",{measureMode:"unspecified"})
],undefined,2);
const second=makeMeal("jantar","Jantar",[
 ingredient("Arroz",0.2,"kg"),
 ingredient("Tomate",2,"un")
]);
const plan={[dayKey]:{
 "Almoço":{id:regular.id,servings:3},
 "Jantar":{id:second.id,servings:1}
}};
const totals=shopping.consolidateShopping([monday],plan,[regular,second]);
assert.deepEqual(totals.find(x=>x.name==="Arroz"),{name:"Arroz",unit:"g",quantity:350},
 "100g para duas porções, preparado para três, mais 0,2kg deve totalizar 350g");
assert.deepEqual(totals.find(x=>x.name==="Banana"),{name:"Banana",unit:"un",quantity:1.5});
assert.ok(!totals.some(x=>["Azeite","Sal","Água"].includes(x.name)),
 "Opcionais, a gosto e sem quantidade não devem ser inventados no total");
const purchasedArroz={name:"Arroz",unit:"g",quantity:350};
assert.equal(progress.purchaseKey(purchasedArroz),progress.purchaseKey({name:"  ARROZ ",unit:"g",quantity:350}),"Nome normalizado continua estável");
assert.notEqual(progress.purchaseKey(purchasedArroz),progress.purchaseKey({...purchasedArroz,quantity:400}),"Quantidade alterada não pode herdar marcação de comprado");
const changedPlan={[dayKey]:{"Almoço":{id:regular.id,servings:4},"Jantar":{id:second.id,servings:1}}};
const changedTotals=shopping.consolidateShopping([monday],changedPlan,[regular,second]);
const changedRice=changedTotals.find(x=>x.name==="Arroz");
assert.ok(changedRice);
assert.equal(changedRice.quantity,400);
assert.notEqual(progress.purchaseKey(totals.find(x=>x.name==="Arroz")),progress.purchaseKey(changedRice),
 "Alterar porções deve invalidar apenas os produtos com quantidades alteradas");
assert.equal(progress.purchaseKey(totals.find(x=>x.name==="Tomate")),progress.purchaseKey(changedTotals.find(x=>x.name==="Tomate")),
 "Produto inalterado deve preservar a marcação");
const nextMonday=new Date(monday);
nextMonday.setDate(nextMonday.getDate()+7);
assert.notEqual(planner.dateKey(nextMonday),planner.dateKey(monday),
 "Semanas diferentes precisam de escopos distintos");
const removedOnChange=progress.changedPurchasedItems(totals,changedTotals);
assert.deepEqual(removedOnChange.map(x=>x.name),["Arroz","Banana"],
 "Somente ingredientes com quantidade modificada devem perder a marcação");
assert.equal(removedOnChange.some(x=>x.name==="Tomate"),false);
assert.equal(progress.changedPurchasedItems(changedTotals,totals).length,2,
 "Retorno à quantidade original exige nova compra, sem ressuscitar marcação antiga");
assert.equal(progress.changedPurchasedItems(totals,totals).length,0);
const persistedBefore=[progress.purchaseKey({name:"Arroz",unit:"g",quantity:350}),progress.purchaseKey({name:"Tomate",unit:"un",quantity:2})];
const currentAfter=new Set(changedTotals.map(progress.purchaseKey));
assert.deepEqual(persistedBefore.filter(key=>currentAfter.has(key)),[progress.purchaseKey({name:"Tomate",unit:"un",quantity:2})],
 "Reconciliação deve manter só marcação compatível com nova lista");
const notes=shopping.shoppingNotes([monday],plan,[regular,second]);
assert.ok(notes.some(x=>x.name==="Sal"));
assert.ok(notes.some(x=>x.name==="Azeite"));
assert.ok(notes.some(x=>x.name==="Água"));

const quickBreakfast=makeMeal("café-rápido","Café da manhã",[ingredient("Ovo",1)]);
const slowLunch=makeMeal("almoço-lento","Almoço",[ingredient("Arroz",100,"g")]);
slowLunch.minutes=90;
const quickDinner=makeMeal("jantar-rápido","Jantar",[ingredient("Feijão",100,"g")]);
assert.throws(()=>suggest.proposeWeek([quickBreakfast,slowLunch,quickDinner],{
 ...suggest.defaultPreferences,cooking_minutes:30
},[monday]),/tempo de preparo escolhido/,
 "Não ignorar limite de tempo quando só receitas demoradas estiverem disponíveis");
const allowedLunch=makeMeal("almoço-rápido","Almoço",[ingredient("Arroz",100,"g")]);
const suggested=suggest.proposeWeek([quickBreakfast,slowLunch,allowedLunch,quickDinner],{
 ...suggest.defaultPreferences,cooking_minutes:30
},[monday]);
assert.equal(suggested[dayKey]["Almoço"].id,"almoço-rápido",
 "Receitas acima do tempo não devem ser sugeridas");
const onlySauce=makeMeal("molho-solto","Almoço",[ingredient("Tomate",2)],"sauce");
onlySauce.pilotSource.ingredientsReviewed=true;
assert.throws(()=>suggest.proposeWeek([quickBreakfast,onlySauce,quickDinner],{
 ...suggest.defaultPreferences,cooking_minutes:30
},[monday]),/categoria Almoço/,
 "Molhos não podem ser sugeridos como refeição principal");
const approvedSalad=makeMeal("salada-completa","Almoço",[ingredient("Frango",150,"g")],"salad");
approvedSalad.pilotSource.ingredientsReviewed=true;
const saladWeek=suggest.proposeWeek([quickBreakfast,approvedSalad,quickDinner],{
 ...suggest.defaultPreferences,cooking_minutes:30
},[monday]);
assert.equal(saladWeek[dayKey]["Almoço"].id,"salada-completa",
 "Saladas adequadas continuam disponíveis para almoço");
const noAllergenAdvice=[makeMeal("teste","Almoço",[ingredient("Feijão",100,"g")])];
assert.throws(()=>suggest.proposeWeek(noAllergenAdvice,{
 ...suggest.defaultPreferences,allergies:["Soja"]
},[monday]),/alergias\/intolerâncias/);
assert.deepEqual(pilotPlan[dayKey]["Ceia"],{id:"piloto",servings:4},
 "A soma das compras não pode alterar o planejamento");
const betaBreakfast=makeMeal("beta-café","Café da manhã",[],"week",2);
betaBreakfast.pilotSource.originalIngredients="2 ovos, sal";
const betaLunch=makeMeal("beta-almoço","Almoço",[],"week",3);
betaLunch.pilotSource.originalIngredients="Arroz, frango";
const betaDinner=makeMeal("beta-jantar","Jantar",[],"week",4);
betaDinner.pilotSource.originalIngredients="Carne, cebola";
const betaDays=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d;});
const betaSuggested=suggest.proposeWeek([betaBreakfast,betaLunch,betaDinner],{
 ...suggest.defaultPreferences,household_size:2
},betaDays);
assert.equal(Object.keys(betaSuggested).length,7,"Deve preencher todos os 7 dias");
assert.ok(betaDays.every(d=>Object.keys(betaSuggested[planner.dateKey(d)]).length===3),"Cada dia precisa das 3 refeições principais");
assert.equal(betaSuggested[dayKey]["Almoço"].servings,3,"Não alterar rendimento original do piloto");
assert.equal(suggest.canMatchAvoidedIngredient(betaLunch,["frango"]),true,"Respeitar ingredientes originais não estruturados");
assert.throws(()=>suggest.proposeWeek([betaBreakfast,betaLunch,betaDinner],{
 ...suggest.defaultPreferences,allergies:["Soja","Glúten"]
},betaDays),/alergias\/intolerâncias/,"Sem verificação de alergênicos não gerar semana automaticamente");

// Cada novo clique deve trocar todos os horários principais quando houver alternativas.
const otherBreakfast=makeMeal("outro-café","Café da manhã",[ingredient("Banana",1)]);
const otherLunch=makeMeal("outro-almoço","Almoço",[ingredient("Feijão",100,"g")]);
const otherDinner=makeMeal("outro-jantar","Jantar",[ingredient("Tomate",2)]);
const twoPerSlot=[quickBreakfast,otherBreakfast,allowedLunch,otherLunch,quickDinner,otherDinner];
const initialWeek=suggest.proposeWeek(twoPerSlot,suggest.defaultPreferences,betaDays);
const renewedWeek=suggest.proposeWeek(twoPerSlot,suggest.defaultPreferences,betaDays,initialWeek);
for(const d of betaDays){
 const date=planner.dateKey(d);
 for(const slot of planner.slots){
  assert.notEqual(renewedWeek[date][slot].id,initialWeek[date][slot].id,
   "Nova sugestão deve substituir a receita de "+slot+" em "+date);
 }
}
const fixedWeek=suggest.proposeWeek([quickBreakfast,allowedLunch,quickDinner],
 suggest.defaultPreferences,betaDays,initialWeek);
assert.equal(fixedWeek[dayKey]["Almoço"].id,allowedLunch.id,
 "Sem alternativa, a receita única permanece disponível");
assert.throws(()=>suggest.proposeWeek(twoPerSlot,{
 ...suggest.defaultPreferences,allergies:["Soja"]
},betaDays,initialWeek),/alergias\/intolerâncias/,
 "Regenerar uma semana não pode ignorar alergias cadastradas");
console.log("OK: horários, acervo piloto, quantidades de compras e bloqueio por alergias, sem Supabase.");
