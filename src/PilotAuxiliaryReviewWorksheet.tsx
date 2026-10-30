import {useState} from "react";
import {buildAuxiliaryEditorialWorkflowPreview} from "./lib/pilotAuxiliaryEditorialWorkflowPreview";
import {buildAuxiliaryAuthorizationBlueprint} from "./lib/pilotAuxiliaryAuthorizationBlueprint";
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
 const workflow=draft?buildAuxiliaryEditorialWorkflowPreview(draft):null;
 const authorizationBlueprint=workflow?buildAuxiliaryAuthorizationBlueprint(workflow):null;
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
   <p>Status permanente: <strong>{draft.status.split("_").join(" ")}</strong>. Resultado da comparação: {draft.providedMeasurement.comparisonStatus}.
    {draft.providedMeasurement.differenceHypothetical
     ?" Diferença física hipotética: "+draft.providedMeasurement.differenceHypothetical.amount+" "+draft.providedMeasurement.differenceHypothetical.unit+"."
     :" Não há diferença numérica calculável."}</p>
   <p><small>Mesmo com números coerentes, esta ficha não aprova segurança, direitos, ingredientes, compras, nutrição nem publicação. A diferença não indica sobra segura para armazenar.</small></p>
   <section aria-label="Fluxo editorial proposto sem aprovação">
    <h5>Etapas e responsabilidades para uma futura homologação</h5>
    <p>Trata-se de um <strong>projeto de fluxo</strong>, não de avaliações concluídas. Os responsáveis abaixo são funções a definir, não papéis já autorizados no sistema. Nenhum parecer foi registrado.</p>
    {workflow?<div>
     <ol>{workflow.gates.map(gate=><li key={gate.id}>
      <strong>{gate.title}</strong>
      <small style={{display:"block"}}>Responsabilidade proposta: {gate.suggestedResponsibility}</small>
      <small style={{display:"block"}}>Situação: {gate.status==="apto_para_conferencia_humana"?
       "Informações organizadas para revisão humana (não aprovado)":gate.status==="bloqueado_por_pendencia"?
       "Etapa bloqueada":"Conferência ainda necessária"}</small>
      <small style={{display:"block"}}>{gate.evidence}</small>
     </li>)}</ol>
     <p><small><strong>Auditoria futura:</strong> identificação do responsável, evidência, versão da receita, versão anterior, versão esperada e horário definido pelo servidor. Não há histórico de decisões persistido nesta etapa.</small></p>
     <details><summary>Ver estrutura prevista do evento ainda não registrado</summary>
      <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(workflow.proposedEventEnvelope,null,2)}</pre>
     </details>
     {authorizationBlueprint&&<details aria-label="Projeto técnico da autorização editorial">
      <summary>Examinar matriz proposta de responsabilidades e tabelas futuras</summary>
      <p><strong>Desenho técnico, não autorização.</strong> Não foram criadas tabelas, novas funções de permissão, contas revisoras ou eventos de aprovação. Esta interface não concede papéis.</p>
      <h5>Responsabilidades propostas</h5>
      <ul>{authorizationBlueprint.roleBlueprint.map(item=><li key={item.role}>
       <strong>{item.title}</strong> · {item.role}
       <small style={{display:"block"}}>{item.serverVerification}</small>
       <small style={{display:"block"}}>Situação: papel ainda não concedido; ação não habilitada.</small>
      </li>)}</ul>
      <h5>Estrutura futura do banco · não migrada</h5>
      <ul>{authorizationBlueprint.tables.map(item=><li key={item.name}>
       <strong><code>{item.name}</code></strong>: {item.purpose}
       <small style={{display:"block"}}>Criação pendente · RLS pendente · escritas somente por rotina futura e autorizada.</small>
      </li>)}</ul>
      <h5>Controles obrigatórios antes de habilitar decisões</h5>
      <ul>{authorizationBlueprint.serverControls.map(item=><li key={item.id}>
       <strong>{item.title}</strong>: {item.detail}
      </li>)}</ul>
      <p><small>Qualquer implementação real exigirá avaliação e aprovação específica da migração, das políticas RLS e das permissões. Esta prévia não grava nada.</small></p>
     </details>}
     <p><small>Publicação, aprovação, alterações em ingredientes e liberação de cálculos continuam bloqueadas. A revisão final deverá ser feita por pessoa diferente da autora e com permissão verificada no servidor.</small></p>
    </div>:<p role="alert">Não foi possível criar a prévia do fluxo. O rascunho continua sem homologação e sem autorização de alteração.</p>}
   </section>
   <button type="button" className="secondary" onClick={()=>{void copyDraft();}}>Copiar rascunho JSON</button>
   {copied&&<p role="status">{copied}</p>}
   <details><summary>Ver conteúdo completo da ficha não homologada</summary>
    <textarea aria-label="JSON da ficha editorial não homologada" readOnly rows={12}
     value={JSON.stringify(draft,null,2)} style={{width:"100%",fontFamily:"monospace"}}/>
   </details>
  </section>}
 </details>;
}
