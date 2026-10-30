import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
import {buildPilotSourceEvidenceReport,type HistoricalIngredientEvidence,type OfficialPilotSource,type PilotSourceEvidenceReport,type HistoricalComparison} from "./lib/pilotSourceEvidence";
import type {RecipeReconciliation} from "./lib/pilotSourceReconciliation";
import {buildEditorialMappingHints} from "./lib/pilotEditorialMappingHints";
import {traceUntrackedIngredientsToSource} from "./lib/pilotSourceLiteralTrace";
import {buildSourceEditorialFocus} from "./lib/pilotSourceEditorialFocus";
import {SAUCE_SAFETY_PROPOSALS,getVerifiedSauceProposal,type SauceSafetyProposal,type CurrentSauceRecipeSnapshot} from "./lib/pilotSauceSafetyProposals";
import {getVerifiedSauceAudit,type SauceAuditIngredient,type SauceAuditReport} from "./lib/pilotSauceEditorialAudit";
import {getVerifiedPreparationPartition,type PreparationPartition,type PreparationKind} from "./lib/pilotRecipePreparationPartition";
import {buildProposedAuxiliaryLink,type AuxiliaryConsumptionLink} from "./lib/pilotAuxiliaryConsumptionModel";

const comparisonLabels:Record<HistoricalComparison,string>={
 exact:"Texto e posição iguais",
 name:"Texto diferente",
 position:"Posição diferente",
 both:"Texto e posição diferentes",
 missing:"Sem ingrediente atual com este ID",
};
type Props={recipe:RecipeReconciliation;onClose:()=>void};
const blockLabels:Record<PreparationKind,string>={main:"Prato principal",sauce:"Preparo auxiliar · molho",side:"Acompanhamento"};

