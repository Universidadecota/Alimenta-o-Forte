import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
import type {Meal} from "./lib/planner";
type Facts={
 basis:"whole_recipe"|"portion";basis_servings:number;
 energy_kcal:number|null;protein_g:number|null;carbohydrates_g:number|null;
 fats_g:number|null;fiber_g:number|null;sodium_mg:number|null;
 source_name:string;source_reference:string;method_notes:string;
};
const metrics=[
 {key:"energy_kcal",name:"Energia",unit:"kcal"},
 {key:"carbohydrates_g",name:"Carboidratos",unit:"g"},
 {key:"protein_g",name:"Proteínas",unit:"g"},
 {key:"fats_g",name:"Gorduras",unit:"g"},
 {key:"fiber_g",name:"Fibras",unit:"g"},
 {key:"sodium_mg",name:"Sódio",unit:"mg"},
] as const;
const number=(n:number)=>new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1}).format(n);
export default function RecipeNutrition({recipe}:{recipe:Meal}){
 const [nutrition,setNutrition]=useState<Facts|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  let alive=true;setNutrition(null);setLoading(true);setError("");
  if(!supabase){setLoading(false);return;}
  void Promise.resolve(supabase.rpc("cc_beta_recipe_nutrition",{p_recipe_id:recipe.id}))
   .then(({data,error:err})=>{
    if(!alive)return;
    if(err)setError("Não foi possível consultar a ficha nutricional.");
    else setNutrition((data?.[0]??null) as Facts|null);
   }).finally(()=>{if(alive)setLoading(false);});
  return()=>{alive=false};
 },[recipe.id]);
 return <section className="detail-panel cc-recipe-nutrition">
  <h3>Informação nutricional da receita</h3>
  {loading?<p className="detail-note" role="status">Consultando informações nutricionais...</p>:
   error?<p className="detail-note" role="alert">{error}</p>:
   nutrition?<><p className="detail-note">Valores {nutrition.basis==="whole_recipe"?"da receita completa":"por porção de referência"} · {number(nutrition.basis_servings)} {nutrition.basis_servings===1?"porção":"porções"} consideradas na ficha técnica.</p>
    <dl className="cc-nutrition-grid">{metrics.map(item=><div key={item.key}><dt>{item.name}</dt><dd>{nutrition[item.key]==null?"Não informado":number(Number(nutrition[item.key]))+" "+item.unit}</dd></div>)}</dl>
    <p className="detail-note"><strong>Fonte:</strong> {nutrition.source_name} · {nutrition.source_reference}</p>
    {nutrition.method_notes&&<p className="detail-note">{nutrition.method_notes}</p>}
    </>:<><p className="cc-nutrition-status">Composição nutricional em revisão</p>
    <p className="detail-note">Os valores de energia, carboidratos, proteínas, gorduras, fibras e sódio ainda não foram liberados para esta receita. As medidas originais e os ingredientes precisam ser conferidos antes de calcular os totais.</p>
    <div className="cc-nutrition-pending" aria-label="Nutrientes aguardando validação">
     {metrics.map(m=><span key={m.key}>{m.name} <strong>—</strong></span>)}
    </div></>}
  <p className="detail-note">A composição nutricional não determina segurança para alergias, intolerâncias ou contato cruzado. Confira ingredientes e rótulos.</p>
 </section>;
}
