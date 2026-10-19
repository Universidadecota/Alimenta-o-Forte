import {type Meal,type Plan,slots,dateKey,recipeFitsSlot} from "./planner";
export type FoodPreferences={goal:string|null;liked_foods:string[];disliked_foods:string[];allergies:string[];household_size:number;cooking_minutes:number};
export const defaultPreferences:FoodPreferences={goal:null,liked_foods:[],disliked_foods:[],allergies:[],household_size:1,cooking_minutes:40};
const normal=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const groups:Record<string,string[]>={peixe:["peixe","salmao","tilapia","atum","sardinha"],cebola:["cebola"],berinjela:["berinjela","beringela"],pimentao:["pimentao"],figado:["figado"],quiabo:["quiabo"]};
export function canMatchAvoidedIngredient(meal:Meal,avoids:string[]):boolean{
 const names=[...meal.ingredients.map(i=>normal(i.name)),...(meal.pilotSource?[normal(meal.pilotSource.originalIngredients)]:[])];
 return avoids.some(food=>{const terms=groups[normal(food)]??[normal(food)];return names.some(name=>terms.some(term=>name.includes(term)));});
}
/** Novas sugestões para 7 dias; preserva o plano antigo até o usuário confirmar. */
export function proposeWeek(recipes:Meal[],prefs:FoodPreferences,days:Date[],current:Plan={}):Plan{
 if(prefs.allergies.length)throw new Error("Há alergias/intolerâncias cadastradas, mas as receitas ainda não têm dados verificados de alérgenos. Por segurança, a sugestão automática está desabilitada. Consulte os ingredientes e um profissional qualificado.");
 const servings=Math.max(1,Math.min(20,Math.trunc(prefs.household_size)||1));
 const result:Plan={};
 const used=new Map<string,number>();
 for(const slot of slots){
  const available=recipes.filter(r=>recipeFitsSlot(r,slot)
   &&(r.ingredients.length>0||Boolean(r.pilotSource?.originalIngredients.trim()))
   &&!canMatchAvoidedIngredient(r,prefs.disliked_foods));
  const withinTime=available.filter(r=>r.minutes<=prefs.cooking_minutes);
  // Receitas com prefixo editorial [Exemplo] ficam como recurso de demonstração,
  // não como sugestão prioritária quando existe catálogo normal compatível.
  const regular=withinTime.filter(r=>!/^\\s*\\[Exemplo\\]/i.test(r.title));
  const candidates=regular.length?regular:withinTime;
  if(!candidates.length)throw new Error("Não há receitas na categoria "+slot+" dentro do tempo de preparo escolhido. Ajuste o tempo disponível ou cadastre receitas.");
  let previousId:string|null=null;
  for(const day of days){
   const key=dateKey(day);
   const currentId=current[key]?.[slot]?.id;
   // Havendo alternativa, nunca repetir a receita do mesmo horário anterior.
   const alternatives=candidates.filter(r=>candidates.length===1||r.id!==currentId);
   const minUse=Math.min(...alternatives.map(r=>used.get(r.id)??0));
   let best=alternatives.filter(r=>(used.get(r.id)??0)===minUse);
   if(best.length>1&&previousId){
    const nonConsecutive=best.filter(r=>r.id!==previousId);
    if(nonConsecutive.length)best=nonConsecutive;
   }
   const recipe=best[Math.floor(Math.random()*best.length)];
   used.set(recipe.id,(used.get(recipe.id)??0)+1);
   previousId=recipe.id;
   result[key]={...result[key],[slot]:{
    id:recipe.id,
    servings:recipe.pilotSource&&!recipe.pilotSource.ingredientsReviewed?recipe.servings:servings
   }};
  }
 }
 return result;
}
