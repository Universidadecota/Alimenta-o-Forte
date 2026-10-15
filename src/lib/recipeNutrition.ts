/**
 * Cálculo de composição nutricional da FÓRMULA, para uso apenas após homologação
 * de alimento, correspondência, medidas, rendimento e revisão técnica.
 * Nunca estimar zeros para ingredientes ausentes ou "a gosto".
 * Esta função não classifica alergênicos nem aprova publicação.
 */
export const nutrients=[
 "energy_kcal","protein_g","carbohydrates_g","fats_g","fiber_g","sodium_mg"
] as const;
export type NutrientKey=typeof nutrients[number];
export type NutrientValues=Record<NutrientKey,number>;
export type NutritionEvidence={
 variantId:string;
 foodName:string;
 editorialStatus:string;
 per100g:Partial<Record<NutrientKey,number|null>>|null;
 source:string|null;
 reviewedAt:string|null;
 foodState:string|null;
};
export type IngredientNutritionInput={
 name:string;
 quantity:number|null;
 unit:string;
 measureMode:string;
 optional:boolean;
 food?:NutritionEvidence;
 link?:{
  variantId:string|null;
  status:string;
  matchNotes:string;
  totalMassG:number|null;
  massEvidence:string;
 };
};
export type NutritionCalculation=
 | {status:"incomplete";missing:string[]}
 | {status:"calculated_unreviewed";perRecipe:NutrientValues;perServing:NutrientValues;
    sources:string[];omittedOptionals:string[];disclaimer:string};
export type OptionalPolicy="block"|"include"|"exclude";

/** Resultados por porção só são expostos se TODOS os dados necessários estiverem presentes. */
export function calculateRecipeNutrition(
 ingredients:IngredientNutritionInput[],
 servings:number,
 optionalPolicy:OptionalPolicy="block"
):NutritionCalculation{
 const missing:string[]=[];
 const sources=new Set<string>();
 const omittedOptionals:string[]=[];
 const values=Object.fromEntries(nutrients.map(k=>[k,0])) as NutrientValues;
 if(!Number.isInteger(servings)||servings<1||servings>1000){
  return {status:"incomplete",missing:["Rendimento em porções ausente ou inválido."]};
 }
 if(!ingredients.length)return {status:"incomplete",missing:["Receita sem ingredientes."]};
 for(const ingredient of ingredients){
  if(ingredient.optional&&optionalPolicy==="exclude"){
   omittedOptionals.push(ingredient.name);
   continue;
  }
  if(ingredient.optional&&optionalPolicy==="block"){
   missing.push(ingredient.name+": informar se o ingrediente opcional entra na fórmula.");
   continue;
  }
  if(ingredient.measureMode!=="measured"||ingredient.quantity===null||
     !Number.isFinite(ingredient.quantity)||ingredient.quantity<=0){
   missing.push(ingredient.name+": falta quantidade numérica comprovada.");
   continue;
  }
  const link=ingredient.link;
  if(!link||link.status!=="confirmed"||!link.variantId||
     link.matchNotes.trim().length<3||!ingredient.food||
     link.variantId!==ingredient.food.variantId){
   missing.push(ingredient.name+": identificação do alimento ainda não confirmada.");
   continue;
  }
  let mass:number|null=null;
  if(ingredient.unit==="g")mass=ingredient.quantity;
  else if(ingredient.unit==="kg")mass=ingredient.quantity*1000;
  else if(link.totalMassG!==null&&link.massEvidence.trim().length>=3)mass=link.totalMassG;
  if(mass===null||!Number.isFinite(mass)||mass<=0){
   missing.push(ingredient.name+": conversão para gramas sem evidência.");
   continue;
  }
  const food=ingredient.food;
  if(food.editorialStatus!=="verified"||!food.per100g||
    !food.source||!food.reviewedAt||
    !food.foodState||food.foodState==="unspecified"){
   missing.push(ingredient.name+": composição/estado da fonte ainda não verificados.");
   continue;
  }
  const invalid=nutrients.filter(key=>{
   const n=food.per100g?.[key];
   return typeof n!=="number"||!Number.isFinite(n)||n<0;
  });
  if(invalid.length){
   missing.push(ingredient.name+": composição incompleta ("+invalid.join(", ")+").");
   continue;
  }
  for(const key of nutrients)values[key]+=food.per100g[key]! *mass/100;
  sources.add(food.source);
 }
 if(missing.length)return {status:"incomplete",missing};
 const perServing=Object.fromEntries(nutrients.map(k=>[k,values[k]/servings])) as NutrientValues;
 return {status:"calculated_unreviewed",perRecipe:values,perServing,
  sources:[...sources],omittedOptionals,
  disclaimer:"Cálculo aritmético sujeito a revisão de preparo, rendimento, fonte e responsável técnico. Não é aprovação nutricional ou de alergênicos."};
}
