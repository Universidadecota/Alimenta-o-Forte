import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";

type Ingredient={id:string;name:string;position:number};
type Evidence={
 id:string;ingredient_id:string;ingredient_text_snapshot:string;
 source_reference_hash_snapshot:string;source_kind:string;
 suspected_allergens:string[];recorded_at:string;
};
type AllergenCode={code:string;label:string};
type FindingCode="declared_in_recipe"|"suspected"|"undetermined";
type CrossContact="not_assessed"|"possible_reported";
type Finding={
 id:string;ingredient_id:string;evidence_id:string;allergen_code:string;
 finding:FindingCode;cross_contact_finding:CrossContact;
 assessment_notes:string;recorded_at:string;
};
type Props={recipeId:string;sourceHash:string;ingredients:Ingredient[];editable:boolean};

const findingLabels:Record<FindingCode,string>={
 declared_in_recipe:"Presença informada na receita",
 suspected:"Possível presença — verificar",
 undetermined:"Ainda não determinado"
};
const crossLabels:Record<CrossContact,string>={
 not_assessed:"Contato cruzado não avaliado",
 possible_reported:"Possibilidade de contato cruzado relatada"
};
const missingTable=(code:string|undefined)=>["42P01","PGRST205"].includes(code??"");

export default function AdminAllergenStructuredFindings({recipeId,sourceHash,ingredients,editable}:Props){
 const [availability,setAvailability]=useState<"loading"|"ready"|"not_deployed"|"error">("loading");
 const [evidence,setEvidence]=useState<Evidence[]>([]);
 const [findings,setFindings]=useState<Finding[]>([]);
 const [taxonomy,setTaxonomy]=useState<AllergenCode[]>([]);
 const [activeId,setActiveId]=useState<string|null>(null);
 const [allergenCode,setAllergenCode]=useState("");
 const [finding,setFinding]=useState<FindingCode|"">("");
 const [crossContact,setCrossContact]=useState<CrossContact>("not_assessed");
 const [notes,setNotes]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");

 const load=async()=>{
  if(!supabase){setAvailability("error");return;}
  const client=supabase;
  const [codes,evidences,assessments]=await Promise.all([
   client.from("cc_allergen_a4_taxonomy").select("code,label").order("label"),
   client.from("cc_allergen_ingredient_evidence")
    .select("id,ingredient_id,ingredient_text_snapshot,source_reference_hash_snapshot,source_kind,suspected_allergens,recorded_at")
    .eq("recipe_id",recipeId).order("recorded_at",{ascending:false}).order("id",{ascending:false}).limit(500),
   client.from("cc_allergen_a4_ingredient_findings")
    .select("id,ingredient_id,evidence_id,allergen_code,finding,cross_contact_finding,assessment_notes,recorded_at")
    .eq("recipe_id",recipeId).order("recorded_at",{ascending:false}).limit(500)
  ]);
  const problem=codes.error??evidences.error??assessments.error;
  if(problem){
   setAvailability(missingTable(problem.code)?"not_deployed":"error");
   return;
  }
  setTaxonomy((codes.data??[]) as AllergenCode[]);
  setEvidence((evidences.data??[]) as Evidence[]);
  setFindings((assessments.data??[]) as Finding[]);
  setAvailability("ready");
 };

 useEffect(()=>{
  let alive=true;
  if(!supabase){setAvailability("error");return;}
  const client=supabase;
  const fetch=async()=>{
   const [codes,evidences,assessments]=await Promise.all([
    client.from("cc_allergen_a4_taxonomy").select("code,label").order("label"),
    client.from("cc_allergen_ingredient_evidence")
     .select("id,ingredient_id,ingredient_text_snapshot,source_reference_hash_snapshot,source_kind,suspected_allergens,recorded_at")
     .eq("recipe_id",recipeId).order("recorded_at",{ascending:false}).order("id",{ascending:false}).limit(500),
    client.from("cc_allergen_a4_ingredient_findings")
     .select("id,ingredient_id,evidence_id,allergen_code,finding,cross_contact_finding,assessment_notes,recorded_at")
     .eq("recipe_id",recipeId).order("recorded_at",{ascending:false}).limit(500)
   ]);
   if(!alive)return;
   const problem=codes.error??evidences.error??assessments.error;
   if(problem){setAvailability(missingTable(problem.code)?"not_deployed":"error");return;}
   setTaxonomy((codes.data??[]) as AllergenCode[]);
   setEvidence((evidences.data??[]) as Evidence[]);
   setFindings((assessments.data??[]) as Finding[]);
   setAvailability("ready");
  };
  void fetch();
  return()=>{alive=false;};
 },[recipeId]);

 const latest:Record<string,Evidence>={};
 for(const item of evidence)if(!latest[item.ingredient_id])latest[item.ingredient_id]=item;
 const selected=ingredients.find(item=>item.id===activeId);
 const current=selected?latest[selected.id]:undefined;
 const fresh=Boolean(selected&&current&&sourceHash&&
  current.ingredient_text_snapshot===selected.name&&
  current.source_reference_hash_snapshot===sourceHash);
 const itemFindings=selected?findings.filter(item=>item.ingredient_id===selected.id):[];
 const choose=(item:Ingredient)=>{
  if(busy)return;
  setActiveId(item.id);setAllergenCode("");setFinding("");setCrossContact("not_assessed");
  setNotes("");setError("");setMessage("");
 };
 const save=async()=>{
  if(!supabase||!editable||busy||availability!=="ready"||!selected||!current||!fresh)return;
  if(!taxonomy.some(item=>item.code===allergenCode)||!finding){
   setError("Selecione um alergênico e uma constatação preliminar.");return;
  }
  if(notes.trim().length<15){
   setError("Descreva as verificações e pendências em pelo menos 15 caracteres.");return;
  }
  if(finding==="declared_in_recipe"&&
   (current.source_kind!=="recipe_text"||!current.suspected_allergens.includes(allergenCode))){
   setError("Presença declarada exige evidência A3B baseada no texto da receita e com esse alergênico identificado.");return;
  }
  if(!window.confirm("Registrar uma NOVA constatação A4, ainda preliminar e imutável? Isso NÃO comprova ausência de alergênicos nem libera sugestões de refeições."))return;
  setBusy(true);setError("");setMessage("");
  const result=await supabase.from("cc_allergen_a4_ingredient_findings").insert({
   recipe_id:recipeId,ingredient_id:selected.id,evidence_id:current.id,
   allergen_code:allergenCode,finding,cross_contact_finding:crossContact,
   assessment_notes:notes.trim()
  });
  if(result.error){
   setError("A constatação não foi registrada. Confira se a evidência A3B ainda é a mais recente; nenhuma receita foi liberada.");
  }else{
   await load();
   setMessage("Constatação A4 preservada no histórico. Nenhuma autorização de consumo ou de geração semanal foi concedida.");
  }
  setBusy(false);
 };

 return <section className="cc-admin-pilot-readonly" aria-label="Constatações A4 de alergênicos" style={{marginTop:20}}>
  <h4>A4 · Constatações por alergênico (pré-revisão)</h4>
  <p className="detail-note">Vincula uma constatação humana à evidência A3B mais recente. Somente presença, suspeita ou situação desconhecida podem ser registradas nesta fase. Não existe opção “sem alergênico”.</p>
  {availability==="loading"&&<p role="status">Carregando constatações A4...</p>}
  {availability==="not_deployed"&&<p className="detail-note" role="status">Estrutura A4 ainda não ativada no banco. As triagens A3/A3B continuam disponíveis, sem aprovação automática.</p>}
  {availability==="error"&&<p role="alert">Não foi possível consultar a pré-revisão A4. Nenhuma receita foi liberada.</p>}
  {availability==="ready"&&<>
   <p className="detail-note">{findings.length} constatação(ões) preliminar(es) registradas nesta receita · {ingredients.filter(item=>latest[item.id]).length} de {ingredients.length} ingredientes com evidência A3B.</p>
   <button type="button" className="secondary" style={{marginBottom:12}} disabled={busy}
    onClick={()=>void load()}>Atualizar evidências e constatações</button>
   <div style={{display:"grid",gap:6,marginBottom:12}}>
    {ingredients.map(item=>{
     const record=latest[item.id];
     const stale=record&&(record.ingredient_text_snapshot!==item.name||
      !sourceHash||record.source_reference_hash_snapshot!==sourceHash);
     return <button type="button" className="secondary" key={item.id} disabled={busy}
      onClick={()=>choose(item)} aria-pressed={activeId===item.id}
      style={{display:"flex",justifyContent:"space-between",gap:12,textAlign:"left"}}>
      <span>{item.position+1}. {item.name}</span>
      <small>{!record?"A3B pendente":stale?"Evidência desatualizada":"Pronto para pré-revisão"}</small>
     </button>;
    })}
   </div>
   {selected&&<>
    <h5>Ingrediente: {selected.name}</h5>
    {itemFindings.length>0&&<div className="notice" style={{marginBottom:12}}>
     <strong>Histórico preliminar preservado ({itemFindings.length})</strong>
     <ul>{itemFindings.slice(0,8).map(item=>{
      const code=taxonomy.find(code=>code.code===item.allergen_code);
      const outdated=!fresh||item.evidence_id!==current?.id;
      return <li key={item.id}>{code?.label??item.allergen_code}: {findingLabels[item.finding]} · {crossLabels[item.cross_contact_finding]} · {new Date(item.recorded_at).toLocaleString("pt-BR")}{outdated?" · evidência anterior/desatualizada":""}</li>;
     })}</ul>
    </div>}
    {!fresh?<p className="notice" role="status">Não é possível registrar A4: falta uma evidência A3B atual deste ingrediente, vinculada à versão original da receita. Registre ou atualize primeiro a investigação A3B.</p>:<>
     <p className="detail-note">Evidência A3B vinculada: {new Date(current!.recorded_at).toLocaleString("pt-BR")}. Esta constatação ainda não é uma análise de ausência nem revisão final independente.</p>
     <div style={{display:"grid",gap:9}}>
      <label htmlFor="cc-a4-code">Alergênico específico sob análise</label>
      <select id="cc-a4-code" value={allergenCode} disabled={!editable||busy}
       onChange={e=>setAllergenCode(e.target.value)}>
       <option value="">Selecione o alergênico...</option>
       {taxonomy.map(code=><option key={code.code} value={code.code}>{code.label}</option>)}
      </select>
      <label htmlFor="cc-a4-finding">Constatação preliminar</label>
      <select id="cc-a4-finding" value={finding} disabled={!editable||busy}
       onChange={e=>setFinding(e.target.value as FindingCode|"")}>
       <option value="">Selecione a constatação...</option>
       {Object.entries(findingLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
      <label htmlFor="cc-a4-cross">Contato cruzado</label>
      <select id="cc-a4-cross" value={crossContact} disabled={!editable||busy}
       onChange={e=>setCrossContact(e.target.value as CrossContact)}>
       {Object.entries(crossLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
      <label htmlFor="cc-a4-notes">Fundamento e pendências da constatação</label>
      <textarea id="cc-a4-notes" rows={3} style={{width:"100%",boxSizing:"border-box",resize:"vertical"}}
       value={notes} disabled={!editable||busy} onChange={e=>setNotes(e.target.value)}
       placeholder="O que a evidência sustenta? O que falta confirmar em rótulos, derivados, fornecedores e contato cruzado?"/>
      <p className="detail-note">O histórico é somente acréscimo. Ausência de palavras, fornecedor ou informações de contato cruzado nunca equivale a risco ausente. Somente revisão final qualificada em etapa posterior poderá examinar exclusões.</p>
      <button type="button" className="primary" disabled={!editable||busy} onClick={()=>void save()}>
       {busy?"Registrando...":"Registrar constatação preliminar A4"}
      </button>
     </div>
    </>}
   </>}
  </>}
  {error&&<p role="alert">{error}</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
