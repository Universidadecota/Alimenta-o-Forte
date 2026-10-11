import {useState,useEffect,type FormEvent} from "react";
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
 const [photo,setPhoto]=useState<File|null>(null);const [preview,setPreview]=useState<string|null>(null);const [removePhoto,setRemovePhoto]=useState(false);const [photoAi,setPhotoAi]=useState(false);
 useEffect(()=>{if(!photo){setPreview(null);return;}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const onPick=(file?:File)=>{if(!file)return;if(!file.type.startsWith("image/")||file.size>12*1024*1024){setError("Selecione uma imagem de até 12 MB.");return;}setPhoto(file);setRemovePhoto(false);setError("");};
 const change=(i:number,k:keyof Ingredient,v:string|number)=>setIngredients(prev=>prev.map((item,j)=>i===j?{...item,[k]:v}:item));
 const save=async(e:FormEvent)=>{
 e.preventDefault();if(!supabase)return;
 setBusy(true);setError("");
 try{
  const {data:auth}=await supabase.auth.getUser();const uid=auth.user?.id;if(!uid)throw new Error("Faça login novamente.");
  const {data:existing}=recipe?await supabase.from("recipes").select("url").eq("id",recipe.id).eq("owner_user_id",uid).single():{data:null};
  const {data:recipeId,error}=await supabase.rpc("save_personal_recipe",{
   p_id:recipe?.id??null,p_title:title.trim(),p_category:codes[category],
   p_description:description,p_instructions:instructions,p_minutes:minutes,p_servings:servings,
   p_ingredients:ingredients.map(i=>({name:i.name.trim(),quantity:Number(i.quantity),unit:i.unit}))
  });
  if(error)throw error;
  const id=recipeId as string;
  let nextUrl:string|null|undefined=undefined;
  if(photo){
   const bitmap=await createImageBitmap(photo);const side=1000;const scale=Math.min(1,side/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const context=canvas.getContext("2d");if(!context)throw new Error("Não foi possível processar a imagem.");context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Erro ao otimizar a imagem.")),"image/webp",0.83));
   if(blob.size>2097152)throw new Error("A imagem otimizada excede 2 MB.");
   const key=uid+"/"+id+"/"+crypto.randomUUID()+".webp";const {error:uploadError}=await supabase.storage.from("personal-recipe-images").upload(key,blob,{contentType:"image/webp",upsert:false});if(uploadError)throw uploadError;nextUrl="personal-recipe-images/"+key;
  }else if(removePhoto)nextUrl=null;
  if(nextUrl!==undefined){const {error:linkError}=await supabase.from("recipes").update({url:nextUrl}).eq("id",id).eq("owner_user_id",uid);if(linkError)throw linkError;
   if(existing?.url?.startsWith("personal-recipe-images/"+uid+"/"))await supabase.storage.from("personal-recipe-images").remove([existing.url.slice("personal-recipe-images/".length)]);
  }
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
 <div className="photo-editor"><h3>Fotografia da receita</h3><label>Escolher fotografia (até 12 MB)<input type="file" accept="image/*" onChange={e=>onPick(e.target.files?.[0])}/></label>{(preview||(!removePhoto&&recipe?.imageUrl))&&<img className="photo-editor-preview" src={preview??recipe?.imageUrl??""} alt="Pré-visualização da fotografia da receita"/>}<label className="photo-editor-check"><input type="checkbox" checked={photoAi} onChange={e=>setPhotoAi(e.target.checked)}/> Fotografia ilustrativa gerada por IA</label>{(preview||recipe?.imageUrl)&&<button className="secondary" type="button" onClick={()=>{setPhoto(null);setRemovePhoto(true);}}>Remover fotografia</button>}<p className="detail-note">A imagem será otimizada em WebP e armazenada de forma privada. Use imagens próprias ou autorizadas.</p></div>
 {error&&<div className="notice" role="alert">{error}</div>}<button type="submit" className="primary" disabled={busy||!supabase}>{busy?"Salvando...":"Salvar receita"}</button>
 </form></section>;
}
