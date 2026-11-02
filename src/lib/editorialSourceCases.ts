import type {Meal} from "./planner";

export type EditorialCaseId="mayo-serving"|"mayo-preparation"|"tea-unspecified";
export type EditorialFinding={
 id:EditorialCaseId;
 title:string;
 issue:string;
 proposal:string;
 caution:string;
 evidence:ReadonlyArray<{recipeId:string;recipeTitle:string;sourceDocument:string;ingredient:string;originalIngredients:string;instructions:string}>;
};

const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .toLocaleLowerCase("pt-BR").replace(/\s+/g," ").trim();
const matchesRecipe=(m:Meal,name:string)=>normalize(m.title)===normalize(name);
const salad="Salada de ovos em canoas de endivia";
const omelet="Omelete enrolada com nori, cebolinha e gergelim";
const wraps="Wraps de alface com ovos, bacon e abacate";

/** Revisão baseada no texto atual do catálogo. Nenhuma proposta altera receitas. */
export function buildEditorialFindings(recipes:readonly Meal[]):EditorialFinding[]{
 const rows=(recipeTitle:string,matcher:(ingredient:string)=>boolean)=>{
  const recipe=recipes.find(r=>matchesRecipe(r,recipeTitle));
  if(!recipe)return [];
  return recipe.ingredients.filter(i=>matcher(normalize(i.name))).map(i=>({
   recipeId:recipe.id,recipeTitle:recipe.title,
   sourceDocument:recipe.pilotSource?.sourceDocument??"Origem documental não disponível",
   ingredient:i.name,
   originalIngredients:recipe.pilotSource?.originalIngredients??"Fonte original não disponível",
   instructions:recipe.instructions??"Modo de preparo não cadastrado"
  }));
 };
 const cases:EditorialFinding[]=[
  {
   id:"mayo-serving",
   title:"Maionese caseira — ingrediente do prato",
   issue:"A salada pede uma colher de maionese caseira, mas a lista também contém os ingredientes de seu preparo. Isso exige conferir o rendimento e evitar contagem duplicada.",
   proposal:"Separar editorialmente o ingrediente usado na salada da subseção que ensina a preparar a maionese. Manter a medida de 1 colher (sopa) como referência original e revisar a relação de compras com o rendimento do preparo.",
   caution:"Não consolidar automaticamente gema, óleo e limão nem considerar a receita aprovada para consumo.",
   evidence:rows(salad,s=>/1 colher \(sopa\) de maionese caseira/.test(s))
  },
  {
   id:"mayo-preparation",
   title:"Maionese caseira — preparo complementar",
   issue:"Uma única entrada da fonte mistura rendimento, prazo de armazenamento e ingrediente (gema). O preparo também utiliza ovo cru.",
   proposal:"Apresentar rendimento e instruções em uma subseção de preparo, deixando gema, limão, óleo e sal como ingredientes distintos. Submeter manipulação do ovo cru e prazo de conservação a uma revisão específica de segurança alimentar antes da publicação comercial.",
   caution:"Não confirmar como seguro o prazo de dois dias nem modificar automaticamente a receita original.",
   evidence:rows(salad,s=>s.startsWith("maionese caseira (rende"))
  },
  {
   id:"tea-unspecified",
   title:"Xícara de chá — bebida não identificada",
   issue:"Duas receitas apresentam '1 xícara de chá' e mencionam servir com chá, mas nenhuma especifica o tipo. A lista agrupa as duas ocorrências.",
   proposal:"Classificar essas entradas como bebida de acompanhamento com tipo de chá não especificado. Confirmar o tipo na fonte antes de transformá-las em ingredientes para comprar.",
   caution:"Não escolher uma variedade de chá por inferência e não gerar compra automática.",
   evidence:[
    ...rows(omelet,s=>/^1 xicara de cha\.?$/.test(s)),
    ...rows(wraps,s=>/^1 xicara de cha\.?$/.test(s))
   ]
  }
 ];
 return cases;
}
