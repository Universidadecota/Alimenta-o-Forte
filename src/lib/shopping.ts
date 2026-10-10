import {type Meal,type Plan,type Slot,dateKey,slots} from "./planner";
const aliases:Record<string,{base:string;factor:number}>={g:{base:"g",factor:1},kg:{base:"g",factor:1000},ml:{base:"ml",factor:1},l:{base:"ml",factor:1000},un:{base:"un",factor:1}};
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g," ");
export type ShoppingItem={name:string;quantity:number;unit:string};
export function consolidateShopping(days:Date[],plan:Plan,recipes:Meal[]):ShoppingItem[]{
 const byId=new Map(recipes.map(r=>[r.id,r]));
 const result=new Map<string,ShoppingItem>();
 days.forEach(d=>slots.forEach((slot:Slot)=>{
  const planned=plan[dateKey(d)]?.[slot];
  const meal=planned?byId.get(planned.id):undefined;
  if(!planned||!meal||meal.servings<=0)return;
  meal.ingredients.forEach(item=>{
   const u=aliases[item.unit.toLowerCase()]??{base:item.unit.toLowerCase(),factor:1};
   const name=normalize(item.name);
   const key=name+"|"+u.base;
   const prev=result.get(key);
   const quantity=item.quantity*u.factor*planned.servings/meal.servings;
   if(!Number.isFinite(quantity)||quantity<=0)return;
   result.set(key,{name:prev?.name??item.name,unit:u.base,quantity:Math.round(((prev?.quantity??0)+quantity)*100)/100});
  });
 }));
 return [...result.values()].sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
}
