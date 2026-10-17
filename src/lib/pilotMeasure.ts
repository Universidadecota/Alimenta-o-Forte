/**
 * Consolidação conservadora de ingredientes das receitas autorais.
 * Apenas expressões inequívocas com ingrediente E unidade idênticos são somadas.
 * Nenhuma equivalência entre colheres, xícaras, g ou ml é presumida.
 * O texto original permanece disponível para consulta.
 */
export type ParsedPilotMeasure = {
 amount:number;
 key:string;
 ingredient:string;
 unitKey:string;
 singular:string;
 plural:string;
};

const fractionValues:Record<string,number>={
 "½":1/2,"¼":1/4,"¾":3/4,
 "⅓":1/3,"⅔":2/3,"⅛":1/8,"⅜":3/8,"⅝":5/8,"⅞":7/8,
};
const unitSpecs:Array<{key:string;expression:RegExp;one:string;many:string}>=[
 {key:"colher-cha",expression:/^colher(?:es)?\s*(?:\(\s*chá\s*\)|de\s+chá)\s+de\s+/i,one:"colher (chá)",many:"colheres (chá)"},
 {key:"colher-sopa",expression:/^colher(?:es)?\s*(?:\(\s*sopa\s*\)|de\s+sopa)\s+de\s+/i,one:"colher (sopa)",many:"colheres (sopa)"},
 {key:"xicara",expression:/^xícaras?\s+de\s+/i,one:"xícara",many:"xícaras"},
 {key:"grama",expression:/^g\s+(?:de\s+)?/i,one:"g",many:"g"},
 {key:"quilograma",expression:/^kg\s+(?:de\s+)?/i,one:"kg",many:"kg"},
 {key:"mililitro",expression:/^ml\s+(?:de\s+)?/i,one:"ml",many:"ml"},
 {key:"litro",expression:/^l\s+(?:de\s+)?/i,one:"L",many:"L"},
 {key:"dente",expression:/^dentes?\s+de\s+/i,one:"dente",many:"dentes"},
 {key:"fatia",expression:/^fatias?\s+de\s+/i,one:"fatia",many:"fatias"},
 {key:"pitada",expression:/^pitadas?\s+de\s+/i,one:"pitada",many:"pitadas"},
 {key:"ramo",expression:/^ramos?\s+de\s+/i,one:"ramo",many:"ramos"},
 {key:"lata",expression:/^latas?\s+de\s+/i,one:"lata",many:"latas"},
 {key:"copo",expression:/^copos?\s+de\s+/i,one:"copo",many:"copos"},
 {key:"unidade",expression:/^unidades?\s+de\s+/i,one:"unidade",many:"unidades"},
 {key:"punhado",expression:/^punhados?\s+de\s+/i,one:"punhado",many:"punhados"},
];
const normalize=(value:string)=>value.normalize("NFD")
 .replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR")
 .replace(/\s+/g," ").trim().replace(/[.\s]+$/,"");
function numericPart(value:string):number|null{
 if(value in fractionValues)return fractionValues[value];
 if(/^\d+\/\d+$/.test(value)){
  const [a,b]=value.split("/").map(Number);
  return b>0&&b<=16?a/b:null;
 }
 if(/^\d+(?:,\d+)?$/.test(value))return Number(value.replace(",","."));
 return null;
}
export function parsePilotMeasure(text:string):ParsedPilotMeasure|null{
 const s=text.trim().replace(/[.\s]+$/,"");
 // Protege casos com opções, listas ou escolhas não resolvidas.
 if(/\b(ou|opcional|aproximad\w*|a gosto|se preferir|se desejar|quanto bastar)\b/i.test(normalize(s))
   ||/[;:]/.test(s) || /\s+e\s+/i.test(s))return null;
 const found=s.match(/^(\d+(?:,\d+)?|\d+\/\d+|[½¼¾⅓⅔⅛⅜⅝⅞])(?:\s+([½¼¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+))?\s+(.+)$/u);
 if(!found)return null;
 const first=numericPart(found[1]);
 const rest=found[2]?numericPart(found[2]):0;
 if(first===null||rest===null)return null;
 const amount=first+rest;
 if(!Number.isFinite(amount)||amount<=0||amount>10000)return null;
 const tail=found[3];
 for(const spec of unitSpecs){
  const m=tail.match(spec.expression);
  if(!m)continue;
  const ingredient=tail.slice(m[0].length).trim();
  if(ingredient.length<2 || /^[\d./]/.test(ingredient) || /[,;:]|\d/.test(ingredient))return null;
  return {
   amount,unitKey:spec.key,ingredient,
   singular:spec.one,plural:spec.many,
   key:spec.key+"|"+normalize(ingredient)
  };
 }
 return null;
}
const near=(v:number,target:number)=>Math.abs(v-target)<0.00001;
export function formatPilotTotal(measure:ParsedPilotMeasure,total:number):string{
 const rounded=Math.round(total*10000)/10000;
 const whole=Math.floor(rounded);
 const frac=rounded-whole;
 const fractions=[
  ["⅛",1/8],["¼",1/4],["⅓",1/3],["⅜",3/8],["½",1/2],
  ["⅝",5/8],["⅔",2/3],["¾",3/4],["⅞",7/8],
 ] as const;
 const matched=fractions.find(([,v])=>near(frac,v));
 const amount=matched?(whole?String(whole)+" "+matched[0]:matched[0]):String(rounded).replace(".",",");
 return amount+" "+(near(rounded,1)?measure.singular:measure.plural)+" de "+measure.ingredient;
}