import {useState} from "react";
import {Leaf} from "lucide-react";
export default function RecipeImage({src,title,large=false}:{src:string|null;title:string;large?:boolean}){
 const [failed,setFailed]=useState(false);
 return <div className={large?"recipe-image-shell large":"recipe-image-shell"}>{src&&!failed?<><img className="recipe-photo" src={src} alt={"Ilustração de "+title} loading="lazy" onError={()=>setFailed(true)}/><span className="ai-photo-credit">Imagem ilustrativa gerada por IA</span></>:<div className="image-placeholder"><Leaf size={large?52:46}/></div>}</div>;
}
