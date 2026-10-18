/** Regras de seleção da Fase 3I.5: aprovação nunca é sugerida nem automática. */
export type EditorialAction="confirm"|"return";
export type EditorialChoice={acknowledged:boolean;action:EditorialAction|"";note:string};
export type EditorialChoices=Record<string,EditorialChoice>;
export type EditorialDraft={
 ingredient_id:string;
 source_text:string;
 review_status:string;
 proposed_quantity:number;
 proposed_unit:string;
 proposed_ingredient:string;
 updated_at:string;
 original_name:string;
};
export type EditorialBatchItem={
 ingredient_id:string;
 source_text:string;
 expected_updated_at:string;
 expected_quantity:number;
 expected_unit:string;
 expected_ingredient:string;
 action:EditorialAction;
 note:string;
};
export function collectEditorialBatch(
 rows:readonly EditorialDraft[],
 choices:EditorialChoices,
 maxItems=5
):EditorialBatchItem[]{
 const selected=rows.filter(row=>choices[row.ingredient_id]?.acknowledged);
 if(selected.length===0||selected.length>Math.min(5,maxItems))
  throw new Error("Selecione entre 1 e 5 medidas conferidas.");
 const ids=new Set<string>();
 return selected.map(row=>{
  if(ids.has(row.ingredient_id))throw new Error("Ingrediente repetido na seleção.");
  ids.add(row.ingredient_id);
  const choice=choices[row.ingredient_id];
  if(!choice||!choice.acknowledged||!["confirm","return"].includes(choice.action))
   throw new Error("Cada decisão exige conferência explícita.");
  const note=choice.note.trim();
  if(note.length<8||note.length>1200)throw new Error("Preencha uma justificativa própria para cada medida (8–1200 caracteres).");
  if(row.review_status!=="draft"||row.source_text!==row.original_name)
   throw new Error("O rascunho não está mais apto para decisão; atualize a lista.");
  if(!Number.isFinite(row.proposed_quantity)||row.proposed_quantity<=0||
   !row.proposed_unit||!row.proposed_ingredient.trim()||
   !row.updated_at||!row.ingredient_id)
   throw new Error("Medida, fonte ou versão incompleta; decisão bloqueada.");
  return {
   ingredient_id:row.ingredient_id,
   source_text:row.source_text,
   expected_updated_at:row.updated_at,
   expected_quantity:row.proposed_quantity,
   expected_unit:row.proposed_unit,
   expected_ingredient:row.proposed_ingredient,
   action:choice.action as EditorialAction,
   note
  };
 });
}
