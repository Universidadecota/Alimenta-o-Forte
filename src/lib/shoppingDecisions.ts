import {supabase} from "./supabase";
import {purchaseKey} from "./shoppingProgress";
import type {PilotShoppingItem} from "./shopping";

/** Uma decisão explícita não altera ingredientes, medidas ou o estado de comprado. */
export type ShoppingDecision =
 | {itemKey:string;kind:"choice";selection:string}
 | {itemKey:string;kind:"optional";included:boolean};

export function decisionKind(item:PilotShoppingItem):"choice"|"optional"|null{
 return item.requiresChoice?"choice":item.optionalSource?"optional":null;
}
export function validateShoppingDecision(item:PilotShoppingItem,decision:ShoppingDecision):void{
 if(decision.itemKey!==purchaseKey(item)||decision.kind!==decisionKind(item))
  throw new Error("Decisão não corresponde ao ingrediente atual.");
 if(decision.kind==="choice"&&(decision.selection.trim().length<1||decision.selection.trim().length>180))
  throw new Error("Informe a opção escolhida em até 180 caracteres.");
}
export function decisionDescription(item:PilotShoppingItem,decisions:readonly ShoppingDecision[]):string{
 const decision=decisions.find(row=>row.itemKey===purchaseKey(item)&&row.kind===decisionKind(item));
 if(!decision)return "Pendente de decisão";
 if(decision.kind==="choice")return "Escolha registrada: "+decision.selection;
 return decision.included?"Opcional incluído por decisão do usuário":"Opcional não incluído";
}
export async function loadShoppingDecisions(userId:string,weekStart:string,items:PilotShoppingItem[]):Promise<ShoppingDecision[]>{
 if(!supabase)return [];
 const allowed=new Map(items.filter(item=>decisionKind(item)!==null).map(item=>[purchaseKey(item),decisionKind(item)]));
 const {data,error}=await supabase.from("cc_shopping_decisions")
  .select("item_key,kind,choice_text,included").eq("user_id",userId).eq("week_start",weekStart);
 if(error)throw error;
 const result:ShoppingDecision[]=[];
 for(const row of data??[]){
  if(allowed.get(row.item_key)!==row.kind)continue;
  if(row.kind==="choice"&&typeof row.choice_text==="string"&&row.choice_text.trim()){
   result.push({itemKey:row.item_key,kind:"choice",selection:row.choice_text});
  }else if(row.kind==="optional"&&typeof row.included==="boolean"){
   result.push({itemKey:row.item_key,kind:"optional",included:row.included});
  }
 }
 return result;
}
export async function saveShoppingDecision(
 userId:string,weekStart:string,item:PilotShoppingItem,decision:ShoppingDecision|null
):Promise<void>{
 if(!supabase)throw new Error("Supabase indisponível.");
 const itemKey=purchaseKey(item);
 if(!decision){
  const {error}=await supabase.from("cc_shopping_decisions").delete()
   .eq("user_id",userId).eq("week_start",weekStart).eq("item_key",itemKey);
  if(error)throw error;
  return;
 }
 validateShoppingDecision(item,decision);
 const {error}=await supabase.from("cc_shopping_decisions").upsert({
  user_id:userId,week_start:weekStart,item_key:itemKey,kind:decision.kind,
  choice_text:decision.kind==="choice"?decision.selection.trim():null,
  included:decision.kind==="optional"?decision.included:null,
 },{onConflict:"user_id,week_start,item_key"});
 if(error)throw error;
}
