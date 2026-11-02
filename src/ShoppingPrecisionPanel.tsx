import {useState} from "react";
import {auditShoppingPrecision,precisionCounts,type PrecisionPriority} from "./lib/shoppingPrecisionAudit";
import type {ShoppingDecision} from "./lib/shoppingDecisions";
import type {PilotShoppingItem} from "./lib/shopping";

type Filter="all"|PrecisionPriority;
const headings:Record<PrecisionPriority,string>={
 source:"Texto ou referência incompleta",
 decision:"Escolha ou opcional pendente",
 quantity:"Medida ou rendimento a conferir"
};
const filters:ReadonlyArray<{id:Filter;label:string}>=[
 {id:"all",label:"Todas"},
 {id:"source",label:"Texto de origem"},
 {id:"decision",label:"Decisões"},
 {id:"quantity",label:"Quantidades"}
];

/** Fase 47: orientação para revisão humana, sem edição ou gravação. */
export default function ShoppingPrecisionPanel({
 items,decisions
}:{items:PilotShoppingItem[];decisions:ShoppingDecision[]}){
 const [filter,setFilter]=useState<Filter>("all");
 const [showAll,setShowAll]=useState(false);
 const issues=auditShoppingPrecision(items,decisions);
 const counts=precisionCounts(issues);
 const selected=filter==="all"?issues:issues.filter(item=>item.priority===filter);
 const visible=showAll?selected:selected.slice(0,12);
 if(!issues.length)return null;
 return <section className="cc-precision-review" aria-label="Triagem de precisão da lista de compras">
  <div className="cc-precision-review-header">
   <div>
    <h3>Pendências para conferir antes de comprar</h3>
    <p>Revisão do texto das receitas piloto: estas informações precisam de confirmação humana. Não são novas compras nem quantidades calculadas.</p>
   </div>
   <span className="cc-precision-total">{issues.length} referências</span>
  </div>
  <div className="cc-precision-summary" aria-label="Contagem por tipo de pendência">
   <div><strong>{counts.source}</strong><span>Textos de origem</span></div>
   <div><strong>{counts.decision}</strong><span>Decisões pendentes</span></div>
   <div><strong>{counts.quantity}</strong><span>Medidas a conferir</span></div>
  </div>
  <div className="cc-precision-filters" role="group" aria-label="Filtrar pendências">
   {filters.map(option=><button key={option.id} type="button"
    className={filter===option.id?"is-active":""}
    aria-pressed={filter===option.id}
    onClick={()=>{setFilter(option.id);setShowAll(false);}}>
    {option.label}
   </button>)}
  </div>
  {selected.length===0
   ?<p className="cc-precision-empty">Nenhuma referência nesta categoria.</p>
   :<ol className="cc-precision-items">
    {visible.map(issue=><li key={issue.key}>
     <div className="cc-precision-issue-head">
      <strong>{issue.title}</strong>
      <span>{headings[issue.priority]}</span>
     </div>
     <p>{issue.explanation}</p>
     <p><strong>Próxima conferência:</strong> {issue.nextStep}</p>
     <small><strong>Fonte:</strong> {issue.recipes.length?issue.recipes.join("; "):"Receita de origem não informada"}
      {issue.usages>1?" · "+issue.usages+" usos no cardápio":""}
     </small>
     {issue.originalFragments.length>0&&<details className="cc-precision-source">
      <summary>Ver texto original completo</summary>
      <p>{issue.originalFragments.join(" | ")}</p>
     </details>}
    </li>)}
   </ol>}
  {selected.length>12&&<button type="button" className="cc-precision-more"
   onClick={()=>setShowAll(open=>!open)}>
   {showAll?"Mostrar somente as primeiras 12":"Mostrar todas ("+selected.length+")"}
  </button>}
  <p className="cc-precision-disclaimer">
   Somente para revisão: não substitui conferência de receitas, embalagens, rendimento, alergênicos ou quantidades efetivas de supermercado. Nenhuma informação é alterada automaticamente.
  </p>
 </section>;
}
