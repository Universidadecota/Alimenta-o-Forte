import {useState} from "react";
import type {AuxiliaryConsumptionLink,AuxiliaryMeasureUnit} from "./lib/pilotAuxiliaryConsumptionModel";
import {
 buildAuxiliaryReviewDraft,
 REQUIRED_EDITORIAL_DECISIONS,
 type AuxiliaryReviewDraft
} from "./lib/pilotAuxiliaryReviewDraft";

type Props={
 link:AuxiliaryConsumptionLink;
 sourceHash:string;
 rightsStatus:string;
 ingredientReviewStatus:string;
};
const UNITS:readonly AuxiliaryMeasureUnit[]=["g","ml","unidade","porcao"];
const UNIT_LABELS:Record<AuxiliaryMeasureUnit,string>={
 g:"gramas (g)",ml:"mililitros (ml)",unidade:"unidades",porcao:"porções"
};

/** Formulário local para montar um rascunho, SEM salvar ou homologar.
 * A exportação é apenas uma cópia manual. Não usa Supabase ou outras APIs.
 */
export default function PilotAuxiliaryReviewWorksheet({
 link,sourceHash,rightsStatus,ingredientReviewStatus
}:Props){
 const [yieldText,setYieldText]=useState("");
 const [yieldUnit,setYieldUnit]=useState<AuxiliaryMeasureUnit>("ml");
 const [useText,setUseText]=useState("");
 const [useUnit,setUseUnit]=useState<AuxiliaryMeasureUnit>("ml");
 const [evidence,setEvidence]=useState("");
 const [notes,setNotes]=useState("");
 const [draft,setDraft]=useState<AuxiliaryReviewDraft|null>(null);
 const [copied,setCopied]=useState("");
 const change=(fn:(value:string)=>void)=>(value:string)=>{
  fn(value);setDraft(null);setCopied("");
 };
 const generate=()=>{
  setDraft(buildAuxiliaryReviewDraft(link,{
   hash:sourceHash,rightsStatus,ingredientReviewStatus
  },{
   yieldText,yieldUnit,useText,useUnit,
   measurementEvidence:evidence,editorialNotes:notes
  }));
  setCopied("");
 };
 const copyDraft=async()=>{
  if(!draft)return;
  try{
   await navigator.clipboard.writeText(JSON.stringify(draft,null,2));
   setCopied("Ficha de rascunho copiada. Não foi enviada nem aprovada.");
  }catch{
   setCopied("Cópia automática indisponível. Selecione o JSON abaixo e copie manualmente.");
  }
 };
 return <details aria-label="Ficha editorial de uso e rendimento do molho">
  <summary>Preparar ficha editorial do molho · somente nesta sessão</summary>
  <p><strong>Rascunho sem homologação.</strong> Valores digitados não são gravados. Use apenas medições reais, na unidade indicada.
   A tela não converte colheres, xícaras ou porções, não considera sobras seguras e não altera cálculos de compras.</p>
  <p><small>Direitos comerciais na fonte: <strong>{rightsStatus}</strong>. Revisão dos ingredientes: <strong>{ingredientReviewStatus}</strong>.
   Esses estados continuam sujeitos ao fluxo administrativo separado.</small></p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:"0.8rem",marginBottom:"0.8rem"}}>
   <label>Quantidade total produzida
    <input type="text" inputMode="decimal" value={yieldText} maxLength={64}
     onChange={event=>change(setYieldText)(event.target.value)} placeholder="Ex.: 200" aria-label="Quantidade total produzida"/>
   </label>
   <label>Unidade produzida
    <select aria-label="Unidade produzida" value={yieldUnit}
     onChange={event=>{setYieldUnit(event.target.value as AuxiliaryMeasureUnit);setDraft(null);setCopied("");}}>
     {UNITS.map(unit=><option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>)}
    </select>
   </label>
   <label>Quantidade aplicada ao prato
    <input type="text" inputMode="decimal" value={useText} maxLength={64}
     onChange={event=>change(setUseText)(event.target.value)} placeholder="Ex.: 30" aria-label="Quantidade aplicada ao prato"/>
   </label>
   <label>Unidade aplicada ao prato
    <select aria-label="Unidade aplicada ao prato" value={useUnit}
     onChange={event=>{setUseUnit(event.target.value as AuxiliaryMeasureUnit);setDraft(null);setCopied("");}}>
     {UNITS.map(unit=><option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>)}
    </select>
   </label>
  </div>
  <label>Evidência da medição (obrigatória para encaminhar à análise)
   <textarea value={evidence} maxLength={2000} rows={3}
    placeholder="Descreva método, utensílio, lote e como foram medidas as quantidades."
    onChange={event=>change(setEvidence)(event.target.value)}/>
  </label>
  <label>Observações editoriais (opcionais)
   <textarea value={notes} maxLength={2000} rows={3}
    placeholder="Informações adicionais para a conferência humana."
    onChange={event=>change(setNotes)(event.target.value)}/>
  </label>
  <p><strong>Pendências que esta ficha não resolve:</strong></p>
  <ul>{REQUIRED_EDITORIAL_DECISIONS.map(item=><li key={item}>{item}</li>)}</ul>
  <button type="button" className="secondary" onClick={generate}>Gerar rascunho não homologado</button>
  {draft&&<section aria-label="Prévia da ficha editorial sem homologação">
   <h5>Prévia local · {draft.editorialStage==="apto_para_analise_humana"?"dados numéricos coerentes para análise humana":"informações insuficientes ou incompatíveis"}</h5>
   <p>Status permanente: <strong>{draft.status.replaceAll("_"," ")}</strong>. Resultado da comparação: {draft.providedMeasurement.comparisonStatus}.
    {draft.providedMeasurement.differenceHypothetical
     ?" Diferença física hipotética: "+draft.providedMeasurement.differenceHypothetical.amount+" "+draft.providedMeasurement.differenceHypothetical.unit+"."
     :" Não há diferença numérica calculável."}</p>
   <p><small>Mesmo com números coerentes, esta ficha não aprova segurança, direitos, ingredientes, compras, nutrição nem publicação. A diferença não indica sobra segura para armazenar.</small></p>
   <button type="button" className="secondary" onClick={()=>{void copyDraft();}}>Copiar rascunho JSON</button>
   {copied&&<p role="status">{copied}</p>}
   <details><summary>Ver conteúdo completo da ficha não homologada</summary>
    <textarea aria-label="JSON da ficha editorial não homologada" readOnly rows={12}
     value={JSON.stringify(draft,null,2)} style={{width:"100%",fontFamily:"monospace"}}/>
   </details>
  </section>}
 </details>;
}
