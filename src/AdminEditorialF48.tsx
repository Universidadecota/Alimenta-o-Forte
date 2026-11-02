import {useState} from "react";
import {buildEditorialFindings} from "./lib/editorialSourceCases";
import type {Meal} from "./lib/planner";

/** Administração: parecer editorial em rascunho, não altera dados. */
export default function AdminEditorialF48({recipes,onOpenRecipe}:{
 recipes:Meal[];
 onOpenRecipe:(recipeId:string)=>void;
}){
 const cases=buildEditorialFindings(recipes);
 const [copied,setCopied]=useState<string|null>(null);
 const [error,setError]=useState("");
 const copyCase=async(item:(typeof cases)[number])=>{
  const body=[
   "Costa&Costa — revisão editorial F48 — proposta sem aprovação",
   "Assunto: "+item.title,
   "Problema: "+item.issue,
   "Proposta para validação: "+item.proposal,
   "Ressalva: "+item.caution,
   ...item.evidence.map(ev=>[
    "Receita: "+ev.recipeTitle,
    "Documento: "+ev.sourceDocument,
    "Trecho cadastrado: "+ev.ingredient,
    "Ingredientes da fonte: "+ev.originalIngredients,
    "Preparo cadastrado: "+ev.instructions
   ].join("\n")),
   "Situação: AGUARDANDO REVISÃO; NÃO ALTERAR A RECEITA AUTOMATICAMENTE."
  ].join("\n\n");
  try{
   await navigator.clipboard.writeText(body);setCopied(item.id);setError("");
  }catch{setError("Não foi possível copiar o parecer. Consulte as evidências na tela.");}
 };
 return <section className="cc-f48-dossier" aria-label="Revisão editorial da lista de compras">
  <div className="cc-f48-heading">
   <div>
    <h2>Revisão editorial — Fase 48</h2>
    <p>Dossiê inicial de três referências da lista de compras, elaborado a partir dos ingredientes e preparos cadastrados. Nenhuma proposta está aprovada ou altera o catálogo.</p>
   </div>
   <span>3 referências</span>
  </div>
  <div className="cc-f48-warning">
   <strong>Aprovação editorial pendente.</strong> As sugestões abaixo precisam de conferência humana com as fontes originais. O caso de maionese com ovo cru exige também revisão específica de segurança alimentar.
  </div>
  {error&&<p role="alert">{error}</p>}
  <div className="cc-f48-cases">
   {cases.map((item,index)=><article key={item.id}>
    <h3>{index+1}. {item.title}</h3>
    <p><strong>Identificação:</strong> {item.issue}</p>
    <p><strong>Proposta para avaliação:</strong> {item.proposal}</p>
    <p className="cc-f48-caution"><strong>Limite:</strong> {item.caution}</p>
    {item.evidence.length===0?<p className="cc-f48-empty">A receita não está disponível nesta sessão. Não é possível homologar esta proposta sem conferir sua fonte.</p>
    :<details className="cc-f48-evidence">
     <summary>Conferir evidências da fonte ({item.evidence.length} {item.evidence.length===1?"entrada":"entradas"})</summary>
     {item.evidence.map((ev,i)=><div key={ev.recipeId+"-"+i}>
      <h4>{ev.recipeTitle}</h4>
      <p><strong>Documento:</strong> {ev.sourceDocument}</p>
      <p><strong>Trecho cadastrado:</strong> {ev.ingredient}</p>
      <details>
       <summary>Ingredientes originais e modo de preparo</summary>
       <p className="cc-f48-original">{ev.originalIngredients}</p>
       <p className="cc-f48-original">{ev.instructions}</p>
      </details>
      <button type="button" onClick={()=>onOpenRecipe(ev.recipeId)}>Abrir receita cadastrada</button>
     </div>)}
    </details>}
    <button className="cc-f48-copy" type="button" disabled={item.evidence.length===0}
     onClick={()=>void copyCase(item)}>{copied===item.id?"Parecer copiado":"Copiar parecer para revisão"}</button>
   </article>)}
  </div>
  <p className="cc-f48-footer">Nenhuma receita, quantidade, alergênico, status de comprado ou decisão do usuário é modificada nesta etapa. A fonte registrada permanece integralmente preservada.</p>
 </section>;
}
