import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
import {collectAllergenTriageHints} from "./lib/allergenTriageHints.mjs";

type Ingredient={id:string;name:string;position:number};
type EvidenceState="investigating"|"awaiting_supplier";
type SourceKind="unverified"|"recipe_text"|"supplier_label"|"manufacturer_document"|"other_document";
type Evidence={
 id:string;recipe_id:string;ingredient_id:string;
 ingredient_text_snapshot:string;source_reference_hash_snapshot:string;
 evidence_state:EvidenceState;source_kind:SourceKind;source_reference:string;
 supplier_or_brand:string;composition_notes:string;suspected_allergens:string[];
 cross_contact_notes:string;recorded_at:string;
};
type Draft={
 evidenceState:EvidenceState;sourceKind:SourceKind;sourceReference:string;
 supplierOrBrand:string;compositionNotes:string;suspectedAllergens:string;crossContactNotes:string;
};
type Props={recipeId:string;sourceHash:string;ingredients:Ingredient[];editable:boolean};
const blank:Draft={
 evidenceState:"investigating",sourceKind:"unverified",sourceReference:"",
 supplierOrBrand:"",compositionNotes:"",suspectedAllergens:"",crossContactNotes:""
};
const stateLabels:Record<EvidenceState,string>={
 investigating:"Investigação aberta",awaiting_supplier:"Aguardando fornecedor / rótulo"
};
const sourceLabels:Record<SourceKind,string>={
 unverified:"Ainda não conferida",recipe_text:"Texto original da receita",
 supplier_label:"Rótulo do fornecedor",manufacturer_document:"Documento do fabricante",
 other_document:"Outra fonte identificada"
};
const isStale=(item:Evidence,ingredient:Ingredient,sourceHash:string)=>
 item.ingredient_text_snapshot!==ingredient.name||
 item.source_reference_hash_snapshot!==sourceHash;

