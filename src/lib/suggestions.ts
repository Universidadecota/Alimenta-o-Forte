import {type Meal,type Plan,slots,dateKey} from "./planner";
export type FoodPreferences={goal:string|null;liked_foods:string[];disliked_foods:string[];allergies:string[];household_size:number;cooking_minutes:number};
export const defaultPreferences:FoodPreferences={goal:null,liked_foods:[],disliked_foods:[],allergies:[],household_size:1,cooking_minutes:40};
const normal=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const groups:Record<string,string[]>={peixe:["peixe","salmao","tilapia","atum","sardinha"],cebola:["cebola"],berinjela:["berinjela","beringela"],pimentao:["pimentao"],figado:["figado"],quiabo:["quiabo"]};
export function canMatchAvoidedIngredient(meal:Meal,avoids:string[]):boolean{
 const names=meal.ingredients.map(i=>normal(i.name));
 return avoids.some(food=>{const terms=groups[normal(food)]??[normal(food)];return names.some(name=>terms.some(term=>name.includes(term)));});
}
export function proposeWeek(recipes:Meal[],prefs:FoodPreferences,days:Date[]):Plan{
 // No recipe catalog currently has verified allergen declarations, including cross-contamination.
 if(prefs.allergies.length)throw new Error("Há alergias/intolerâncias cadastradas, mas as receitas ainda não têm dados verificados de alérgenos. Por segurança, a sugestão automática está desabilitada. Consulte os ingredientes e um profissional qualificado.");
 const servings=Math.max(1,Math.min(20,Math.trunc(prefs.household_size)||1));
 const result:Plan={};
 for(const slot of slots){
  const available=recipes.filter(r=>r.category===slot&&r.ingredients.length>0&&!canMatchAvoidedIngredient(r,prefs.disliked_foods));
  const withinTime=available.filter(r=>r.minutes<=prefs.cooking_minutes);
  const candidates=withinTime.length?withinTime:available;
  if(!candidates.length)throw new Error("Não há receitas suficientes na categoria "+slot+" após os filtros. Ajuste suas preferências ou cadastre receitas.");
  const ordered=[...candidates].sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));
  days.forEach((d,i)=>{
   const recipe=ordered[(i+Math.floor(i/ordered.length))%ordered.length];
   const key=dateKey(d);
   result[key]={...result[key],[slot]:{id:recipe.id,servings}};
  });
 }
 return result;
}
