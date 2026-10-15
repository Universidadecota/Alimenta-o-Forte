import {type Meal,type Plan,type Slot,dateKey,daySlots} from "./planner";
import {formatIngredientAmount,formatRecipeIngredient,formatUnit} from "./ingredientMeasures";

export {formatUnit,formatIngredientAmount};
const aliases:Record<string,{base:string;factor:number}>={
 g:{base:"g",factor:1},kg:{base:"g",factor:1000},
 ml:{base:"ml",factor:1},l:{base:"ml",factor:1000},
 un:{base:"un",factor:1},
};
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .trim().toLocaleLowerCase("pt-BR").replace(/\s+/g," ");
export type ShoppingItem={name:string;quantity:number;unit:string};
export type ShoppingNote={name:string;description:string};
export type PilotShoppingItem=ShoppingItem&{sourceText:string;sourceRecipes:string[]};
/**
 * Lista de compra UTILIZÁVEL para o piloto pessoal.
 * Cada item contém a expressão literal usada na receita, inclusive medidas,
 * produtos alternativos e qualificadores. quantity = número de ocorrências
 * na semana, NÃO quantidade física, nem conversão de colher para gramas.
 * O prefixo na chave evita colisão com compras estruturadas anteriores.
 */
export function collectPilotShopping(days:Date[],plan:Plan,recipes:Meal[]):PilotShoppingItem[]{
 const byId=new Map(recipes.map(recipe=>[recipe.id,recipe]));
 const out=new Map<string,PilotShoppingItem>();
 days.forEach(day=>daySlots.forEach(slot=>{
  const entry=plan[dateKey(day)]?.[slot];
  const meal=entry?byId.get(entry.id):undefined;
  if(!meal?.pilotSource||meal.pilotSource.ingredientsReviewed)return;
  // O rendimento permanece o da receita original até revisão das medidas.
  for(const ingredient of meal.ingredients){
   const text=ingredient.name.trim();
   if(!text)continue;
   const key=normalize(text.replace(/[.\s]+$/g,""));
   const old=out.get(key);
   if(old){
    old.quantity+=1;
    if(!old.sourceRecipes.includes(meal.title))old.sourceRecipes.push(meal.title);
   }else{
    out.set(key,{
     name:"Piloto · "+text.replace(/[.\s]+$/g,""),quantity:1,unit:"un",sourceText:text,
     sourceRecipes:[meal.title]
    });
   }
  }
 }));
 return [...out.values()].sort((a,b)=>a.sourceText.localeCompare(b.sourceText,"pt-BR"));
}


/** Apenas ingredientes obrigatórios com quantidades confiáveis participam do total. */
export function consolidateShopping(days:Date[],plan:Plan,recipes:Meal[]):ShoppingItem[]{
 const byId=new Map(recipes.map(r=>[r.id,r]));
 const result=new Map<string,ShoppingItem>();
 days.forEach(d=>daySlots.forEach((slot:Slot)=>{
  const planned=plan[dateKey(d)]?.[slot];
  const meal=planned?byId.get(planned.id):undefined;
  if(!planned||!meal||meal.servings<=0)return;
  if(meal.pilotSource&&!meal.pilotSource.ingredientsReviewed)return;
  meal.ingredients.forEach(item=>{
   if(item.optional||(item.measureMode??"measured")!=="measured"
      ||item.quantity===null||!Number.isFinite(item.quantity)||item.quantity<=0)return;
   const u=aliases[item.unit.toLowerCase()]??{base:item.unit.toLowerCase(),factor:1};
   const name=normalize(item.name);
   const key=name+"|"+u.base;
   const prev=result.get(key);
   const quantity=item.quantity*u.factor*planned.servings/meal.servings;
   if(!Number.isFinite(quantity)||quantity<=0)return;
   result.set(key,{name:prev?.name??item.name,unit:u.base,quantity:Math.round(((prev?.quantity??0)+quantity)*1000)/1000});
  });
 }));
 return [...result.values()].sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
}

/**
 * Ingredientes a gosto e opcionais não desaparecem.
 * São mostrados como observações, fora do total e das caixas de "comprado".
 */
export function shoppingNotes(days:Date[],plan:Plan,recipes:Meal[]):ShoppingNote[]{
 const byId=new Map(recipes.map(r=>[r.id,r]));
 const notes=new Map<string,ShoppingNote>();
 days.forEach(d=>daySlots.forEach((slot:Slot)=>{
  const planned=plan[dateKey(d)]?.[slot];
  const meal=planned?byId.get(planned.id):undefined;
  if(!planned||!meal||meal.servings<=0)return;
  if(meal.pilotSource&&!meal.pilotSource.ingredientsReviewed)return;
  meal.ingredients.forEach(i=>{
   const mode=i.measureMode??"measured";
   if(!i.optional&&mode==="measured"&&i.quantity!==null)return;
   // Quantidades opcionais podem variar com cada receita: nunca inferir ou somar.
   const label=normalize(i.name)+"|"+mode+"|"+i.unit+"|"+Boolean(i.optional);
   if(!notes.has(label)){
    notes.set(label,{
      name:i.name,
      description:formatRecipeIngredient(i,planned.servings/meal.servings),
    });
   }
  });
 }));
 return [...notes.values()].sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
}
