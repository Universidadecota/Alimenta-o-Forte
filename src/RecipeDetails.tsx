import RecipeImage from "./RecipeImage";
import { useState } from "react";
import { ArrowLeft, Clock3, Minus, Plus } from "lucide-react";
import type { Meal } from "./lib/planner";
import { formatRecipeIngredient } from "./lib/ingredientMeasures";

type Props={recipe:Meal;onClose:()=>void;onAdd:(servings:number)=>void;canAdd:boolean};
export default function RecipeDetails({recipe,onClose,onAdd,canAdd}:Props){
 const [servings,setServings]=useState(recipe.servings);
 const steps=recipe.instructions?.split(/(?:\\n|\r?\n)+/).map(s=>s.trim()).filter(Boolean)??[];
 return <section className="recipe-details">
  <button type="button" className="secondary" onClick={onClose}><ArrowLeft size={16}/> Voltar às receitas</button>
  <div className="recipe-detail-head">
   <div className="detail-symbol"><RecipeImage src={recipe.imageUrl} title={recipe.title} isAi={recipe.imageIsAi} large/></div>
   <div><span className="eyebrow">{recipe.category}</span><h2>{recipe.title}</h2>
    <p>{recipe.description || "Receita demonstrativa em revisão editorial e nutricional."}</p>
    <div className="recipe-meta"><span><Clock3 size={17}/> {recipe.minutes} minutos</span><span>{recipe.servings} {recipe.servings===1?"porção de referência":"porções de referência"}</span></div>
   </div>
  </div>
  <div className="detail-columns">
   <section className="detail-panel"><h3>Ingredientes</h3><div className="portion-stepper"><span>Porções</span><button type="button" disabled={servings<=1} onClick={()=>setServings(v=>Math.max(1,v-1))} aria-label="Diminuir porções"><Minus size={16}/></button><strong>{servings}</strong><button type="button" disabled={servings>=20} onClick={()=>setServings(v=>Math.min(20,v+1))} aria-label="Aumentar porções"><Plus size={16}/></button></div>
   {recipe.pilotSource?<div className="cc-pilot-source-ingredients">
    <p><strong>Ingredientes conforme o documento original:</strong></p>
    <p>{recipe.pilotSource.originalIngredients}</p>
    <p className="detail-note">Rendimento informado: {recipe.pilotSource.originalYield}. As medidas ainda não foram estruturadas para redimensionamento ou soma automática na lista de compras.</p>
   </div>:<ul className="ingredients">{recipe.ingredients.map((ingredient,i)=><li key={i}><span>{ingredient.name}</span><strong>{formatRecipeIngredient(ingredient,servings/recipe.servings)}</strong></li>)}</ul>}
   {recipe.pilotSource?<p className="detail-note">Acervo de uso pessoal — texto original preservado. A escolha de porções no cardápio não altera automaticamente as quantidades do PDF. Dados nutricionais, alergênicos e equivalências aguardam revisão.</p>:<p className="detail-note">As quantidades são referências demonstrativas. Ao adicionar ao cardápio, as porções selecionadas também serão consideradas na lista de compras.</p>}
   </section>
   <section className="detail-panel"><h3>Modo de preparo</h3>{steps.length>0?<ol className="preparation">{steps.map((step,i)=><li key={i}>{step}</li>)}</ol>:<p className="detail-note">O modo de preparo desta receita ainda não foi cadastrado e revisado. Não vamos apresentar instruções inventadas como definitivas.</p>}
   <button type="button" className="primary" disabled={!canAdd} onClick={()=>onAdd(servings)}><Plus size={16}/> Adicionar ao dia selecionado</button>
   </section>
  </div>
 </section>;
}
