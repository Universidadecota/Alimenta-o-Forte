import {useEffect,useState} from "react";
import {Star,ThumbsUp,ThumbsDown} from "lucide-react";
import {supabase} from "./lib/supabase";

type Vote={stars:number;liked:boolean|null};
type Summary={total:number;average_stars:number|null;likes:number;dislikes:number};
export default function RecipeRating({recipeId}:{recipeId:string}){
 const [rating,setRating]=useState<Vote>({stars:0,liked:null});
 const [summary,setSummary]=useState<Summary|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  if(!supabase)return;
  let live=true;
  const client=supabase;
  void (async()=>{
   setLoading(true);setError("");setRating({stars:0,liked:null});setSummary(null);
   const auth=await client.auth.getUser();
   if(auth.error||!auth.data.user){if(live){setError("Entre na sua conta para avaliar.");setLoading(false);}return;}
   const [mine,stats]=await Promise.all([
    client.from("cc_recipe_ratings").select("stars,liked").eq("recipe_id",recipeId).eq("user_id",auth.data.user.id).maybeSingle(),
    client.rpc("cc_recipe_rating_summary",{p_recipe_id:recipeId})
   ]);
   if(!live)return;
   if(mine.error||stats.error){setError("Avaliações indisponíveis no momento.");}
   else{if(mine.data)setRating({stars:mine.data.stars,liked:mine.data.liked});
    setSummary((stats.data?.[0]??{total:0,average_stars:null,likes:0,dislikes:0}) as Summary);}
   setLoading(false);
  })();
  return()=>{live=false};
 },[recipeId]);
 const save=async(next:Vote)=>{
  if(!supabase||busy||loading)return;
  const auth=await supabase.auth.getUser();
  if(auth.error||!auth.data.user){setError("Faça login novamente.");return;}
  if(next.stars<1){setError("Escolha uma nota de 1 a 5 antes de votar.");return;}
  setBusy(true);setError("");
  const {error:writeError}=await supabase.from("cc_recipe_ratings").upsert({
   recipe_id:recipeId,user_id:auth.data.user.id,stars:next.stars,liked:next.liked,updated_at:new Date().toISOString()
  },{onConflict:"recipe_id,user_id"});
  if(writeError){setError("Não foi possível salvar sua avaliação.");setBusy(false);return;}
  setRating(next);
  const {data,error:summaryError}=await supabase.rpc("cc_recipe_rating_summary",{p_recipe_id:recipeId});
  if(!summaryError)setSummary((data?.[0]??null) as Summary|null);
  setBusy(false);
 };
 return <section className="detail-panel" aria-label="Avaliação da receita" style={{marginTop:16}}>
  <h3>Avalie esta receita</h3>
  {summary&&<p className="detail-note">Nota média: {summary.average_stars??"—"}/5 · {summary.total} avaliações · {summary.likes} gostei · {summary.dislikes} não gostei</p>}
  <div role="group" aria-label="Sua nota de 1 a 5 estrelas" style={{display:"flex",gap:8,margin:"12px 0"}}>
   {[1,2,3,4,5].map(n=><button key={n} type="button" disabled={loading||busy} aria-label={n+" estrelas"} aria-pressed={rating.stars===n}
    onClick={()=>void save({...rating,stars:n})} style={{border:0,background:"transparent",cursor:"pointer",padding:4}}>
    <Star size={26} fill={n<=rating.stars?"#e6a23c":"none"} color={n<=rating.stars?"#e6a23c":"#888"}/></button>)}
  </div>
  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
   <button className="secondary" type="button" disabled={loading||busy} aria-pressed={rating.liked===true}
    onClick={()=>void save({...rating,liked:rating.liked===true?null:true})}><ThumbsUp size={16}/> Gostei {rating.liked===true?"✓":""}</button>
   <button className="secondary" type="button" disabled={loading||busy} aria-pressed={rating.liked===false}
    onClick={()=>void save({...rating,liked:rating.liked===false?null:false})}><ThumbsDown size={16}/> Não gostei {rating.liked===false?"✓":""}</button>
  </div>
  {loading&&<p role="status" className="detail-note">Carregando avaliações...</p>}
  {busy&&<p role="status" className="detail-note">Salvando avaliação...</p>}
  {error&&<p role="alert" className="detail-note">{error}</p>}
 </section>;
}
