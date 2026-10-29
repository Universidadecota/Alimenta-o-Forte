import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
import {buildPilotSourceEvidenceReport,type HistoricalIngredientEvidence,type OfficialPilotSource,type PilotSourceEvidenceReport,type HistoricalComparison} from "./lib/pilotSourceEvidence";
import type {CurrentPilotIngredient,RecipeReconciliation} from "./lib/pilotSourceReconciliation";

const comparisonLabels:Record<HistoricalComparison,string>={
 exact:"Texto e posição iguais",
 name:"Texto diferente",
 position:"Posição diferente",
 both:"Texto e posição diferentes",
 missing:"Sem ingrediente atual com este ID",
};
type Props={recipe:RecipeReconciliation;onClose:()=>void};

/** Leitura administrativa e sob demanda. Não há qualquer ação de escrita. */
export default function PilotMeasureSourceEvidence({recipe,onClose}:Props){
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [report,setReport]=useState<PilotSourceEvidenceReport|null>(null);
 useEffect(()=>{
  let cancelled=false;
  const run=async()=>{
   setLoading(true);setError("");setReport(null);
   if(!supabase){setError("Conexão com o catálogo indisponível.");setLoading(false);return;}
   try{
    const [officialResult,historicalResult,currentResult]=await Promise.all([
     supabase.from("cc_official_recipe_source_records")
      .select("recipe_id,source_document,entry_number,source_page,original_title,original_ingredients,reference_hash,use_stage")
      .eq("recipe_id",recipe.recipe_id).maybeSingle(),
     supabase.from("cc_pilot_ingredient_measure_reviews")
      .select("ingredient_id,recipe_id,source_text,source_position,review_status",{count:"exact"})
      .eq("recipe_id",recipe.recipe_id)
      .order("source_position",{ascending:true}).order("ingredient_id",{ascending:true}).range(0,249),
     supabase.from("recipe_ingredients")
      .select("id,recipe_id,name,position",{count:"exact"})
      .eq("recipe_id",recipe.recipe_id)
      .order("position",{ascending:true}).order("id",{ascending:true}).range(0,249)
    ]);
    if(cancelled)return;
    if(officialResult.error)throw officialResult.error;
    if(historicalResult.error)throw historicalResult.error;
    if(currentResult.error)throw currentResult.error;
    const historic=(historicalResult.data??[]) as HistoricalIngredientEvidence[];
    const current=(currentResult.data??[]) as CurrentPilotIngredient[];
    if(historicalResult.count!==historic.length||currentResult.count!==current.length||
     historic.length>250||current.length>250){
     throw new Error("A leitura da receita foi incompleta. Nenhuma evidência parcial foi exibida.");
    }
    const evidence=buildPilotSourceEvidenceReport(recipe,
     (officialResult.data??null) as OfficialPilotSource|null,historic,current);
    setReport(evidence);
   }catch(err){
    if(!cancelled)setError(err instanceof Error?err.message:"Não foi possível ler a evidência da receita.");
   }finally{if(!cancelled)setLoading(false);}
  };
  void run();
  return ()=>{cancelled=true;};
 },[recipe.recipe_id]);
 return <article className="cc-measure-draft-preview" aria-label={"Evidência histórica da receita "+recipe.title}>
  <div className="cc-measure-batch-header">
   <div>
    <h4>Fonte e ingredientes · {recipe.title}</h4>
    <p>Conferência de origem somente para a administração. A proximidade de posições não prova correspondência 1:N.</p>
   </div>
   <button type="button" className="secondary" onClick={onClose}>Fechar evidência</button>
  </div>
  {loading&&<p role="status">Consultando a fonte oficial e os dois inventários…</p>}
  {error&&<p className="error" role="alert">{error} Nenhum dado foi alterado.</p>}
  {report&&<>
   <section>
    <strong>Registro da fonte oficial preservada</strong>
    <p><small>Documento: {report.official.source_document} · entrada {report.official.entry_number}
     {report.official.source_page!=null?" · página "+report.official.source_page:""}
     {" · "}referência registrada: <code>{report.official.reference_hash}</code></small></p>
    <p><small>Título de origem: {report.official.original_title}. O hash é exibido como identificador armazenado; não foi recalculado nesta consulta.</small></p>
    <p style={{whiteSpace:"pre-wrap"}}><strong>Ingredientes no documento de origem:</strong>{"\n"}{report.official.original_ingredients}</p>
   </section>
   <section>
    <h4>Expressões históricas e ingrediente atual pelo mesmo ID</h4>
    <p>Somente a identidade do registro é usada na correspondência abaixo. Alterações de texto e posição ficam explícitas.</p>
    <div style={{overflowX:"auto"}}>
     <table>
      <thead><tr><th>Expressão histórica</th><th>Ingrediente atual com o mesmo ID</th><th>Situação técnica</th></tr></thead>
      <tbody>{report.historical.map(line=><tr key={line.ingredient_id}>
       <td><strong>#{line.source_position+1}</strong> · {line.source_text}<small> · {line.review_status}</small></td>
       <td>{line.current_name==null?"— sem registro atual":"#"+(line.current_position!+1)+" · "+line.current_name}</td>
       <td>{comparisonLabels[line.comparison]}</td>
      </tr>)}</tbody>
     </table>
    </div>
   </section>
   {report.untrackedCurrent.length>0&&<section>
    <h4>{report.untrackedCurrent.length} ingredientes atuais sem ficha histórica por ID</h4>
    <p>Esses itens podem resultar de desmembramentos editoriais, mas <strong>nenhuma relação foi presumida</strong>. Verifique a fonte integral antes de propor um vínculo.</p>
    <ul>{report.untrackedCurrent.map(row=><li key={row.id}>
     <strong>#{row.position+1}</strong> · {row.name} <small>(ID atual: <code>{row.id}</code>)</small>
    </li>)}</ul>
   </section>}
   <p><small>Esta é apenas a evidência de origem. Não grava sugestões, não altera aprovação, alergênicos, porções, lista de compras ou nutrição. Para corrigir vínculo ou desmembramento será necessária decisão editorial específica e auditável.</small></p>
  </>}
 </article>;
}
