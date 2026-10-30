import {traceUntrackedIngredientsToSource,type UntrackedLiteralSourceTrace} from "./pilotSourceLiteralTrace";
import type {PilotSourceEvidenceReport} from "./pilotSourceEvidence";

export type SourceEditorialFocusCase=UntrackedLiteralSourceTrace&{
 explanation:string;
 requiresSafetyContext:boolean;
};
export type SourceEditorialFocus={
 cases:SourceEditorialFocusCase[];
 recipeRequiresEggSauceReview:boolean;
};

/**
 * Priorização somente de leitura: evidência textual e alerta de revisão.
 * Uma menção a gema + molho não conclui, por si, que o preparo usa ovo cru.
 * Não valida ingredientes, medidas ou segurança alimentar.
 */
export function buildSourceEditorialFocus(report:PilotSourceEvidenceReport):SourceEditorialFocus{
 const source=report.official.original_ingredients;
 const recipeRequiresEggSauceReview=/\bgema\b/iu.test(source)&&
  /(maionese|molho\s+caesar)/iu.test(source);
 const traced=traceUntrackedIngredientsToSource(report);
 const cases:SourceEditorialFocusCase[]=traced.items
  .filter(item=>item.status!=="unique")
  .map(item=>{
   const explanation=item.status==="ambiguous"
    ?"O nome aparece "+item.occurrences+" vezes na fonte; verificar em qual preparo cada ocorrência é usada."
    :item.status==="annotated"
    ?"O texto-base \""+item.matchedFragment+"\" aparece uma vez, mas a observação contextual não é literal; conferir a intenção da edição."
    :"A redação não foi localizada com os critérios conservadores; conferir a origem sem criar equivalência.";
   return {...item,explanation,requiresSafetyContext:recipeRequiresEggSauceReview};
  });
 const rank={not_found:0,ambiguous:1,annotated:2,unique:3} as const;
 cases.sort((a,b)=>
  Number(b.requiresSafetyContext)-Number(a.requiresSafetyContext)||
  rank[a.status]-rank[b.status]||
  a.ingredient.position-b.ingredient.position||
  a.ingredient.id.localeCompare(b.ingredient.id));
 return {cases,recipeRequiresEggSauceReview};
}
