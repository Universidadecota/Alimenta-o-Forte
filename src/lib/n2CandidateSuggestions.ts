/**
 * Costa&Costa N2 — correspondência conservadora para pré-triagem administrativa.
 * Um nome compatível NÃO valida composição, variedade, preparo, massa ou alergênicos.
 * Nenhuma gravação, publicação ou cálculo ocorre nesta função.
 */
export type N2FoodOption={id:string;name:string;published?:boolean};
export type N2SuggestedDraft={
 foodId:string;
 foodPublication:"published"|"preliminary"|"none";
 triageStatus:"need_mass"|"need_food"|"ambiguous_or_optional";
 reviewNote:string;
 matchNotes:string;
 reason:string;
};
const normalized=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .toLocaleLowerCase("pt-BR").replace(/\s+/g," ").trim();
const standard=(text:string)=>normalized(text).replace(/[.]$/,"").trim();

/** As regras abaixo não incluem sinônimos nutricionais de espécies, cortes ou preparos distintos. */
type StrictAlias={name:string;pattern:RegExp;reason:string};
const aliases:StrictAlias[]=[
 {name:"Ovo de galinha",pattern:/^(?:\d+\s+)?ovos?(?:\s+(?:batidos?|cozidos?|mexidos?))?$/u,reason:"Ovo isolado; conferir a espécie, o tamanho e o preparo antes da associação."},
 {name:"Tomate",pattern:/^(?:\d+(?:[,.]\d+)?|½|¼|¾)\s+tomates?(?:\s+(?:picados?|fatiados?|em cubos|sem pele))?$/u,reason:"Tomate não especifica variedade; confirmar a variante e a porção realmente utilizada."},
 {name:"Tomate-cereja",pattern:/^(?:\d+(?:[,.]\d+)?|½|¼|¾)\s+tomates?[- ]cerejas?$/u,reason:"Tomate-cereja explicitamente indicado; confirmar o produto, sua massa e a variedade."},
 {name:"Café",pattern:/^(?:\d+|½|¼|¾)\s+xicaras?\s+de\s+cafe(?:\s+(?:preto|sem acucar))?$/u,reason:"Café preparado; conferir concentração e volume reais."},
 {name:"Chá de camomila",pattern:/^(?:\d+|½|¼|¾)\s+xicaras?\s+de\s+cha\s+de\s+camomila(?:\s+sem acucar)?$/u,reason:"Chá de camomila explicitamente descrito; conferir concentração e volume, sem usar composição de camomila seca."},
 {name:"Chá verde",pattern:/^(?:\d+|½|¼|¾)\s+xicaras?\s+de\s+cha\s+verde(?:\s+sem acucar)?$/u,reason:"Chá verde preparado; conferir concentração e volume, sem confundir com folhas secas."},
 {name:"Água potável",pattern:/^(?:\d+\s+(?:ml|l|litros?|copos?)\s+de\s+)?agua(?:\s+potavel)?$/u,reason:"Água isolada; verificar origem e quantidade real."},
 {name:"Banana",pattern:/^(?:\d+|½|¼)\s+bananas?(?:\s+(?:picadas?|amassadas?|em rodelas))?$/u,reason:"Banana isolada; confirmar a variedade, a maturação e a parte comestível."},
 {name:"Laranja",pattern:/^(?:\d+|½|¼)\s+laranjas?(?:\s+(?:descascadas?|picadas?))?$/u,reason:"Laranja isolada; confirmar cultivar e parte comestível."},
 {name:"Maçã",pattern:/^(?:\d+|½|¼)\s+macas?(?:\s+(?:picadas?|em cubos|com casca|sem casca))?$/u,reason:"Maçã isolada; confirmar cultivar e presença de casca."},
 {name:"Azeite de oliva",pattern:/^(?:\d+|½|¼|¾)\s+colher(?:es)?\s*(?:\(\s*sopa\s*\)|\(\s*cha\s*\)|de\s+sopa|de\s+cha)\s+de\s+azeite\s+de\s+oliva$/u,reason:"Azeite explicitamente de oliva; verificar tipo e massa."},
 {name:"Bacon",pattern:/^(?:\d+|½|¼)\s+fatias?\s+de\s+bacon$/u,reason:"Bacon indicado por fatias; peso, composição e preparo dependem do produto utilizado."},
 {name:"Semente de abóbora",pattern:/^(?:\d+|½|¼|¾)\s+colher(?:es)?\s*(?:\(\s*sopa\s*\)|de\s+sopa)\s+de\s+sementes?\s+de\s+abobora$/u,reason:"Semente de abóbora explícita; identificar variedade, casca e massa aferida."},
 {name:"Morango",pattern:/^(?:(?:\d+|½|¼|¾)\s+(?:xicaras?\s+de\s+)?morangos?(?:\s+picados?)?)$/u,reason:"Morango explicitamente indicado; verificar massa da parte comestível."},
 {name:"Chia",pattern:/^(?:\d+|½|¼|¾)\s+colher(?:es)?\s*(?:\(\s*sopa\s*\)|de\s+sopa)\s+de\s+(?:sementes?\s+de\s+)?chia$/u,reason:"Chia explícita; confirmar produto e massa medida."},
 {name:"Linhaça",pattern:/^(?:\d+|½|¼|¾)\s+colher(?:es)?\s*(?:\(\s*sopa\s*\)|de\s+sopa)\s+de\s+linhaca$/u,reason:"Linhaça não indica moagem; confirmar inteira/moída e a massa."},
 {name:"Manteiga",pattern:/^(?:\d+|½|¼|¾)\s+colher(?:es)?\s*(?:\(\s*sopa\s*\)|\(\s*cha\s*\)|de\s+sopa|de\s+cha)\s+de\s+manteiga$/u,reason:"Manteiga explícita; verificar composição e peso em gramas."},
 {name:"Coco ralado",pattern:/^(?:\d+|½|¼|¾)\s+colher(?:es)?\s*(?:\(\s*sopa\s*\)|de\s+sopa)\s+de\s+coco\s+ralado(?:\s+sem\s+acucar)?$/u,reason:"Coco ralado: confirmar se há adição de açúcar e qual a massa efetiva."},
 {name:"Rúcula",pattern:/^(?:\d+|½|¼|¾)\s+punhados?\s+de\s+rucula$/u,reason:"Rúcula por punhado: peso deve ser medido, nunca presumido."},
 {name:"Abacate",pattern:/^(?:\d+|½|¼|¾)\s+(?:de\s+)?abacates?(?:\s+fatiados?)?$/u,reason:"Abacate indicado: confirmar variedade, parte comestível e massa."},
 {name:"Limão",pattern:/^limao$/u,reason:"Limão mencionado sem quantidade nem uso definido; confirmar se é suco, casca ou outra parte."},
 {name:"Framboesa",pattern:/^(?:\d+|½|¼|¾)\s+xicaras?\s+de\s+framboesas?$/u,reason:"Framboesa indicada por xícara: pesar a parte comestível."},
 {name:"Óleo de coco",pattern:/^(?:\d+|½|¼|¾)\s+colher(?:es)?\s*(?:\(\s*sopa\s*\)|\(\s*cha\s*\)|de\s+sopa|de\s+cha)\s+de\s+oleo\s+de\s+coco$/u,reason:"Óleo de coco explícito; confirmar origem e massa efetiva."},
 {name:"Sal",pattern:/^(?:(?:\d+|½|¼|¾)\s+pitadas?\s+de\s+)?sal$/u,reason:"Sal explicitamente citado; quantidade e teor de sódio dependem do sal realmente usado."},
 {name:"Orégano",pattern:/^oregano$/u,reason:"Orégano sem quantidade especificada; identificar apresentação e massa."},
 {name:"Páprica",pattern:/^paprica$/u,reason:"Páprica genérica; confirmar tipo, forma e massa antes do vínculo nutricional."},
];
function isAmbiguous(text:string){
 return /\bou\b|\bopcional\b|\ba gosto\b|\b(?:se preferir|se desejar|quanto bastar)\b/i.test(text);
}
export function suggestN2Ingredient(text:string,foods:N2FoodOption[]):N2SuggestedDraft{
 const s=standard(text);
 if(isAmbiguous(s))return {
  foodId:"",foodPublication:"none",triageStatus:"ambiguous_or_optional",
  reviewNote:"A expressão contém alternativa, ingrediente opcional ou quantidade a gosto. Definir a escolha e aferir antes do cálculo.",
  matchNotes:"",reason:"Alternativa/quantidade não resolvida — não sugerir alimento."
 };
 for(const alias of aliases){
  if(!alias.pattern.test(s))continue;
  const exact=foods.filter(food=>standard(food.name)===standard(alias.name));
  if(exact.length===1){
   const food=exact[0];
   const publication=food.published===false?"preliminary":"published";
   return {
    foodId:food.id,foodPublication:publication,triageStatus:"need_mass",
    reviewNote:publication==="preliminary"
     ?"Alimento já cadastrado, mas NÃO publicado. Revisar cadastro e fonte nutricional; aferir massa, variedade e preparo."
     :"Correspondência textual possível em alimento publicado; aferir massa e conferir variedade e preparo antes de validar.",
    matchNotes:alias.reason,
    reason:publication==="preliminary"
     ?"Cadastro preliminar localizado: "+alias.name+". NÃO está publicado nem tem nutrição aprovada."
     :"Possível correspondência textual: "+alias.name+". Massa, variante e nutrição não verificadas."
   };
  }
  return {
   foodId:"",foodPublication:"none",triageStatus:"need_food",
   reviewNote:"Nome corresponde a uma regra, mas o cadastro é inexistente ou duplicado. Resolver identidade antes da associação.",
   matchNotes:"",reason:"Não foi possível identificar cadastro único para "+alias.name+"."
  };
 }
 const mayBeMissing=/(?:\b(?:kefir|camomila|bacon|morangos?|chia|linhaca|abacate|rucula|framboesas?|manteiga|sal|lim[aã]o|coco|pimenta|paprica|oregano)\b)/u.test(s);
 return {
  foodId:"",foodPublication:"none",triageStatus:mayBeMissing?"need_food":"need_mass",
  reviewNote:mayBeMissing
   ?"Verificar se o alimento existe no catálogo preliminar e se há correspondência exata; não inventar equivalência."
   :"Aferir quantidade e massa com evidência; verificar identidade alimentar e preparo antes de vincular.",
  matchNotes:"",
  reason:mayBeMissing
   ?"Ingrediente com identidade ou preparo ainda não resolvidos; conferir cadastro preliminar manualmente."
   :"Sem correspondência textual suficientemente segura. Revisar manualmente, sem inventar equivalência."
 };
}
