import RecipeImage from "./RecipeImage";
import { useState } from "react";
import { ArrowLeft, Clock3, Minus, Plus } from "lucide-react";
import type { Meal } from "./lib/planner";
import { formatRecipeIngredient } from "./lib/ingredientMeasures";

type Props={recipe:Meal;destinationDateLabel:string;onClose:()=>void;onAdd:(servings:number)=>void;canAdd:boolean};
export default function RecipeDetails({recipe,destinationDateLabel,onClose,onAdd,canAdd}:Props){
 const [servings,setServings]=useState(recipe.servings);
 const steps=recipe.instructions?.split(/(?:\\n|\r?\n)+/).map(s=>s.trim()).filter(Boolean)??[];
 return <section className="recipe-details">
  <button type="button" className="secondary" onClick={onClose}><ArrowLeft size={16}/> Voltar às receitas</button>
  <div className="recipe-detail-head">
   <div className="detail-symbol"><RecipeImage src={recipe.imageUrl} title={recipe.title} isAi={recipe.imageIsAi} large/></div>
   <div><span className="eyebrow">{recipe.pilotSource?.kind==="supper"?"Ceia":recipe.pilotSource?.kind==="salad"?"Salada · almoço ou jantar":recipe.pilotSource?.kind==="snack"?"Lanche":recipe.category}</span><h2>{recipe.title}</h2>
    <p>{recipe.pilotSource?"Receita autoral Costa&Costa para uso pessoal. Ingredientes e preparo mantidos conforme o original; confira rótulos e alergênicos antes de consumir.":recipe.description || "Receita em organização culinária."}</p>
    <div className="recipe-meta"><span><Clock3 size={17}/> {recipe.pilotSource?.originalTime??recipe.minutes+" minutos"}</span>{!recipe.pilotSource&&<span>{recipe.servings} {recipe.servings===1?"porção de referência":"porções de referência"}</span>}</div>
   </div>
  </div>
  <div className="detail-columns">
   <section className="detail-panel"><h3>Ingredientes</h3>{recipe.pilotSource
   ?<p className="detail-note"><strong>Rendimento original:</strong> {recipe.pilotSource.originalYield}. Porções mantidas conforme a receita.</p>
   :<div className="portion-stepper"><span>Porções</span><button type="button" disabled={servings<=1} onClick={()=>setServings(v=>Math.max(1,v-1))} aria-label="Diminuir porções"><Minus size={16}/></button><strong>{servings}</strong><button type="button" disabled={servings>=20} onClick={()=>setServings(v=>Math.min(20,v+1))} aria-label="Aumentar porções"><Plus size={16}/></button></div>}
   {recipe.pilotSource?<div className="cc-pilot-source-ingredients">
    <p><strong>Ingredientes conforme o documento original:</strong></p>
    <p>{recipe.pilotSource.originalIngredients}</p>

   </div>:<ul className="ingredients">{recipe.ingredients.map((ingredient,i)=><li key={i}><span>{ingredient.name}</span><strong>{formatRecipeIngredient(ingredient,servings/recipe.servings)}</strong></li>)}</ul>}
   {recipe.pilotSource?<details className="detail-note"><summary>Ver informações sobre medidas e segurança</summary><div><p>Receita autoral em uso pessoal: ingredientes e modo de preparo originais preservados. Não há redimensionamento automático das porções até a revisão das medidas.</p><p>A lista de compras soma apenas medidas compatíveis identificadas com segurança; quantidades ambíguas são apresentadas separadamente, sem conversões inventadas.</p><p>Alérgenos, contaminação cruzada e composição nutricional ainda não foram verificados. Confira ingredientes e rótulos antes de consumir.</p></div></details>:<p className="detail-note">As quantidades são referências demonstrativas. Ao adicionar ao cardápio, as porções selecionadas também serão consideradas na lista de compras.</p>}
   </section>
   <section className="detail-panel"><h3>Modo de preparo</h3>{steps.length>0?<ol className="preparation">{steps.map((step,i)=><li key={i}>{step}</li>)}</ol>:<p className="detail-note">O modo de preparo desta receita ainda não foi cadastrado e revisado. Não vamos apresentar instruções inventadas como definitivas.</p>}
   <button type="button" className="primary" disabled={!canAdd} onClick={()=>onAdd(servings)}><Plus size={16}/> {recipe.category==="Lanche"||recipe.pilotSource?.kind==="salad"?"Escolher horário · "+destinationDateLabel:"Adicionar em "+destinationDateLabel}</button>
   </section>
  </div>
 </section>;
}
