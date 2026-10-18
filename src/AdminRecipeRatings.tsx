import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";

type RatingRow={recipe_id:string;title:string;total:number;average_stars:number|null;likes:number;dislikes:number;published:boolean};
export default function AdminRecipeRatings(){
 const [rows,setRows]=useState<RatingRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  if(!supabase){setLoading(false);return;}
  let live=true;
  void supabase.rpc("cc_admin_recipe_rating_overview").then(({data,error:loadError})=>{
   if(!live)return;
   if(loadError)setError("Não foi possível carregar as avaliações das receitas.");
   else setRows((data??[]) as RatingRow[]);
   setLoading(false);
  });
  return()=>{live=false};
 },[]);
 return <section className="detail-panel" style={{marginTop:20}}>
  <h3>Aceitação das receitas no beta</h3>
  <p className="detail-note">Notas e votos de participantes ajudam a decidir quais receitas manter publicadas. Nenhuma receita é alterada ou despublicada automaticamente.</p>
  {loading&&<p role="status">Carregando avaliações...</p>}
  {error&&<p role="alert">{error}</p>}
  {!loading&&!error&&rows.length===0&&<p>Ainda não há receitas para avaliar.</p>}
  {!loading&&!error&&rows.length>0&&<div style={{overflowX:"auto"}}>
   <table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}>
    <thead><tr><th>Receita</th><th>Avaliações</th><th>Média</th><th>Gostei</th><th>Não gostei</th><th>Situação</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.recipe_id}>
     <td>{row.title}</td><td>{row.total}</td><td>{row.average_stars??"—"}</td>
     <td>{row.likes}</td><td>{row.dislikes}</td><td>{row.published?"Publicada":"Privada"}</td>
    </tr>)}</tbody>
   </table>
  </div>}
 </section>;
}