/** Leitura administrativa e sob demanda. Não há qualquer ação de escrita. */
export default function PilotMeasureSourceEvidence({recipe,onClose}:Props){
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [report,setReport]=useState<PilotSourceEvidenceReport|null>(null);
 const [sauceComparison,setSauceComparison]=useState<{proposal:SauceSafetyProposal;currentInstructions:string;audit:SauceAuditReport|null;partition:PreparationPartition|null;link:AuxiliaryConsumptionLink|null}|null>(null);
 const [sauceWarning,setSauceWarning]=useState("");
 useEffect(()=>{
  let cancelled=false;
  const run=async()=>{
   setLoading(true);setError("");setReport(null);
   setSauceComparison(null);setSauceWarning("");
   if(!supabase){setError("Conexão com o catálogo indisponível.");setLoading(false);return;}
   try{
    const [officialResult,historicalResult,currentResult]=await Promise.all([
     supabase.from("cc_official_recipe_source_records")
      .select("recipe_id,source_document,entry_number,source_page,original_title,original_ingredients,original_yield,reference_hash,use_stage")
      .eq("recipe_id",recipe.recipe_id).maybeSingle(),
     supabase.from("cc_pilot_ingredient_measure_reviews")
      .select("ingredient_id,recipe_id,source_text,source_position,review_status",{count:"exact"})
      .eq("recipe_id",recipe.recipe_id)
      .order("source_position",{ascending:true}).order("ingredient_id",{ascending:true}).range(0,249),
     supabase.from("recipe_ingredients")
      .select("id,recipe_id,name,position,quantity,unit,measure_mode",{count:"exact"})
      .eq("recipe_id",recipe.recipe_id)
      .order("position",{ascending:true}).order("id",{ascending:true}).range(0,249)
    ]);
    if(cancelled)return;
    if(officialResult.error)throw officialResult.error;
    if(historicalResult.error)throw historicalResult.error;
    if(currentResult.error)throw currentResult.error;
    const historic=(historicalResult.data??[]) as HistoricalIngredientEvidence[];
    const current=(currentResult.data??[]) as SauceAuditIngredient[];
    const currentRowsForAudit=current;
    if(historicalResult.count!==historic.length||currentResult.count!==current.length||
     historic.length>250||current.length>250){
     throw new Error("A leitura da receita foi incompleta. Nenhuma evidência parcial foi exibida.");
    }
    const evidence=buildPilotSourceEvidenceReport(recipe,
     (officialResult.data??null) as OfficialPilotSource|null,historic,current);
    setReport(evidence);
    // A proposta é carregada apenas nas três receitas auditadas. Falhas não
    // interferem na leitura da fonte e nunca habilitam aprovação.
    if(SAUCE_SAFETY_PROPOSALS.some(item=>item.recipeId===recipe.recipe_id)){
     try{
      const snapshotResult=await supabase.from("recipes")
       .select("id,instructions,published,servings").eq("id",recipe.recipe_id).maybeSingle();
      if(cancelled)return;
      if(snapshotResult.error)throw snapshotResult.error;
      const current=(snapshotResult.data??null) as (CurrentSauceRecipeSnapshot&{servings:number|null})|null;
      const proposal=getVerifiedSauceProposal(evidence.official,current);
      if(!proposal||!current?.instructions)throw new Error("A fonte, a versão do preparo ou o estado de publicação não coincidem com a auditoria.");
      const audit=getVerifiedSauceAudit(proposal,evidence.official,current,
       currentRowsForAudit);
      const partition=getVerifiedPreparationPartition(proposal,evidence.official,current,currentRowsForAudit);
      const link=partition?buildProposedAuxiliaryLink(recipe.recipe_id,partition):null;
      setSauceComparison({proposal,currentInstructions:current.instructions,audit,partition,link});
     }catch{
      if(!cancelled)setSauceWarning("A proposta de preparo foi ocultada: não foi possível confirmar a versão exata da fonte, das instruções atuais e o estado não publicado. Refaça a revisão antes de propor mudanças.");
     }
    }
   }catch(err){
    if(!cancelled)setError(err instanceof Error?err.message:"Não foi possível ler a evidência da receita.");
   }finally{if(!cancelled)setLoading(false);}
  };
  void run();
  return ()=>{cancelled=true;};
 },[recipe.recipe_id]);
 const mapping=report?buildEditorialMappingHints(report):null;
 const sourceTrace=report?traceUntrackedIngredientsToSource(report):null;
 const editorialFocus=report?buildSourceEditorialFocus(report):null;
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
   {editorialFocus&&(editorialFocus.cases.length>0||editorialFocus.recipeRequiresEggSauceReview)&&<section aria-label="Conferência editorial prioritária da receita">
    <h4>Conferência prioritária · evidências que exigem interpretação</h4>
    <p>Estes pontos precisam ser examinados na fonte antes de qualquer conciliação. A classificação não aprova medidas, não estabelece vínculos por ID e não altera o catálogo.</p>
    {editorialFocus.recipeRequiresEggSauceReview&&<p role="note">
     <strong>Atenção à segurança alimentar:</strong> a fonte inclui gema em molho ou maionese.
     Conferir o preparo atual, a eventual utilização de ovo sem cozimento, o emprego de ingredientes pasteurizados, as orientações de conservação e os alergênicos antes de qualquer publicação.
     Este aviso é uma pendência editorial, não uma validação de segurança.
    </p>}
    {editorialFocus.cases.length>0?<ol>{editorialFocus.cases.map(item=><li key={item.ingredient.id}>
     <strong>#{item.ingredient.position+1} · {item.ingredient.name}</strong>
     <small style={{display:"block"}}>{item.explanation}</small>
     <small style={{display:"block"}}>Identificador do ingrediente: <code>{item.ingredient.id}</code></small>
    </li>)}</ol>:<p>Nenhum ingrediente adicional com ambiguidade textual nesta receita.</p>}
   </section>}
   {(sauceWarning||sauceComparison)&&<section aria-label="Propostas de preparo mais seguro ainda não aprovadas">
    <h4>Proposta editorial de preparo mais seguro · não homologada</h4>
    <p>Esta seção é apenas uma alternativa proposta com base na fotografia auditada. <strong>A receita atual e seu documento de origem não foram alterados.</strong></p>
    {sauceWarning&&<p role="alert">{sauceWarning}</p>}
    {sauceComparison&&<details>
     <summary>Examinar preparo atual e proposta para {sauceComparison.proposal.title}</summary>
     <h5>Preparo registrado atualmente — preservado</h5>
     <p style={{whiteSpace:"pre-wrap"}}>{sauceComparison.currentInstructions}</p>
     <h5>Mudança sugerida nos ingredientes — ainda não aplicada</h5>
     <p>{sauceComparison.proposal.proposedIngredientNote}</p>
     <h5>Preparo alternativo proposto — ainda não aplicado</h5>
     <p style={{whiteSpace:"pre-wrap"}}>{sauceComparison.proposal.proposedPreparation}</p>
     <h5>Conferência de consistência, rendimentos e quantidades</h5>
     {sauceComparison.audit?<div>
      <p><strong>{sauceComparison.audit.sourceIngredientCount} ingredientes</strong> na receita;
       <strong> {sauceComparison.audit.structurallyUnmeasuredCount}</strong> ainda sem quantidade numérica estruturada.
       <strong> {sauceComparison.audit.servings} porção</strong> cadastrada para a refeição.
       A expressão textual original pode conter medidas, mas elas não foram homologadas para cálculos automáticos.</p>
      <ul>{sauceComparison.audit.issues.map(issue=><li key={issue}>{issue}</li>)}</ul>
      <h5>Ingredientes que exigem verificação dos alertas de alergia</h5>
      <ul>{sauceComparison.audit.ingredientsForAllergyReview.map(item=><li key={item}>{item}</li>)}</ul>
      <p><small>Esta lista é uma triagem do texto, não um cadastro validado de alergênicos nem garantia de ausência de risco.</small></p>
     </div>:<p role="alert">A fotografia de ingredientes, quantidades ou rendimento diverge da auditoria; os detalhes de consistência foram ocultados para evitar conclusões desatualizadas. Refaça a revisão.</p>}
     <h5>Mapa do prato e dos preparos auxiliares · somente leitura</h5>
     {sauceComparison.audit&&sauceComparison.partition?<div>
      <p>Refeição cadastrada para <strong>{sauceComparison.partition.mealServings} pessoa</strong>. A divisão abaixo preserva os ingredientes atuais sem criar novas receitas ou relações no banco.</p>
      {sauceComparison.partition.blocks.map(block=><section key={block.key} aria-label={blockLabels[block.kind]+" — "+block.title}>
       <h5>{blockLabels[block.kind]} — {block.title}</h5>
       <p><small>{block.ingredients.length} expressões originais neste bloco.
        {block.declaredYield?" Rendimento descrito na fonte: "+block.declaredYield+".":""}
        {block.usedInMeal?" Quantidade indicada para uso no prato: "+block.usedInMeal+".":""}
       </small></p>
       <ol start={block.ingredients[0].position+1}>{block.ingredients.map(item=><li key={item.id}>
        {item.name}
        {block.referencedAtPosition===item.position&&<small style={{display:"block"}}>Referência à maionese preparada no bloco auxiliar; não duplicar este item e seus ingredientes na lista de compras.</small>}
       </li>)}</ol>
      </section>)}
      <h5>Modelo de relação prato → preparo auxiliar · ainda não homologado</h5>
      {sauceComparison.link?<div>
       <p><strong>Prato:</strong> {sauceComparison.link.mainBlockKey} · <strong>Molho:</strong> {sauceComparison.link.auxiliaryBlockKey}</p>
       <p><small>Rendimento descrito: {sauceComparison.link.sourceDeclaredYield??"não informado em unidade quantificável"}.
        {" "}Uso descrito na refeição: {sauceComparison.link.sourceDeclaredUse??"quantidade não informada"}.
        {" "}Referência ao molho pronto: {sauceComparison.link.referenceIngredientText??"não consta como item próprio no prato"}.</small></p>
       <p><strong>Quantidade produzida, quantidade usada e sobra:</strong> pendentes de medição validada.
        Não há conversão automática entre xícara, colher, massa ou volume.</p>
       {sauceComparison.link.duplicatePurchaseRisk&&<p role="note">
        <strong>Dupla contagem possível:</strong> o prato menciona o molho pronto e o bloco auxiliar descreve seus componentes.
        A lista de compras não deve contar os dois conjuntos como compras independentes.
       </p>}
       <p><small>Nenhum cálculo para compras ou nutrição foi habilitado. As simulações matemáticas são exercitadas apenas nos testes automatizados, com dados fictícios.</small></p>
      </div>:<p role="alert">A relação prato–molho não passou pela verificação editorial. Nenhum cálculo foi habilitado.</p>}
      <h5>Uso, sobras e consolidação pendentes</h5>
      <ul>{sauceComparison.partition.warnings.map(item=><li key={item}>{item}</li>)}</ul>
      <p><small><strong>Sem cálculo automático:</strong> nem as quantidades consumidas nem as sobras, conversões de unidades, valores nutricionais ou somas de compras estão homologados nesta visualização.</small></p>
     </div>:<p role="alert">A divisão entre prato e molho foi ocultada porque a fotografia do inventário não passou pela verificação de integridade.</p>}
     <h5>Pontos que exigem revisão e decisão editorial</h5>
     <ul>{sauceComparison.proposal.reviewChecklist.map(item=><li key={item}>{item}</li>)}</ul>
     <p><small>Sem botão de aprovação nesta fase. Esta prévia não atualiza ingredientes, medidas, alergênicos, rendimento, lista de compras ou a publicação da receita.</small></p>
    </details>}
   </section>}
   {mapping&&<section aria-label="Mapa editorial preliminar de correspondências">
    <h4>Mapa editorial preliminar · hipóteses não aprovadas</h4>
    <p>O sistema compara somente trechos literais da fonte, com IDs únicos e posições contíguas. <strong>Uma hipótese não equivale a vínculo confirmado nem modifica ingrediente algum.</strong></p>
    {mapping.literalSplits.length>0?<ul>{mapping.literalSplits.map(hint=><li key={hint.historical_id}>
     <strong>Possível desmembramento da expressão #{hint.historical_position+1}:</strong> {hint.historical_source}
     <ul>{hint.current_parts.map(part=><li key={part.id}>
      #{part.position+1} · {part.name} <small>({part.kind==="same_id"?"ID histórico preservado":"Novo ID sem ficha histórica"})</small>
     </li>)}</ul>
     <small>Correspondência textual preliminar. Confirmar manualmente na fonte antes de qualquer decisão editorial.</small>
    </li>)}</ul>:<p>Nenhum desmembramento atende aos critérios literais estritos desta receita. Isso não elimina a necessidade de revisão editorial.</p>}
    <p><small>{mapping.unresolvedText.length} expressões históricas sem hipótese literal segura; {mapping.stillUnlinked.length} ingredientes atuais sem associação literal sugerida.</small></p>
    {mapping.relocated.length>0&&<details>
     <summary>Ver {mapping.relocated.length} ingredientes com texto preservado e posição diferente</summary>
     <ul>{mapping.relocated.map(line=><li key={line.ingredient_id}>
      {line.source_text}: posição histórica #{line.source_position+1} → atual #{(line.current_position??-1)+1}. <small>Mesma identidade; nenhuma aprovação de medida.</small>
     </li>)}</ul>
    </details>}
   </section>}
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
    <p>Alguns itens podem ser componentes de molhos ou acompanhamentos já descritos na origem. A conferência abaixo procura apenas a <strong>redação literal na fonte oficial</strong>, sem criar vínculos nem aprovar ingredientes.</p>
    {sourceTrace&&<p>
     <strong>{sourceTrace.counts.unique}</strong> com redação literal única ·{" "}
     <strong>{sourceTrace.counts.annotated}</strong> com texto-base localizado e anotação contextual ·{" "}
     <strong>{sourceTrace.counts.ambiguous}</strong> com ocorrência repetida ·{" "}
     <strong>{sourceTrace.counts.not_found}</strong> sem trecho localizado.
    </p>}
    <ul>{sourceTrace?.items.map(({ingredient:row,status,occurrences,matchedFragment})=><li key={row.id}>
     <strong>#{row.position+1}</strong> · {row.name} <small>(ID atual: <code>{row.id}</code>)</small>
     <small style={{display:"block"}}>
      {status==="unique"?"Redação literal localizada uma vez na origem; vínculo histórico ainda não comprovado.":
       status==="annotated"?"Texto-base da fonte localizado uma vez (“"+matchedFragment+"”), com anotação contextual diferente na ficha; exige conferência.":
       status==="ambiguous"?"Redação localizada "+occurrences+" vezes; conferir a qual preparo pertence.":
       "Nenhum trecho seguro localizado; comparar a descrição integral do preparo."}
     </small>
    </li>)}</ul>
    <p><small>Correspondência textual não confirma identidade por ID, rendimento, porção nem composição nutricional. Não há decisão editorial automática.</small></p>
   </section>}
   <p><small>Esta é apenas a evidência de origem. Não grava sugestões, não altera aprovação, alergênicos, porções, lista de compras ou nutrição. Para corrigir vínculo ou desmembramento será necessária decisão editorial específica e auditável.</small></p>
  </>}
 </article>;
}
