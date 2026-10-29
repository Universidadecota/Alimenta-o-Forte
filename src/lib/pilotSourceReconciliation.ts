import type {BatchItem} from "./pilotMeasureBatch";

/**
 * Conciliação exclusivamente de leitura entre o inventário histórico e os
 * ingredientes atualmente relacionados às receitas do piloto privado.
 * Não sugere equivalência 1:N e não autoriza gravações ou aprovações.
 */
export type CurrentPilotIngredient={
 id:string;
 recipe_id:string;
 name:string;
 position:number;
};

export type RecipeReconciliation={
 recipe_id:string;
 title:string;
 originalExpressions:number;
 currentIngredients:number;
 exact:number;
 nameMismatch:number;
 positionMismatch:number;
 bothMismatch:number;
 missingCurrent:number;
 untrackedCurrent:number;
 pending:number;
};

export type PilotSourceReconciliation={
 originalExpressions:number;
 currentIngredients:number;
 exact:number;
 nameMismatch:number;
 positionMismatch:number;
 bothMismatch:number;
 missingCurrent:number;
 untrackedCurrent:number;
 affectedRecipes:number;
 recipes:RecipeReconciliation[];
};

function titleOf(row:BatchItem):string{
 const recipe=Array.isArray(row.recipes)?row.recipes[0]:row.recipes;
 return recipe?.title?.trim()||"Receita sem título ("+row.recipe_id?.slice(0,8)+")";
}
function newRecipe(recipe_id:string,title:string):RecipeReconciliation{
 return {recipe_id,title,originalExpressions:0,currentIngredients:0,exact:0,
  nameMismatch:0,positionMismatch:0,bothMismatch:0,missingCurrent:0,
  untrackedCurrent:0,pending:0};
}
function discrepancyCount(recipe:RecipeReconciliation):number{
 return recipe.nameMismatch+recipe.positionMismatch+recipe.bothMismatch+
  recipe.missingCurrent+recipe.untrackedCurrent;
}
export function summarizeSourceReconciliation(
 sourceRows:ReadonlyArray<BatchItem>,
 currentRows:ReadonlyArray<CurrentPilotIngredient>
):PilotSourceReconciliation{
 const summaries=new Map<string,RecipeReconciliation>();
 const sourceIds=new Set<string>();
 const sourceRowsById=new Map<string,BatchItem>();
 const currentIds=new Map<string,CurrentPilotIngredient>();
 for(const row of sourceRows){
  if(!row.recipe_id||!row.ingredient_id||!Number.isInteger(row.source_position)){
   throw new Error("Inventário histórico contém vínculo ou posição inválidos; conciliação interrompida.");
  }
  if(sourceIds.has(row.ingredient_id)){
   throw new Error("Identificador histórico duplicado; conciliação interrompida.");
  }
  sourceIds.add(row.ingredient_id);
  sourceRowsById.set(row.ingredient_id,row);
  if(!summaries.has(row.recipe_id)){
   summaries.set(row.recipe_id,newRecipe(row.recipe_id,titleOf(row)));
  }
  const summary=summaries.get(row.recipe_id)!;
  summary.originalExpressions++;
  if(row.review_status==="pending")summary.pending++;
 }
 for(const row of currentRows){
  if(!row.id||!row.recipe_id||!Number.isInteger(row.position)){
   throw new Error("Ingrediente atual contém vínculo ou posição inválidos; conciliação interrompida.");
  }
  if(currentIds.has(row.id)){
   throw new Error("Identificador de ingrediente atual duplicado; conciliação interrompida.");
  }
  currentIds.set(row.id,row);
  const recipe=summaries.get(row.recipe_id);
  if(recipe)recipe.currentIngredients++;
 }
 for(const row of sourceRows){
  const recipe=summaries.get(row.recipe_id!)!;
  const current=currentIds.get(row.ingredient_id);
  if(!current||current.recipe_id!==row.recipe_id){
   recipe.missingCurrent++;
  }else{
   const sameName=current.name===row.source_text;
   const samePosition=current.position===row.source_position;
   if(sameName&&samePosition)recipe.exact++;
   else if(!sameName&&samePosition)recipe.nameMismatch++;
   else if(sameName&&!samePosition)recipe.positionMismatch++;
   else recipe.bothMismatch++;
  }
 }
 for(const current of currentRows){
  const recipe=summaries.get(current.recipe_id);
  if(!recipe)continue;
  const historical=sourceRowsById.get(current.id);
  if(!historical||historical.recipe_id!==current.recipe_id){
   recipe.untrackedCurrent++;
  }
 }
 const recipes=[...summaries.values()].sort((a,b)=>
  discrepancyCount(b)-discrepancyCount(a)||
  a.title.localeCompare(b.title,"pt-BR")||a.recipe_id.localeCompare(b.recipe_id));
 const totals: PilotSourceReconciliation={
  originalExpressions:sourceRows.length,
  currentIngredients:recipes.reduce((sum,recipe)=>sum+recipe.currentIngredients,0),
  exact:0,nameMismatch:0,positionMismatch:0,bothMismatch:0,
  missingCurrent:0,untrackedCurrent:0,affectedRecipes:0,recipes
 };
 for(const recipe of recipes){
  totals.exact+=recipe.exact;
  totals.nameMismatch+=recipe.nameMismatch;
  totals.positionMismatch+=recipe.positionMismatch;
  totals.bothMismatch+=recipe.bothMismatch;
  totals.missingCurrent+=recipe.missingCurrent;
  totals.untrackedCurrent+=recipe.untrackedCurrent;
  if(discrepancyCount(recipe)>0)totals.affectedRecipes++;
 }
 if(totals.exact+totals.nameMismatch+totals.positionMismatch+
  totals.bothMismatch+totals.missingCurrent!==totals.originalExpressions){
  throw new Error("A conciliação histórica não fechou; resultado descartado.");
 }
 if(totals.exact+totals.nameMismatch+totals.positionMismatch+
  totals.bothMismatch+totals.untrackedCurrent!==totals.currentIngredients){
  throw new Error("A conciliação atual não fechou; resultado descartado.");
 }
 return totals;
}
