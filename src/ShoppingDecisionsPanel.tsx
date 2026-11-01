import {useEffect,useState} from "react";
import {purchaseKey} from "./lib/shoppingProgress";
import {decisionKind,decisionDescription,type ShoppingDecision} from "./lib/shoppingDecisions";
import type {PilotShoppingItem,ShoppingNote} from "./lib/shopping";

type Props={
 items:PilotShoppingItem[];notes:ShoppingNote[];
 decisions:ShoppingDecision[];disabled:boolean;busyKey:string|null;
 onSave:(item:PilotShoppingItem,decision:ShoppingDecision|null)=>void;
};

function DecisionRow({item,decision,disabled,busy,onSave}:{
 item:PilotShoppingItem;decision:ShoppingDecision|undefined;disabled:boolean;busy:boolean;
 onSave:Props["onSave"];
}){
 const key=purchaseKey(item);
 const kind=decisionKind(item);
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState("");
 useEffect(()=>{setEditing(false);setDraft(decision?.kind==="choice"?decision.selection:"");},[key,decision]);
 const status=decisionDescription(item,decision?[decision]:[]);
 return <li className="cc-shopping-decision">
  <span className="cc-shopping-decision-body">
   <span className="cc-shopping-decision-title">{item.sourceText}</span>
   <small className="cc-shopping-decision-note">{item.quantity>1?item.quantity+" usos":"1 uso"} no cardápio. {kind==="choice"?"Registre a alternativa escolhida conforme a receita.":"Defina se deseja utilizar este ingrediente."}</small>
   {item.sourceRawFragments.length>0&&<small className="cc-shopping-decision-note">Texto original: {item.sourceRawFragments.join(" | ")}</small>}
   <small className="cc-shopping-decision-origin">Em: {item.sourceRecipes.join("; ")}</small>
   <small className={decision?"cc-shopping-decision-selected":"cc-shopping-decision-note"} role="status">{busy?"Salvando decisão...":status}</small>
   {kind==="choice"&&(editing||!decision)&&<form className="cc-shopping-choice-form" onSubmit={event=>{
    event.preventDefault();
    if(draft.trim()&&!disabled&&!busy)onSave(item,{itemKey:key,kind:"choice",selection:draft.trim()});
   }}>
    <label htmlFor={"cc-choice-"+key}>Alternativa escolhida (não altera automaticamente a quantidade)</label>
    <input id={"cc-choice-"+key} type="text" maxLength={180} value={draft}
     placeholder="Ex.: azeite, endro ou alface romana"
     disabled={disabled||busy} onChange={event=>setDraft(event.target.value)}
     required/>
    <button type="submit" className="secondary" disabled={disabled||busy||!draft.trim()}>Salvar escolha</button>
   </form>}
   <div className="cc-shopping-choice-actions">
    {kind==="choice"&&decision&&!editing&&<button type="button" className="secondary" disabled={disabled||busy} onClick={()=>setEditing(true)}>Alterar escolha</button>}
    {kind==="optional"&&<>
     <button type="button" className="secondary" disabled={disabled||busy}
      aria-pressed={decision?.kind==="optional"&&decision.included}
      onClick={()=>onSave(item,{itemKey:key,kind:"optional",included:true})}>Incluir</button>
     <button type="button" className="secondary" disabled={disabled||busy}
      aria-pressed={decision?.kind==="optional"&&!decision.included}
      onClick={()=>onSave(item,{itemKey:key,kind:"optional",included:false})}>Não incluir</button>
    </>}
    {decision&&<button type="button" className="cc-shopping-clear-decision" disabled={disabled||busy}
     onClick={()=>onSave(item,null)}>Limpar decisão</button>}
   </div>
  </span>
  <span className="cc-shopping-decision-tag">{decision?"Decidido":kind==="choice"?"Escolher opção":"Opcional"}</span>
 </li>;
}

export default function ShoppingDecisionsPanel({items,notes,decisions,disabled,busyKey,onSave}:Props){
 if(!items.length&&!notes.length)return null;
 return <section className="cc-shopping-notes cc-shopping-decisions" aria-label="Alternativas e opcionais">
  <h3>Alternativas e opcionais ({items.length+notes.length})</h3>
  <p>Registre suas escolhas. Elas são pessoais e não alteram os ingredientes originais, a quantidade calculada nem os itens marcados como comprados.</p>
  <ul>
   {items.map(item=><DecisionRow key={purchaseKey(item)} item={item}
    decision={decisions.find(row=>row.itemKey===purchaseKey(item)&&row.kind===decisionKind(item))}
    disabled={disabled} busy={busyKey===purchaseKey(item)} onSave={onSave}/>)}
   {notes.map(note=><li className="cc-shopping-decision" key={note.name+"|"+note.description}>
    <span className="cc-shopping-decision-body">
     <span className="cc-shopping-decision-title">{note.name}</span>
     <small className="cc-shopping-decision-note">{note.description}</small>
    </span>
    <span className="cc-shopping-decision-tag">A gosto</span>
   </li>)}
  </ul>
 </section>;
}
