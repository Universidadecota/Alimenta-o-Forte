import {useState,type FormEvent} from "react";
import {Plus, Trash2, ArrowLeft} from "lucide-react";
import type {Meal,Slot,Ingredient} from "./lib/planner";
import {supabase} from "./lib/supabase";
const categories:Slot[]=["Café da manhã","Almoço","Jantar"];
const codes:Record<Slot,string>={"Café da manhã":"breakfast","Almoço":"lunch","Jantar":"dinner"};
type Props={recipe:Meal|null;onBack:()=>void;onSaved:()=>Promise<void>};
export default function PersonalRecipeForm({recipe,onBack,onSaved}:Props){
 const [title,setTitle]=useState(recipe?.title??"");
 const [category,setCategory]=useState<Slot>(recipe?.category??"Almoço");
 const [description,setDescription]=useState(recipe?.description??"");
 const [instructions,setInstructions]=useState(recipe?.instructions??"");
 const [minutes,setMinutes]=useState(recipe?.minutes??25);
 const [servings,setServings]=useState(recipe?.servings??1);
 const [ingredients,setIngredients]=useState<Ingredient[]>(recipe?.ingredients.map(v=>({...v}))??[{name:"",quantity:1,unit:"g"}]);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const change=(i:number,k:keyof Ingredient,v:string|number)=>setIngredients(prev=>prev.map((item,j)=>i===j?{...item,[k]:v}:item));
 const save=async(e:FormEvent)=>{
 e.preventDefault();if(!supabase)return;
 setBusy(true);setError("");
 try{
  const {error}=await supabase.rpc("save_personal_recipe",{
   p_id:recipe?.id??null,p_title:title.trim(),p_category:codes[category],
   p_description:description,p_instructions:instructions,p_minutes:minutes,p_servings:servings,
   p_ingredients:ingredients.map(i=>({name:i.name.trim(),quantity:Number(i.quantity),unit:i.unit}))
  });
  if(error)throw error;
  await onSaved();
 }catch(e){setError(e instanceof Error?e.message:"Erro ao salvar receita.");}
 finally{setBusy(false);}
 };
 return <section className="personal-recipe"><button className="secondary" type="button" onClick={onBack}><ArrowLeft size={16}/> Voltar</button>
 <h2>{recipe?"Editar minha receita":"Nova receita pessoal"}</h2><p>Receitas pessoais ficam visíveis apenas em sua conta. Não são publicadas na biblioteca oficial.</p>
 <form onSubmit={e=>void save(e)} className="personal-form">
 <label>Nome da receita<input required minLength={2} maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></label>
 <div className="personal-form-grid"><label>Categoria<select value={category} onChange={e=>setCategory(e.target.value as Slot)}>{categories.map(v=><option key={v}>{v}</option>)}</select></label><label>Preparo (min)<input type="number" min="0" max="1440" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/></label><label>Porções de referência<input type="number" min="1" max="20" value={servings} onChange={e=>setServings(Number(e.target.value))}/></label></div>
 <label>Descrição<textarea maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <h3>Ingredientes</h3>{ingredients.map((item,i)=><div className="ingredient-edit" key={i}><input aria-label={"Ingrediente "+(i+1)} required maxLength={140} placeholder="Ingrediente" value={item.name} onChange={e=>change(i,"name",e.target.value)}/><input aria-label={"Quantidade "+(i+1)} type="number" min=".001" max="100000" step=".001" required value={item.quantity} onChange={e=>change(i,"quantity",Number(e.target.value))}/><select aria-label={"Unidade "+(i+1)} value={item.unit} onChange={e=>change(i,"unit",e.target.value)}>{["g","kg","ml","l","un"].map(x=><option key={x}>{x}</option>)}</select><button type="button" aria-label={"Excluir ingrediente "+(i+1)} disabled={ingredients.length===1} onClick={()=>setIngredients(a=>a.filter((_,j)=>j!==i))}><Trash2 size={16}/></button></div>)}
 <button type="button" className="secondary" disabled={ingredients.length>=40} onClick={()=>setIngredients(a=>[...a,{name:"",quantity:1,unit:"g"}])}><Plus size={16}/> Ingrediente</button>
 <label>Modo de preparo (uma etapa por linha)<textarea rows={6} maxLength={10000} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Descreva as etapas do preparo..."/></label>
 <p className="detail-note">Cadastro sem foto nesta etapa. Utilize somente receitas autorais ou que tenha autorização para usar.</p>
 {error&&<div className="notice" role="alert">{error}</div>}<button type="submit" className="primary" disabled={busy||!supabase}>{busy?"Salvando...":"Salvar receita"}</button>
 </form></section>;
}
