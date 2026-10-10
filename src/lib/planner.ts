import { supabase } from "./supabase";

export type Slot = "Café da manhã" | "Almoço" | "Jantar";
export type Ingredient = {name:string;quantity:number;unit:string};
export type Meal = {id:string;title:string;category:Slot;ingredients:Ingredient[];minutes:number;servings:number;description:string|null;instructions:string|null;imageUrl:string|null;ownerId:string|null};
export type PlannedMeal = {id:string;servings:number};
export type Plan = Record<string,Partial<Record<Slot,PlannedMeal>>>;
export const slots:Slot[]=["Café da manhã","Almoço","Jantar"];
const fromSlot:Record<Slot,string>={"Café da manhã":"breakfast","Almoço":"lunch","Jantar":"dinner"};
const toSlot:Record<string,Slot>={breakfast:"Café da manhã",lunch:"Almoço",dinner:"Jantar"};
export const dateKey=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
export function startOfWeek(date:Date){const d=new Date(date);d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
const toPlan=(rows:Array<{meal_date:string;slot:string;recipe_id:string;servings:number}>):Plan=>rows.reduce((all,row)=>{
 const slot=toSlot[row.slot];if(slot)all[row.meal_date]={...all[row.meal_date],[slot]:{id:row.recipe_id,servings:row.servings}};return all;
},{} as Plan);
export async function loadRecipes():Promise<Meal[]>{
 if(!supabase)return [];
 const {data,error}=await supabase.from("recipes").select("id,title,category,prep_minutes,servings,description,instructions,image_url,owner_user_id,published,recipe_ingredients(name,quantity,unit)").order("title");
 if(error)throw error;
 return (data||[]).filter(r=>!!toSlot[r.category]&&(r.published || r.owner_user_id)).map(r=>({
  id:r.id,title:r.title,category:toSlot[r.category],minutes:r.prep_minutes,servings:r.servings,description:r.description,instructions:r.instructions,imageUrl:r.image_url,ownerId:r.owner_user_id,
  ingredients:(r.recipe_ingredients||[]).map(i=>({name:i.name,quantity:Number(i.quantity),unit:i.unit}))
 }));
}
export async function loadWeek(userId:string,weekStart:string):Promise<Plan>{
 if(!supabase)throw new Error("Supabase indisponível");
 const {data:plans,error:plansError}=await supabase.from("meal_plans").select("id").eq("user_id",userId).eq("week_start",weekStart).maybeSingle();
 if(plansError)throw plansError;
 if(!plans)return {};
 const {data,error}=await supabase.from("planned_meals").select("meal_date,slot,recipe_id,servings").eq("user_id",userId).eq("meal_plan_id",plans.id);
 if(error)throw error;return toPlan(data||[]);
}
export async function saveMeal(userId:string,weekStart:string,day:string,slot:Slot,recipeId:string,servings=1):Promise<void>{
 if(!supabase)throw new Error("Supabase indisponível");
 if(!Number.isInteger(servings)||servings<1||servings>20)throw new Error("Porções inválidas.");
 const dayDate=new Date(day+"T12:00:00"),monday=startOfWeek(dayDate);
 if(dateKey(monday)!==weekStart)throw new Error("A refeição está fora da semana selecionada.");
 const {data:container,error:planError}=await supabase.from("meal_plans").upsert({user_id:userId,week_start:weekStart},{onConflict:"user_id,week_start"}).select("id").single();
 if(planError)throw planError;
 const {error}=await supabase.from("planned_meals").upsert({
  user_id:userId,meal_plan_id:container.id,meal_date:day,slot:fromSlot[slot],recipe_id:recipeId,servings
 },{onConflict:"meal_plan_id,meal_date,slot"});
 if(error)throw error;
}
export async function removeMeal(userId:string,weekStart:string,day:string,slot:Slot):Promise<void>{
 if(!supabase)throw new Error("Supabase indisponível");
 const {data,error}=await supabase.from("meal_plans").select("id").eq("user_id",userId).eq("week_start",weekStart).maybeSingle();
 if(error)throw error;if(!data)return;
 const deleted=await supabase.from("planned_meals").delete().eq("user_id",userId).eq("meal_plan_id",data.id).eq("meal_date",day).eq("slot",fromSlot[slot]);
 if(deleted.error)throw deleted.error;
}
