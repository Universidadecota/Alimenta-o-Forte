import EdvCollection from "./EdvCollection";
import PersonalRecipeForm from "./PersonalRecipeForm";
import RecipeDetails from "./RecipeDetails";
import { supabase } from "./lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { type Meal, type Slot, type Plan, slots, dateKey, startOfWeek, loadRecipes, loadWeek, saveMeal, removeMeal } from "./lib/planner";
import { CalendarDays, ChefHat, ShoppingBasket, Leaf, LayoutDashboard, Check, Plus, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
function safeLoad():Plan{if(supabase)return {};try{return JSON.parse(localStorage.getItem("cc_demo_plan")||"{}") as Plan;}catch{return {};}}
export default function App(){
 const [editingId,setEditingId]=useState<string|null>(null);const [recipeForm,setRecipeForm]=useState(false);const [detailId,setDetailId]=useState<string|null>(null); const [recipes,setRecipes]=useState<Meal[]>([]); const [userId,setUserId]=useState<string|null>(null); const [loading,setLoading]=useState(!!supabase); const [saving,setSaving]=useState(false);const [error,setError]=useState("");
 const [page,setPage]=useState("Início"); const [week,setWeek]=useState(()=>startOfWeek(new Date())); const [selected,setSelected]=useState(()=>dateKey(new Date())); const [plan,setPlan]=useState<Plan>(safeLoad);const [done,setDone]=useState<string[]>([]);
 const days=Array.from({length:7},(_,i)=>{const d=new Date(week);d.setDate(week.getDate()+i);return d;});
 const weekStart=dateKey(week);
 const reloadRecipes=async()=>{const data=await loadRecipes();setRecipes(data);setRecipeForm(false);setEditingId(null);setDetailId(null);};
 const archiveRecipe=async(recipe:Meal)=>{
 if(!supabase||!userId||recipe.ownerId!==userId)return;
 if(!confirm("Arquivar esta receita pessoal? Ela deixará de aparecer na biblioteca."))return;
 setSaving(true);setError("");
 try{
 const {count,error:usageError}=await supabase.from("planned_meals").select("id",{count:"exact",head:true}).eq("user_id",userId).eq("recipe_id",recipe.id);
 if(usageError)throw usageError;
 if((count??0)>0)throw new Error("Esta receita já está em um cardápio. Remova-a dos dias planejados antes de arquivar.");
 const {error:archiveError}=await supabase.from("recipes").update({archived_at:new Date().toISOString()}).eq("id",recipe.id).eq("owner_user_id",userId);
 if(archiveError)throw archiveError;
 await reloadRecipes();
 }catch(err){setError(err instanceof Error?err.message:"Não foi possível arquivar.");}finally{setSaving(false);}
 };

 useEffect(()=>{
  if(!supabase)return;
  const client=supabase;let alive=true;
  async function initialize(){
   const {data:{user},error:authError}=await client.auth.getUser();
   if(!alive)return;
   if(authError||!user){setError("Sessão inválida. Entre novamente.");setLoading(false);return;}
   setUserId(user.id);
   try{const loaded=await loadRecipes();if(alive)setRecipes(loaded);}catch(err){if(alive)setError(err instanceof Error?err.message:"Erro ao carregar receitas.");}
  }
  void initialize();
  return ()=>{alive=false;};
 },[]);
 useEffect(()=>{
  if(!supabase||!userId)return;
  let alive=true;setLoading(true);setError("");setPlan({});
  void loadWeek(userId,weekStart).then(data=>{if(alive)setPlan(data);}).catch(err=>{if(alive)setError(err instanceof Error?err.message:"Erro ao carregar cardápio.");}).finally(()=>{if(alive)setLoading(false);});
  return ()=>{alive=false;};
 },[userId,weekStart]);
 const update=async(key:string,slot:Slot,id:string,servings=1)=>{
  if(supabase && (!userId||loading||saving))return;
  setError("");setSaving(true);
  try{
   if(supabase){
    if(id)await saveMeal(userId!,weekStart,key,slot,id,servings);
    else await removeMeal(userId!,weekStart,key,slot);
   }
   const next={...plan,[key]:{...plan[key],[slot]:id?{id,servings}:undefined}};setPlan(next);
   if(!supabase)localStorage.setItem("cc_demo_plan",JSON.stringify(next));
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar a refeição.");}
  finally{setSaving(false);}
 };
 const generate=async()=>{
  if(supabase&&(!userId||loading||saving))return;
  if(recipes.length===0){setError("Nenhuma receita disponível para planejar.");return;}
  setSaving(true);setError("");
  try{
   const next={...plan};
   for(const [i,d] of days.entries()){
    const key=dateKey(d);next[key]={...next[key]};
    for(const slot of slots){
     const arr=recipes.filter(r=>r.category===slot);
     if(!arr.length)continue;
     const id=arr[i%arr.length].id;
     if(supabase)await saveMeal(userId!,weekStart,key,slot,id);
     next[key][slot]={id,servings:1};
    }
   }
   setPlan(next);
   if(!supabase)localStorage.setItem("cc_demo_plan",JSON.stringify(next));
  }catch(err){
   setError(err instanceof Error?err.message:"Erro ao gerar cardápio.");
   if(supabase&&userId){try{setPlan(await loadWeek(userId,weekStart));}catch{setError("Houve uma falha ao atualizar o cardápio. Recarregue a página.");}}
  }finally{setSaving(false);}
 };
 const shopping=useMemo(()=>{const result=new Map<string,{name:string;quantity:number;unit:string}>();days.forEach(d=>slots.forEach(s=>{const meal=recipes.find(r=>r.id===plan[dateKey(d)]?.[s]?.id);meal?.ingredients.forEach(item=>{const k=item.name+"|"+item.unit;const prev=result.get(k);result.set(k,{...item,quantity:(prev?.quantity||0)+item.quantity*(plan[dateKey(d)]?.[s]?.servings??1)/meal.servings});});}));return [...result.values()].sort((a,b)=>a.name.localeCompare(b.name));},[days.map(dateKey).join("|"),plan]);
 const fmt=(d:Date)=>d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); const nav=[["Início",LayoutDashboard],["Cardápio",CalendarDays],["Receitas",ChefHat],["Coleção EDV",Leaf],["Compras",ShoppingBasket]] as const;
 return <div className="shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Leaf/></div><div><strong>Costa&Costa</strong><small>ALIMENTAÇÃO FORTE</small></div></div><nav>{nav.map(([name,Icon])=><button className={page===name?"active":""} key={name} onClick={()=>setPage(name)}><Icon size={19}/>{name}</button>)}</nav><div className="sidebar-foot">Sua alimentação.<br/>Seu ritmo. Sua evolução.</div></aside><main><header><div><span className="eyebrow">SUA ROTINA, MAIS LEVE</span><h1>{page==="Início"?"Bem-vindo à Costa&Costa":page}</h1></div><div className="avatar">C&C</div></header><div className="notice"><Leaf size={15}/> Ambiente de testes · Receitas demonstrativas em revisão editorial e nutricional.</div>
 {error&&<div className="notice" role="alert">{error}</div>}{loading&&<div className="notice">Carregando cardápio...</div>}{saving&&<div className="notice">Salvando alterações...</div>}
 {page==="Início"&&<><section className="hero premium-hero"><div className="hero-copy"><span className="eyebrow light">COSTA&COSTA · VIDA EM EQUILÍBRIO</span><h2>Comer bem pode ser <em>simples, gostoso</em> e do seu jeito.</h2><p>Uma semana mais leve começa com pequenas escolhas. Planeje suas refeições, encontre receitas e organize as compras em um só lugar.</p><div className="hero-actions"><button className="primary light-button" onClick={()=>setPage("Cardápio")}>Planejar minha semana <ChevronRight size={17}/></button><button className="hero-outline" onClick={()=>setPage("Receitas")}>Explorar receitas</button></div><span className="hero-microcopy">Sua alimentação. Seu ritmo. Sua evolução.</span></div><div className="hero-graphic premium-graphic"><div className="plate-rim"><div className="plate-food"><Leaf size={76} strokeWidth={1.15}/><span>feito para a sua rotina</span></div></div><span className="graphic-caption">ALIMENTE O QUE FAZ BEM</span></div></section><div className="section-intro"><span className="eyebrow">COMECE POR AQUI</span><h2>Mais praticidade, menos complicação.</h2><p>Três caminhos simples para transformar sua rotina à mesa.</p></div><div className="cards premium-cards"><button onClick={()=>setPage("Cardápio")}><span className="feature-icon"><CalendarDays/></span><strong>Seu cardápio, organizado</strong><span>Escolha suas refeições para a semana e ajuste as porções.</span><b>Montar cardápio →</b></button><button onClick={()=>setPage("Receitas")}><span className="feature-icon"><ChefHat/></span><strong>Receitas para a vida real</strong><span>Ideias práticas e sua coleção de receitas particulares.</span><b>Descobrir receitas →</b></button><button onClick={()=>setPage("Compras")}><span className="feature-icon"><ShoppingBasket/></span><strong>Compras sem esquecer nada</strong><span>Ingredientes reunidos automaticamente a partir do seu planejamento.</span><b>Ver minha lista →</b></button></div><section className="home-bottom"><div><span className="eyebrow">CONTEÚDO COM ORIGEM</span><h2>Descubra a coleção Código Emagrecer de Vez</h2><p>Explore os 50 títulos catalogados, com créditos a Rodrigo Polesso. Conteúdo completo em preparação.</p></div><button className="secondary" onClick={()=>setPage("Coleção EDV")}>Conhecer coleção <ChevronRight size={16}/></button></section></>}
 {page==="Cardápio"&&<><div className="toolbar"><div><h2>Planejamento da semana</h2><span>Altere as refeições quando quiser</span></div><div className="toolbar-actions"><button className="icon-button" aria-label="Semana anterior" onClick={()=>{const d=new Date(week);d.setDate(d.getDate()-7);setWeek(d);setSelected(dateKey(d));}}><ChevronLeft/></button><strong>{fmt(days[0])} — {fmt(days[6])}</strong><button className="icon-button" aria-label="Próxima semana" onClick={()=>{const d=new Date(week);d.setDate(d.getDate()+7);setWeek(d);setSelected(dateKey(d));}}><ChevronRight/></button><button className="primary" onClick={()=>void generate()} disabled={loading||saving||recipes.length===0}><RefreshCcw size={16}/> Sugerir semana</button></div></div><div className="week-grid">{days.map(d=><button key={dateKey(d)} className={selected===dateKey(d)?"day selected":"day"} onClick={()=>setSelected(dateKey(d))}><small>{d.toLocaleDateString("pt-BR",{weekday:"short"})}</small><strong>{d.getDate()}</strong><span>{slots.filter(s=>plan[dateKey(d)]?.[s]?.id).length}/3</span></button>)}</div><div className="meal-list">{slots.map(slot=>{const current=recipes.find(r=>r.id===plan[selected]?.[slot]?.id);return <div className="meal-row" key={slot}><div className="meal-icon"><ChefHat size={22}/></div><div className="meal-info"><small>{slot}</small><strong>{current?.title||"Escolha uma refeição"}</strong><span>{current?current.minutes+" minutos de preparo":"Sem refeição planejada"}</span>{current&&<label className="meal-servings">Porções <input type="number" aria-label={"Porções para "+slot} min="1" max="20" disabled={loading||saving} value={plan[selected]?.[slot]?.servings??1} onChange={e=>void update(selected,slot,current.id,Math.max(1,Math.min(20,Number(e.target.value)||1)))}/></label> }</div><select aria-label={"Escolher "+slot} value={current?.id||""} disabled={loading||saving} onChange={e=>void update(selected,slot,e.target.value)}><option value="">Selecionar</option>{recipes.filter(r=>r.category===slot).map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></div>;})}</div><button className="secondary" onClick={()=>setPage("Compras")}><ShoppingBasket size={17}/> Ver lista de compras</button></>}
 {page==="Coleção EDV"&&<EdvCollection/>}
 {page==="Receitas"&&recipeForm&&<PersonalRecipeForm key={editingId??"new"} recipe={recipes.find(r=>r.id===editingId)??null} onBack={()=>{setRecipeForm(false);setEditingId(null);}} onSaved={reloadRecipes}/>}
 {page==="Receitas"&&detailId&&recipes.some(r=>r.id===detailId)?<RecipeDetails key={detailId} recipe={recipes.find(r=>r.id===detailId)!} onClose={()=>setDetailId(null)} canAdd={!saving&&!loading} onAdd={servings=>{const recipe=recipes.find(r=>r.id===detailId)!;setPage("Cardápio");setDetailId(null);void update(selected,recipe.category,recipe.id,servings);}}/>:null}
 {page==="Receitas"&&!detailId&&!recipeForm&&<><div className="toolbar"><div><h2>Receitas para sua rotina</h2><span>Receitas oficiais demonstrativas e receitas particulares da sua conta.</span></div><button className="primary" onClick={()=>{setEditingId(null);setRecipeForm(true);}}><Plus size={16}/> Nova receita</button></div><div className="recipe-grid">{recipes.map(r=><article className="recipe" key={r.id}><div className="recipe-art">{r.imageUrl?<img className="recipe-photo" src={r.imageUrl} alt={r.title} loading="lazy"/>:<Leaf size={48}/>}</div><div className="recipe-body"><small>{r.ownerId?"Minha receita":"Receita demonstrativa"} · {r.category} · {r.minutes} min</small><h3>{r.title}</h3><p>{r.ingredients.map(i=>i.name).join(", ")}</p><button className="secondary" onClick={()=>setDetailId(r.id)}>Ver receita completa</button>{r.ownerId===userId&&<><button className="secondary" onClick={()=>{setEditingId(r.id);setRecipeForm(true);}}>Editar</button><button className="secondary" disabled={saving} onClick={()=>void archiveRecipe(r)}>Arquivar</button></>}<button className="secondary" disabled={loading||saving} onClick={()=>{setPage("Cardápio");void update(selected,r.category,r.id)}}><Plus size={16}/> Adicionar ao dia selecionado</button></div></article>)}</div></>}
 {page==="Compras"&&<><div className="toolbar"><div><h2>Lista de supermercado</h2><span>Somatório dos ingredientes da semana {fmt(days[0])} a {fmt(days[6])}</span></div></div><div className="shopping-list">{shopping.length===0?<div className="empty">Ainda não há ingredientes. Planeje suas refeições primeiro.</div>:shopping.map(item=>{const k=item.name+"|"+item.unit;return <button key={k} className={done.includes(k)?"shopping-item checked":"shopping-item"} onClick={()=>setDone(prev=>prev.includes(k)?prev.filter(v=>v!==k):[...prev,k])}><span className="checkmark">{done.includes(k)&&<Check size={14}/>}</span><span>{item.name}</span><strong>{item.quantity} {item.unit}</strong></button>;})}</div>{shopping.length>0&&<button className="secondary" onClick={()=>navigator.clipboard?.writeText(shopping.map(x=>x.name+": "+x.quantity+" "+x.unit).join("\n"))}>Copiar lista</button>}</>}
 </main><div className="mobile-nav">{nav.map(([name,Icon])=><button key={name} className={page===name?"active":""} onClick={()=>setPage(name)}><Icon size={21}/><small>{name}</small></button>)}</div></div>;
}
