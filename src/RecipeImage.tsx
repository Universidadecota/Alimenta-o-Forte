import {useEffect,useState} from "react";
import {Leaf, Maximize2, X} from "lucide-react";
import {createPortal} from "react-dom";

export default function RecipeImage({src,title,large=false,isAi=true}:{src:string|null;title:string;large?:boolean;isAi?:boolean}){
 const [failed,setFailed]=useState(false);
 const [open,setOpen]=useState(false);
 useEffect(()=>{setFailed(false);setOpen(false);},[src]);
 useEffect(()=>{
  if(!open)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
  document.addEventListener("keydown",onKey);
  const previous=document.body.style.overflow;
  document.body.style.overflow="hidden";
  return ()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow=previous;};
 },[open]);
 const available=Boolean(src&&!failed);
 return <div className={large?"recipe-image-shell large":"recipe-image-shell"}>
  {available?<><button type="button" className="recipe-image-zoom" onClick={()=>setOpen(true)} aria-label={"Ampliar fotografia de "+title} title="Clique para ampliar">
    <img className="recipe-photo" src={src!} alt={"Imagem ilustrativa de "+title} loading="lazy" onError={()=>setFailed(true)}/>
    <span className="zoom-icon"><Maximize2 size={17}/></span>
  </button>{isAi&&<span className="ai-photo-credit">Imagem ilustrativa gerada por IA</span>}</>
  :<div className="image-placeholder"><Leaf size={large?52:46}/></div>}
  {open&&available&&createPortal(<div className="recipe-lightbox" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
   <section className="recipe-lightbox-panel" role="dialog" aria-modal="true" aria-label={"Fotografia ampliada: "+title}>
    <button type="button" className="recipe-lightbox-close" autoFocus onClick={()=>setOpen(false)} aria-label="Fechar imagem ampliada"><X size={23}/></button>
    <img src={src!} alt={"Imagem ilustrativa ampliada de "+title}/>
    <div className="recipe-lightbox-caption"><strong>{title}</strong>{isAi&&<span>Imagem ilustrativa gerada por IA</span>}</div>
   </section>
  </div>,document.body)}
 </div>;
}
