import {Check} from "lucide-react";
import {formatIngredientAmount} from "./lib/ingredientMeasures";
import {purchaseKey} from "./lib/shoppingProgress";
import {groupShoppingForReview,shoppingReviewReason} from "./lib/shoppingReviewGroups";
import type {ShoppingItem,PilotShoppingItem,ShoppingNote} from "./lib/shopping";

type Props={
 shopping:ShoppingItem[];
 pilotShopping:PilotShoppingItem[];
 notes:ShoppingNote[];
 purchasedKeys:string[];
 onToggle:(item:ShoppingItem)=>void;
 disabled:boolean;
};

/** Três grupos de apresentação; mantém IDs, quantidades e marcações originais. */
export default function ShoppingListSections({
 shopping,pilotShopping,notes,purchasedKeys,onToggle,disabled
}:Props){
 const groups=groupShoppingForReview(shopping,pilotShopping,notes);
 const measuredCount=groups.structured.length+groups.consolidatedOriginal.length;
 const reviewCount=groups.needsChecking.length+groups.incompleteReference.length;
 const optionalCount=groups.choicesAndOptional.length+groups.notes.length;
 const purchased=(item:ShoppingItem)=>purchasedKeys.includes(purchaseKey(item));
 const pilotDetail=(item:PilotShoppingItem)=><>
  {item.totalLabel&&<small>Medida original somada para referência, não redimensionada. {item.quantity>1?item.quantity+" ocorrências": "1 ocorrência"}. Expressões: {item.sourceExpressions.join(" + ")}</small>}
  {!item.totalLabel&&<small>{item.quantity>1?item.quantity+" utilizações":"1 utilização"} no cardápio; não corresponde necessariamente a unidades para comprar.</small>}
  {shoppingReviewReason(item,pilotShopping)&&<small className="cc-pilot-shopping-attention">{shoppingReviewReason(item,pilotShopping)}</small>}
  {item.ambiguousSource&&<small className="cc-pilot-shopping-attention">Trecho composto ou ambíguo: confira a receita.</small>}
  {item.requiresChoice&&<small className="cc-pilot-shopping-attention">Escolha uma das alternativas antes de comprar; nenhuma substituição automática.</small>}
  {item.optionalSource&&<small className="cc-pilot-shopping-attention">Opcional — inclua apenas se decidir utilizar.</small>}
  {item.sourceRawFragments.length>0&&<small>Trecho original completo: {item.sourceRawFragments.join(" | ")}</small>}
  <small>Em: {item.sourceRecipes.join("; ")}</small>
 </>;
 const pilotButton=(item:PilotShoppingItem)=><button type="button" key={purchaseKey(item)}
  disabled={disabled} aria-pressed={purchased(item)}
  className={purchased(item)?"shopping-item checked":"shopping-item"}
  onClick={()=>onToggle(item)}>
  <span className="checkmark">{purchased(item)&&<Check size={14}/>}</span>
  <span className="cc-pilot-shopping-text">{item.totalLabel??item.sourceText}{pilotDetail(item)}</span>
  <strong>{item.quantity>1?item.quantity+" usos":"1 uso"}</strong>
 </button>;
 return <>
  {measuredCount===0&&reviewCount===0&&optionalCount===0&&
   <div className="empty">Ainda não há ingredientes. Planeje suas refeições primeiro.</div>}

  {measuredCount>0&&<section className="cc-pilot-shopping" aria-label="Medidas estruturadas e originais consolidadas">
   <h3>Medidas consolidadas ({measuredCount})</h3>
   <p>Quantidades estruturadas e somas de medidas originais literais equivalentes. As receitas internas não foram ajustadas para o número de pessoas; confira embalagens e rendimentos antes de comprar.</p>
   <div className="shopping-list">
    {groups.structured.map(item=><button type="button" key={purchaseKey(item)}
     disabled={disabled} aria-pressed={purchased(item)}
     className={purchased(item)?"shopping-item checked":"shopping-item"}
     onClick={()=>onToggle(item)}>
     <span className="checkmark">{purchased(item)&&<Check size={14}/>}</span>
     <span>{item.name}<small>Quantidade estruturada</small></span>
     <strong>{formatIngredientAmount(item.quantity,item.unit)}</strong>
    </button>)}
    {groups.consolidatedOriginal.map(pilotButton)}
   </div>
  </section>}

  {reviewCount>0&&<section className="cc-pilot-shopping" aria-label="Ingredientes que precisam de conferência">
   <h3>Conferir antes de comprar ({reviewCount})</h3>
   <p>Medidas diferentes, ingredientes sem quantificação e trechos ambíguos. A frequência de uso não indica quantidade a comprar. Consulte a receita original.</p>
   <div className="shopping-list">{groups.needsChecking.map(pilotButton)}</div>
   {groups.incompleteReference.length>0&&<div className="cc-shopping-notes cc-shopping-decisions">
    <h4>Referências incompletas — não são produtos para compra</h4>
    <ul>{groups.incompleteReference.map(item=><li className="cc-shopping-decision" key={purchaseKey(item)}>
     <span className="cc-shopping-decision-body">
      <span className="cc-shopping-decision-title">{item.sourceText}</span>
      <small className="cc-shopping-decision-note">{shoppingReviewReason(item,pilotShopping)}</small>
      <small className="cc-shopping-decision-origin">Em: {item.sourceRecipes.join("; ")}</small>
     </span>
     <span className="cc-shopping-decision-tag">Conferir receita</span>
    </li>)}</ul>
   </div>}
  </section>}

  {optionalCount>0&&<section className="cc-shopping-notes cc-shopping-decisions" aria-label="Alternativas e opcionais">
   <h3>Alternativas e opcionais ({optionalCount})</h3>
   <p>Não incluídos automaticamente como quantidades de compra. Escolha a alternativa ou decida pelo opcional antes de acrescentar ao supermercado.</p>
   <ul>
    {groups.choicesAndOptional.map(item=><li className="cc-shopping-decision" key={purchaseKey(item)}>
     <span className="cc-shopping-decision-body">
      <span className="cc-shopping-decision-title">{item.sourceText}</span>
      <small className="cc-shopping-decision-note">{item.quantity>1?item.quantity+" usos":"1 uso"} no cardápio. {item.requiresChoice?"Escolha uma opção antes de comprar.":""} {item.optionalSource?"Só inclua se desejar utilizar.":""}</small>
      {item.sourceRawFragments.length>0&&<small className="cc-shopping-decision-note">Texto original: {item.sourceRawFragments.join(" | ")}</small>}
      <small className="cc-shopping-decision-origin">Em: {item.sourceRecipes.join("; ")}</small>
     </span>
     <span className="cc-shopping-decision-tag">{item.requiresChoice?"Escolher opção":item.optionalSource?"Opcional":"Conferir"}</span>
    </li>)}
    {groups.notes.map(note=><li className="cc-shopping-decision" key={note.name+"|"+note.description}>
     <span className="cc-shopping-decision-body">
      <span className="cc-shopping-decision-title">{note.name}</span>
      <small className="cc-shopping-decision-note">{note.description}</small>
     </span>
     <span className="cc-shopping-decision-tag">A gosto</span>
    </li>)}
   </ul>
  </section>}
 </>;
}
