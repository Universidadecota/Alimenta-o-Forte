import {useCallback,useEffect,useState} from "react";
import {supabase} from "./lib/supabase";

type RatingRow={recipe_id:string;title:string;total:number;average_stars:number|null;likes:number;dislikes:number;published:boolean};
export default function AdminRecipeRatings(){
 const [rows,setRows]=useState<RatingRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [onlyRated,setOnlyRated]=useState(true);
 const refresh=useCallback(async()=>{
  if(!supabase){setError("Banco indisponível.");setLoading(false);return;}
  setLoading(true);setError("");
  const {data,error:loadError}=await supabase.rpc("cc_admin_recipe_rating_overview");
  if(loadError)setError("Não foi possível carregar as avaliações das receitas.");
  else setRows((data??[]) as RatingRow[]);
  setLoading(false);
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 const rated=rows.filter(row=>Number(row.total)>0);
 const shown=onlyRated?rated:rows;
 return <section className="detail-panel" style={{marginTop:20}}>
  <h3>Aceitação das receitas no beta</h3>
  <p className="detail-note">Notas e votos ajudam a decidir o que manter na biblioteca. Nenhuma receita é alterada ou despublicada automaticamente.</p>
  <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",margin:"12px 0"}}>
   <strong>{rated.length} receitas avaliadas</strong>
   <label style={{display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={onlyRated} onChange={e=>setOnlyRated(e.target.checked)}/> Somente avaliadas</label>
   <button type="button" className="secondary" disabled={loading} onClick={()=>void refresh()}>Atualizar resultados</button>
  </div>
  {loading&&<p role="status">Carregando avaliações...</p>}
  {error&&<p role="alert">{error}</p>}
  {!loading&&!error&&shown.length===0&&<p>{onlyRated?"Nenhuma receita avaliada ainda. Desmarque o filtro para visualizar o catálogo.":"Nenhuma receita disponível."}</p>}
  {!loading&&!error&&shown.length>0&&<div style={{overflowX:"auto"}}>
   <table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}>
    <thead><tr><th>Receita</th><th>Avaliações</th><th>Média</th><th>Gostei</th><th>Não gostei</th><th>Situação</th></tr></thead>
    <tbody>{shown.map(row=><tr key={row.recipe_id}>
     <td>{row.title}</td><td>{row.total}</td><td>{row.average_stars??"—"}</td>
     <td>{row.likes}</td><td>{row.dislikes}</td><td>{row.published?"Publicada":"Não publicada"}</td>
    </tr>)}</tbody>
   </table>
  </div>}
 </section>;
}
