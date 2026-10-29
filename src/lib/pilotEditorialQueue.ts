import type {RecipeReconciliation} from "./pilotSourceReconciliation";

/**
 * Fila editorial exclusivamente derivada da conciliação de leitura.
 * A prioridade organiza a conferência humana: não é uma avaliação de risco
 * clínico, não determina equivalência 1:N e não altera dados.
 */
export type EditorialQueueKind="source_gap"|"untracked_current"|"text_change"|"position_only";
export type EditorialQueueFilter=EditorialQueueKind|"all";
export type EditorialQueueOrder="risk_first"|"simplest_first";

export type EditorialQueueEntry={
 recipe:RecipeReconciliation;
 kind:EditorialQueueKind;
 discrepancyCount:number;
};

export const editorialQueueGroups:ReadonlyArray<{
 kind:EditorialQueueKind;
 title:string;
 guidance:string;
}>= [
 {kind:"source_gap",title:"Histórico sem ingrediente atual",
  guidance:"Conferir se o ingrediente foi removido, substituído ou desmembrado; exige evidência individual."},
 {kind:"untracked_current",title:"Ingrediente sem histórico",
  guidance:"Investigar inclusão ou possível desmembramento; nenhum vínculo novo é presumido."},
 {kind:"text_change",title:"Texto divergente",
  guidance:"Comparar o texto atual com a origem, inclusive quando a posição também mudou."},
 {kind:"position_only",title:"Somente posição",
  guidance:"Verificar reordenação com texto preservado; ainda requer conferência."},
];

const queueRank:Record<EditorialQueueKind,number>={
 source_gap:0,untracked_current:1,text_change:2,position_only:3
};

export function classifyEditorialQueueRecipe(
 recipe:RecipeReconciliation
):EditorialQueueKind|null{
 if(recipe.missingCurrent>0)return "source_gap";
 if(recipe.untrackedCurrent>0)return "untracked_current";
 if(recipe.nameMismatch>0||recipe.bothMismatch>0)return "text_change";
 if(recipe.positionMismatch>0)return "position_only";
 return null;
}

export function summarizeEditorialQueue(recipes:ReadonlyArray<RecipeReconciliation>):{
 entries:EditorialQueueEntry[];
 counts:Record<EditorialQueueKind,number>;
}{
 const counts:Record<EditorialQueueKind,number>={
  source_gap:0,untracked_current:0,text_change:0,position_only:0
 };
 const entries:EditorialQueueEntry[]=[];
 for(const recipe of recipes){
  const kind=classifyEditorialQueueRecipe(recipe);
  if(!kind)continue;
  counts[kind]++;
  entries.push({
   recipe,kind,
   discrepancyCount:recipe.nameMismatch+recipe.positionMismatch+
    recipe.bothMismatch+recipe.missingCurrent+recipe.untrackedCurrent
  });
 }
 return {entries,counts};
}

export function filterEditorialQueue(
 entries:ReadonlyArray<EditorialQueueEntry>,
 filter:EditorialQueueFilter,
 order:EditorialQueueOrder
):EditorialQueueEntry[]{
 return entries.filter(entry=>filter==="all"||entry.kind===filter)
  .sort((a,b)=>{
   const byPriority=order==="risk_first"
    ?queueRank[a.kind]-queueRank[b.kind]
    :queueRank[b.kind]-queueRank[a.kind];
   if(byPriority!==0)return byPriority;
   const byCount=order==="risk_first"
    ?b.discrepancyCount-a.discrepancyCount
    :a.discrepancyCount-b.discrepancyCount;
   return byCount||
    a.recipe.title.localeCompare(b.recipe.title,"pt-BR")||
    a.recipe.recipe_id.localeCompare(b.recipe.recipe_id);
  });
}
