import {useEffect,useState,type FormEvent} from "react";
import {supabase} from "./lib/supabase";
import IngredientEditor from "./IngredientEditor";
import RecipeTechnicalSheet from "./RecipeTechnicalSheet";
import FoodNutritionAdmin from "./FoodNutritionAdmin";
import PilotIngredientMeasureReview from "./PilotIngredientMeasureReview";
import type {Ingredient} from "./lib/planner";
import {formatRecipeIngredient} from "./lib/ingredientMeasures";
type Row={id:string;title:string;category:string;description:string|null;instructions:string|null;prep_minutes:number;servings:number;published:boolean;url:string|null;image_is_ai:boolean;recipe_ingredients:Array<{name:string;quantity:number|null;unit:string;measure_mode:string;is_optional:boolean}>};
const initial:{title:string;category:string;description:string;instructions:string;prep_minutes:number;servings:number;published:boolean;url:string;image_is_ai:boolean;recipe_ingredients:Ingredient[]}={title:"",category:"lunch",description:"",instructions:"",prep_minutes:25,servings:1,published:false,url:"",image_is_ai:false,recipe_ingredients:[{name:"",quantity:1,unit:"g",measureMode:"measured",optional:false}]};
export default function AdminRecipes({onRefresh}:{onRefresh:()=>Promise<void>}){
 const [previewOpen,setPreviewOpen]=useState(false),[photoConfirm,setPhotoConfirm]=useState<"remove"|"replace"|null>(null),[publishConfirm,setPublishConfirm]=useState<boolean|null>(null);const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null),[removePhoto,setRemovePhoto]=useState(false);
 useEffect(()=>{if(!file){setPreview(null);return;}const objectUrl=URL.createObjectURL(file);setPreview(objectUrl);return()=>URL.revokeObjectURL(objectUrl);},[file]);
 const [section,setSection]=useState<"official"|"mine">("official");
 const [mine,setMine]=useState<Array<{id:string;title:string;category:string;published:boolean}>>([]),[mineLoading,setMineLoading]=useState(false),[mineError,setMineError]=useState("");
 const [pilotRecipeIds,setPilotRecipeIds]=useState<string[]>([]);
 const [rows,setRows]=useState<Row[]>([]),[editing,setEditing]=useState<string|null>(null),[form,setForm]=useState({...initial}),[error,setError]=useState(""),[busy,setBusy]=useState(false),[search,setSearch]=useState("");
 const load=async()=>{if(!supabase)return;
  const [recipeResult,pilotResult]=await Promise.all([
   supabase.from("recipes").select("id,title,category,description,instructions,prep_minutes,servings,published,url,image_is_ai,recipe_ingredients(name,quantity,unit,measure_mode,is_optional)").is("owner_user_id",null).is("archived_at",null).order("title"),
   supabase.from("cc_official_recipe_source_records").select("recipe_id").eq("use_stage","personal_pilot")
  ]);
  if(recipeResult.error)throw recipeResult.error;
  if(pilotResult.error)throw pilotResult.error;
  setRows(recipeResult.data??[]);
  setPilotRecipeIds((pilotResult.data??[]).map(row=>row.recipe_id));
 };
 useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Erro ao carregar catálogo"));},[]);
 const loadMine=async()=>{
  if(!supabase)return;
  setMineLoading(true);setMineError("");
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(authError)throw authError;
   if(!user){setMine([]);return;}
   const {data,error}=await supabase.from("recipes").select("id,title,category,published").eq("owner_user_id",user.id).is("archived_at",null).order("title");
   if(error)throw error;
   setMine(data??[]);
  }catch(e){setMineError(e instanceof Error?e.message:"Não foi possível consultar suas receitas.");}
  finally{setMineLoading(false);}
 };
 useEffect(()=>{if(section==="mine")void loadMine();},[section]);
 const choose=(r:Row)=>{setPreviewOpen(false);setPhotoConfirm(null);setFile(null);setRemovePhoto(false);setEditing(r.id);setForm({...r,url:r.url??"",description:r.description??"",instructions:r.instructions??"",recipe_ingredients:r.recipe_ingredients.length?r.recipe_ingredients.map(i=>({name:i.name,quantity:i.quantity==null?null:Number(i.quantity),unit:i.unit,measureMode:(i.measure_mode||"measured") as Ingredient["measureMode"],optional:Boolean(i.is_optional)})):initial.recipe_ingredients});setError("");};
 const save=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);setError("");try{let uploadedKey:string|null=null;let nextUrl=removePhoto?"":form.url;
 if(file){
  if(!file.type.startsWith("image/")||file.size>12*1024*1024)throw new Error("Selecione uma imagem de até 12 MB.");
  const bitmap=await createImageBitmap(file);const factor=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*factor);canvas.height=Math.round(bitmap.height*factor);const context=canvas.getContext("2d");if(!context)throw new Error("Não foi possível processar a imagem.");context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Não foi possível converter para WebP.")),"image/webp",.83));if(blob.size>2097152)throw new Error("A imagem processada excede 2 MB.");
  uploadedKey="official/"+crypto.randomUUID()+".webp";const {error:uploadError}=await supabase.storage.from("recipe-illustrations").upload(uploadedKey,blob,{contentType:"image/webp",upsert:false});if(uploadError)throw uploadError;
  nextUrl=supabase.storage.from("recipe-illustrations").getPublicUrl(uploadedKey).data.publicUrl;
 }
 let saveError:Error|null=null;
  if(editing&&pilotRecipeIds.includes(editing)){
   const saved=rows.find(r=>r.id===editing);
   if(!saved)throw new Error("Receita autoral não localizada.");
   // Mesmo com a ficha protegida, a RPC permite APENAS foto: nunca substitui ingredientes.
   const currentIngredients=form.recipe_ingredients.map(i=>({
    name:i.name,quantity:i.quantity==null?null:Number(i.quantity),
    unit:i.unit,measureMode:i.measureMode??"measured",optional:Boolean(i.optional)
   }));
   const savedIngredients=saved.recipe_ingredients.map(i=>({
    name:i.name,quantity:i.quantity==null?null:Number(i.quantity),
    unit:i.unit,measureMode:i.measure_mode??"measured",optional:Boolean(i.is_optional)
   }));
   if(form.title!==saved.title||form.category!==saved.category
     ||form.description!==(saved.description??"")||form.instructions!==(saved.instructions??"")
     ||form.prep_minutes!==saved.prep_minutes||form.servings!==saved.servings
     ||JSON.stringify(currentIngredients)!==JSON.stringify(savedIngredients)||saved.published){
     throw new Error("O conteúdo autoral não pode ser modificado no salvamento da fotografia.");
   }
   const {error}=await supabase.rpc("cc_set_personal_pilot_recipe_photo",{
     p_recipe_id:editing,p_url:nextUrl.trim()||null,p_image_is_ai:form.image_is_ai
   });
   if(error)saveError=error;
  }else{
    const {error}=await supabase.rpc("cc_save_official_recipe",{p_id:editing,p_title:form.title,p_category:form.category,p_description:form.description,p_instructions:form.instructions,p_minutes:form.prep_minutes,p_servings:form.servings,p_ingredients:form.recipe_ingredients.map(i=>({name:i.name,quantity:i.measureMode&&i.measureMode!=="measured"?null:i.quantity,unit:i.unit,measure_mode:i.measureMode??"measured",is_optional:Boolean(i.optional)})),p_published:form.published,p_url:nextUrl.trim()||null,p_image_is_ai:form.image_is_ai});
    if(error)saveError=error;
  }if(saveError){if(uploadedKey)await supabase.storage.from("recipe-illustrations").remove([uploadedKey]);throw saveError;}await load();await onRefresh();setFile(null);setRemovePhoto(false);setEditing(null);setForm({...initial,recipe_ingredients:[{name:"",quantity:1,unit:"g"}]});}catch(e){setError(e&&typeof e==="object"&&"message" in e?String(e.message):"Erro ao salvar receita oficial.");}finally{setBusy(false);}};
 const togglePublication=async(target:boolean)=>{
  if(!supabase||!editing||busy)return;
  setPublishConfirm(null);setError("");
  if(pilotRecipeIds.includes(editing)){setError("Acervo autoral em piloto pessoal: publicação bloqueada até a fase comercial.");return;}
  const saved=rows.find(r=>r.id===editing);
  if(!saved){setError("Receita não encontrada. Atualize a lista.");return;}
  const normalize=(v:unknown)=>JSON.stringify(v);
  const savedValues={title:saved.title,category:saved.category,description:saved.description??"",instructions:saved.instructions??"",prep_minutes:saved.prep_minutes,servings:saved.servings,url:saved.url??"",image_is_ai:saved.image_is_ai,recipe_ingredients:saved.recipe_ingredients.map(i=>({name:i.name,quantity:i.quantity==null?null:Number(i.quantity),unit:i.unit,measureMode:i.measure_mode??"measured",optional:Boolean(i.is_optional)}))};
  const currentValues={title:form.title,category:form.category,description:form.description,instructions:form.instructions,prep_minutes:form.prep_minutes,servings:form.servings,url:form.url,image_is_ai:form.image_is_ai,recipe_ingredients:form.recipe_ingredients.map(i=>({name:i.name,quantity:i.quantity==null?null:Number(i.quantity),unit:i.unit,measureMode:i.measureMode??"measured",optional:Boolean(i.optional)}))};
  if(file||removePhoto||normalize(savedValues)!==normalize(currentValues)){setError("Existem alterações não salvas. Salve a receita antes de publicar ou despublicar.");return;}
  setBusy(true);
  try{
   const {error}=await supabase.rpc("cc_save_official_recipe",{p_id:saved.id,p_title:saved.title,p_category:saved.category,p_description:saved.description??"",p_instructions:saved.instructions??"",p_minutes:saved.prep_minutes,p_servings:saved.servings,p_ingredients:saved.recipe_ingredients,p_published:target,p_url:saved.url,p_image_is_ai:saved.image_is_ai});
   if(error)throw error;
   await load();await onRefresh();setForm(v=>({...v,published:target}));
  }catch(e){setError(e&&typeof e==="object"&&"message" in e?String(e.message):"Erro ao alterar publicação");}
  finally{setBusy(false);}
 };
 const field=(key:"title"|"description"|"instructions"|"url",value:string)=>setForm(v=>({...v,[key]:value}));
 const pilotEditing=Boolean(editing&&pilotRecipeIds.includes(editing));
  return <section className="cc-admin"><h2>Gestão do catálogo de receitas</h2><p>Organização culinária das receitas autorais Costa&Costa. As receitas do piloto pessoal continuam privadas: preparar uma receita não é prescrever uma dieta, e este painel não oferece atendimento médico ou nutricional.</p>
 <div className="cc-admin-tabs" role="group" aria-label="Área de receitas"><button type="button" className={section==="official"?"selected":""} aria-pressed={section==="official"} onClick={()=>setSection("official")}>Receitas oficiais</button><button type="button" className={section==="mine"?"selected":""} aria-pressed={section==="mine"} onClick={()=>setSection("mine")}>Minhas receitas particulares</button></div>
 {section==="mine"?<div className="cc-admin-private"><h3>Minhas receitas particulares</h3><p>Esta seção exibe somente as receitas vinculadas à sua própria conta. Receitas de outros usuários permanecem privadas e não são disponibilizadas aos administradores por este painel.</p><p>Para editar ou arquivar suas receitas particulares, use a área <strong>Receitas</strong> do aplicativo. Nenhuma receita particular é publicada como oficial automaticamente.</p>{mineLoading?<p role="status">Carregando suas receitas…</p>:mineError?<p role="alert">{mineError}</p>:mine.length?<ul>{mine.map(r=><li key={r.id}><strong>{r.title}</strong><span>Receita pessoal · {r.category==="breakfast"?"Café da manhã":r.category==="lunch"?"Almoço":r.category==="dinner"?"Jantar":r.category==="snack"?"Lanche":r.category}</span></li>)}</ul>:<p>Você não possui receitas particulares ativas nesta conta.</p>}</div>:<>
 <details className="cc-food-nutrition-section"><summary>Medidas das receitas autorais · inventário e revisão</summary><PilotIngredientMeasureReview/></details>
 <details className="cc-food-nutrition-section"><summary>Base nutricional dos alimentos · revisão administrativa</summary><FoodNutritionAdmin/></details>
 <div className="cc-admin-list"><input placeholder="Buscar receita oficial" aria-label="Buscar receita" value={search} onChange={e=>setSearch(e.target.value)}/><button type="button" className="secondary" onClick={()=>{setFile(null);setRemovePhoto(false);setEditing(null);setForm({...initial,recipe_ingredients:[{name:"",quantity:1,unit:"g"}]});}}>Nova receita oficial</button></div>
 <div className="cc-admin-items">{rows.filter(r=>r.title.toLowerCase().includes(search.toLowerCase())).map(r=><button type="button" key={r.id} className={editing===r.id?"selected":""} onClick={()=>choose(r)}><span>{r.title}</span><small>{pilotRecipeIds.includes(r.id)?"Piloto pessoal · não publicado":r.published?"Publicada":"Rascunho"}</small></button>)}</div>
 <form className="personal-form cc-admin-form" onSubmit={e=>void save(e)}><h3>{editing?"Editar receita oficial":"Nova receita oficial"}</h3>
{pilotEditing?<section className="cc-admin-pilot-readonly" aria-label="Texto da receita protegido">
   <p className="notice"><strong>Receita autoral do piloto.</strong> O título, os ingredientes, o preparo e o rendimento estão protegidos. Neste editor você pode apenas colocar, substituir ou remover a fotografia.</p>
   <h4>{form.title}</h4><p>{form.prep_minutes} minutos · {form.servings} {form.servings===1?"porção de referência":"porções de referência"}</p>
   <details><summary>Consultar ingredientes originais (sem edição)</summary><ul>{form.recipe_ingredients.map((item,i)=><li key={i}>{item.name}</li>)}</ul></details>
   <details><summary>Consultar preparo (sem edição)</summary><p className="cc-admin-pilot-prep">{form.instructions}</p></details>
  </section>:<>
 <label>Nome<input required minLength={2} maxLength={180} value={form.title} onChange={e=>field("title",e.target.value)}/></label>
 <div className="personal-form-grid"><label>Categoria<select value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}><option value="breakfast">Café da manhã</option><option value="lunch">Almoço</option><option value="dinner">Jantar</option><option value="snack">Lanche</option></select></label><label>Preparo (min)<input type="number" min="0" max="1440" value={form.prep_minutes} onChange={e=>setForm(v=>({...v,prep_minutes:Number(e.target.value)}))}/></label><label>Porções<input type="number" min="1" max="20" value={form.servings} onChange={e=>setForm(v=>({...v,servings:Number(e.target.value)}))}/></label></div>
 <label>Descrição<textarea value={form.description} maxLength={2000} onChange={e=>field("description",e.target.value)}/></label>
 <label>Preparo, uma etapa por linha<textarea rows={5} maxLength={10000} value={form.instructions} onChange={e=>field("instructions",e.target.value)}/></label>
 <h3>Ingredientes</h3><p className="detail-note">Use medidas reais. Ingredientes “a gosto” ou sem quantidade não são somados automaticamente.</p>
 {form.recipe_ingredients.map((item,i)=><IngredientEditor key={i} item={item} index={i}
   removable={form.recipe_ingredients.length>1}
   onChange={next=>setForm(v=>({...v,recipe_ingredients:v.recipe_ingredients.map((old,j)=>j===i?next:old)}))}
   onRemove={()=>setForm(v=>({...v,recipe_ingredients:v.recipe_ingredients.filter((_,j)=>j!==i)}))}/>)}
 <button type="button" className="secondary" disabled={form.recipe_ingredients.length>=40}
   onClick={()=>setForm(v=>({...v,recipe_ingredients:[...v.recipe_ingredients,{name:"",quantity:1,unit:"g",measureMode:"measured",optional:false}]}))}>+ Ingrediente</button>
 </>}
 <div className="photo-editor"><h3>Fotografia oficial</h3><label>Escolher fotografia do computador ou celular<input type="file" accept="image/*" onChange={e=>{const chosen=e.target.files?.[0];if(!chosen)return;if(!chosen.type.startsWith("image/")||chosen.size>12*1024*1024){setError("Selecione uma imagem de até 12 MB.");return;}setFile(chosen);setRemovePhoto(false);setPhotoConfirm("replace");setError("");}}/></label>{(preview||(!removePhoto&&form.url))&&<img className="photo-editor-preview" src={preview||form.url} alt="Pré-visualização da receita"/>}{(preview||(!removePhoto&&form.url))&&<button type="button" className="secondary" onClick={()=>setPhotoConfirm("remove")}>Remover fotografia</button>}<p className="detail-note">Padrão recomendado: 1200 × 800 px, horizontal (3:2), WebP, com o prato centralizado. A foto será reduzida para até 1200 px no maior lado e limitada a 2 MB após processamento. Confira a fidelidade à receita.</p></div>
 <label className="cc-admin-checkbox"><input type="checkbox" checked={form.image_is_ai} onChange={e=>setForm(v=>({...v,image_is_ai:e.target.checked}))}/> Imagem ilustrativa gerada por IA</label>
 <div className="cc-editor-actions"><span>Status: <strong>{editing&&pilotRecipeIds.includes(editing)?"Piloto pessoal · privado":form.published?"Publicada":"Rascunho"}</strong></span><button type="button" className="secondary" onClick={()=>setPreviewOpen(true)}>Pré-visualizar receita</button>{editing&&!pilotRecipeIds.includes(editing)&&<button type="button" disabled={busy} onClick={()=>setPublishConfirm(!form.published)}>{form.published?"Despublicar":"Publicar para todos"}</button>}</div><p className="detail-note">Antes de publicar, valide ingredientes, preparação, fotografias e direitos autorais. As fotografias oficiais são enviadas diretamente ao Storage, com acesso administrativo.</p>
 {error&&<div className="notice" role="alert">{error}</div>}<button type="submit" className="primary" disabled={busy}>{busy?"Salvando...":pilotEditing?"Salvar somente fotografia":"Salvar receita oficial"}</button></form>{editing&&<RecipeTechnicalSheet key={editing} recipeId={editing} recipeTitle={rows.find(r=>r.id===editing)?.title??form.title} referenceServings={rows.find(r=>r.id===editing)?.servings??form.servings} ingredientCount={rows.find(r=>r.id===editing)?.recipe_ingredients.length??form.recipe_ingredients.length}/>}</>}
 {previewOpen&&<div className="cc-editor-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setPreviewOpen(false);}}><section className="cc-editor-dialog" role="dialog" aria-modal="true" aria-label="Pré-visualização da receita"><button type="button" className="secondary" onClick={()=>setPreviewOpen(false)}>Fechar</button><p className="detail-note">Pré-visualização administrativa — {form.published?"receita atualmente publicada":"rascunho"}</p>{(preview||(!removePhoto&&form.url))&&<img src={preview||form.url} alt={form.title}/>}<h2>{form.title||"Receita sem título"}</h2><p>{pilotEditing?"Receita autoral Costa&Costa em piloto pessoal. Ingredientes e preparo originais preservados; revisão das medidas em andamento.":form.description}</p><p>{form.prep_minutes} minutos · {form.servings} {form.servings===1?"porção":"porções"}</p><h3>Ingredientes</h3>{pilotEditing&&<p className="detail-note">As quantidades e medidas já constam no texto original de cada ingrediente. Não foram omitidas; o redimensionamento automático de porções ainda aguarda estruturação das medidas.</p>}<ul>{form.recipe_ingredients.map((item,i)=><li key={i}>{pilotEditing?item.name:formatRecipeIngredient(item)+" — "+item.name}</li>)}</ul><h3>Modo de preparo</h3><ol>{form.instructions.split("\n").filter(Boolean).map((line,i)=><li key={i}>{line}</li>)}</ol></section></div>}
 {photoConfirm&&<div className="cc-editor-overlay"><section className="cc-editor-dialog" role="dialog" aria-modal="true" aria-label="Confirmar fotografia"><h3>{photoConfirm==="remove"?"Remover fotografia?":"Substituir fotografia?"}</h3><p>A mudança só será efetivada quando você salvar a receita oficial.</p><div className="cc-editor-actions"><button type="button" className="secondary" onClick={()=>{if(photoConfirm==="replace")setFile(null);setPhotoConfirm(null);}}>Cancelar</button><button type="button" onClick={()=>{if(photoConfirm==="remove"){setFile(null);setRemovePhoto(true);}setPhotoConfirm(null);}}>Confirmar</button></div></section></div>}
 {publishConfirm!==null&&<div className="cc-editor-overlay"><section className="cc-editor-dialog" role="dialog" aria-modal="true" aria-label="Confirmar publicação"><h3>{publishConfirm?"Publicar receita para todos?":"Despublicar esta receita?"}</h3><p>{publishConfirm?"Confirme que ingredientes, preparo, fotografia e direitos autorais foram revisados.":"A receita deixará de aparecer na biblioteca pública, mas será mantida como rascunho."}</p><div className="cc-editor-actions"><button type="button" className="secondary" onClick={()=>setPublishConfirm(null)}>Cancelar</button><button type="button" disabled={busy} onClick={()=>void togglePublication(publishConfirm)}>Confirmar</button></div></section></div>}
 </section>;
}
