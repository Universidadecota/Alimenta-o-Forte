/**
 * Costa&Costa N2 — triagem auxiliar, somente em memória.
 * Corresponde apenas expressões isoladas, sem misturas/alternativas.
 * NUNCA deduz gramas, calorias, variedade ou modo de preparo.
 * A aplicação depende do clique explícito do administrador e não grava no banco.
 */
export type N2FoodOption={id:string;name:string};
export type N2SuggestedDraft={
 foodId:string;
 triageStatus:"need_mass"|"need_food"|"ambiguous_or_optional";
 reviewNote:string;
 matchNotes:string;
 reason:string;
};
const normalized=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .toLocaleLowerCase("pt-BR").replace(/\s+/g," ").trim();
const standard=(text:string)=>normalized(text).replace(/[.]$/,"").trim();

type StrictAlias={name:string;pattern:RegExp;reason:string};
const aliases:StrictAlias[]=[
 {name:"Ovo de galinha",pattern:/^(?:\d+\s+)?ovos?(?:\s+(?:batidos?|cozidos?|mexidos?))?$/u,reason:"O ingrediente cita somente ovo; verificar a espécie e o preparo antes da associação."},
 {name:"Tomate",pattern:/^(?:\d+(?:[,.]\d+)?|½|¼|¾)\s+tomates?(?:\s+(?:picados?|fatiados?|em cubos|sem pele))?$/u,reason:"Tomate sem variedade indicada; confirmar se a variante nutricional corresponde."},
 {name:"Café",pattern:/^(?:\d+|½|¼|¾)\s+xicaras?\s+de\s+cafe(?:\s+(?:preto|sem acucar))?$/u,reason:"Café como bebida isolada; confirmar concentração e volume reais."},
 {name:"Água potável",pattern:/^(?:\d+\s+(?:ml|l|litros?|copos?)\s+de\s+)?agua(?:\s+potavel)?$/u,reason:"Água explicitamente citada; confirmar origem e medida real."},
 {name:"Banana",pattern:/^(?:\d+|½|¼)\s+bananas?(?:\s+(?:picadas?|amassadas?|em rodelas))?$/u,reason:"Banana indicada; confirmar variedade, maturação e massa consumida."},
 {name:"Laranja",pattern:/^(?:\d+|½|¼)\s+laranjas?(?:\s+(?:descascadas?|picadas?))?$/u,reason:"Laranja isolada; confirmar variedade e parte comestível."},
 {name:"Maçã",pattern:/^(?:\d+|½|¼)\s+macas?(?:\s+(?:picadas?|em cubos|com casca|sem casca))?$/u,reason:"Maçã isolada; confirmar cultivar e presença de casca."},
 {name:"Azeite de oliva",pattern:/^(?:\d+|½|¼|¾)\s+colher(?:es)?\s*(?:\(\s*sopa\s*\)|\(\s*cha\s*\)|de\s+sopa|de\s+cha)\s+de\s+azeite\s+de\s+oliva$/u,reason:"Azeite explicitamente identificado como de oliva; conferir variante e massa."},
];
function isAmbiguous(text:string){
 return /\bou\b|\bopcional\b|\ba gosto\b|\b(?:se preferir|se desejar|quanto bastar)\b/i.test(text);
}
export function suggestN2Ingredient(text:string,foods:N2FoodOption[]):N2SuggestedDraft{
 const s=standard(text);
 if(isAmbiguous(s))return {
  foodId:"",triageStatus:"ambiguous_or_optional",
  reviewNote:"Expressão contém alternativa, ingrediente opcional ou quantidade a gosto. Definir a escolha e aferir antes do cálculo.",
  matchNotes:"",reason:"Alternativa/quantidade não resolvida — não sugerir alimento."
 };
 for(const alias of aliases){
  if(!alias.pattern.test(s))continue;
  const exact=foods.filter(food=>standard(food.name)===standard(alias.name));
  if(exact.length===1)return {
   foodId:exact[0].id,triageStatus:"need_mass",
   reviewNote:"Correspondência textual preliminar possível; aferir massa real e conferir variedade/preparo antes de validar.",
   matchNotes:alias.reason,
   reason:"Possível correspondência literal com a biblioteca: "+alias.name+". Nenhuma quantidade ou variante foi inferida."
  };
  break;
 }
 const absent=/(?:\b(?:camomila|bacon|morangos?|kefir|chia|linhaca|manteiga|rucula|abacate|mirtilos?|framboesas?|coco|orega?no|pimenta|limao|paprica|sal)\b|sementes? de abobora|peito de peru|cha verde)/u.test(s);
 return {
  foodId:"",triageStatus:absent?"need_food":"need_mass",
  reviewNote:absent
   ?"Ingrediente sem correspondente específico nos alimentos publicados; cadastrar/comprovar alimento e aferir sua massa antes do cálculo."
   :"Aferir quantidade e massa com evidência; verificar identidade alimentar e preparo antes de cadastrar um vínculo.",
  matchNotes:"",
  reason:absent?"Ingrediente aparentemente ausente dos alimentos publicados; confirmar o cadastro necessário.":"Sem correspondência literal suficientemente segura. Selecionar manualmente ou registrar alimento ausente."
 };
}
