import {getVerifiedSauceAudit,type SauceAuditIngredient,type SauceAuditRecipe,type SauceAuditSource} from "./pilotSauceEditorialAudit";
import type {SauceSafetyProposal} from "./pilotSauceSafetyProposals";

export type PreparationKind="main"|"sauce"|"side";
export type PreparationBlock={
 key:string;
 title:string;
 kind:PreparationKind;
 ingredients:readonly SauceAuditIngredient[];
 declaredYield:string|null;
 usedInMeal:string|null;
 referencedAtPosition:number|null;
};
export type PreparationPartition={
 mealServings:number;
 blocks:readonly PreparationBlock[];
 warnings:readonly string[];
 shoppingCalculationAllowed:false;
 nutritionCalculationAllowed:false;
};
type BlockLayout={
 key:string;title:string;kind:PreparationKind;
 start:number;end:number;
 declaredYield:string|null;usedInMeal:string|null;
 referencedAtPosition:number|null;
};
type RecipeLayout={
 recipeId:string;blocks:readonly BlockLayout[];
 warnings:readonly string[];
};

/** Divisões editoriais explícitas, conferidas no documento de origem.
 * Não correspondem a entidades comerciais, subtabelas nem receitas publicadas.
 */
export const PILOT_PREPARATION_LAYOUTS:readonly RecipeLayout[]=[
 {
  recipeId:"bc72828c-22ad-4201-9672-86e754eabe9c",
  blocks:[
   {key:"salmon-cakes",title:"Bolinhos de salmão",kind:"main",start:0,end:7,declaredYield:null,usedInMeal:null,referencedAtPosition:null},
   {key:"salmon-mayo",title:"Maionese auxiliar",kind:"sauce",start:8,end:11,declaredYield:null,usedInMeal:null,referencedAtPosition:null},
   {key:"cucumber-salad",title:"Salada de pepino",kind:"side",start:12,end:15,declaredYield:null,usedInMeal:null,referencedAtPosition:null}
  ],
  warnings:[
   "A refeição está cadastrada para uma pessoa; a fonte não determina o rendimento próprio da maionese nem quanto dela é consumido.",
   "Há duas ocorrências distintas de suco de meio limão: uma nos bolinhos e outra na maionese. Não eliminar nem multiplicar automaticamente.",
   "Ingredientes da maionese e da salada são subpreparos da mesma refeição, não pratos independentes. Verificar eventuais sobras."
  ]
 },
 {
  recipeId:"ccea2f76-a9b0-477a-a5b7-2e4594d2cac7",
  blocks:[
   {key:"caesar-main",title:"Salada Caesar com frango",kind:"main",start:0,end:7,declaredYield:null,usedInMeal:null,referencedAtPosition:null},
   {key:"caesar-dressing",title:"Molho Caesar sem queijo",kind:"sauce",start:8,end:14,declaredYield:"2 a 3 porções (molho, conforme a fonte)",usedInMeal:null,referencedAtPosition:null}
  ],
  warnings:[
   "A receita principal serve uma pessoa, enquanto a origem informa que o molho rende de 2 a 3 porções. A quantidade efetivamente usada não está definida.",
   "Pimenta aparece no prato e no molho; não presumir que a menção textual duplicada seja erro ou quantidade dobrada.",
   "Não atribuir toda a receita do molho à refeição sem uma decisão editorial sobre uso, sobra e escalonamento."
  ]
 },
 {
  recipeId:"fd9d66ab-d656-4bac-8ac6-2607ffad8cc4",
  blocks:[
   {key:"endive-main",title:"Salada de ovos nas folhas de endívia",kind:"main",start:0,end:9,declaredYield:null,usedInMeal:null,referencedAtPosition:1},
   {key:"endive-mayo",title:"Maionese caseira auxiliar",kind:"sauce",start:10,end:13,declaredYield:"cerca de ½ xícara (maionese, conforme a fonte)",usedInMeal:"1 colher (sopa) de maionese caseira (no prato)",referencedAtPosition:null}
  ],
  warnings:[
   "A salada inclui uma colher de sopa da maionese preparada em outro bloco. Essa referência não é uma compra adicional dos mesmos ingredientes.",
   "A fonte informa rendimento aproximado de meia xícara do molho, mas não permite deduzir consumo, sobras ou conversão confiável sem validar a receita.",
   "O suco de meio limão aparece uma vez na salada e outra na maionese; preservar os dois usos sem contabilizar um molho pronto e seus componentes duas vezes."
  ]
 }
];

/** Falha fechada se o catálogo se afastou da foto auditada, se algum bloco
 * se sobrepõe, se um ingrediente ficou de fora ou se a referência ao molho
 * não corresponde ao texto mantido. Apenas classificação, sem gravar.
 */
export function getVerifiedPreparationPartition(
 proposal:SauceSafetyProposal,
 source:SauceAuditSource,
 recipe:SauceAuditRecipe,
 ingredients:readonly SauceAuditIngredient[]
):PreparationPartition|null{
 if(!getVerifiedSauceAudit(proposal,source,recipe,ingredients))return null;
 const layout=PILOT_PREPARATION_LAYOUTS.find(item=>item.recipeId===recipe.id);
 if(!layout||new Set(ingredients.map(item=>item.id)).size!==ingredients.length)return null;
 const byPosition=new Map(ingredients.map(item=>[item.position,item]));
 const usedPositions=new Set<number>();
 const blocks:PreparationBlock[]=[];
 for(const definition of layout.blocks){
  if(!Number.isInteger(definition.start)||!Number.isInteger(definition.end)||
   definition.end<definition.start)return null;
  const rows:SauceAuditIngredient[]=[];
  for(let position=definition.start;position<=definition.end;position++){
   const row=byPosition.get(position);
   if(!row||usedPositions.has(position))return null;
   rows.push(row);usedPositions.add(position);
  }
  if(definition.referencedAtPosition!==null){
   const ref=rows.find(item=>item.position===definition.referencedAtPosition);
   if(!ref||!ref.name.toLocaleLowerCase("pt-BR").includes("maionese caseira"))return null;
  }
  blocks.push({
   key:definition.key,title:definition.title,kind:definition.kind,
   ingredients:rows,declaredYield:definition.declaredYield,
   usedInMeal:definition.usedInMeal,
   referencedAtPosition:definition.referencedAtPosition
  });
 }
 if(usedPositions.size!==ingredients.length||
  blocks.filter(item=>item.kind==="main").length!==1||
  blocks.filter(item=>item.kind==="sauce").length!==1)return null;
 return {
  mealServings:recipe.servings!,
  blocks,warnings:layout.warnings,
  shoppingCalculationAllowed:false,
  nutritionCalculationAllowed:false
 };
}
