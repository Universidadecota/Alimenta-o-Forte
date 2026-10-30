import {dateKey,recipeFitsSlot,slots,type Meal,type Plan,type Slot} from "./planner";

export type UnavailableWeekMeal={day:string;slot:Slot;locked:boolean};
export function unavailableMainMeals(current:Plan,recipes:readonly Meal[],days:readonly Date[]):UnavailableWeekMeal[]{
 const available=new Map(recipes.map(r=>[r.id,r]));
 const missing:UnavailableWeekMeal[]=[];
 for(const day of days){
  const key=dateKey(day);
  for(const slot of slots){
   const stored=current[key]?.[slot];
   if(!stored)continue;
   const recipe=available.get(stored.id);
   if(!recipe||!recipeFitsSlot(recipe,slot))
    missing.push({day:key,slot,locked:Boolean(stored.locked)});
  }
 }
 return missing;
}
/**
 * Transição do catálogo Beta ao público: remove somente do RASCUNHO de
 * geração referências às quais o usuário não tem mais acesso. A semana
 * persistida continua intacta até consentimento e RPC transacional.
 */
export function editableWeekDraft(current:Plan,missing:readonly UnavailableWeekMeal[]):Plan{
 const draft:Plan={};
 for(const [day,meals] of Object.entries(current))draft[day]={...meals};
 for(const {day,slot} of missing){
  if(draft[day])delete draft[day][slot];
 }
 return draft;
}
/** Mostra o erro do Supabase; PostgrestError é objeto, não Error nativo. */
export function readableWeekError(err:unknown):string{
 const obj=err&&typeof err==="object"?err as {message?:unknown;code?:unknown}:null;
 const message=err instanceof Error?err.message:typeof obj?.message==="string"?obj.message:"";
 if(message.includes("Receita indisponível para este usuário"))
  return "Uma receita do cardápio anterior não está mais disponível para esta conta. Autorize sua substituição para gerar uma nova semana.";
 if(message.includes("Cardápio alterado em outra sessão"))
  return "O cardápio mudou em outra sessão. Atualize a página antes de tentar novamente.";
 if(message.includes("Uma escolha fixada mudou"))
  return "Uma escolha fixada não pode ser substituída sem autorização.";
 if(message&&message.length<=350)return message;
 return "A solicitação não foi concluída. Confira sua conexão e tente novamente.";
}
