import type {FoodPreferences} from "./suggestions";

export const profileGoals=[
 ["eat_better","Comer melhor"],
 ["plan_meals","Organizar refeições"],
 ["balanced_weight","Cuidar do peso com equilíbrio"],
 ["build_habits","Cultivar hábitos"],
 ["maintain_balance","Manter equilíbrio"]
] as const;
export const profileLikes=["Verduras","Frutas","Massas","Carnes","Peixes","Vegetariano","Vegano","Sem lactose","Sem glúten"] as const;
export const profileAvoids=["Berinjela","Pimentão","Fígado","Quiabo","Peixe","Cebola"] as const;
export const profileAllergens=["Leite","Glúten","Amendoim","Castanhas","Ovo","Peixes","Crustáceos","Soja","Gergelim","Outros"] as const;

const cleanList=(value:unknown):string[]=>{
 if(!Array.isArray(value))return [];
 return [...new Set(value.filter((s):s is string=>typeof s==="string")
  .map(s=>s.trim()).filter(s=>s.length>0&&s.length<=80))];
};
export function normalizeProfilePreferences(value:Partial<FoodPreferences>):FoodPreferences{
 return {
  goal:typeof value.goal==="string"&&value.goal.trim()?value.goal.trim():null,
  liked_foods:cleanList(value.liked_foods),
  disliked_foods:cleanList(value.disliked_foods),
  allergies:cleanList(value.allergies),
  household_size:value.household_size==null?1:Number(value.household_size),
  cooking_minutes:value.cooking_minutes==null?40:Number(value.cooking_minutes)
 };
}
export function validateProfilePreferences(value:FoodPreferences):string|null{
 if(value.goal!==null&&!profileGoals.some(([key])=>key===value.goal))
  return "Escolha um objetivo válido.";
 if(!Number.isInteger(value.household_size)||value.household_size<1||value.household_size>20)
  return "Informe de 1 a 20 pessoas em casa.";
 if(!Number.isInteger(value.cooking_minutes)||value.cooking_minutes<5||value.cooking_minutes>360)
  return "Informe um tempo de preparo entre 5 e 360 minutos.";
 for(const field of [value.liked_foods,value.disliked_foods,value.allergies]){
  if(!Array.isArray(field)||field.some(s=>typeof s!=="string"||!s.trim()||s.length>80))
   return "Há uma preferência inválida. Revise suas opções.";
 }
 return null;
}
const equivalentList=(x:string[],y:string[])=>x.length===y.length &&
 [...new Set(x)].sort().join("\u0000")===[...new Set(y)].sort().join("\u0000");
export const allergiesChanged=(a:FoodPreferences,b:FoodPreferences)=>!equivalentList(a.allergies,b.allergies);
export const preferencesEqual=(a:FoodPreferences,b:FoodPreferences)=>
 a.goal===b.goal&&a.household_size===b.household_size&&a.cooking_minutes===b.cooking_minutes
 &&equivalentList(a.liked_foods,b.liked_foods)
 &&equivalentList(a.disliked_foods,b.disliked_foods)
 &&equivalentList(a.allergies,b.allergies);
export function profileChoices(standard:readonly string[],current:readonly string[]):string[]{
 return [...new Set([...standard,...current])];
}
