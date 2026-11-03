/** Resumo editorial somente leitura: nunca aprova, publica ou transforma medidas. */
export type QualityIngredient={
 name:string;quantity:number|null;unit:string;measure_mode:string;is_optional:boolean;
};
export type QualityRecipe={
 id:string;title:string;published:boolean;description:string|null;instructions:string|null;
 prep_minutes:number;servings:number;recipe_ingredients:QualityIngredient[];
};
export type PilotSourceReview={
 recipe_id:string;ingredient_review_status:string;commercial_rights_status:string;
};
export type QualityAttention={id:string;title:string;reasons:string[]};

export function summarizeRecipeQuality(
 recipes:readonly QualityRecipe[],
 sources:readonly PilotSourceReview[]
){
 const pilotById=new Map(sources.map(source=>[source.recipe_id,source]));
 const pilots=recipes.filter(recipe=>pilotById.has(recipe.id));
 const other=recipes.filter(recipe=>!pilotById.has(recipe.id));
 const pilotNeedsMeasures=pilots.filter(recipe=>pilotById.get(recipe.id)?.ingredient_review_status!=="structured_confirmed").length;
 const pilotRightsPending=pilots.filter(recipe=>pilotById.get(recipe.id)?.commercial_rights_status==="pending_review").length;
 const attention:QualityAttention[]=[];
 let nonpilotUnquantifiedIngredients=0;
 let nonpilotStrictMeasureErrors=0;
 for(const recipe of other){
  const reasons:string[]=[];
  if(!recipe.recipe_ingredients.length)reasons.push("Sem ingredientes cadastrados");
  if(!recipe.instructions?.trim())reasons.push("Preparo não informado");
  if(!recipe.description?.trim())reasons.push("Descrição não informada");
  if(!Number.isFinite(recipe.servings)||recipe.servings<=0)reasons.push("Rendimento precisa de revisão");
  if(!Number.isFinite(recipe.prep_minutes)||recipe.prep_minutes<=0)reasons.push("Tempo de preparo precisa de revisão");
  const unquantified=recipe.recipe_ingredients.filter(item=>
   item.quantity===null && item.measure_mode!=="taste"
  );
  nonpilotUnquantifiedIngredients+=unquantified.length;
  if(unquantified.length)reasons.push(`${unquantified.length} ingrediente(s) sem quantidade estruturada (conferir se é intencional)`);
  const inconsistent=recipe.recipe_ingredients.filter(item=>
   item.measure_mode==="measured"&&(item.quantity===null||!Number.isFinite(item.quantity)||item.quantity<=0)
  );
  nonpilotStrictMeasureErrors+=inconsistent.length;
  if(inconsistent.length)reasons.push(`${inconsistent.length} medida(s) marcadas como aferidas, mas sem quantidade válida`);
  if(reasons.length)attention.push({id:recipe.id,title:recipe.title,reasons});
 }
 return {
  total:recipes.length,pilot:pilots.length,other:other.length,
  pilotNeedsMeasures,pilotRightsPending,
  published:recipes.filter(r=>r.published).length,
  nonpilotUnquantifiedIngredients,nonpilotStrictMeasureErrors,
  attention:attention.sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"))
 };
}
