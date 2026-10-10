import {useEffect,useState} from "react";
import {supabase} from "./lib/supabase";
type Item={id:number;recipe_title:string;source_page:number;source_category:string;attribution:string;import_status:string};
const labels:Record<string,string>={breakfast:"Café da manhã",main:"Almoço e jantar",dessert:"Sobremesas",bonus:"Bônus"};
export default function EdvCollection(){
 const [items,setItems]=useState<Item[]>([]);const [error,setError]=useState("");const [filter,setFilter]=useState("all");const [query,setQuery]=useState("");
 useEffect(()=>{let alive=true;(async()=>{if(!supabase){setError("Entre na sua conta para visualizar a coleção.");return;}
 const {data,error}=await supabase.from("source_recipe_review").select("id,recipe_title,source_page,source_category,attribution,import_status").eq("rights_status","licensed").order("source_page");
 if(!alive)return;if(error)setError("Não foi possível carregar o catálogo.");else setItems((data??[]) as Item[]);
 })();return ()=>{alive=false};},[]);
 const result=items.filter(x=>(filter==="all"||x.source_category===filter)&&x.recipe_title.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));
 return <section className="edv-collection">
 <div className="toolbar"><div><h2>50 receitas — Código Emagrecer de Vez</h2><span>Créditos: Rodrigo Polesso · Coleção em preparação</span></div></div>
 <p className="detail-note">Catálogo licenciado conforme autorização informada pelo responsável da Costa&Costa. Ingredientes, preparo e imagens estão em revisão de importação. Os itens ainda não podem ser adicionados ao cardápio.</p>
 <div className="edv-filters"><input aria-label="Pesquisar receita" placeholder="Pesquisar entre as 50 receitas..." value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Categoria" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas as categorias</option>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
 {error&&<p role="alert">{error}</p>}
 <div className="edv-items">{result.map(x=><article key={x.id} className="edv-entry"><small>{labels[x.source_category]} · Página {x.source_page}</small><strong>{x.recipe_title}</strong><span>{x.import_status==="published"?"Disponível":"Conteúdo em preparação"}</span></article>)}</div>
 <p className="detail-note">{result.length} de {items.length} títulos exibidos.</p>
 </section>;
}
