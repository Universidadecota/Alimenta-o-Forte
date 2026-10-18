import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
type Recipe={recipe_id:string;title:string;enabled:boolean};
export default function AdminBetaAccess(){
 const [email,setEmail]=useState("");
 const [recipes,setRecipes]=useState<Recipe[]>([]);
 const [search,setSearch]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const load=async()=>{
  if(!supabase)return;
  const {data,error}=await supabase.rpc("cc_admin_beta_catalog_overview");
  if(error)setError("Não foi possível consultar o catálogo beta.");
  else setRecipes((data??[]) as Recipe[]);
 };
 useEffect(()=>{void load();},[]);
 const updateMember=async(enabled:boolean)=>{
  if(!supabase||busy||!email.trim())return;
  setBusy(true);setError("");setMessage("");
  const {error}=await supabase.rpc("cc_admin_set_beta_member",{p_email:email.trim(),p_enabled:enabled});
  if(error)setError("Não foi possível alterar acesso. Confira se a conta já está cadastrada e se você possui permissão.");
  else{setMessage(enabled?"Participante habilitado.":"Acesso do participante revogado.");setEmail("");}
  setBusy(false);
 };
 const updateRecipe=async(row:Recipe)=>{
  if(!supabase||busy)return;
  const action=row.enabled?"retirar do":"incluir no";
  if(!window.confirm("Confirmar "+action+" catálogo beta: "+row.title+"?"))return;
  setBusy(true);setError("");setMessage("");
  const {error}=await supabase.rpc("cc_admin_set_beta_recipe",{p_recipe_id:row.recipe_id,p_enabled:!row.enabled});
  if(error)setError("Não foi possível alterar a disponibilidade dessa receita.");
  else{setMessage("Disponibilidade beta atualizada.");await load();}
  setBusy(false);
 };
 const shown=recipes.filter(x=>x.title.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
 return <section className="detail-panel" style={{marginTop:20}}>
  <h3>Participantes e receitas do beta gratuito</h3>
  <p className="detail-note">Acesso restrito aos participantes convidados. Esta liberação não publica a receita na internet e não altera ingredientes ou preparo.</p>
  <label htmlFor="beta-email">E-mail de usuário já cadastrado</label>
  <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"8px 0 18px"}}>
   <input id="beta-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@exemplo.com" style={{flex:"1 1 230px",minWidth:0}}/>
   <button className="primary" type="button" disabled={busy||!email.trim()} onClick={()=>void updateMember(true)}>Autorizar beta</button>
   <button className="secondary" type="button" disabled={busy||!email.trim()} onClick={()=>void updateMember(false)}>Revogar acesso</button>
  </div>
  <h3>Catálogo disponível aos testadores</h3>
  <p className="detail-note">{recipes.filter(r=>r.enabled).length} de {recipes.length} receitas habilitadas para o beta.</p>
  <input aria-label="Buscar receita do catálogo beta" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar receita..." style={{width:"100%",maxWidth:420}}/>
  <div style={{maxHeight:360,overflowY:"auto",marginTop:12}}>
   {shown.map(row=><div key={row.recipe_id} style={{display:"flex",gap:10,alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #ddd"}}>
    <span>{row.title} · {row.enabled?"No beta":"Restrita"}</span>
    <button type="button" className="secondary" disabled={busy} onClick={()=>void updateRecipe(row)}>{row.enabled?"Retirar do beta":"Liberar no beta"}</button>
   </div>)}
  </div>
  {error&&<p role="alert">{error}</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
