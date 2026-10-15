import { supabase } from "./supabase";

export type RecipeCategory = "Café da manhã" | "Almoço" | "Jantar" | "Lanche";
export type Slot = "Café da manhã" | "Lanche da manhã" | "Almoço" | "Lanche da tarde" | "Jantar" | "Ceia";
export type Ingredient = {name:string;quantity:number|null;unit:string;measureMode?:"measured"|"taste"|"unspecified";optional?:boolean};
export type PilotRecipeSource = {
 kind:"week"|"salad"|"snack"|"supper"|"sauce";
 sourceMeal:string;
 originalIngredients:string;
 originalTime:string;
 originalYield:string;
 sourceDocument:string;
 ingredientsReviewed:boolean;
};
export type Meal = {id:string;title:string;category:RecipeCategory;ingredients:Ingredient[];minutes:number;servings:number;description:string|null;instructions:string|null;imageUrl:string|null;ownerId:string|null;imageIsAi:boolean;pilotSource?:PilotRecipeSource};
export type PlannedMeal = {id:string;servings:number};
export type Plan = Record<string,Partial<Record<Slot,PlannedMeal>>>;
// As três refeições principais continuam sendo a referência da sugestão automática.
export const slots:Slot[]=["Café da manhã","Almoço","Jantar"];
export const optionalSlots:Slot[]=["Lanche da manhã","Lanche da tarde","Ceia"];
export const daySlots:Slot[]=["Café da manhã","Lanche da manhã","Almoço","Lanche da tarde","Jantar","Ceia"];
export const isOptionalSlot=(slot:Slot)=>optionalSlots.includes(slot);
export const recipeCategoryForSlot=(slot:Slot):RecipeCategory =>
 isOptionalSlot(slot)?"Lanche":slot as RecipeCategory;
