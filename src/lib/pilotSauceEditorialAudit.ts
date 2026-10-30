import type {SauceSafetyProposal} from "./pilotSauceSafetyProposals";

/** Retrato auditado das três receitas no piloto privado.
 * Não constitui homologação de rendimentos, medidas nem alergênicos. */
export type SauceAuditIngredient={
 recipe_id:string;name:string;position:number;
 quantity:number|null;unit:string|null;measure_mode:string|null;
};
export type SauceAuditRecipe={id:string;published:boolean;servings:number|null;};
export type SauceAuditSource={recipe_id:string;reference_hash:string;
 original_yield?:string|null;original_ingredients:string;use_stage:string;};
export type SauceAuditBaseline={
 recipeId:string;sourceHash:string;sourceIngredients:string;
 originalYield:string|null;servings:number;ingredientNames:readonly string[];
 issues:readonly string[];ingredientsForAllergyReview:readonly string[];
};
export type SauceAuditReport={
 sourceIngredientCount:number;
 structurallyUnmeasuredCount:number;
 servings:number;
 issues:readonly string[];
 ingredientsForAllergyReview:readonly string[];
};
export const SAUCE_AUDIT_BASELINES:readonly SauceAuditBaseline[]=[
  {
    "recipeId": "bc72828c-22ad-4201-9672-86e754eabe9c",
    "sourceHash": "e18d1b485ac6c29971c98ca02f1f53d4",
    "sourceIngredients": "150 g de salmão cozido e desfiado (ou 1 lata de salmão em água), 1 ovo, 2 colheres (sopa) de linhaça moída, 1 colher (sopa) de endro ou cebolinha, suco de ½ limão, sal, pimenta, 1 colher (sopa) de azeite. Maionese: 1 gema, suco de ½ limão, ¼ de xícara de óleo de abacate, 1 pitada de sal. Salada: ½ pepino fatiado, vinagre, azeite, sal.",
    "originalYield": "Porção: 1",
    "servings": 1,
    "ingredientNames": [
      "150 g de salmão cozido e desfiado (ou 1 lata de salmão em água)",
      "1 ovo",
      "2 colheres (sopa) de linhaça moída",
      "1 colher (sopa) de endro ou cebolinha",
      "suco de ½ limão",
      "sal",
      "pimenta",
      "1 colher (sopa) de azeite",
      "1 gema (maionese)",
      "suco de ½ limão",
      "¼ de xícara de óleo de abacate",
      "1 pitada de sal",
      "½ pepino fatiado (salada)",
      "vinagre",
      "azeite",
      "sal."
    ],
    "issues": [
      "Receita serve 1 pessoa; não há rendimento separado do lote de maionese definido na fonte. Conferir quanto do molho é usado e eventual sobra.",
      "Dois usos textuais de suco de meio limão (bolinhos e maionese) devem permanecer separados para evitar omissão ou soma indevida.",
      "Salmão cozido/desfiado ou salmão enlatado e endro ou cebolinha são alternativas na origem: nenhuma escolha foi fixada editorialmente.",
      "O molho usa gema sem cocção nas instruções atuais; a proposta com gema pasteurizada continua sem homologação culinária e de segurança.",
      "A soma automática de ingredientes do molho e eventual item pronto não pode pressupor correspondência de porções ou rendimento."
    ],
    "ingredientsForAllergyReview": [
      "Ovo: usado nos bolinhos e na gema do molho.",
      "Peixe: salmão cozido/desfiado ou em conserva.",
      "Avaliar possíveis ingredientes ou contatos cruzados não explícitos na fonte."
    ]
  },
  {
    "recipeId": "ccea2f76-a9b0-477a-a5b7-2e4594d2cac7",
    "sourceHash": "6538873f59c212a1ac6f7b8e080965f1",
    "sourceIngredients": "1 peito de frango pequeno (150 g), sal, pimenta, 1 colher (chá) de azeite, 1 alface romana picada, 1 ovo cozido, 2 fatias de bacon crocante, 1 colher (sopa) de gergelim torrado (no lugar do crouton), Molho Caesar (receita abaixo).\n\nMolho Caesar sem queijo (rendimento próprio: 2 a 3 porções): 1 gema, 3 filés de anchovas, 1 dente de alho, suco de 1 limão, ¼ de xícara de óleo de abacate (ou azeite suave), pimenta, 1 colher (sopa) de água se precisar afinar.",
    "originalYield": "Porção: 1",
    "servings": 1,
    "ingredientNames": [
      "1 peito de frango pequeno (150 g)",
      "sal",
      "pimenta",
      "1 colher (chá) de azeite",
      "1 alface romana picada",
      "1 ovo cozido",
      "2 fatias de bacon crocante",
      "1 colher (sopa) de gergelim torrado (no lugar do crouton)",
      "1 gema",
      "3 filés de anchovas",
      "1 dente de alho",
      "suco de 1 limão",
      "¼ de xícara de óleo de abacate (ou azeite suave)",
      "pimenta",
      "1 colher (sopa) de água se precisar afinar."
    ],
    "issues": [
      "A refeição tem 1 porção, mas o molho Caesar tem rendimento próprio de 2 a 3 porções na fonte: não atribuir todo o molho a uma única refeição.",
      "Pimenta aparece como tempero da refeição e do molho, em ocorrências distintas; não consolidar quantidade não especificada.",
      "Óleo de abacate ou azeite suave é uma alternativa; a água do molho é condicional. Não converter alternativas em duas compras obrigatórias.",
      "Molho com gema não cozida e anchovas pede validação de uso de ingrediente pasteurizado, conservação e preparo do frango."
    ],
    "ingredientsForAllergyReview": [
      "Ovo: ovo cozido na salada e gema do molho.",
      "Peixe: filés de anchovas no molho.",
      "Gergelim: ingrediente da cobertura da salada.",
      "Verificar rótulo do bacon e riscos de contato cruzado conforme fornecimento."
    ]
  },
  {
    "recipeId": "fd9d66ab-d656-4bac-8ac6-2607ffad8cc4",
    "sourceHash": "f3babecdf97e8f272d3110824817556d",
    "sourceIngredients": "3 ovos cozidos, 1 colher (sopa) de maionese caseira (receita abaixo), 1 talo de aipo picado fino, 1 colher (sopa) de endro ou cebolinha, suco de ½ limão, sal, pimenta, páprica, 4 folhas de endivia (ou alface romana), chá gelado sem açúcar.\nMaionese caseira (rende cerca de ½ xícara; a sobra dura 2 dias na geladeira): 1 gema em temperatura ambiente, suco de ½ limão, ¼ de xícara de óleo de abacate (ou azeite suave), 1 pitada de sal.",
    "originalYield": "Porção: 1",
    "servings": 1,
    "ingredientNames": [
      "3 ovos cozidos",
      "1 colher (sopa) de maionese caseira (receita abaixo)",
      "1 talo de aipo picado fino",
      "1 colher (sopa) de endro ou cebolinha",
      "suco de ½ limão",
      "sal",
      "pimenta",
      "páprica",
      "4 folhas de endivia (ou alface romana)",
      "chá gelado sem açúcar.",
      "Maionese caseira (rende cerca de ½ xícara; a sobra dura 2 dias na geladeira): 1 gema em temperatura ambiente",
      "suco de ½ limão",
      "¼ de xícara de óleo de abacate (ou azeite suave)",
      "1 pitada de sal"
    ],
    "issues": [
      "A refeição tem 1 porção e utiliza 1 colher de sopa de maionese, enquanto a receita auxiliar rende cerca de meia xícara: conferir quantidade efetivamente consumida e sobras.",
      "A lista de ingredientes inclui maionese caseira como ingrediente da salada e, separadamente, os itens que a compõem: evitar contagem dupla na lista de compras.",
      "Há dois usos de suco de meio limão, um no prato e outro no molho; preservar as ocorrências distintas.",
      "A instrução original de conservar por 2 dias e usar gema crua exige revisão; a proposta pasteurizada não homologa validade nem segurança."
    ],
    "ingredientsForAllergyReview": [
      "Ovo: três ovos cozidos, gema da maionese e referência ao molho pronto.",
      "Aipo: presente no recheio; conferir adequação a restrições individuais.",
      "Alternativas como endro/cebolinha e endívia/alface romana exigem conferência no cadastro e na informação ao usuário."
    ]
  }
];

