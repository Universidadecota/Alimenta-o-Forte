import AdminRecipes from "./AdminRecipes";
import AdminRecipeRatings from "./AdminRecipeRatings";
import AdminBetaAccess from "./AdminBetaAccess";
import AdminAllergenReviewQueue from "./AdminAllergenReviewQueue";
import AdminNutritionN2 from "./AdminNutritionN2";
import HomeDashboard from "./HomeDashboard";
import FoodLibrary from "./FoodLibrary";
import CopyMealAction from "./CopyMealAction";
import RecipeImage from "./RecipeImage";
import {consolidateShopping,collectPilotShopping,shoppingNotes,formatIngredientAmount,type ShoppingItem} from "./lib/shopping";
import {purchaseKey,loadPurchasedKeys,savePurchasedItem,changedPurchasedItems} from "./lib/shoppingProgress";
import {openWeeklyPrint,type PrintKind} from "./lib/weeklyPrint";
import {dataReadyForUser,sessionReadyForMealPlanning} from "./lib/flowReadiness";
import {defaultPreferences,proposeWeek,type FoodPreferences} from "./lib/suggestions";
import PersonalRecipeForm from "./PersonalRecipeForm";
import RecipeDetails from "./RecipeDetails";
import { supabase } from "./lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { type Meal, type Slot, type Plan, slots, daySlots, optionalSlots, recipeFitsSlot, dateKey, startOfWeek, loadRecipes, loadWeek, saveMeal, replaceWeekMainMeals, removeMeal, moveMeal } from "./lib/planner";
import { CalendarDays, ChefHat, ShoppingBasket, Leaf, LayoutDashboard, Check, Plus, ChevronLeft, ChevronRight, LogOut, Apple, Printer } from "lucide-react";
function safeLoad():Plan{if(supabase)return {};try{return JSON.parse(localStorage.getItem("cc_demo_plan")||"{}") as Plan;}catch{return {};}}
export default function App(){
 const [isAdmin,setIsAdmin]=useState(false);
 const [archivedOpen,setArchivedOpen]=useState(false);
 const [archivedRecipes,setArchivedRecipes]=useState<Array<{recipe_id:string;recipe_title:string;archived_on:string}>>([]);
 const [archivedLoading,setArchivedLoading]=useState(false);
 const [editingId,setEditingId]=useState<string|null>(null);const [recipeForm,setRecipeForm]=useState(false);const [detailId,setDetailId]=useState<string|null>(null); const [detailOrigin,setDetailOrigin]=useState<"Cardápio"|"Receitas"|"Início">("Receitas"); const [recipes,setRecipes]=useState<Meal[]>([]); const [userId,setUserId]=useState<string|null>(null); const [userEmail,setUserEmail]=useState<string|null>(null); const [loading,setLoading]=useState(!!supabase); const [saving,setSaving]=useState(false);const [error,setError]=useState("");
 const [preferences,setPreferences]=useState<FoodPreferences>(defaultPreferences);
 const [recipesLoadedFor,setRecipesLoadedFor]=useState<string|null>(null);
 const [preferencesLoadedFor,setPreferencesLoadedFor]=useState<string|null>(null);
 const [weekLoadedScope,setWeekLoadedScope]=useState<string|null>(null);
 const [weekSuggestionProgress,setWeekSuggestionProgress]=useState("");
 const [page,setPage]=useState("Início"); const [week,setWeek]=useState(()=>startOfWeek(new Date())); const [selected,setSelected]=useState(()=>dateKey(new Date())); const [plan,setPlan]=useState<Plan>(safeLoad);const [done,setDone]=useState<string[]>([]);
 const [recipeSearch,setRecipeSearch]=useState("");
 const [recipeGroup,setRecipeGroup]=useState("Todos");
 const [recipePage,setRecipePage]=useState(1);
  const [optionalOpen,setOptionalOpen]=useState(false);
 const [pendingPlacement,setPendingPlacement]=useState<{recipeId:string;servings:number}|null>(null);
 const [placementTarget,setPlacementTarget]=useState<Slot|"">("");
 const [purchased,setPurchased]=useState<{scope:string;keys:string[];loaded:boolean}>({scope:"",keys:[],loaded:false});
 const [purchasing,setPurchasing]=useState<string|null>(null);
 const [purchaseLoadError,setPurchaseLoadError]=useState(false);
 const days=Array.from({length:7},(_,i)=>{const d=new Date(week);d.setDate(week.getDate()+i);return d;});
 const weekStart=dateKey(week);
 const recipesReady=!supabase||dataReadyForUser(recipesLoadedFor,userId);
 const preferencesReady=!supabase||dataReadyForUser(preferencesLoadedFor,userId);
 const weekReady=!supabase||weekLoadedScope===(userId+"|"+weekStart);
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
   setRecipesLoadedFor(null);setPreferencesLoadedFor(null);setPreferences(defaultPreferences);
   setUserId(user.id);setUserEmail(user.email??null);
   const {data:adminAccess}=await client.rpc("cc_is_admin");if(alive)setIsAdmin(adminAccess===true);
   try{const loaded=await loadRecipes();if(alive){setRecipes(loaded);setRecipesLoadedFor(user.id);}}catch(err){if(alive)setError(err instanceof Error?err.message:"Erro ao carregar receitas.");}
  }
  void initialize();
  return ()=>{alive=false;};
 },[]);
 useEffect(()=>{
  if(!supabase||!userId)return;
  const client=supabase;let live=true;
  setPreferencesLoadedFor(null);setPreferences(defaultPreferences);
  void (async()=>{
   try{
    const {data,error}=await client.from("user_preferences")
     .select("goal,liked_foods,disliked_foods,allergies,household_size,cooking_minutes")
     .eq("user_id",userId).maybeSingle();
    if(error)throw error;
    if(live){
     setPreferences({...defaultPreferences,...(data??{}),
      allergies:Array.isArray(data?.allergies)?data.allergies:[],
      disliked_foods:Array.isArray(data?.disliked_foods)?data.disliked_foods:[],
      liked_foods:Array.isArray(data?.liked_foods)?data.liked_foods:[]});
     setPreferencesLoadedFor(userId);
    }
   }catch{
    if(live)setError("Não foi possível carregar preferências e alergias. Por segurança, novas escolhas e sugestões ficam bloqueadas até recarregar o perfil.");
   }
  })();
  return()=>{live=false;};
 },[userId]);
 useEffect(()=>{
  if(!supabase||!userId)return;
  let alive=true;setLoading(true);setError("");setPlan({});setWeekLoadedScope(null);
  void loadWeek(userId,weekStart).then(data=>{if(alive){setPlan(data);setWeekLoadedScope(userId+"|"+weekStart);}}).catch(err=>{if(alive)setError(err instanceof Error?err.message:"Erro ao carregar cardápio.");}).finally(()=>{if(alive)setLoading(false);});
  return ()=>{alive=false;};
 },[userId,weekStart]);
 // Cada entrada na tela de Compras recarrega as marcacoes do servidor.
 // Nao reutilizar marcacoes entre contas ou semanas.
 useEffect(()=>{
  if(!supabase||!userId||page!=="Compras"||loading||!weekReady||!recipesReady)return;
  let active=true;
  const scope=userId+"|"+weekStart;
  setPurchased({scope,keys:[],loaded:false});setPurchaseLoadError(false);
  const currentItems=[...consolidateShopping(days,plan,recipes),...collectPilotShopping(days,plan,recipes)];
  void loadPurchasedKeys(userId,weekStart,currentItems)
   .then(keys=>{if(active)setPurchased({scope,keys,loaded:true});})
   .catch(err=>{if(active){setPurchaseLoadError(true);setError(err instanceof Error?err.message:"Não foi possível carregar as marcações de compras.");}});
  return ()=>{active=false;};
 },[page,userId,weekStart,loading,weekReady,plan,recipes,recipesReady]);
 useEffect(()=>{if(!supabase)setDone([]);},[weekStart]);
 useEffect(()=>{setWeekSuggestionProgress("");},[weekStart,userId]);
 const syncChangedPurchases=async(before:Plan,after:Plan)=>{
  const oldItems=[...consolidateShopping(days,before,recipes),...collectPilotShopping(days,before,recipes)];
  const newItems=[...consolidateShopping(days,after,recipes),...collectPilotShopping(days,after,recipes)];
  const changed=changedPurchasedItems(oldItems,newItems);
  if(!changed.length)return;
  const invalid=new Set(changed.map(purchaseKey));
  // O cardápio já pode ter sido persistido. Falha na limpeza de compras
  // não deve apresentar a operação inteira como se não tivesse sido salva.
  try{
   if(supabase&&userId){
    for(const item of changed)await savePurchasedItem(userId,weekStart,item,false);
   }
  }catch{
   setError("O cardápio foi salvo, mas não foi possível atualizar todas as marcações de compras. Verifique a lista antes de comprar e tente novamente quando a conexão voltar.");
  }finally{
   if(supabase)setPurchased(prev=>prev.scope===(userId+"|"+weekStart)?{...prev,keys:prev.keys.filter(k=>!invalid.has(k))}:prev);
   else setDone(prev=>prev.filter(k=>!invalid.has(k)));
  }
 };
 const update=async(key:string,slot:Slot,id:string,servings?:number)=>{
  const chosenRecipe=id?recipes.find(r=>r.id===id):undefined;
  // Receita do piloto usa sempre rendimento original, sem criar quantidades fictícias.
  const finalServings=chosenRecipe?.pilotSource&&!chosenRecipe.pilotSource.ingredientsReviewed
   ?chosenRecipe.servings
   :servings??plan[key]?.[slot]?.servings??preferences.household_size;
  if(supabase&&!preferencesReady){setError("Aguarde o carregamento das preferências e alergias antes de alterar o cardápio.");return false;}
  if(id && id!==plan[key]?.[slot]?.id && preferences.allergies.length && !confirm("Atenção: você cadastrou alergias/intolerâncias ("+preferences.allergies.join(", ")+"). Esta receita não foi validada como segura para seu perfil, inclusive quanto à contaminação cruzada. Confira ingredientes, rótulos e preparo. Deseja adicioná-la manualmente mesmo assim?"))return false;
  if(supabase && (!userId||loading||!weekReady||!recipesReady||saving))return false;
  setError("");setSaving(true);
  try{
   if(supabase){
    if(id)await saveMeal(userId!,weekStart,key,slot,id,finalServings);
    else await removeMeal(userId!,weekStart,key,slot);
   }
   const next={...plan,[key]:{...plan[key],[slot]:id?{id,servings:finalServings}:undefined}};setPlan(next);
   await syncChangedPurchases(plan,next);
   if(!supabase)localStorage.setItem("cc_demo_plan",JSON.stringify(next));
   return true;
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar a refeição.");return false;}
  finally{setSaving(false);}
 };
 const suggestWeek=async()=>{
  if(supabase&&!sessionReadyForMealPlanning(userId,recipesLoadedFor,preferencesLoadedFor,loading||!weekReady,saving)){
   setError("Aguarde o carregamento de receitas, cardápio, preferências e alergias antes de gerar sugestões.");return;
  }
  if(loading||saving)return;
  setError("");setWeekSuggestionProgress("");
  let proposal:Plan;
  try{proposal=proposeWeek(recipes,preferences,days,plan);}
  catch(err){setError(err instanceof Error?err.message:"Não foi possível sugerir a semana.");return;}
  const next:Plan={...plan};
  let changed=0;
  for(const day of days){
   const key=dateKey(day);
   next[key]={...plan[key],...proposal[key]};
   for(const slot of slots)if(plan[key]?.[slot]?.id!==proposal[key]?.[slot]?.id)changed++;
  }
  if(!confirm("Gerar um NOVO cardápio para esta semana e SUBSTITUIR todas as 21 refeições principais? As escolhas atuais serão trocadas pelas novas sugestões. Lanches e ceia opcionais serão preservados e a lista de compras será recalculada."))return;
  setSaving(true);
  setWeekSuggestionProgress("Renovando as 21 refeições da semana...");
  try{
   if(supabase)await replaceWeekMainMeals(userId!,weekStart,days,next,plan);
   else localStorage.setItem("cc_demo_plan",JSON.stringify(next));
   setPlan(next);
   await syncChangedPurchases(plan,next);
   setWeekSuggestionProgress(changed===21
    ?"21 refeições renovadas com sucesso."
    :"Cardápio renovado: "+changed+" receitas trocadas. As demais não tinham alternativa compatível.");
  }catch(err){
   setWeekSuggestionProgress("");
   const detail=err instanceof Error?err.message:"Falha de conexão";
   if(supabase&&userId){
    try{setPlan(await loadWeek(userId,weekStart));}
    catch{setError("Não foi possível confirmar o estado salvo. Atualize o cardápio antes de continuar.");return;}
   }
   setError("Não foi possível confirmar a renovação. O cardápio foi recarregado do banco; confira as refeições exibidas antes de tentar novamente. "+detail);
  }finally{setSaving(false);}
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
    const fresh=await loadWeek(userId!,weekStart);
    setPlan(fresh);
    await syncChangedPurchases(plan,fresh);
   }else{
    const next={...plan,[destinationDay]:{...plan[destinationDay],[slot]:{...source}}};
    setPlan(next);localStorage.setItem("cc_demo_plan",JSON.stringify(next));
    await syncChangedPurchases(plan,next);
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
    await syncChangedPurchases(plan,next);
    try{setPlan(await loadWeek(userId!,weekStart));}
    catch{setError("A transferência foi salva, mas não foi possível recarregar o cardápio. Atualize a página para conferir.");}
   }else{
    setPlan(next);
    localStorage.setItem("cc_demo_plan",JSON.stringify(next));
    await syncChangedPurchases(plan,next);
   }
  }catch(err){
   setError(err instanceof Error?err.message:"Não foi possível mover a refeição. Verifique o cardápio.");
   if(supabase&&userId)try{setPlan(await loadWeek(userId,weekStart));}
   catch{setError("Não foi possível confirmar o estado do cardápio. Atualize a página antes de tentar novamente.");}
  }finally{setSaving(false);}
 };
 const plannedCount=days.reduce((n,d)=>n+slots.filter(slot=>Boolean(plan[dateKey(d)]?.[slot]?.id)).length,0);
 const optionalCount=days.reduce((n,d)=>n+optionalSlots.filter(slot=>Boolean(plan[dateKey(d)]?.[slot]?.id)).length,0);
 const addFromRecipes=(recipe:Meal,servings:number)=>{
  if(!days.some(day=>dateKey(day)===selected)){
   setError("Selecione um dia válido da semana no Cardápio antes de adicionar a receita.");
   setPage("Cardápio");
   return;
  }
  if(recipe.category==="Lanche"||recipe.pilotSource?.kind==="salad"){
   setPage("Cardápio");setDetailId(null);
   if(recipe.category==="Lanche")setOptionalOpen(true);
   setPendingPlacement({recipeId:recipe.id,servings});
   setPlacementTarget("");
  }else{
   const existingId=plan[selected]?.[recipe.category]?.id;
   if(existingId&&existingId!==recipe.id){
    const existingName=recipes.find(r=>r.id===existingId)?.title??"outra receita";
    if(!confirm("No dia "+selected.split("-").reverse().join("/")+" já existe '"+existingName+"' em "+recipe.category+". Deseja substituí-la por '"+recipe.title+"'?"))return;
   }
   setPage("Cardápio");setDetailId(null);
   void update(selected,recipe.category,recipe.id,servings);
  }
 };
 const confirmPlacement=async()=>{
  if(!pendingPlacement || !placementTarget || !daySlots.includes(placementTarget))return;
  const selectedRecipe=recipes.find(r=>r.id===pendingPlacement.recipeId);
  if(!selectedRecipe||!recipeFitsSlot(selectedRecipe,placementTarget))return;
  const existingId=plan[selected]?.[placementTarget]?.id;
  if(existingId&&existingId!==selectedRecipe.id){
   const existingName=recipes.find(r=>r.id===existingId)?.title??"outra receita";
   if(!confirm("No dia "+selected.split("-").reverse().join("/")+" já existe '"+existingName+"' em "+placementTarget+". Deseja substituí-la por '"+selectedRecipe.title+"'?"))return;
  }
  const saved=await update(selected,placementTarget,pendingPlacement.recipeId,pendingPlacement.servings);
  if(saved){setPendingPlacement(null);setPlacementTarget("");}
 };
 const visibleRecipes=useMemo(()=>{
  const normal=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
  const query=normal(recipeSearch.trim());
  return recipes.filter(recipe=>{
   const legacyOfficial=!recipe.pilotSource&&!recipe.ownerId;
   if(recipeGroup==="Legado")return isAdmin&&legacyOfficial&&(!query||normal(recipe.title).includes(query));
   if(legacyOfficial)return false;
   if(query&&!normal(recipe.title).includes(query))return false;
   switch(recipeGroup){
    case "Minhas":return Boolean(recipe.ownerId);
    case "Saladas":return recipe.pilotSource?.kind==="salad";
    case "Lanches":return recipe.pilotSource?.kind==="snack"||(!recipe.pilotSource&&recipe.category==="Lanche");
    case "Ceias":return recipe.pilotSource?.kind==="supper";
    case "Café da manhã":return recipe.category==="Café da manhã";
    case "Almoço":return recipe.category==="Almoço"&&recipe.pilotSource?.kind!=="salad";
    case "Jantar":return recipe.category==="Jantar";
    default:return true;
   }
  });
 },[recipes,recipeGroup,recipeSearch,isAdmin]);
 const recipeTotalPages=Math.max(1,Math.ceil(visibleRecipes.length/18));
 const visibleRecipePage=visibleRecipes.slice((Math.min(recipePage,recipeTotalPages)-1)*18,Math.min(recipePage,recipeTotalPages)*18);
 const shopping=useMemo(()=>consolidateShopping(days,plan,recipes),[days.map(dateKey).join("|"),plan,recipes]);
 const pilotShopping=useMemo(()=>collectPilotShopping(days,plan,recipes),[days.map(dateKey).join("|"),plan,recipes]);
 const shoppingAnnotations=useMemo(()=>shoppingNotes(days,plan,recipes),[days.map(dateKey).join("|"),plan,recipes]);
 const purchasedScope=(userId??"")+"|"+weekStart;
 const purchasedLoaded=!supabase||(purchased.scope===purchasedScope&&purchased.loaded);
 const purchasedKeys=supabase?(purchasedLoaded?purchased.keys:[]):done;
 const printWeek=(kind:PrintKind)=>{
  if(loading||!weekReady||!recipesReady||Boolean(supabase&&!userId)){
   setError("Aguarde o carregamento do cardápio antes de imprimir.");return;
  }
  if(kind==="shopping"&&!purchasedLoaded){
   setError("Aguarde carregar os itens comprados para imprimir a lista atualizada.");return;
  }
  const opened=openWeeklyPrint({kind,days,plan,recipes,shopping,pilotShopping,notes:shoppingAnnotations,purchasedKeys});
  if(!opened)setError("O navegador bloqueou a prévia. Permita pop-ups para imprimir ou salvar em PDF.");
 };
 const togglePurchased=async(item:ShoppingItem)=>{
  const key=purchaseKey(item);
  if(!supabase){setDone(prev=>prev.includes(key)?prev.filter(v=>v!==key):[...prev,key]);return;}
  if(!userId||!purchasedLoaded||purchasing||loading||!weekReady||!recipesReady)return;
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
 const recipeTargetDate=days.find(day=>dateKey(day)===selected)??days[0];
 const recipeTargetLong=recipeTargetDate.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
 const recipeTargetShort=recipeTargetDate.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
 const fmt=(d:Date)=>d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); const nav=[["Início",LayoutDashboard],["Cardápio",CalendarDays],["Receitas",ChefHat],["Alimentos",Apple],["Compras",ShoppingBasket],...(isAdmin?[["Administração",ChefHat] as const]:[])] as const;
 return <div className="shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Leaf/></div><div><strong>Costa&Costa</strong><small>ALIMENTAÇÃO FORTE</small></div></div><nav>{nav.map(([name,Icon])=><button className={page===name?"active":""} key={name} onClick={()=>name==="Início"?openHome():setPage(name)}><Icon size={19}/>{name}</button>)}</nav><div className="sidebar-foot">Sua alimentação.<br/>Seu ritmo. Sua evolução.</div></aside><main><header><div><span className="eyebrow">SUA ROTINA, MAIS LEVE</span><h1>{page==="Início"?"Bem-vindo à Costa&Costa":page}</h1></div>{supabase?<div className="cc-account-controls"><span className="cc-account-email" title={userEmail??"Minha conta"}>{userEmail??"Minha conta"}</span><button type="button" onClick={()=>void supabase?.auth.signOut()} aria-label="Sair da conta"><LogOut size={16}/> Sair</button></div>:<div className="avatar">C&C</div>}</header><div className="notice"><Leaf size={15}/> {isAdmin?"Piloto pessoal · Receitas autorais para organizar seu cardápio e suas compras. Confira ingredientes e rótulos: alergênicos e composição nutricional ainda não foram verificados.":"Biblioteca culinária em testes · Organize receitas e compras; nenhuma sugestão constitui prescrição de dieta."}</div>
 {error&&<div className="notice" role="alert">{error}</div>}{loading&&<div className="notice">Carregando cardápio...</div>}{saving&&<div className="notice">Salvando alterações...</div>}
 {page==="Início"&&<HomeDashboard
  plan={plan} recipes={recipes} plannedInWeek={plannedCount} optionalInWeek={optionalCount}
  loading={loading||!weekReady||weekStart!==dateKey(startOfWeek(new Date()))}
  onOpenPlanner={openTodayPlanner}
  onOpenShopping={()=>setPage("Compras")}
  onOpenRecipes={()=>{setRecipeForm(false);setDetailId(null);setPage("Receitas");}}
  onViewRecipe={id=>{setRecipeForm(false);setEditingId(null);setDetailOrigin("Início");setDetailId(id);setPage("Receitas");}}
 />}
 {page==="Cardápio"&&<>{preferences.allergies.length>0&&<div className="notice cc-allergy-alert" role="alert"><strong>Alergias/intolerâncias cadastradas: {preferences.allergies.join(", ")}</strong><span>As receitas ainda não tiveram alergênicos e contato cruzado verificados. Confira cada uma antes de consumir.</span><details><summary>Entenda a orientação de segurança</summary><p>As receitas não têm validação suficiente para assegurar ausência de alérgenos ou contato cruzado. {plannedCount>0?`As ${plannedCount} refeições já planejadas nesta semana permanecem no cardápio, mas precisam ser conferidas individualmente.`:"Confira cada receita antes de escolher uma refeição."} A seleção manual não representa uma recomendação segura. Consulte ingredientes, rótulos, condições de preparo e orientação profissional quando necessário.</p></details></div>}<div className="toolbar"><div><h2>Planejamento da semana</h2><span>Altere as refeições quando quiser · {preferences.household_size} pessoas em casa</span></div><div className="toolbar-actions"><button disabled={loading||saving} className="icon-button" aria-label="Semana anterior" onClick={()=>{const d=new Date(week);d.setDate(d.getDate()-7);setWeek(d);setSelected(dateKey(d));}}><ChevronLeft/></button><strong>{fmt(days[0])} — {fmt(days[6])}</strong><button disabled={loading||saving} className="icon-button" aria-label="Próxima semana" onClick={()=>{const d=new Date(week);d.setDate(d.getDate()+7);setWeek(d);setSelected(dateKey(d));}}><ChevronRight/></button><button type="button" className="secondary" disabled={loading||saving||!weekReady||!recipesReady||!preferencesReady} onClick={()=>void suggestWeek()}>Sugerir refeições da semana</button><button type="button" className="secondary" disabled={loading||saving||!weekReady||!recipesReady} onClick={()=>printWeek("fridge")}><Printer size={16}/> Imprimir só o cardápio</button><button type="button" className="secondary" disabled={loading||saving||!weekReady||!recipesReady} onClick={()=>printWeek("week")}><Printer size={16}/> Imprimir cardápio e receitas / Salvar PDF</button>{weekSuggestionProgress&&<span role="status" className="cc-manual-planning-notice">{weekSuggestionProgress}</span>}<span className="cc-manual-planning-notice">{preferences.allergies.length?"Sugestões automáticas indisponíveis enquanto os alergênicos das receitas não forem verificados.":"Substitui as 21 refeições principais por novas sugestões; lanches e ceia são preservados."}</span></div></div>{pendingPlacement&&<section className="cc-snack-placement" aria-label="Escolher horário da refeição">
 <div><strong>Em qual horário deseja adicionar esta receita?</strong>
 <p>{recipes.find(r=>r.id===pendingPlacement.recipeId)?.title??"Receita selecionada"} · {pendingPlacement.servings} {pendingPlacement.servings===1?"porção":"porções"} · {selected.split("-").reverse().join("/")}</p></div>
 <label>Horário<select aria-label="Horário para a receita selecionada" value={placementTarget} disabled={loading||saving}
 onChange={e=>setPlacementTarget(e.target.value as Slot|"")}>
 <option value="">Selecione o horário</option>{daySlots.filter(slot=>{const meal=recipes.find(r=>r.id===pendingPlacement.recipeId);return meal !== undefined && recipeFitsSlot(meal,slot);}).map(slot=><option key={slot} value={slot}>{slot}</option>)}</select></label>
 <button type="button" className="primary" disabled={loading||saving||!placementTarget}
 onClick={()=>void confirmPlacement()}>Adicionar ao cardápio</button>
 <button type="button" className="secondary" disabled={saving} onClick={()=>{setPendingPlacement(null);setPlacementTarget("");}}>Cancelar</button>
 </section>}
 <div className="week-grid">{days.map(d=><button key={dateKey(d)} className={selected===dateKey(d)?"day selected":"day"} disabled={loading||saving} onClick={()=>setSelected(dateKey(d))}><small>{d.toLocaleDateString("pt-BR",{weekday:"short"})}</small><strong>{d.getDate()}</strong><span>{slots.filter(s=>plan[dateKey(d)]?.[s]?.id).length}/3{optionalSlots.some(s=>plan[dateKey(d)]?.[s]?.id)?" +"+optionalSlots.filter(s=>plan[dateKey(d)]?.[s]?.id).length+" opc.":""}</span></button>)}</div><div className="cc-optional-toolbar">
 <div><strong>Refeições opcionais</strong><span>Lanches e ceia só aparecem se você desejar incluí-los.</span></div>
 <button type="button" className="secondary" disabled={loading||saving}
 aria-expanded={optionalOpen} onClick={()=>setOptionalOpen(value=>!value)}>
 {optionalOpen?"Ocultar horários não preenchidos":"Adicionar lanche ou ceia"}
 </button></div><div className="meal-list">{daySlots.filter(slot=>slots.includes(slot)||optionalOpen||Boolean(plan[selected]?.[slot]?.id)).map(slot=>{const current=recipes.find(r=>r.id===plan[selected]?.[slot]?.id);return <div className={optionalSlots.includes(slot)?"meal-row cc-optional-meal-row":"meal-row"} key={slot}><div className="meal-icon"><ChefHat size={22}/></div><div className="meal-info"><small>{slot}{optionalSlots.includes(slot)?" · opcional":""}</small>{current?<button type="button" aria-label={"Abrir receita "+current.title} title="Ver ingredientes e preparo" style={{border:0,background:"transparent",padding:0,color:"inherit",font:"inherit",fontWeight:700,textAlign:"left",textDecoration:"underline",textUnderlineOffset:3,cursor:"pointer"}} onClick={()=>{setRecipeForm(false);setDetailOrigin("Cardápio");setDetailId(current.id);setPage("Receitas");}}>{current.title}</button>:<strong>Escolha uma refeição</strong>}<span>{current?(current.pilotSource?.originalTime??current.minutes+" minutos de preparo"):"Sem refeição planejada"}</span>{current&&current.pilotSource&&!current.pilotSource.ingredientsReviewed?<span className="detail-note">Rendimento original: {current.pilotSource.originalYield}. Quantidades não redimensionadas.</span>:null}{current&&(!current.pilotSource||current.pilotSource.ingredientsReviewed)&&<label className="meal-servings">Porções <input type="number" aria-label={"Porções para "+slot} min="1" max="20" disabled={loading||saving||!weekReady||!preferencesReady} value={plan[selected]?.[slot]?.servings??1} onChange={e=>void update(selected,slot,current.id,Math.max(1,Math.min(20,Number(e.target.value)||1)))}/></label> }{current&&<CopyMealAction key={selected+"|"+slot} sourceDay={selected} slot={slot} weekDays={days} busy={loading||saving} onCopy={copyMeal} onMove={moveSelectedMeal}/>}</div><select aria-label={"Escolher "+slot} value={current?.id||""} disabled={loading||saving||!weekReady||!preferencesReady} onChange={e=>void update(selected,slot,e.target.value)}><option value="">Selecionar</option>{recipes.filter(r=>recipeFitsSlot(r,slot)&&(Boolean(r.pilotSource)||Boolean(r.ownerId)||r.id===current?.id)).map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></div>;})}</div><button className="secondary" onClick={()=>setPage("Compras")}><ShoppingBasket size={17}/> Ver lista de compras</button></>}
 {page==="Alimentos"&&<FoodLibrary/>}
 {page==="Administração"&&isAdmin&&<><AdminNutritionN2/><AdminRecipes onRefresh={reloadRecipes}/><AdminRecipeRatings/><AdminBetaAccess/><AdminAllergenReviewQueue/></> }
 {page==="Receitas"&&!recipeForm&&<section className="cc-recipe-target-date" aria-label="Dia escolhido para adicionar receitas">
  <div className="cc-recipe-target-summary">
   <strong>Dia escolhido para o cardápio</strong>
   <p role="status">As receitas serão adicionadas a <strong>{recipeTargetLong}</strong>.</p>
   <small>Semana de {fmt(days[0])} a {fmt(days[6])}.</small>
  </div>
  <label htmlFor="cc-recipe-day-select">Alterar dia
   <select id="cc-recipe-day-select" value={selected} disabled={loading||saving}
    onChange={event=>setSelected(event.target.value)}>
    {days.map(day=><option key={dateKey(day)} value={dateKey(day)}>
     {day.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"})}
    </option>)}
   </select>
  </label>
  <button className="secondary" type="button" disabled={loading||saving} onClick={()=>setPage("Cardápio")}>Escolher outra semana</button>
 </section>}
 {page==="Receitas"&&recipeForm&&<PersonalRecipeForm key={editingId??"new"} recipe={recipes.find(r=>r.id===editingId)??null} onBack={()=>{setRecipeForm(false);setEditingId(null);}} onSaved={reloadRecipes}/>}
 {page==="Receitas"&&detailId&&recipes.some(r=>r.id===detailId)?<RecipeDetails key={detailId} recipe={recipes.find(r=>r.id===detailId)!} destinationDateLabel={recipeTargetShort} backLabel={detailOrigin==="Cardápio"?"Voltar ao cardápio":detailOrigin==="Início"?"Voltar ao início":"Voltar às receitas"} onClose={()=>{setDetailId(null);if(detailOrigin!=="Receitas")setPage(detailOrigin);}} canAdd={!saving&&!loading} onAdd={servings=>{const recipe=recipes.find(r=>r.id===detailId)!;addFromRecipes(recipe,servings);}}/>:null}
 {page==="Receitas"&&!detailId&&!recipeForm&&<><div className="toolbar"><div><h2>Receitas para sua rotina</h2><span>Receitas autorais Costa&Costa para escolher livremente e planejar suas refeições. O catálogo piloto é privado e ainda não está à venda.</span></div><div className="toolbar-actions"><button className="secondary" disabled={archivedLoading||saving} onClick={()=>archivedOpen?setArchivedOpen(false):void loadArchived()}>{archivedLoading?"Consultando...":archivedOpen?"Ocultar arquivadas":"Minhas arquivadas"}</button><button className="primary" onClick={()=>{setEditingId(null);setRecipeForm(true);}}><Plus size={16}/> Nova receita</button></div></div>{archivedOpen&&<section className="notice" aria-label="Minhas receitas arquivadas"><div><strong>Minhas receitas arquivadas</strong><p>Somente suas receitas pessoais aparecem aqui. Restaurar devolve a receita à biblioteca, sem alterar a fotografia ou os ingredientes.</p>{archivedRecipes.length===0?<p>Nenhuma receita arquivada.</p>:archivedRecipes.map(item=><div key={item.recipe_id} className="row" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginTop:12}}><span>{item.recipe_title}</span><button className="secondary" disabled={saving||archivedLoading} onClick={()=>void restoreArchived(item.recipe_id)}>Restaurar</button></div>)}</div></section>}<div className="cc-recipes-filterbar">
 <label>Buscar receita
  <input type="search" placeholder="Ex.: omelete, peixe, salada..." value={recipeSearch}
   onChange={event=>{setRecipeSearch(event.target.value);setRecipePage(1);}}/>
 </label>
 <label>Tipo de refeição
  <select value={recipeGroup} onChange={event=>{setRecipeGroup(event.target.value);setRecipePage(1);}}>
   {["Todos","Café da manhã","Almoço","Jantar","Saladas","Lanches","Ceias","Minhas",...(isAdmin?["Legado"]:[])].map(value=><option key={value} value={value}>{value}</option>)}
  </select>
 </label>
 <span role="status">{visibleRecipes.length} {visibleRecipes.length===1?"receita encontrada":"receitas encontradas"}</span>
</div>
{visibleRecipes.length===0&&<div className="notice"><p>Nenhuma receita encontrada com estes filtros.</p></div>}
<div className="recipe-grid">{visibleRecipePage.map(r=><article className="recipe" key={r.id}><div className="recipe-art"><RecipeImage src={r.imageUrl} title={r.title} isAi={r.imageIsAi}/></div><div className="recipe-body"><small>{r.ownerId?"Minha receita":r.pilotSource?"Receita autoral · "+r.pilotSource.sourceMeal:"Receita de exemplo (legado)"} · {r.minutes} min</small><h3>{r.title}</h3><p>{r.pilotSource?.originalIngredients??r.ingredients.map(i=>i.name).join(", ")}</p><button className="secondary" onClick={()=>{setDetailOrigin("Receitas");setDetailId(r.id);}}>Ver receita completa</button>{r.ownerId===userId&&<><button className="secondary" onClick={()=>{setEditingId(r.id);setRecipeForm(true);}}>Editar</button><button className="secondary" disabled={saving} onClick={()=>void archiveRecipe(r)}>Arquivar</button></>}<button className="secondary" disabled={loading||saving} onClick={()=>addFromRecipes(r,r.servings)}><Plus size={16}/> {r.category==="Lanche"||r.pilotSource?.kind==="salad"?"Escolher horário · "+recipeTargetShort:"Adicionar em "+recipeTargetShort}</button></div></article>)}</div>
{recipeTotalPages>1&&<nav className="cc-recipe-pages" aria-label="Paginação de receitas">
 <button type="button" className="secondary" disabled={recipePage<=1}
  onClick={()=>setRecipePage(page=>Math.max(1,page-1))}>Anterior</button>
 <span>Página {Math.min(recipePage,recipeTotalPages)} de {recipeTotalPages}</span>
 <button type="button" className="secondary" disabled={recipePage>=recipeTotalPages}
  onClick={()=>setRecipePage(page=>Math.min(recipeTotalPages,page+1))}>Próxima</button>
</nav>}
</>}
 {page==="Compras"&&<><div className="toolbar"><div><h2>Lista de supermercado</h2><span>Ingredientes estruturados e itens originais das receitas da semana {fmt(days[0])} a {fmt(days[6])}</span></div><div className="toolbar-actions"><button type="button" className="secondary" disabled={loading||!weekReady||!recipesReady||Boolean(supabase&&!purchasedLoaded)} onClick={()=>printWeek("shopping")}><Printer size={16}/> Imprimir lista / Salvar PDF</button></div></div>{!purchasedLoaded&&!purchaseLoadError&&<div className="notice" role="status">Carregando itens comprados...</div>}{purchaseLoadError&&<div className="notice" role="alert">Não foi possível consultar as marcações. Abra novamente esta página para tentar outra vez.</div>}{purchasing&&<div className="notice" role="status">Salvando marcacao de compra...</div>}<div className="shopping-list">{shopping.length===0&&!pilotShopping.length?<div className="empty">{shoppingAnnotations.length?"Ingredientes sem quantidade numérica nas observações abaixo.":"Ainda não há ingredientes. Planeje suas refeições primeiro."}</div>:shopping.map(item=>{const k=purchaseKey(item);return <button type="button" key={k} disabled={Boolean(supabase)&&(!userId||!purchasedLoaded||Boolean(purchasing)||loading)} aria-pressed={purchasedKeys.includes(k)} className={purchasedKeys.includes(k)?"shopping-item checked":"shopping-item"} onClick={()=>void togglePurchased(item)}><span className="checkmark">{purchasedKeys.includes(k)&&<Check size={14}/>}</span><span>{item.name}</span><strong>{formatIngredientAmount(item.quantity,item.unit)}</strong></button>;})}</div>
{pilotShopping.length>0&&<section className="cc-pilot-shopping" aria-label="Ingredientes das receitas do acervo pessoal">
  <h3>Ingredientes das receitas do acervo pessoal ({pilotShopping.length})</h3>
  <p>Somamos medidas equivalentes somente com o mesmo ingrediente e unidade. Também organizamos preparos com subtítulos explícitos. Alternativas e trechos ambíguos são sinalizados, sem conversões ou escolhas inventadas; as receitas originais não são modificadas.</p>
  <div className="shopping-list">{pilotShopping.map(item=>{const key=purchaseKey(item);return <button type="button" key={key}
   disabled={Boolean(supabase)&&(!userId||!purchasedLoaded||Boolean(purchasing)||loading)}
   aria-pressed={purchasedKeys.includes(key)}
   className={purchasedKeys.includes(key)?"shopping-item checked":"shopping-item"}
   onClick={()=>void togglePurchased(item)}>
   <span className="checkmark">{purchasedKeys.includes(key)&&<Check size={14}/>}</span>
   <span className="cc-pilot-shopping-text">{item.totalLabel??item.sourceText}
    {!item.totalLabel&&<small>Quantidade conforme a receita · {item.quantity>1?item.quantity+" utilizações no cardápio":"1 utilização no cardápio"}. Não indica unidades a comprar.</small>}
    {item.totalLabel&&<small>Medida original consolidada para referência; {item.quantity>1?item.quantity+" ocorrências":"1 ocorrência"} no cardápio. Expressões: {item.sourceExpressions.join(" + ")}</small>}
    {item.requiresChoice&&<small className="cc-pilot-shopping-attention">Alternativas no documento: escolha uma opção antes de comprar. Nada foi substituído automaticamente.</small>}
    {item.optionalSource&&<small className="cc-pilot-shopping-attention">Opcional — inclua na compra somente se decidir utilizar.</small>}
    {item.ambiguousSource&&<small className="cc-pilot-shopping-attention">Trecho composto ou ambíguo: confira as instruções da receita.</small>}
    {item.sourceRawFragments.length>0&&<small>Trecho original completo: {item.sourceRawFragments.join(" | ")}</small>}
    <small>Em: {item.sourceRecipes.join("; ")}</small>
   </span>
   <strong>{item.quantity>1?item.quantity+" usos":"1 uso"}</strong>
  </button>;})}</div>
 </section>}
{shoppingAnnotations.length>0&&<section className="cc-shopping-notes" aria-label="Ingredientes a gosto e opcionais">
  <h3>Ingredientes a gosto, opcionais e sem quantificação</h3>
  <p>Itens sem quantidade exata permanecem separados para não gerar totais inventados.</p>
  <ul>{shoppingAnnotations.map(note=><li key={note.name+"|"+note.description}>
    <span>{note.name}</span><strong>{note.description}</strong>
  </li>)}</ul>
 </section>}
 {(shopping.length>0||pilotShopping.length>0||shoppingAnnotations.length>0)&&<button className="secondary" onClick={()=>navigator.clipboard?.writeText([
  ...shopping.map(x=>x.name+": "+formatIngredientAmount(x.quantity,x.unit)),
  ...(pilotShopping.length?["","Ingredientes das receitas do piloto (quantidades originais):",...pilotShopping.map(x=>(x.totalLabel??x.sourceText)+(x.totalLabel?" · Originais: "+x.sourceExpressions.join(" + "):"")+(x.quantity>1?" · "+x.quantity+" usos":"")+" · "+x.sourceRecipes.join("; "))]:[]),
  ...(shoppingAnnotations.length?["","A gosto e opcionais (sem quantidade automática):",...shoppingAnnotations.map(x=>x.name+": "+x.description)]:[])
 ].join("\n"))}>Copiar lista</button>}</>}
 </main><div className="mobile-nav">{nav.map(([name,Icon])=><button key={name} className={page===name?"active":""} onClick={()=>name==="Início"?openHome():setPage(name)}><Icon size={21}/><small>{name}</small></button>)}</div></div>;
}
