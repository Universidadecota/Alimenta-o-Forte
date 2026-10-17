import type { Ingredient } from "./lib/planner";
import { ingredientUnits, type MeasureMode } from "./lib/ingredientMeasures";
import { Trash2 } from "lucide-react";

type Props={
  item:Ingredient;
  index:number;
  removable:boolean;
  onChange:(item:Ingredient)=>void;
  onRemove:()=>void;
};
export default function IngredientEditor({item,index,removable,onChange,onRemove}:Props){
 const mode:MeasureMode=item.measureMode??"measured";
 const edit=(patch:Partial<Ingredient>)=>onChange({...item,...patch});
 return <div className="cc-ingredient-editor">
   <label>Ingrediente {index+1}<input required maxLength={140}
     placeholder="Ex.: leite de coco" value={item.name}
     onChange={e=>edit({name:e.target.value})}/></label>
   <label>Como medir<select aria-label={"Como medir ingrediente "+(index+1)}
     value={mode} onChange={e=>{
       const next=e.target.value as MeasureMode;
       edit({measureMode:next,quantity:next==="measured"?(item.quantity??null):null});
     }}>
       <option value="measured">Quantidade definida</option>
       <option value="taste">A gosto</option>
       <option value="unspecified">Sem quantidade definida</option>
     </select></label>
   {mode==="measured"&&<>
     <label>Quantidade<input type="number" min=".001" max="100000" step=".001"
       aria-label={"Quantidade "+(index+1)} required value={item.quantity??""}
       onChange={e=>edit({quantity:e.target.value===""?null:Number(e.target.value)})}/></label>
     <label>Unidade<select aria-label={"Unidade "+(index+1)}
       value={item.unit} onChange={e=>edit({unit:e.target.value})}>
       {ingredientUnits.map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select></label>
   </>}
   <label className="cc-ingredient-optional"><input type="checkbox"
      checked={Boolean(item.optional)} onChange={e=>edit({optional:e.target.checked})}/>
     Ingrediente opcional</label>
   <button type="button" className="cc-ingredient-remove" disabled={!removable}
     aria-label={"Excluir ingrediente "+(index+1)} onClick={onRemove}>
     <Trash2 size={17}/>
   </button>
   {mode!=="measured"&&<p className="cc-ingredient-hint">
     {mode==="taste"?"A quantidade será exibida como “a gosto”, sem multiplicação automática."
       :"A quantidade não será inventada nem somada à lista de compras."}
   </p>}
 </div>;
}
