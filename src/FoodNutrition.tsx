import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
import type {FoodItem} from "./lib/foodLibrary";

type Variant={
 variant_name:string;food_state:string;reference_basis:string;
 energy_kcal:number|null;protein_g:number|null;carbohydrates_g:number|null;
 fats_g:number|null;fiber_g:number|null;sodium_mg:number|null;
 source_name:string;source_reference:string;source_url:string;review_status:string;
};
const facts=[
 {field:"energy_kcal",label:"Energia",unit:"kcal"},
 {field:"carbohydrates_g",label:"Carboidratos",unit:"g"},
 {field:"protein_g",label:"Proteínas",unit:"g"},
 {field:"fats_g",label:"Gorduras totais",unit:"g"},
 {field:"fiber_g",label:"Fibras",unit:"g"},
 {field:"sodium_mg",label:"Sódio",unit:"mg"},
] as const;
const formatNumber=(value:number|null)=>value==null?"Não informado":new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(Number(value));
export default function FoodNutrition({food}:{food:FoodItem}){
 const [variants,setVariants]=useState<Variant[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  let active=true;setLoading(true);setError("");setVariants([]);
  if(!supabase){setLoading(false);setError("Conexão indisponível.");return;}
  void supabase.rpc("cc_beta_food_nutrition_references",{p_food_id:food.id})
   .then(({data,error:loadError})=>{
    if(!active)return;
    if(loadError)setError("As referências nutricionais não puderam ser carregadas.");
    else setVariants((data??[]) as Variant[]);
   }).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false};
 },[food.id]);
 return <section className="cc-food-nutrition">
  <h3>Informações nutricionais</h3>
  <p className="detail-note">Valores de referência por 100 g da parte comestível. Variedade e preparo podem alterar a composição.</p>
  {loading&&<p role="status" className="detail-note">Consultando referências nutricionais...</p>}
  {error&&<p role="alert" className="detail-note">{error}</p>}
  {!loading&&!error&&variants.length===0&&<p className="detail-note">Este alimento ainda não possui valores com fonte cadastrada. Nenhum valor foi estimado.</p>}
  {variants.map((variant,i)=><article key={variant.variant_name+i} className="cc-nutrition-variant">
   <h4>{variant.variant_name}</h4>
   <p className="cc-nutrition-status">{variant.review_status==="awaiting_specialist"?"Dados da tabela de referência · revisão especializada pendente":"Referência nutricional em revisão"}</p>
   <dl className="cc-nutrition-grid">{facts.map(fact=><div key={fact.field}>
    <dt>{fact.label}</dt><dd>{formatNumber(variant[fact.field])}{variant[fact.field]!=null?" "+fact.unit:""}</dd>
   </div>)}</dl>
   <p className="detail-note"><strong>Fonte:</strong> {variant.source_name}. {variant.source_reference}.</p>
   {/^https:\/\/(?:www\.)?nepa\.unicamp\.br\//.test(variant.source_url)&&<p className="detail-note"><a href={variant.source_url} target="_blank" rel="noopener noreferrer">Consultar a tabela original</a></p>}
  </article>)}
  <p className="detail-note"><strong>Importante:</strong> os valores acima são referências identificadas na fonte, mas sua associação às fichas do aplicativo ainda aguarda revisão. Não representam uma análise laboratorial desta unidade de alimento nem validam alergênicos. Não são automaticamente utilizados para calcular receitas.</p>
 </section>;
}
