/**
 * Preparação do payload de edição do catálogo oficial.
 * A identidade dos ingredientes carregados é mantida e um snapshot explícito
 * acompanha cada ID, para o servidor rejeitar alterações concorrentes.
 */
export type EditableOfficialIngredient={
 id?:string; name:string; quantity:number|null;unit:string;
 measureMode?:"measured"|"taste"|"unspecified"; optional?:boolean;
};
export type SavedOfficialIngredient={
 id:string;position:number;name:string;quantity:number|null;unit:string;
 measure_mode:string;is_optional:boolean;
};
export type OfficialIngredientWrite={
 id:string|null;name:string;quantity:number|null;unit:string;
 measure_mode:string;is_optional:boolean;
 expected_name?:string;expected_position?:number;
 expected_quantity?:number|null;expected_unit?:string;
 expected_mode?:string;expected_optional?:boolean;
};
export function buildOfficialIngredientWrites(
 current:readonly EditableOfficialIngredient[],
 previous:readonly SavedOfficialIngredient[]|null
):OfficialIngredientWrite[]{
 if(!current.length||current.length>40)throw new Error("A receita deve conter de 1 a 40 ingredientes.");
 const original=new Map((previous??[]).map(row=>[row.id,row]));
 if(original.size!==(previous?.length??0))throw new Error("Inventário original inconsistente.");
 const seen=new Set<string>();
 let kept=0;
 const writes=current.map(item=>{
  const id=item.id??null;
  const mode=item.measureMode??"measured";
  const base:OfficialIngredientWrite={
   id,name:item.name,quantity:mode==="measured"?item.quantity:null,
   unit:item.unit,measure_mode:mode,is_optional:Boolean(item.optional)
  };
  if(id!==null){
   if(seen.has(id))throw new Error("Ingredientes com identificadores repetidos.");
   seen.add(id);
   const prior=original.get(id);
   if(!prior)throw new Error("Ingrediente antigo alterado por outro editor. Recarregue a receita.");
   kept++;
   return {
    ...base,
    expected_name:prior.name,expected_position:prior.position,
    expected_quantity:prior.quantity==null?null:Number(prior.quantity),
    expected_unit:prior.unit,expected_mode:prior.measure_mode,
    expected_optional:Boolean(prior.is_optional)
   };
  }
  return base;
 });
 if(previous&&previous.length>0&&kept===0)
  throw new Error("A edição precisa preservar ao menos um ingrediente original. Recarregue a receita.");
 return writes;
}
