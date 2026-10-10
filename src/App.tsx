import { supabase } from "./lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { type Meal, type Slot, type Plan, slots, dateKey, startOfWeek, loadRecipes, loadWeek, saveMeal, removeMeal } from "./lib/planner";
import { CalendarDays, ChefHat, ShoppingBasket, Leaf, LayoutDashboard, Check, Plus, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
function safeLoad():Plan{if(supabase)return {};try{return JSON.parse(localStorage.getItem("cc_demo_plan")||"{}") as Plan;}catch{return {};}}
export default function App(){
 const [recipes,setRecipes]=useState<Meal[]>([]); const [userId,setUserId]=useState<string|null>(null); const [loading,setLoading]=useState(!!supabase); const [saving,setSaving]=useState(false);const [error,setError]=useState("");
 const [page,setPage]=useState("Início"); const [week,setWeek]=useState(()=>startOfWeek(new Date())); const [selected,setSelected]=useState(()=>dateKey(new Date())); const [plan,setPlan]=useState<Plan>(safeLoad);const [done,setDone]=useState<string[]>([]);const [portions,setPortions]=useState(1);
 const days=Array.from({length:7},(_,i)=>{const d=new Date(week);d.setDate(week.getDate()+i);return d;});
 const weekStart=dateKey(week);
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
 const update=async(key:string,slot:Slot,id:string)=>{
  if(supabase && (!userId||loading||saving))return;
  setError("");setSaving(true);
  try{
   if(supabase){
    if(id)await saveMeal(userId!,weekStart,key,slot,id);
    else await removeMeal(userId!,weekStart,key,slot);
   }
   const next={...plan,[key]:{...plan[key],[slot]:id}};setPlan(next);
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
     next[key][slot]=id;
    }
   }
   setPlan(next);
   if(!supabase)localStorage.setItem("cc_demo_plan",JSON.stringify(next));
  }catch(err){
   setError(err instanceof Error?err.message:"Erro ao gerar cardápio.");
   if(supabase&&userId){try{setPlan(await loadWeek(userId,weekStart));}catch{setError("Houve uma falha ao atualizar o cardápio. Recarregue a página.");}}
  }finally{setSaving(false);}
 };
 const shopping=useMemo(()=>{const result=new Map<string,{name:string;quantity:number;unit:string}>();days.forEach(d=>slots.forEach(s=>{const meal=recipes.find(r=>r.id===plan[dateKey(d)]?.[s]);meal?.ingredients.forEach(item=>{const k=item.name+"|"+item.unit;const prev=result.get(k);result.set(k,{...item,quantity:(prev?.quantity||0)+item.quantity*portions});});}));return [...result.values()].sort((a,b)=>a.name.localeCompare(b.name));},[days.map(dateKey).join("|"),plan,portions]);
 const fmt=(d:Date)=>d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); const nav=[["Início",LayoutDashboard],["Cardápio",CalendarDays],["Receitas",ChefHat],["Compras",ShoppingBasket]] as const;
 return <div className="shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Leaf/></div><div><strong>Costa&Costa</strong><small>ALIMENTAÇÃO FORTE</small></div></div><nav>{nav.map(([name,Icon])=><button className={page===name?"active":""} key={name} onClick={()=>setPage(name)}><Icon size={19}/>{name}</button>)}</nav><div className="sidebar-foot">Sua alimentação.<br/>Seu ritmo. Sua evolução.</div></aside><main><header><div><span className="eyebrow">SUA ROTINA, MAIS LEVE</span><h1>{page==="Início"?"Bem-vindo à Costa&Costa":page}</h1></div><div className="avatar">C&C</div></header><div className="notice">Cardápios vinculados à sua conta quando o Supabase está configurado. Receitas de demonstração necessitam revisão antes do lançamento público.</div>
 {error&&<div className="notice" role="alert">{error}</div>}{loading&&<div className="notice">Carregando cardápio...</div>}{saving&&<div className="notice">Salvando alterações...</div>}
 {page==="Início"&&<><section className="hero"><div><span className="eyebrow light">BEM-ESTAR TODOS OS DIAS</span><h2>Alimentar-se bem pode ser simples.</h2><p>Organize sua semana com refeições práticas, variadas e uma lista de compras pronta para você.</p><button className="primary light-button" onClick={()=>setPage("Cardápio")}>Planejar minha semana <ChevronRight size={17}/></button></div><div className="hero-graphic"><Leaf size={100} strokeWidth={1}/></div></section><div className="cards"><button onClick={()=>setPage("Cardápio")}><CalendarDays/><strong>Cardápio semanal</strong><span>Escolha as refeições de cada dia</span></button><button onClick={()=>setPage("Receitas")}><ChefHat/><strong>Receitas</strong><span>Descubra sugestões deliciosas</span></button><button onClick={()=>setPage("Compras")}><ShoppingBasket/><strong>Lista de compras</strong><span>Ingredientes agrupados para comprar</span></button></div></>}
 {page==="Cardápio"&&<><div className="toolbar"><div><h2>Planejamento da semana</h2><span>Altere as refeições quando quiser</span></div><div className="toolbar-actions"><button className="icon-button" aria-label="Semana anterior" onClick={()=>{const d=new Date(week);d.setDate(d.getDate()-7);setWeek(d);setSelected(dateKey(d));}}><ChevronLeft/></button><strong>{fmt(days[0])} — {fmt(days[6])}</strong><button className="icon-button" aria-label="Próxima semana" onClick={()=>{const d=new Date(week);d.setDate(d.getDate()+7);setWeek(d);setSelected(dateKey(d));}}><ChevronRight/></button><button className="primary" onClick={()=>void generate()} disabled={loading||saving||recipes.length===0}><RefreshCcw size={16}/> Sugerir semana</button></div></div><div className="week-grid">{days.map(d=><button key={dateKey(d)} className={selected===dateKey(d)?"day selected":"day"} onClick={()=>setSelected(dateKey(d))}><small>{d.toLocaleDateString("pt-BR",{weekday:"short"})}</small><strong>{d.getDate()}</strong><span>{slots.filter(s=>plan[dateKey(d)]?.[s]).length}/3</span></button>)}</div><div className="meal-list">{slots.map(slot=>{const current=recipes.find(r=>r.id===plan[selected]?.[slot]);return <div className="meal-row" key={slot}><div className="meal-icon"><ChefHat size={22}/></div><div className="meal-info"><small>{slot}</small><strong>{current?.title||"Escolha uma refeição"}</strong><span>{current?current.minutes+" minutos de preparo":"Sem refeição planejada"}</span></div><select aria-label={"Escolher "+slot} value={current?.id||""} disabled={loading||saving} onChange={e=>void update(selected,slot,e.target.value)}><option value="">Selecionar</option>{recipes.filter(r=>r.category===slot).map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></div>;})}</div><button className="secondary" onClick={()=>setPage("Compras")}><ShoppingBasket size={17}/> Ver lista de compras</button></>}
 {page==="Receitas"&&<><div className="toolbar"><div><h2>Receitas para sua rotina</h2><span>Exemplos editoriais para testar o planejador</span></div></div><div className="recipe-grid">{recipes.map(r=><article className="recipe" key={r.id}><div className="recipe-art"><Leaf size={48}/></div><div className="recipe-body"><small>{r.category} · {r.minutes} min</small><h3>{r.title}</h3><p>{r.ingredients.map(i=>i.name).join(", ")}</p><button className="secondary" onClick={()=>{setPage("Cardápio");void update(selected,r.category,r.id)}}><Plus size={16}/> Adicionar ao dia selecionado</button></div></article>)}</div></>}
 {page==="Compras"&&<><div className="toolbar"><div><h2>Lista de supermercado</h2><span>Somatório dos ingredientes da semana {fmt(days[0])} a {fmt(days[6])}</span></div><label className="portions">Porções por refeição <input type="number" min="1" max="12" value={portions} onChange={e=>setPortions(Math.max(1,Math.min(12,Number(e.target.value)||1)))}/></label></div><div className="shopping-list">{shopping.length===0?<div className="empty">Ainda não há ingredientes. Planeje suas refeições primeiro.</div>:shopping.map(item=>{const k=item.name+"|"+item.unit;return <button key={k} className={done.includes(k)?"shopping-item checked":"shopping-item"} onClick={()=>setDone(prev=>prev.includes(k)?prev.filter(v=>v!==k):[...prev,k])}><span className="checkmark">{done.includes(k)&&<Check size={14}/>}</span><span>{item.name}</span><strong>{item.quantity} {item.unit}</strong></button>;})}</div>{shopping.length>0&&<button className="secondary" onClick={()=>navigator.clipboard?.writeText(shopping.map(x=>x.name+": "+x.quantity+" "+x.unit).join("\n"))}>Copiar lista</button>}</>}
 </main><div className="mobile-nav">{nav.map(([name,Icon])=><button key={name} className={page===name?"active":""} onClick={()=>setPage(name)}><Icon size={21}/><small>{name}</small></button>)}</div></div>;
}
