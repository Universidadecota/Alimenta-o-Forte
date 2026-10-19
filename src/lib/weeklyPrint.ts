import {dateKey,daySlots,type Meal,type Plan} from "./planner";
import {formatRecipeIngredient,formatIngredientAmount} from "./ingredientMeasures";
import {purchaseKey} from "./shoppingProgress";
import type {ShoppingItem,PilotShoppingItem,ShoppingNote} from "./shopping";

export type PrintKind="fridge"|"week"|"shopping";
export type WeeklyPrintData={
 kind:PrintKind;days:Date[];plan:Plan;recipes:Meal[];
 shopping:ShoppingItem[];pilotShopping:PilotShoppingItem[];
 notes:ShoppingNote[];purchasedKeys:string[];
};
const escapeHtml=(value:unknown)=>String(value??"").replace(/[&<>"']/g,char=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[char]??char);
const displayDate=(date:Date)=>date.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});
const period=(days:Date[])=>days.length?days[0].toLocaleDateString("pt-BR")+" a "+days[days.length-1].toLocaleDateString("pt-BR"):"";
const steps=(text:string|null)=>text?.split(/(?:\\n|\r?\n)+/).map(s=>s.trim()).filter(Boolean)??[];
const safe=(value:unknown)=>escapeHtml(value);