export default function AdminAllergenIngredientEvidence({recipeId,sourceHash,ingredients,editable}:Props){
 const [availability,setAvailability]=useState<"loading"|"ready"|"not_deployed"|"error">("loading");
 const [history,setHistory]=useState<Evidence[]>([]);
 const [activeId,setActiveId]=useState<string|null>(null);
 const [draft,setDraft]=useState<Draft>(blank);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const load=async()=>{
  if(!supabase)return;
  const result=await supabase.from("cc_allergen_ingredient_evidence")
   .select("id,recipe_id,ingredient_id,ingredient_text_snapshot,source_reference_hash_snapshot,evidence_state,source_kind,source_reference,supplier_or_brand,composition_notes,suspected_allergens,cross_contact_notes,recorded_at")
   .eq("recipe_id",recipeId).order("recorded_at",{ascending:false}).limit(500);
  if(result.error){
   setAvailability(["42P01","PGRST205"].includes(result.error.code??"")?"not_deployed":"error");
   setHistory([]);
  }else{
   setHistory((result.data??[]) as Evidence[]);
   setAvailability("ready");
  }
 };
 useEffect(()=>{
  let alive=true;
  const fetchEvidence=async()=>{
   if(!supabase){if(alive)setAvailability("error");return;}
   const result=await supabase.from("cc_allergen_ingredient_evidence")
    .select("id,recipe_id,ingredient_id,ingredient_text_snapshot,source_reference_hash_snapshot,evidence_state,source_kind,source_reference,supplier_or_brand,composition_notes,suspected_allergens,cross_contact_notes,recorded_at")
    .eq("recipe_id",recipeId).order("recorded_at",{ascending:false}).limit(500);
   if(!alive)return;
   if(result.error){
    setAvailability(["42P01","PGRST205"].includes(result.error.code??"")?"not_deployed":"error");
   }else{setHistory((result.data??[]) as Evidence[]);setAvailability("ready");}
  };
  void fetchEvidence();
  return()=>{alive=false;};
 },[recipeId]);
 const latest:Record<string,Evidence>={};
 for(const entry of history)if(!latest[entry.ingredient_id])latest[entry.ingredient_id]=entry;
 const chosen=ingredients.find(item=>item.id===activeId);
 const previous=chosen?latest[chosen.id]:undefined;
 const oldEvidence=Boolean(previous&&chosen&&isStale(previous,chosen,sourceHash));
 const choose=(ingredient:Ingredient)=>{
  if(busy)return;
  const recent=latest[ingredient.id];
  const changed=recent&&isStale(recent,ingredient,sourceHash);
  const hints=collectAllergenTriageHints(ingredient.name).hints.map(item=>item.code);
  setActiveId(ingredient.id);setError("");setMessage("");
  setDraft(recent&&!changed?{
   evidenceState:recent.evidence_state,sourceKind:recent.source_kind,
   sourceReference:recent.source_reference,supplierOrBrand:recent.supplier_or_brand,
   compositionNotes:recent.composition_notes,
   suspectedAllergens:recent.suspected_allergens.join(", "),
   crossContactNotes:recent.cross_contact_notes
  }:{...blank,suspectedAllergens:hints.join(", ")});
 };
 const save=async()=>{
  if(!supabase||!chosen||busy||!editable||availability!=="ready")return;
  if(draft.compositionNotes.trim().length<10){
   setError("Descreva as informações verificadas ou pendentes (mínimo de 10 caracteres).");return;
  }
  if(draft.sourceKind!=="unverified"&&draft.sourceReference.trim().length<5){
   setError("Identifique a referência documental ou o rótulo consultado.");return;
  }
  const codes=[...new Set(draft.suspectedAllergens.split(",").map(value=>value.trim().toLowerCase()).filter(Boolean))];
  if(codes.some(value=>!(/^[a-z][a-z0-9_]*$/.test(value)))){
   setError("Use códigos de alergênicos sem acentos ou espaços, como ovos, soja e leite.");return;
  }
  if(!window.confirm("Registrar uma NOVA evidência editorial, ainda inconclusiva? O histórico anterior será preservado. Esta ação NÃO comprova ausência de alergênicos nem libera o cardápio."))return;
  setBusy(true);setError("");setMessage("");
  const result=await supabase.from("cc_allergen_ingredient_evidence").insert({
   recipe_id:recipeId,ingredient_id:chosen.id,
   evidence_state:draft.evidenceState,source_kind:draft.sourceKind,
   source_reference:draft.sourceReference.trim(),supplier_or_brand:draft.supplierOrBrand.trim(),
   composition_notes:draft.compositionNotes.trim(),suspected_allergens:codes,
   cross_contact_notes:draft.crossContactNotes.trim()
  });
  if(result.error){
   setError("Não foi possível registrar a evidência. Nenhuma liberação foi concedida.");
  }else{
   await load();
   setMessage("Nova evidência registrada em histórico. A receita permanece NÃO liberada para alérgicos.");
  }
  setBusy(false);
 };
 return <section className="cc-admin-pilot-readonly" aria-label="Evidências por ingrediente" style={{marginTop:20}}>
  <h4>A3B · Evidências por ingrediente (investigação)</h4>
  <p className="detail-note">Registros individuais, com histórico imutável, referência, fornecedor e contato cruzado. Nenhuma evidência nesta etapa é uma declaração de ausência de alergênicos.</p>
  {availability==="loading"&&<p role="status">Carregando evidências...</p>}
  {availability==="not_deployed"&&<p className="detail-note" role="status">Estrutura A3B ainda não ativada no banco principal. A triagem A3 continua disponível; não há gravação nem liberação por esta área.</p>}
  {availability==="error"&&<p role="alert">Não foi possível consultar as evidências A3B. A triagem anterior continua disponível.</p>}
  {availability==="ready"&&<>
   <p className="detail-note">{ingredients.filter(item=>latest[item.id]).length} de {ingredients.length} ingredientes com pelo menos uma investigação registrada (não verificada).</p>
   <div style={{display:"grid",gap:6,marginBottom:12}}>
    {ingredients.map(item=>{
     const last=latest[item.id];
     const stale=last&&isStale(last,item,sourceHash);
     return <button type="button" className="secondary" key={item.id} disabled={busy}
      onClick={()=>choose(item)} aria-pressed={activeId===item.id}
      style={{display:"flex",justifyContent:"space-between",gap:12,textAlign:"left"}}>
      <span>{item.position+1}. {item.name}</span>
      <small>{!last?"Sem evidência":stale?"Fonte alterada — reavaliar":stateLabels[last.evidence_state]}</small>
     </button>;
    })}
   </div>
   {chosen&&<>
    <h5>Ingrediente: {chosen.name}</h5>
    {previous&&<p className="detail-note">Último registro: {new Date(previous.recorded_at).toLocaleString("pt-BR")} · {history.filter(row=>row.ingredient_id===chosen.id).length} versão(ões) preservada(s). {oldEvidence?"A referência original mudou; é necessária nova análise.":"Rascunho anterior carregado para revisão."}</p>}
    <p className="detail-note">As pistas textuais são apenas hipóteses. Informe a origem real dos dados e os pontos ainda não esclarecidos.</p>
    <div style={{display:"grid",gap:9}}>
     <label htmlFor="cc-a3b-state">Situação da investigação</label>
     <select id="cc-a3b-state" value={draft.evidenceState} disabled={!editable||busy}
      onChange={e=>setDraft(value=>({...value,evidenceState:e.target.value as EvidenceState}))}>
      {Object.entries(stateLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select>
     <label htmlFor="cc-a3b-source">Tipo de fonte</label>
     <select id="cc-a3b-source" value={draft.sourceKind} disabled={!editable||busy}
      onChange={e=>setDraft(value=>({...value,sourceKind:e.target.value as SourceKind}))}>
      {Object.entries(sourceLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select>
     <label htmlFor="cc-a3b-reference">Referência da fonte (documento, lote, rótulo ou endereço)</label>
     <input id="cc-a3b-reference" style={{width:"100%",boxSizing:"border-box"}} value={draft.sourceReference}
      disabled={!editable||busy} onChange={e=>setDraft(value=>({...value,sourceReference:e.target.value}))}
      placeholder="Sem documento conferido? Deixe em branco e marque fonte não conferida."/>
     <label htmlFor="cc-a3b-supplier">Fornecedor ou marca (se conhecido)</label>
     <input id="cc-a3b-supplier" style={{width:"100%",boxSizing:"border-box"}} value={draft.supplierOrBrand}
      disabled={!editable||busy} onChange={e=>setDraft(value=>({...value,supplierOrBrand:e.target.value}))}/>
     <label htmlFor="cc-a3b-composition">Composição, derivados e pendências identificadas</label>
     <textarea id="cc-a3b-composition" rows={3} style={{width:"100%",boxSizing:"border-box",resize:"vertical"}}
      value={draft.compositionNotes} disabled={!editable||busy}
      onChange={e=>setDraft(value=>({...value,compositionNotes:e.target.value}))}
      placeholder="O que está comprovado pela fonte? O que ainda falta verificar?"/>
     <label htmlFor="cc-a3b-allergens">Alergênicos SUSPEITOS (códigos separados por vírgula)</label>
     <input id="cc-a3b-allergens" style={{width:"100%",boxSizing:"border-box"}} value={draft.suspectedAllergens}
      disabled={!editable||busy} onChange={e=>setDraft(value=>({...value,suspectedAllergens:e.target.value}))}
      placeholder="Ex.: ovos, soja — não é lista de exclusões"/>
     <label htmlFor="cc-a3b-contact">Contato cruzado: informação disponível e pendências</label>
     <textarea id="cc-a3b-contact" rows={3} style={{width:"100%",boxSizing:"border-box",resize:"vertical"}}
      value={draft.crossContactNotes} disabled={!editable||busy}
      onChange={e=>setDraft(value=>({...value,crossContactNotes:e.target.value}))}
      placeholder="A ausência de informação não equivale a risco ausente."/>
     <p className="detail-note">Salvar cria uma nova versão (sem alterar as anteriores), nunca uma autorização. Uma revisão final independente ainda será necessária.</p>
     <button type="button" className="primary" disabled={!editable||busy} onClick={()=>void save()}>
      {busy?"Registrando...":"Registrar evidência pendente"}
     </button>
    </div>
   </>}
  </>}
  {error&&<p role="alert">{error}</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
