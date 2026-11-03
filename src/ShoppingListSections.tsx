import {Check} from "lucide-react";
import {formatIngredientAmount} from "./lib/ingredientMeasures";
import {purchaseKey} from "./lib/shoppingProgress";
import {groupShoppingForReview,shoppingReviewReason} from "./lib/shoppingReviewGroups";
import {recurringIngredientReviews} from "./lib/recurringIngredientReview";
import ShoppingDecisionsPanel from "./ShoppingDecisionsPanel";
import ShoppingPrecisionPanel from "./ShoppingPrecisionPanel";
import type {ShoppingDecision} from "./lib/shoppingDecisions";
import type {ShoppingItem,PilotShoppingItem,ShoppingNote} from "./lib/shopping";

type Props={
 shopping:ShoppingItem[];
 pilotShopping:PilotShoppingItem[];
 notes:ShoppingNote[];
 purchasedKeys:string[];
 onToggle:(item:ShoppingItem)=>void;
 decisions:ShoppingDecision[];
 decisionBusyKey:string|null;
 decisionDisabled:boolean;
 onSaveDecision:(item:PilotShoppingItem,decision:ShoppingDecision|null)=>void;
 disabled:boolean;
};

/** Três grupos de apresentação; mantém IDs, quantidades e marcações originais. */
export default function ShoppingListSections({
 shopping,pilotShopping,notes,purchasedKeys,onToggle,decisions,decisionBusyKey,onSaveDecision,decisionDisabled,disabled
}:Props){
 const groups=groupShoppingForReview(shopping,pilotShopping,notes);
 const recurring=recurringIngredientReviews(pilotShopping);
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

  <ShoppingPrecisionPanel items={pilotShopping} decisions={decisions}/>

  {recurring.length>0&&<details className="cc-quantity-review">
   <summary>Conferir alimentos em diferentes apresentações ({recurring.length})</summary>
   <p>Esses alimentos aparecem de maneiras diferentes nas receitas. O quadro ajuda a conferir as medidas, mas não converte unidades nem define a quantidade definitiva a comprar. As entradas completas continuam nas seções abaixo.</p>
   <div className="cc-quantity-review-grid">
    {recurring.map(group=><section key={group.id} aria-label={"Conferir "+group.label}>
     <h4>{group.label}</h4>
     <ul>{group.variants.map((variant,index)=><li key={index}>
      {variant.description}{variant.uses>1&&<small> ({variant.uses} usos)</small>}
     </li>)}</ul>
    </section>)}
   </div>
  </details>}

  {measuredCount>0&&<section className="cc-pilot-shopping" aria-label="Medidas estruturadas e originais consolidadas">
   <h3>Medidas consolidadas ({measuredCount})</h3>
   <p>Quantidades estruturadas e somas de medidas originais literais equivalentes. As receitas internas não foram ajustadas para o número de pessoas; confira embalagens e rendimentos antes de comprar.</p>
   <div className="shopping-list">
    {groups.structured.map(item=><button type="button" key={purchaseKey(item)}
     disabled={disabled} aria-pressed={purchased(item)}
     className={purchased(item)?"shopping-item checked":"shopping-item"}
     onClick={()=>onToggle(item)}>
     <span className="checkmark">{purchased(item)&&<Check size={14}/>}</span>
     <span className="cc-shopping-structured-text">{item.name}</span>
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
      <small className="cc-shopping-decision-note">{item.quantity>1?item.quantity+" ocorrências no cardápio. ":""}{shoppingReviewReason(item,pilotShopping)}</small>
      <small className="cc-shopping-decision-origin">Em: {item.sourceRecipes.join("; ")}</small>
     </span>
     <span className="cc-shopping-decision-tag">Conferir receita</span>
    </li>)}</ul>
   </div>}
  </section>}

  {optionalCount>0&&<ShoppingDecisionsPanel items={groups.choicesAndOptional} notes={groups.notes}
   decisions={decisions} busyKey={decisionBusyKey} disabled={disabled||decisionDisabled}
   onSave={onSaveDecision}/>}
 </>;
}
