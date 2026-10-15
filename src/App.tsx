import AdminRecipes from "./AdminRecipes";
import HomeDashboard from "./HomeDashboard";
import FoodLibrary from "./FoodLibrary";
import CopyMealAction from "./CopyMealAction";
import RecipeImage from "./RecipeImage";
import {consolidateShopping,shoppingNotes,formatIngredientAmount,type ShoppingItem} from "./lib/shopping";
import {purchaseKey,loadPurchasedKeys,savePurchasedItem} from "./lib/shoppingProgress";
import {proposeWeek,defaultPreferences,type FoodPreferences} from "./lib/suggestions";
import EdvCollection from "./EdvCollection";
import PersonalRecipeForm from "./PersonalRecipeForm";
import RecipeDetails from "./RecipeDetails";
import { supabase } from "./lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { type Meal, type Slot, type Plan, slots, daySlots, optionalSlots, recipeCategoryForSlot, dateKey, startOfWeek, loadRecipes, loadWeek, saveMeal, removeMeal, moveMeal } from "./lib/planner";
import { CalendarDays, ChefHat, ShoppingBasket, Leaf, LayoutDashboard, Check, Plus, ChevronLeft, ChevronRight, RefreshCcw, LogOut, Apple } from "lucide-react";
function safeLoad():Plan{if(supabase)return {};try{return JSON.parse(localStorage.getItem("cc_demo_plan")||"{}") as Plan;}catch{return {};}}
export default function App(){
 const [isAdmin,setIsAdmin]=useState(false);
 const [archivedOpen,setArchivedOpen]=useState(false);
 const [archivedRecipes,setArchivedRecipes]=useState<Array<{recipe_id:string;recipe_title:string;archived_on:string}>>([]);
 const [archivedLoading,setArchivedLoading]=useState(false);
 const [editingId,setEditingId]=useState<string|null>(null);const [recipeForm,setRecipeForm]=useState(false);const [detailId,setDetailId]=useState<string|null>(null); const [recipes,setRecipes]=useState<Meal[]>([]); const [userId,setUserId]=useState<string|null>(null); const [userEmail,setUserEmail]=useState<string|null>(null); const [loading,setLoading]=useState(!!supabase); const [saving,setSaving]=useState(false);const [error,setError]=useState("");
 const [preferences,setPreferences]=useState<FoodPreferences>(defaultPreferences);
 const [page,setPage]=useState("Início"); const [week,setWeek]=useState(()=>startOfWeek(new Date())); const [selected,setSelected]=useState(()=>dateKey(new Date())); const [plan,setPlan]=useState<Plan>(safeLoad);const [done,setDone]=useState<string[]>([]);
 const [optionalOpen,setOptionalOpen]=useState(false);
 const [pendingSnack,setPendingSnack]=useState<{recipeId:string;servings:number}|null>(null);
 const [snackTarget,setSnackTarget]=useState<Slot|"">("");
 const [purchased,setPurchased]=useState<{scope:string;keys:string[];loaded:boolean}>({scope:"",keys:[],loaded:false});
 const [purchasing,setPurchasing]=useState<string|null>(null);
 const [purchaseLoadError,setPurchaseLoadError]=useState(false);
 const days=Array.from({length:7},(_,i)=>{const d=new Date(week);d.setDate(week.getDate()+i);return d;});
 const weekStart=dateKey(week);
 const reloadRecipes=async()=>{const data=await loadRecipes();setRecipes(data);setRecipeForm(false);setEditingId(null);setDetailId(null);};
 const loadArchived=async()=>{
  if(!supabase)return;
  setArchivedLoading(true);setError("");
  try{const {data,error}=await supabase.rpc("cc_list_archived_personal_recipes");if(error)throw error;setArchivedRecipes(data??[]);setArchivedOpen(true);}
  catch(err){setError(err instanceof Error?err.message:"Não foi possível consultar receitas arquivadas.");}
  finally{setArchivedLoading(false);}
 };
 const restoreArchived=async(recipeId:string)=>{
  if(!supabase||saving)return;
  if(!confirm("Restaurar esta receita à sua biblioteca pessoal?"))return;
  setSaving(true);setError("");
  try{const {error}=await supabase.rpc("cc_restore_personal_recipe",{p_recipe_id:recipeId});if(error)throw error;
   await reloadRecipes();await loadArchived();
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível restaurar a receita.");}
  finally{setSaving(false);}
 };
 const archiveRecipe=async(recipe:Meal)=>{
 if(!supabase||!userId||recipe.ownerId!==userId)return;
 if(!confirm("Arquivar esta receita pessoal? Ela deixará de aparecer na biblioteca."))return;
 setSaving(true);setError("");
 try{
 const {count,error:usageError}=await supabase.from("planned_meals").select("id",{count:"exact",head:true}).eq("user_id",userId).eq("recipe_id",recipe.id);
 if(usageError)throw usageError;
 if((count??0)>0)throw new Error("Esta receita já está em um cardápio. Remova-a dos dias planejados antes de arquivar.");
 const {error:archiveError}=await supabase.rpc("cc_archive_personal_recipe",{p_recipe_id:recipe.id});
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
   setUserId(user.id);setUserEmail(user.email??null);
   const {data:adminAccess}=await client.rpc("cc_is_admin");if(alive)setIsAdmin(adminAccess===true);
   try{const loaded=await loadRecipes();if(alive)setRecipes(loaded);}catch(err){if(alive)setError(err instanceof Error?err.message:"Erro ao carregar receitas.");}
  }
  void initialize();
  return ()=>{alive=false;};
 },[]);
 useEffect(()=>{if(!supabase||!userId)return;let live=true;void supabase.from("user_preferences").select("goal,liked_foods,disliked_foods,allergies,household_size,cooking_minutes").eq("user_id",userId).maybeSingle().then(({data,error})=>{if(live){if(error)setError("Não foi possível carregar preferências. A sugestão automática está indisponível.");else if(data)setPreferences({...defaultPreferences,...data});}});return()=>{live=false};},[userId]);
 useEffect(()=>{
  if(!supabase||!userId)return;
  let alive=true;setLoading(true);setError("");setPlan({});
  void loadWeek(userId,weekStart).then(data=>{if(alive)setPlan(data);}).catch(err=>{if(alive)setError(err instanceof Error?err.message:"Erro ao carregar cardápio.");}).finally(()=>{if(alive)setLoading(false);});
  return ()=>{alive=false;};
 },[userId,weekStart]);
 // Cada entrada na tela de Compras recarrega as marcacoes do servidor.
 // Nao reutilizar marcacoes entre contas ou semanas.
 useEffect(()=>{
  if(!supabase||!userId||page!=="Compras")return;
  let active=true;
  const scope=userId+"|"+weekStart;
  setPurchased({scope,keys:[],loaded:false});setPurchaseLoadError(false);
  void loadPurchasedKeys(userId,weekStart)
   .then(keys=>{if(active)setPurchased({scope,keys,loaded:true});})
   .catch(err=>{if(active){setPurchaseLoadError(true);setError(err instanceof Error?err.message:"Não foi possível carregar as marcações de compras.");}});
  return ()=>{active=false;};
 },[page,userId,weekStart]);
 useEffect(()=>{if(!supabase)setDone([]);},[weekStart]);
 const update=async(key:string,slot:Slot,id:string,servings=plan[key]?.[slot]?.servings??preferences.household_size)=>{
  if(id && id!==plan[key]?.[slot]?.id && preferences.allergies.length && !confirm("Atenção: você cadastrou alergias/intolerâncias ("+preferences.allergies.join(", ")+"). Esta receita não foi validada como segura para seu perfil, inclusive quanto à contaminação cruzada. Confira ingredientes, rótulos e preparo. Deseja adicioná-la manualmente mesmo assim?"))return false;
  if(supabase && (!userId||loading||saving))return false;
  setError("");setSaving(true);
  try{
   if(supabase){
    if(id)await saveMeal(userId!,weekStart,key,slot,id,servings);
    else await removeMeal(userId!,weekStart,key,slot);
   }
   const next={...plan,[key]:{...plan[key],[slot]:id?{id,servings}:undefined}};setPlan(next);
   if(!supabase)localStorage.setItem("cc_demo_plan",JSON.stringify(next));
   return true;
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar a refeição.");return false;}
  finally{setSaving(false);}
 };
 const copyMeal=async(slot:Slot,destinationDay:string)=>{
  const source=plan[selected]?.[slot];
  const destination=days.find(day=>dateKey(day)===destinationDay);
  if(!source||!destination||destinationDay===selected||loading||saving||Boolean(supabase&&!userId))return;
  const original=recipes.find(recipe=>recipe.id===source.id);
  if(!original){setError("A receita de origem não está mais disponível.");return;}
  const existing=plan[destinationDay]?.[slot];
  if(existing?.id===source.id&&existing.servings===source.servings){
   setError("Esta refeição já está planejada nesse dia, com as mesmas porções.");return;
  }
  const destinationLabel=destination.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
  const overwrite=existing?" A refeição existente no destino será substituída.":"";
  const allergyNotice=preferences.allergies.length
   ?" Atenção: há alergias/intolerâncias cadastradas ("+preferences.allergies.join(", ")+"). A receita não foi validada para seu perfil nem quanto à contaminação cruzada. Confira ingredientes, rótulos e preparo antes de confirmar.":"";
  if(!confirm("Copiar "+original.title+" ("+source.servings+" porções) para "+destinationLabel+", em "+slot+"?"+overwrite+allergyNotice))return;
  setSaving(true);setError("");
  try{
   if(supabase){
    await saveMeal(userId!,weekStart,destinationDay,slot,source.id,source.servings);
    setPlan(await loadWeek(userId!,weekStart));
   }else{
    const next={...plan,[destinationDay]:{...plan[destinationDay],[slot]:{...source}}};
    setPlan(next);localStorage.setItem("cc_demo_plan",JSON.stringify(next));
   }
  }catch(err){
   setError(err instanceof Error?err.message:"Não foi possível copiar a refeição.");
   if(supabase&&userId)try{setPlan(await loadWeek(userId,weekStart));}catch{
    setError("Não foi possível confirmar a cópia. Atualize o cardápio antes de tentar novamente.");
   }
  }finally{setSaving(false);}
 };
 const moveSelectedMeal=async(slot:Slot,destinationDay:string)=>{
  const source=plan[selected]?.[slot];
  const destination=days.find(day=>dateKey(day)===destinationDay);
  if(!source||!destination||destinationDay===selected||loading||saving||Boolean(supabase&&!userId))return;
  const original=recipes.find(recipe=>recipe.id===source.id);
  if(!original){setError("A receita de origem não está mais disponível.");return;}
  const existing=plan[destinationDay]?.[slot];
  const label=destination.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
  const displaced=existing?recipes.find(recipe=>recipe.id===existing.id)?.title??"outra refeição":null;
  const warning=displaced?" ATENÇÃO: a refeição do destino ("+displaced+") será substituída.":" O destino está vazio.";
  const allergyNotice=preferences.allergies.length
   ?" Atenção: há alergias/intolerâncias cadastradas ("+preferences.allergies.join(", ")+"). A receita não foi validada para seu perfil nem quanto à contaminação cruzada. Confira ingredientes, rótulos e preparo antes de confirmar.":"";
  if(!confirm("MOVER "+original.title+" ("+source.servings+" porções) de "+selected+" para "+label+", em "+slot+"? A refeição será REMOVIDA do dia de origem."+warning+allergyNotice))return;
  setSaving(true);setError("");
  try{
   const next:Plan={...plan,[selected]:{...plan[selected],[slot]:undefined},
    [destinationDay]:{...plan[destinationDay],[slot]:{...source}}};
   if(supabase){
    await moveMeal(userId!,weekStart,selected,destinationDay,slot,source,existing);
    setPlan(next);
    try{setPlan(await loadWeek(userId!,weekStart));}
    catch{setError("A transferência foi salva, mas não foi possível recarregar o cardápio. Atualize a página para conferir.");}
   }else{
    setPlan(next);
    localStorage.setItem("cc_demo_plan",JSON.stringify(next));
   }
  }catch(err){
   setError(err instanceof Error?err.message:"Não foi possível mover a refeição. Verifique o cardápio.");
   if(supabase&&userId)try{setPlan(await loadWeek(userId,weekStart));}
   catch{setError("Não foi possível confirmar o estado do cardápio. Atualize a página antes de tentar novamente.");}
  }finally{setSaving(false);}
 };
 const generate=async()=>{
  if(!supabase||!userId||loading||saving)return;
  setSaving(true);setError("");
  try{
   const {data,error:prefError}=await supabase.from("user_preferences").select("goal,liked_foods,disliked_foods,allergies,household_size,cooking_minutes").eq("user_id",userId).maybeSingle();
   if(prefError)throw prefError;
   const prefs:FoodPreferences={...defaultPreferences,...(data??{})};
   setPreferences(prefs);
   if(prefs.allergies.length){setError("Não é possível sugerir uma semana automaticamente: sua conta possui alergias ou intolerâncias cadastradas, e as receitas ainda não têm informações verificadas de alérgenos. Para sua segurança, escolha as refeições manualmente após conferir os ingredientes e eventuais riscos de contaminação cruzada.");return;}
   const proposal=proposeWeek(recipes,prefs,days);
   if(!confirm("Atualizar café da manhã, almoço e jantar desta semana com as sugestões? Lanches e ceia opcionais já cadastrados serão preservados."))return;
   for(const d of days){const key=dateKey(d);for(const slot of slots){const item=proposal[key]?.[slot];if(item)await saveMeal(userId,weekStart,key,slot,item.id,item.servings);}}
   setPlan(await loadWeek(userId,weekStart));
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível gerar a semana.");try{setPlan(await loadWeek(userId,weekStart));}catch{setError("Falha ao recarregar o cardápio. Atualize a página.");}}
  finally{setSaving(false);}
 };
 const plannedCount=days.reduce((n,d)=>n+slots.filter(slot=>Boolean(plan[dateKey(d)]?.[slot]?.id)).length,0);
 const optionalCount=days.reduce((n,d)=>n+optionalSlots.filter(slot=>Boolean(plan[dateKey(d)]?.[slot]?.id)).length,0);
 const addFromRecipes=(recipe:Meal,servings:number)=>{
  setPage("Cardápio");setDetailId(null);
  if(recipe.category==="Lanche"){
   setOptionalOpen(true);
   setPendingSnack({recipeId:recipe.id,servings});
   setSnackTarget("");
  }else{
   void update(selected,recipe.category,recipe.id,servings);
  }
 };
 const confirmSnackPlace=async()=>{
  if(!pendingSnack || !snackTarget || !optionalSlots.includes(snackTarget))return;
  const saved=await update(selected,snackTarget,pendingSnack.recipeId,pendingSnack.servings);
  if(saved){setPendingSnack(null);setSnackTarget("");}
 };
 const shopping=useMemo(()=>consolidateShopping(days,plan,recipes),[days.map(dateKey).join("|"),plan,recipes]);
 const shoppingAnnotations=useMemo(()=>shoppingNotes(days,plan,recipes),[days.map(dateKey).join("|"),plan,recipes]);
 const purchasedScope=(userId??"")+"|"+weekStart;
 const purchasedLoaded=!supabase||(purchased.scope===purchasedScope&&purchased.loaded);
 const purchasedKeys=supabase?(purchasedLoaded?purchased.keys:[]):done;
 const togglePurchased=async(item:ShoppingItem)=>{
  const key=purchaseKey(item);
  if(!supabase){setDone(prev=>prev.includes(key)?prev.filter(v=>v!==key):[...prev,key]);return;}
  if(!userId||!purchasedLoaded||purchasing||loading)return;
  const purchasedBefore=purchasedKeys.includes(key);
  setPurchasing(key);setError("");
  try{
   await savePurchasedItem(userId,weekStart,item,!purchasedBefore);
   setPurchased(prev=>prev.scope===purchasedScope
    ?{...prev,keys:purchasedBefore?prev.keys.filter(v=>v!==key):[...prev.keys,key]}
    :prev);
  }catch(err){setError(err instanceof Error?err.message:"Nao foi possivel salvar o item comprado.");}
  finally{setPurchasing(null);}
 };
 const openTodayPlanner=()=>{
  const today=new Date(),todayWeek=startOfWeek(today);
  if(dateKey(todayWeek)!==weekStart){setPlan({});setWeek(todayWeek);}
  setSelected(dateKey(today));setPage("Cardápio");
 };
 const openHome=()=>{
  const today=new Date(),todayWeek=startOfWeek(today);
  if(dateKey(todayWeek)!==weekStart){setPlan({});setWeek(todayWeek);}
  setSelected(dateKey(today));setPage("Início");
 };
 const fmt=(d:Date)=>d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); const nav=[["Início",LayoutDashboard],["Cardápio",CalendarDays],["Receitas",ChefHat],["Alimentos",Apple],["Coleção EDV",Leaf],["Compras",ShoppingBasket],...(isAdmin?[["Administração",ChefHat] as const]:[])] as const;
 return <div className="shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Leaf/></div><div><strong>Costa&Costa</strong><small>ALIMENTAÇÃO FORTE</small></div></div><nav>{nav.map(([name,Icon])=><button className={page===name?"active":""} key={name} onClick={()=>name==="Início"?openHome():setPage(name)}><Icon size={19}/>{name}</button>)}</nav><div className="sidebar-foot">Sua alimentação.<br/>Seu ritmo. Sua evolução.</div></aside><main><header><div><span className="eyebrow">SUA ROTINA, MAIS LEVE</span><h1>{page==="Início"?"Bem-vindo à Costa&Costa":page}</h1></div>{supabase?<div className="cc-account-controls"><span className="cc-account-email" title={userEmail??"Minha conta"}>{userEmail??"Minha conta"}</span><button type="button" onClick={()=>void supabase?.auth.signOut()} aria-label="Sair da conta"><LogOut size={16}/> Sair</button></div>:<div className="avatar">C&C</div>}</header><div className="notice"><Leaf size={15}/> Ambiente de testes · Receitas demonstrativas em revisão editorial e nutricional.</div>
 {error&&<div className="notice" role="alert">{error}</div>}{loading&&<div className="notice">Carregando cardápio...</div>}{saving&&<div className="notice">Salvando alterações...</div>}
 {page==="Início"&&<HomeDashboard
  plan={plan} recipes={recipes} plannedInWeek={plannedCount} optionalInWeek={optionalCount} goal={preferences.goal}
  loading={loading||weekStart!==dateKey(startOfWeek(new Date()))}
  onOpenPlanner={openTodayPlanner}
  onOpenShopping={()=>setPage("Compras")}
  onOpenRecipes={()=>{setRecipeForm(false);setDetailId(null);setPage("Receitas");}}
  onViewRecipe={id=>{setRecipeForm(false);setEditingId(null);setDetailId(id);setPage("Receitas");}}
 />}
 {page==="Cardápio"&&<>{preferences.allergies.length>0&&<div className="notice cc-allergy-alert" role="alert"><strong>Alergias/intolerâncias cadastradas: {preferences.allergies.join(", ")}</strong><span>As receitas ainda não tiveram alergênicos e contato cruzado verificados. Confira cada uma antes de consumir.</span><details><summary>Entenda a orientação de segurança</summary><p>As receitas não têm validação suficiente para assegurar ausência de alérgenos ou contato cruzado. {plannedCount>0?`As ${plannedCount} refeições já planejadas nesta semana permanecem no cardápio, mas precisam ser conferidas individualmente.`:"Confira cada receita antes de escolher uma refeição."} A seleção manual não representa uma recomendação segura. Consulte ingredientes, rótulos, condições de preparo e orientação profissional quando necessário.</p></details></div>}<div className="toolbar"><div><h2>Planejamento da semana</h2><span>Altere as refeições quando quiser · {preferences.household_size} pessoas em casa</span></div><div className="toolbar-actions"><button disabled={loading||saving} className="icon-button" aria-label="Semana anterior" onClick={()=>{const d=new Date(week);d.setDate(d.getDate()-7);setWeek(d);setSelected(dateKey(d));}}><ChevronLeft/></button><strong>{fmt(days[0])} — {fmt(days[6])}</strong><button disabled={loading||saving} className="icon-button" aria-label="Próxima semana" onClick={()=>{const d=new Date(week);d.setDate(d.getDate()+7);setWeek(d);setSelected(dateKey(d));}}><ChevronRight/></button><button className="primary" onClick={()=>void generate()} disabled={loading||saving||recipes.length===0}><RefreshCcw size={16}/> Sugerir semana</button></div></div>{pendingSnack&&<section className="cc-snack-placement" aria-label="Escolher horário para o lanche">
 <div><strong>Em qual horário deseja adicionar esta receita?</strong>
 <p>{recipes.find(r=>r.id===pendingSnack.recipeId)?.title??"Receita de lanche"} · {pendingSnack.servings} {pendingSnack.servings===1?"porção":"porções"} · {selected.split("-").reverse().join("/")}</p></div>
 <label>Horário<select aria-label="Horário para a receita de lanche" value={snackTarget} disabled={loading||saving}
 onChange={e=>setSnackTarget(e.target.value as Slot|"")}>
 <option value="">Selecione o horário</option>{optionalSlots.map(slot=><option key={slot} value={slot}>{slot}</option>)}</select></label>
 <button type="button" className="primary" disabled={loading||saving||!snackTarget}
 onClick={()=>void confirmSnackPlace()}>Adicionar ao cardápio</button>
 <button type="button" className="secondary" disabled={saving} onClick={()=>{setPendingSnack(null);setSnackTarget("");}}>Cancelar</button>
 </section>}
 <div className="week-grid">{days.map(d=><button key={dateKey(d)} className={selected===dateKey(d)?"day selected":"day"} disabled={loading||saving} onClick={()=>setSelected(dateKey(d))}><small>{d.toLocaleDateString("pt-BR",{weekday:"short"})}</small><strong>{d.getDate()}</strong><span>{slots.filter(s=>plan[dateKey(d)]?.[s]?.id).length}/3{optionalSlots.some(s=>plan[dateKey(d)]?.[s]?.id)?" +"+optionalSlots.filter(s=>plan[dateKey(d)]?.[s]?.id).length+" opc.":""}</span></button>)}</div><div className="cc-optional-toolbar">
 <div><strong>Refeições opcionais</strong><span>Lanches e ceia só aparecem se você desejar incluí-los.</span></div>
 <button type="button" className="secondary" disabled={loading||saving}
 aria-expanded={optionalOpen} onClick={()=>setOptionalOpen(value=>!value)}>
 {optionalOpen?"Ocultar horários não preenchidos":"Adicionar lanche ou ceia"}
 </button></div><div className="meal-list">{daySlots.filter(slot=>slots.includes(slot)||optionalOpen||Boolean(plan[selected]?.[slot]?.id)).map(slot=>{const current=recipes.find(r=>r.id===plan[selected]?.[slot]?.id);return <div className={optionalSlots.includes(slot)?"meal-row cc-optional-meal-row":"meal-row"} key={slot}><div className="meal-icon"><ChefHat size={22}/></div><div className="meal-info"><small>{slot}{optionalSlots.includes(slot)?" · opcional":""}</small><strong>{current?.title||"Escolha uma refeição"}</strong><span>{current?current.minutes+" minutos de preparo":"Sem refeição planejada"}</span>{current&&<label className="meal-servings">Porções <input type="number" aria-label={"Porções para "+slot} min="1" max="20" disabled={loading||saving} value={plan[selected]?.[slot]?.servings??1} onChange={e=>void update(selected,slot,current.id,Math.max(1,Math.min(20,Number(e.target.value)||1)))}/></label> }{current&&<CopyMealAction key={selected+"|"+slot} sourceDay={selected} slot={slot} weekDays={days} busy={loading||saving} onCopy={copyMeal} onMove={moveSelectedMeal}/>}</div><select aria-label={"Escolher "+slot} value={current?.id||""} disabled={loading||saving} onChange={e=>void update(selected,slot,e.target.value)}><option value="">Selecionar</option>{recipes.filter(r=>r.category===recipeCategoryForSlot(slot)).map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></div>;})}</div><button className="secondary" onClick={()=>setPage("Compras")}><ShoppingBasket size={17}/> Ver lista de compras</button></>}
 {page==="Alimentos"&&<FoodLibrary/>}
 {page==="Coleção EDV"&&<EdvCollection/>}
 {page==="Administração"&&isAdmin&&<AdminRecipes onRefresh={reloadRecipes}/> }
 {page==="Receitas"&&recipeForm&&<PersonalRecipeForm key={editingId??"new"} recipe={recipes.find(r=>r.id===editingId)??null} onBack={()=>{setRecipeForm(false);setEditingId(null);}} onSaved={reloadRecipes}/>}
 {page==="Receitas"&&detailId&&recipes.some(r=>r.id===detailId)?<RecipeDetails key={detailId} recipe={recipes.find(r=>r.id===detailId)!} onClose={()=>setDetailId(null)} canAdd={!saving&&!loading} onAdd={servings=>{const recipe=recipes.find(r=>r.id===detailId)!;addFromRecipes(recipe,servings);}}/>:null}
 {page==="Receitas"&&!detailId&&!recipeForm&&<><div className="toolbar"><div><h2>Receitas para sua rotina</h2><span>Receitas oficiais demonstrativas e receitas particulares da sua conta.</span></div><div className="toolbar-actions"><button className="secondary" disabled={archivedLoading||saving} onClick={()=>archivedOpen?setArchivedOpen(false):void loadArchived()}>{archivedLoading?"Consultando...":archivedOpen?"Ocultar arquivadas":"Minhas arquivadas"}</button><button className="primary" onClick={()=>{setEditingId(null);setRecipeForm(true);}}><Plus size={16}/> Nova receita</button></div></div>{archivedOpen&&<section className="notice" aria-label="Minhas receitas arquivadas"><div><strong>Minhas receitas arquivadas</strong><p>Somente suas receitas pessoais aparecem aqui. Restaurar devolve a receita à biblioteca, sem alterar a fotografia ou os ingredientes.</p>{archivedRecipes.length===0?<p>Nenhuma receita arquivada.</p>:archivedRecipes.map(item=><div key={item.recipe_id} className="row" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginTop:12}}><span>{item.recipe_title}</span><button className="secondary" disabled={saving||archivedLoading} onClick={()=>void restoreArchived(item.recipe_id)}>Restaurar</button></div>)}</div></section>}<div className="recipe-grid">{recipes.map(r=><article className="recipe" key={r.id}><div className="recipe-art"><RecipeImage src={r.imageUrl} title={r.title} isAi={r.imageIsAi}/></div><div className="recipe-body"><small>{r.ownerId?"Minha receita":"Receita demonstrativa"} · {r.category} · {r.minutes} min</small><h3>{r.title}</h3><p>{r.ingredients.map(i=>i.name).join(", ")}</p><button className="secondary" onClick={()=>setDetailId(r.id)}>Ver receita completa</button>{r.ownerId===userId&&<><button className="secondary" onClick={()=>{setEditingId(r.id);setRecipeForm(true);}}>Editar</button><button className="secondary" disabled={saving} onClick={()=>void archiveRecipe(r)}>Arquivar</button></>}<button className="secondary" disabled={loading||saving} onClick={()=>addFromRecipes(r,r.servings)}><Plus size={16}/> {r.category==="Lanche"?"Escolher horário no cardápio":"Adicionar ao dia selecionado"}</button></div></article>)}</div></>}
 {page==="Compras"&&<><div className="toolbar"><div><h2>Lista de supermercado</h2><span>Somatório dos ingredientes da semana {fmt(days[0])} a {fmt(days[6])}</span></div></div>{!purchasedLoaded&&!purchaseLoadError&&<div className="notice" role="status">Carregando itens comprados...</div>}{purchaseLoadError&&<div className="notice" role="alert">Não foi possível consultar as marcações. Abra novamente esta página para tentar outra vez.</div>}{purchasing&&<div className="notice" role="status">Salvando marcacao de compra...</div>}<div className="shopping-list">{shopping.length===0?<div className="empty">{shoppingAnnotations.length?"Nenhum ingrediente com quantidade definida para calcular nesta semana. Veja as observações abaixo.":"Ainda não há ingredientes. Planeje suas refeições primeiro."}</div>:shopping.map(item=>{const k=purchaseKey(item);return <button type="button" key={k} disabled={Boolean(supabase)&&(!userId||!purchasedLoaded||Boolean(purchasing)||loading)} aria-pressed={purchasedKeys.includes(k)} className={purchasedKeys.includes(k)?"shopping-item checked":"shopping-item"} onClick={()=>void togglePurchased(item)}><span className="checkmark">{purchasedKeys.includes(k)&&<Check size={14}/>}</span><span>{item.name}</span><strong>{formatIngredientAmount(item.quantity,item.unit)}</strong></button>;})}</div>{shoppingAnnotations.length>0&&<section className="cc-shopping-notes" aria-label="Ingredientes a gosto e opcionais">
  <h3>A gosto e opcionais</h3>
  <p>Sem quantidade automática. Confira se deseja adquirir esses ingredientes e quanto utilizar.</p>
  <ul>{shoppingAnnotations.map(note=><li key={note.name+"|"+note.description}>
    <span>{note.name}</span><strong>{note.description}</strong>
  </li>)}</ul>
 </section>}
 {(shopping.length>0||shoppingAnnotations.length>0)&&<button className="secondary" onClick={()=>navigator.clipboard?.writeText([
  ...shopping.map(x=>x.name+": "+formatIngredientAmount(x.quantity,x.unit)),
  ...(shoppingAnnotations.length?["","A gosto e opcionais (sem quantidade automática):",...shoppingAnnotations.map(x=>x.name+": "+x.description)]:[])
 ].join("\n"))}>Copiar lista</button>}</>}
 </main><div className="mobile-nav">{nav.map(([name,Icon])=><button key={name} className={page===name?"active":""} onClick={()=>name==="Início"?openHome():setPage(name)}><Icon size={21}/><small>{name}</small></button>)}</div></div>;
}
