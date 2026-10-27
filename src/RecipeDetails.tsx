import RecipeImage from "./RecipeImage";
import RecipeRating from "./RecipeRating";
import RecipeNutrition from "./RecipeNutrition";
import { useState } from "react";
import { ArrowLeft, Clock3, Heart, Minus, Plus } from "lucide-react";
import type { Meal } from "./lib/planner";
import { formatRecipeIngredient } from "./lib/ingredientMeasures";
import {formatPilotRecipeTime} from "./lib/pilotRecipeTime.mjs";
import {parseRecipePreparation} from "./lib/recipePreparationSections.mjs";
import {parsePilotIngredientDisplay,parsePilotIngredientGroups} from "./lib/pilotIngredientDisplay.mjs";

type Props={recipe:Meal;destinationDateLabel:string;onClose:()=>void;onAdd:(servings:number)=>void;canAdd:boolean;backLabel?:string;isFavorite:boolean;favoriteBusy:boolean;onToggleFavorite:()=>void};
export default function RecipeDetails({recipe,destinationDateLabel,onClose,onAdd,canAdd,backLabel="Voltar às receitas",isFavorite,favoriteBusy,onToggleFavorite}:Props){
 const [servings,setServings]=useState(recipe.servings);
 const {steps,tips,safety}=parseRecipePreparation(recipe.instructions);
 const pilotIngredientItems=recipe.pilotSource?parsePilotIngredientDisplay(recipe.pilotSource.originalIngredients):null;
 const pilotIngredientGroups=recipe.pilotSource&&!pilotIngredientItems?parsePilotIngredientGroups(recipe.pilotSource.originalIngredients):null;
 const includesCompiledSauce=Boolean(recipe.pilotSource&&
  /rendimento próprio: 2 a 3 porções/iu.test(recipe.pilotSource.originalIngredients));
 const includesUncookedYolkSauce=Boolean(recipe.pilotSource&&
  /maionese\s+(?:caseira|artesanal)|maionese\s*:|molho caesar/iu.test(recipe.pilotSource.originalIngredients));
 const includesRawFishPreparation=Boolean(recipe.pilotSource&&/ceviche/i.test(recipe.title));
 const includesAnchovy=Boolean(recipe.pilotSource&&/anchovas?|aliches?/iu.test(recipe.pilotSource.originalIngredients));
 const includesSeasonedSeaweed=Boolean(recipe.pilotSource&&/wakame|nori/iu.test(recipe.pilotSource.originalIngredients));
 const displayedTime=formatPilotRecipeTime(recipe);
 return <section className="recipe-details">
  <button type="button" className="secondary" onClick={onClose}><ArrowLeft size={16}/> {backLabel}</button>
  <button type="button" className="secondary" aria-pressed={isFavorite} disabled={favoriteBusy} onClick={onToggleFavorite}><Heart size={16} fill={isFavorite?"currentColor":"none"}/> {isFavorite?"Remover dos favoritos":"Salvar nos favoritos"}</button>
  <div className="recipe-detail-head">
   <div className="detail-symbol"><RecipeImage src={recipe.imageUrl} title={recipe.title} isAi={recipe.imageIsAi} large/></div>
   <div><span className="eyebrow">{recipe.pilotSource?.kind==="supper"?"Ceia":recipe.pilotSource?.kind==="salad"?"Salada · almoço ou jantar":recipe.pilotSource?.kind==="snack"?"Lanche":recipe.category}</span><h2>{recipe.title}</h2>
    <p>{recipe.pilotSource?(includesCompiledSauce?"Receita autoral Costa&Costa para uso pessoal. O molho foi incorporado de outra ficha do mesmo documento, preservando seu rendimento; confira rótulos e alergênicos.":"Receita autoral Costa&Costa para uso pessoal. O documento de origem é preservado; a ficha exibida pode incluir correções editoriais de clareza. Confira rótulos e alergênicos antes de consumir."):recipe.description || "Receita em organização culinária."}</p>
    <div className="recipe-meta"><span><Clock3 size={17}/> {displayedTime}</span>{!recipe.pilotSource&&<span>{recipe.servings} {recipe.servings===1?"porção de referência":"porções de referência"}</span>}</div>
   </div>
  </div>
  <div className="detail-columns">
   <section className="detail-panel"><h3>Ingredientes</h3>{recipe.pilotSource
   ?<><p className="detail-note"><strong>Rendimento original:</strong> {recipe.pilotSource.originalYield}. Porções mantidas conforme a receita.</p>{includesCompiledSauce&&<p className="detail-note">O molho rende de 2 a 3 porções. A ficha mostra todos os ingredientes necessários para preparar esse lote; a quantidade usada na salada não foi presumida.</p>}</>
   :<div className="portion-stepper"><span>Porções</span><button type="button" disabled={servings<=1} onClick={()=>setServings(v=>Math.max(1,v-1))} aria-label="Diminuir porções"><Minus size={16}/></button><strong>{servings}</strong><button type="button" disabled={servings>=20} onClick={()=>setServings(v=>Math.min(20,v+1))} aria-label="Aumentar porções"><Plus size={16}/></button></div>}
   {recipe.pilotSource?<div className="cc-pilot-source-ingredients">
    <p><strong>{includesCompiledSauce?"Ingredientes da salada e do molho complementar:":"Ingredientes conforme o documento original:"}</strong></p>
    {pilotIngredientItems?<ul className="cc-ingredient-items">{pilotIngredientItems.map((item,i)=><li key={i}>{item}</li>)}</ul>
     :pilotIngredientGroups?<div className="cc-ingredient-groups">{pilotIngredientGroups.map((group,i)=><section key={i}>
      {group.title&&<h4>{group.title}</h4>}
      {group.items?<ul className="cc-ingredient-items">{group.items.map((item,j)=><li key={j}>{item}</li>)}</ul>
       :<p style={{whiteSpace:"pre-line"}}>{group.text}</p>}
     </section>)}</div>
     :<p style={{whiteSpace:"pre-line"}}>{recipe.pilotSource.originalIngredients.replace(/\\n/g,"\n")}</p>}

   </div>:<ul className="ingredients">{recipe.ingredients.map((ingredient,i)=><li key={i}><span>{ingredient.name}</span><strong>{formatRecipeIngredient(ingredient,servings/recipe.servings)}</strong></li>)}</ul>}
   {recipe.pilotSource?<details className="detail-note"><summary>Ver informações sobre medidas e segurança</summary><div><p>{includesCompiledSauce?"O molho foi transcrito de outra ficha do mesmo documento, com as quantidades do lote original. A salada e o molho não foram redimensionados automaticamente.":"O documento de origem está preservado; a apresentação pode conter ajustes editoriais de leitura e etapas de preparo. Não há redimensionamento automático das porções até a revisão das medidas."}</p><p>A lista de compras soma apenas medidas compatíveis identificadas com segurança; quantidades ambíguas são apresentadas separadamente, sem conversões inventadas.</p><p>Alérgenos, contaminação cruzada e composição nutricional ainda não foram verificados. Confira ingredientes e rótulos antes de consumir.</p>
    {includesUncookedYolkSauce&&<p className="notice" role="alert"><strong>Atenção à maionese ou molho com gema:</strong> a preparação descrita utiliza gema sem cocção. Para molhos não cozidos, utilize gema pasteurizada; não considere segura a utilização de ovo cru comum. Mantenha ingredientes e utensílios higienizados e refrigere imediatamente. A eventual indicação de conservação por até dois dias no documento não garante segurança microbiológica.</p>}
    {includesAnchovy&&<p className="notice" role="alert"><strong>Atenção aos alergênicos:</strong> a receita contém anchovas, que são peixe. O molho Caesar também contém gema (ovo), e a salada leva gergelim. Essas informações não substituem uma revisão formal de alergênicos e contaminação cruzada.</p>}
    {includesSeasonedSeaweed&&<p className="notice" role="alert"><strong>Atenção ao rótulo da alga:</strong> confirme se o produto contém soja ou outros ingredientes alergênicos, especialmente se estiver temperado. A salada e o vinagrete também contêm gergelim.</p>}
    {includesRawFishPreparation&&<p className="notice" role="alert"><strong>Atenção ao ceviche:</strong> marinar peixe em limão não equivale a cozinhá-lo nem elimina todos os riscos de microrganismos e parasitas. Utilize apenas pescado controlado para consumo cru ou prefira o preparo com o peixe completamente cozido, especialmente para pessoas de maior risco.</p>}
   </div></details>:<p className="detail-note">As quantidades são referências demonstrativas. Ao adicionar ao cardápio, as porções selecionadas também serão consideradas na lista de compras.</p>}
   </section>
   <section className="detail-panel"><h3>Modo de preparo</h3>{steps.length>0?<ol className="preparation">{steps.map((step,i)=><li key={i}>{step}</li>)}</ol>:<p className="detail-note">O modo de preparo desta receita ainda não foi cadastrado e revisado. Não vamos apresentar instruções inventadas como definitivas.</p>}
   {tips.length>0&&<aside className="recipe-preparation-tips"><h4>Dicas para dar certo</h4><ul>{tips.map((tip,i)=><li key={i}>{tip}</li>)}</ul></aside>}
   {safety.length>0&&<aside className="recipe-preparation-safety"><h4>Cuidados de segurança</h4><ul>{safety.map((warning,i)=><li key={i}>{warning}</li>)}</ul></aside>}
   <button type="button" className="primary" disabled={!canAdd} onClick={()=>onAdd(servings)}><Plus size={16}/> {recipe.category==="Lanche"||recipe.pilotSource?.kind==="salad"?"Escolher horário · "+destinationDateLabel:"Adicionar em "+destinationDateLabel}</button>
   </section>
  </div>
  <RecipeNutrition recipe={recipe}/>
  <RecipeRating recipeId={recipe.id}/>
 </section>;
}