export function buildWeeklyPrintHtml(data:WeeklyPrintData):string{
 const {kind,days,plan,recipes,shopping,pilotShopping,notes,purchasedKeys}=data;
 const byId=new Map(recipes.map(r=>[r.id,r]));
 const dateRange=period(days);
 const heading=kind==="fridge"?"Cardápio da semana":kind==="week"?"Cardápio e receitas da semana":"Lista de compras da semana";
 const checklist=(item:ShoppingItem,label:string,comment="")=>`
  <li class="item"><span class="square">${purchasedKeys.includes(purchaseKey(item))?"✓":""}</span>
   <div><strong>${safe(label)}</strong>${comment?`<small>${safe(comment)}</small>`:""}</div></li>`;
 const dayCards=days.map(day=>{
  const date=dateKey(day);
  const meals=daySlots.map(slot=>{
   const scheduled=plan[date]?.[slot];
   const recipe=scheduled?byId.get(scheduled.id):undefined;
   return scheduled?`<div class="slot"><span>${safe(slot)}</span><strong>${safe(recipe?.title??"Receita indisponível")}</strong></div>`:"";
  }).join("");
  return `<section class="day"><h3>${safe(displayDate(day))}</h3>${meals||'<p class="muted">Sem refeições planejadas</p>'}</section>`;
 }).join("");
 // Uma ficha por receita distinta. Seu texto e medidas permanecem como cadastrados.
 const unique=new Map<string,{recipe:Meal;where:string[]}>();
 for(const day of days)for(const slot of daySlots){
  const scheduled=plan[dateKey(day)]?.[slot];
  const recipe=scheduled?byId.get(scheduled.id):undefined;
  if(!recipe)continue;
  const entry=unique.get(recipe.id)??{recipe,where:[]};
  entry.where.push(day.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit"})+" · "+slot);
  unique.set(recipe.id,entry);
 }
 const sheets=[...unique.values()].map(({recipe,where})=>{
  const timeText=(recipe.pilotSource?.originalTime?.split("|")[0]??recipe.minutes+" min").replace(/^\s*Tempo\s*:\s*/i,"").trim();
  const yieldText=recipe.pilotSource?recipe.pilotSource.originalYield:`${recipe.servings} porções de referência`;
  const ingredientMarkup=recipe.pilotSource
   ?`<p class="original">${safe(recipe.pilotSource.originalIngredients)}</p>`
   :`<ul>${recipe.ingredients.map(i=>`<li>${safe(i.name)} — ${safe(formatRecipeIngredient(i))}</li>`).join("")}</ul>`;
  const instructions=steps(recipe.instructions);
  const preparation=instructions.length
   ?`<ol>${instructions.map(s=>`<li>${safe(s)}</li>`).join("")}</ol>`
   :'<p class="muted">Modo de preparo ainda não cadastrado.</p>';
  return `<article class="recipe"><h3>${safe(recipe.title)}</h3><p class="muted">
   ${safe(where.join(" | "))}</p><p><strong>Tempo:</strong> ${safe(timeText)}
   · <strong>Rendimento original:</strong> ${safe(yieldText)}</p>
   <div class="recipe-body"><section><h4>Ingredientes</h4>${ingredientMarkup}</section>
   <section><h4>Modo de preparo</h4>${preparation}</section></div>
   ${recipe.pilotSource&&!recipe.pilotSource.ingredientsReviewed?'<p class="warning">Medidas originais preservadas; não houve redimensionamento automático.</p>':""}
   </article>`;
 }).join("");
 const requiresSourceReview=(item:PilotShoppingItem)=>/^(?:[0-9]+|[½¼¾⅓⅔])\s*(?:x[ií]cara|colher(?:es)?)(?:\s+\([^)]*\))?\s*\.?$/i.test(item.sourceText.trim())||/\(receita abaixo\)/i.test(item.sourceText);
 const availablePilot=pilotShopping.filter(item=>!requiresSourceReview(item));
 const needsReview=pilotShopping.filter(requiresSourceReview);
 const shoppingBody=`
 ${shopping.length?"<h2>Ingredientes com quantidades estruturadas</h2>":""}
 ${shopping.length?`<ul class="checklist">${shopping.map(item=>checklist(item,item.name+" — "+formatIngredientAmount(item.quantity,item.unit))).join("")}</ul>`:""}
 ${availablePilot.length?`<h2>Ingredientes das receitas originais</h2>
 <p class="muted">Medidas conforme as receitas, sem redimensionamento. Somente equivalências seguras são somadas. Quando não há quantidade clara, “usos” indica a frequência no cardápio, não unidades para comprar.</p>
 <ul class="checklist">${availablePilot.map(item=>checklist(item,item.totalLabel??item.sourceText,
 [
  !item.totalLabel&&item.quantity>1?item.quantity+" usos no cardápio":"",
  item.requiresChoice?"Escolha entre as alternativas":"",
  item.optionalSource?"Opcional":"",
  item.ambiguousSource?"Confira o texto original":""
 ].filter(Boolean).join(" · "))).join("")}</ul>`:""}
 ${needsReview.length?`<h2>Referências incompletas: conferir na receita</h2>
 <p class="muted">Estes trechos não identificam claramente um produto para compra e não devem ser considerados como quantidades a adquirir.</p>
 <ul class="review-list">${needsReview.map(item=>`<li>${safe(item.sourceText)}</li>`).join("")}</ul>`:""}
 ${notes.length?`<h2>Opcionais, a gosto ou sem quantidade definida</h2>
 <ul class="checklist">${notes.map(item=>`<li class="item"><span class="square"></span><div><strong>${safe(item.name)}</strong><small>${safe(item.description)}</small></div></li>`).join("")}</ul>`:""}
 ${!shopping.length&&!pilotShopping.length&&!notes.length?'<p class="muted">Planeje refeições para gerar a lista de compras.</p>':""}
 `;
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <title>${safe("Costa&Costa — "+heading+" — "+dateRange)}</title>
 <style>
 @page{size:A4;margin:13mm 14mm}
 *{box-sizing:border-box}
 body{font-family:Arial,Helvetica,sans-serif;color:#173a31;max-width:980px;margin:0 auto;padding:20px;line-height:1.45;background:#fff}
 h1{font-family:Georgia,serif;font-size:25px;margin:8px 0}h2{font-size:17px;border-bottom:1px solid #b6c7bc;padding-bottom:6px;margin-top:22px}
 h3{font-size:15px;margin:0 0 6px}h4{font-size:13px;margin:12px 0 5px}
 p,li{font-size:12px}p{margin:5px 0 10px}.muted{color:#506258;font-size:11px}.warning{font-size:11px;color:#715625}
 .brand{font-family:Georgia,serif;font-size:16px;letter-spacing:.01em}.subhead{font-size:12px;color:#506258;margin:0 0 15px}
 .toolbar{display:flex;gap:10px;margin-bottom:14px;align-items:center}.toolbar button{background:#153f34;color:white;border:0;border-radius:7px;padding:10px 15px;cursor:pointer}
 .week{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
 .day{break-inside:avoid;border:1px solid #cfd9ce;border-radius:8px;padding:7px 9px}
 .slot{display:flex;gap:2px;flex-direction:column;border-top:1px solid #edf0eb;padding:3px 0}
 .slot span{font-size:9px;color:#506258}.slot strong{font-size:11px;line-height:1.2}
 .review-list{margin:4px 0 12px;padding-left:18px}.review-list li{margin:2px 0;font-size:11px}.recipe{break-inside:avoid-page;border-top:1px solid #cdd5cc;padding:13px 0}
 .recipe-body{display:grid;grid-template-columns:1fr 1fr;gap:22px}
 .recipe li{margin-bottom:3px}.original{white-space:pre-wrap}
 .checklist{padding:0;list-style:none;columns:2;column-gap:20px}.item{break-inside:avoid;display:flex;align-items:flex-start;gap:8px;border-bottom:1px solid #edf0ea;padding:6px 0}
 .item strong{font-size:12px;font-weight:600}.item small{display:block;font-size:10px;color:#506258;margin-top:2px}
 .square{border:1px solid #8b998e;width:14px;height:14px;flex:0 0 14px;text-align:center;line-height:12px;margin-top:2px}
 .page-break{break-before:page}.foot{font-size:10px;margin-top:20px;color:#506258}
 @media(max-width:680px){.week{grid-template-columns:1fr}.recipe-body{grid-template-columns:1fr}.checklist{columns:1}}
 @media print{body{padding:0;max-width:none}.toolbar{display:none}.week{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}
 .day{padding:5px 7px;border-radius:5px;line-height:1.1}
 .day h3{font-size:11px;margin:0 0 3px}
 .slot{padding:2px 0;gap:1px}
 .slot span{font-size:8px}.slot strong{font-size:9px;line-height:1.18}
 body:has(.week){line-height:1.2}
 body:has(.week) header h1{font-size:21px;margin:4px 0}
 body:has(.week) h2{font-size:14px;margin-top:9px;padding-bottom:4px}
 body:has(.week) .subhead{margin:0 0 8px}
 body:has(.week) .brand{font-size:14px}
 /* A versão de geladeira usa a altura útil do A4 para favorecer a leitura. */
 body.fridge{line-height:1.28}
 .fridge .week{gap:9px}
 .fridge .day{padding:10px 12px;border-radius:7px;line-height:1.24}
 .fridge .day h3{font-size:14px;margin:0 0 6px}
 .fridge .slot{padding:5px 0;gap:2px}
 .fridge .slot span{font-size:10px}
 .fridge .slot strong{font-size:12px;line-height:1.27}
 .fridge header h1{font-size:26px;margin:5px 0}
 .fridge h2{font-size:17px;margin-top:13px;padding-bottom:6px}
 .fridge .subhead{font-size:12px;margin:0 0 12px}
 .fridge .brand{font-size:16px}
 .fridge .foot{font-size:10px;margin-top:15px}
 .recipe-body{grid-template-columns:1fr 1fr}.checklist{columns:2}a{color:inherit;text-decoration:none}}
 </style></head><body class="${safe(kind)}">
 <div class="toolbar"><button type="button" onclick="window.print()">Imprimir / salvar como PDF</button>
 <span class="muted">Para baixar, escolha “Salvar como PDF”. Para retirar data e endereço do papel, desmarque “Cabeçalhos e rodapés” nas opções de impressão.</span></div>
 <header><div class="brand">Costa&amp;Costa · Alimentação Forte</div><h1>${safe(heading)}</h1><p class="subhead">${safe(dateRange)}</p></header>
 ${kind!=="shopping"?`<h2>Planejamento dos sete dias</h2><div class="week">${dayCards}</div>
 ${kind==="week"?`<section class="page-break"><h2>Receitas completas da semana</h2>
 <p class="muted">Cada receita aparece uma única vez, mesmo quando se repete no cardápio.</p>${sheets||'<p>Sem receitas planejadas.</p>'}</section>`:""}`:shoppingBody}
 <footer class="foot">Costa&amp;Costa · Material de organização culinária. Alergênicos, contaminação cruzada e composição nutricional podem não estar verificados. Confira ingredientes e rótulos antes de consumir.</footer>
 </body></html>`;
}

/** Abre uma prévia própria para impressão; o navegador pode salvar como PDF. */
export function openWeeklyPrint(data:WeeklyPrintData):boolean{
 const tab=window.open("","_blank");
 if(!tab)return false;
 tab.opener=null;
 tab.document.open();
 tab.document.write(buildWeeklyPrintHtml(data));
 tab.document.close();
 tab.focus();
 return true;
}