const fromSlot:Record<Slot,string>={
 "Café da manhã":"breakfast","Lanche da manhã":"morning_snack",
 "Almoço":"lunch","Lanche da tarde":"afternoon_snack",
 "Jantar":"dinner","Ceia":"supper"
};
const toSlot:Record<string,Slot>={breakfast:"Café da manhã",morning_snack:"Lanche da manhã",lunch:"Almoço",afternoon_snack:"Lanche da tarde",dinner:"Jantar",supper:"Ceia"};
const toRecipeCategory:Record<string,RecipeCategory>={breakfast:"Café da manhã",lunch:"Almoço",dinner:"Jantar",snack:"Lanche"};
/** Seleção livre de dias, respeitando o tipo original (ceia, lanche, salada). */
export function recipeFitsSlot(recipe:Meal,slot:Slot):boolean{
 const kind=recipe.pilotSource?.kind;
 if(kind==="salad")return slot==="Almoço"||slot==="Jantar";
 if(kind==="supper")return slot==="Ceia";
 if(kind==="snack")return slot==="Lanche da manhã"||slot==="Lanche da tarde";
 if(kind==="sauce")return false;
 return recipe.category===recipeCategoryForSlot(slot);
}
export const dateKey=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
export function startOfWeek(date:Date){const d=new Date(date);d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
const toPlan=(rows:Array<{meal_date:string;slot:string;recipe_id:string;servings:number}>):Plan=>rows.reduce((all,row)=>{
 const slot=toSlot[row.slot];if(slot)all[row.meal_date]={...all[row.meal_date],[slot]:{id:row.recipe_id,servings:row.servings}};return all;
},{} as Plan);
export async function loadRecipes():Promise<Meal[]>{
 if(!supabase)return [];
 const [recipeResult,adminResult]=await Promise.all([
  supabase.from("recipes").select("id,title,category,prep_minutes,servings,description,instructions,url,owner_user_id,published,image_is_ai,recipe_ingredients(name,quantity,unit,measure_mode,is_optional)").order("title"),
  supabase.rpc("cc_is_admin")
 ]);
 if(recipeResult.error)throw recipeResult.error;
 // Nunca incluir rascunhos oficiais de outro usuário: somente o administrador vê o próprio piloto.
 const isAdmin=!adminResult.error && adminResult.data===true;
 const sources=new Map<string,PilotRecipeSource>();
 if(isAdmin){
  const {data,error}=await supabase.from("cc_official_recipe_source_records")
   .select("recipe_id,source_kind,source_meal_name,source_document,original_ingredients,original_time,original_yield,ingredient_review_status,is_plannable,use_stage")
   .eq("use_stage","personal_pilot").eq("is_plannable",true);
  if(error)throw error;
  for(const row of data??[]){
   sources.set(row.recipe_id,{
    kind:row.source_kind as PilotRecipeSource["kind"],
    sourceMeal:row.source_meal_name,
    originalIngredients:row.original_ingredients,
    originalTime:row.original_time,
    originalYield:row.original_yield,
    sourceDocument:row.source_document,
    ingredientsReviewed:row.ingredient_review_status==="structured_confirmed"
   });
  }
 }
 const data=recipeResult.data??[];
 const ownPaths=data.filter(r=>r.owner_user_id&&r.url?.startsWith("personal-recipe-images/")).map(r=>r.url!.slice("personal-recipe-images/".length));
 const signed=new Map<string,string>();
 if(ownPaths.length){const {data:links}=await supabase.storage.from("personal-recipe-images").createSignedUrls(ownPaths,3600);links?.forEach((link,i)=>{if(link.signedUrl)signed.set(ownPaths[i],link.signedUrl);});}
 return data.filter(r=>Boolean(toRecipeCategory[r.category])&&(r.published || r.owner_user_id || sources.has(r.id))).map(r=>({
  id:r.id,title:r.title,category:toRecipeCategory[r.category],minutes:r.prep_minutes,servings:r.servings,
  description:r.description,instructions:r.instructions,
  imageUrl:r.url?.startsWith("personal-recipe-images/")?(signed.get(r.url.slice("personal-recipe-images/".length))??null):r.url,
  ownerId:r.owner_user_id,imageIsAi:r.owner_user_id?Boolean(r.image_is_ai):true,
  pilotSource:sources.get(r.id),
  ingredients:(r.recipe_ingredients||[]).map(i=>({name:i.name,quantity:i.quantity==null?null:Number(i.quantity),unit:i.unit,measureMode:i.measure_mode??"measured",optional:Boolean(i.is_optional)}))
 })).sort((a,b)=>{
  // Acervo pessoal em primeiro lugar; exemplos antigos permanecem identificados e por último.
  const priority=(m:Meal)=>m.pilotSource?0:m.ownerId?1:2;
  return priority(a)-priority(b)||a.title.localeCompare(b.title,"pt-BR");
 });
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

// Deslocamento atomico: a RPC realiza toda a movimentacao na mesma transacao.
// A origem e o destino esperados protegem contra abas com cardapio desatualizado.
export async function moveMeal(
  userId: string,
  weekStart: string,
  sourceDay: string,
  destinationDay: string,
  slot: Slot,
  source: PlannedMeal,
  destination: PlannedMeal | undefined,
): Promise<void> {
  if (!supabase) throw new Error("Supabase indisponível.");
  if (!daySlots.includes(slot)) {
    throw new Error("Refeição não compatível com este planejador.");
  }
  if (sourceDay === destinationDay || !source.id
      || !Number.isInteger(source.servings) || source.servings < 1 || source.servings > 20) {
    throw new Error("Origem ou destino inválido.");
  }
  for (const day of [sourceDay, destinationDay]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)
        || dateKey(startOfWeek(new Date(day + "T12:00:00"))) !== weekStart) {
      throw new Error("A transferência deve permanecer na mesma semana.");
    }
  }
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || data.user?.id !== userId) {
    throw new Error("Sessão alterada. Entre novamente antes de mover a refeição.");
  }
  const { error } = await supabase.rpc("cc_move_planned_meal", {
    p_week_start: weekStart,
    p_source_date: sourceDay,
    p_destination_date: destinationDay,
    p_slot: fromSlot[slot],
    p_expected_source_recipe: source.id,
    p_expected_source_servings: source.servings,
    p_expected_destination_recipe: destination?.id ?? null,
    p_expected_destination_servings: destination?.servings ?? null,
  });
  if (error) throw error;
}