/** Falha fechada: somente gera diagnóstico quando todos os ingredientes,
 * texto da fonte, rendimento e publicação correspondem ao registro auditado.
 * Essa função não grava aprovações ou medidas e não deduz alergênicos.
 */
export function getVerifiedSauceAudit(
 proposal:SauceSafetyProposal,
 source:SauceAuditSource,
 recipe:SauceAuditRecipe,
 ingredients:readonly SauceAuditIngredient[]
):SauceAuditReport|null{
 const baseline=SAUCE_AUDIT_BASELINES.find(item=>item.recipeId===proposal.recipeId);
 if(!baseline||
  recipe.id!==baseline.recipeId||recipe.published!==false||
  recipe.servings!==baseline.servings||
  source.use_stage!=="personal_pilot"||
  source.recipe_id!==baseline.recipeId||
  source.reference_hash!==baseline.sourceHash||
  source.reference_hash!==proposal.sourceHash||
  source.original_yield!==baseline.originalYield||
  source.original_ingredients!==baseline.sourceIngredients||
  ingredients.length!==baseline.ingredientNames.length)return null;
 const seen=new Set<number>();
 for(const ingredient of ingredients){
  if(ingredient.recipe_id!==baseline.recipeId||
   !Number.isInteger(ingredient.position)||
   ingredient.position<0||ingredient.position>=baseline.ingredientNames.length||
   seen.has(ingredient.position)||
   baseline.ingredientNames[ingredient.position]!==ingredient.name||
   ingredient.quantity!==null||ingredient.unit!=="un"||
   ingredient.measure_mode!=="unspecified")return null;
  seen.add(ingredient.position);
 }
 return {
  sourceIngredientCount:baseline.ingredientNames.length,
  structurallyUnmeasuredCount:ingredients.length,
  servings:recipe.servings,
  issues:baseline.issues,
  ingredientsForAllergyReview:baseline.ingredientsForAllergyReview
 };
}
