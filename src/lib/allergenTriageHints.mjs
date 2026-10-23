/**
 * A3 · Pistas textuais para triagem EDITORIAL, nunca para liberar refeições.
 * Vocabulário inicial orientado às classes de alergênicos de rotulagem da Anvisa.
 * Pistas podem ser falsas, incompletas ou omitir derivados, marcas e contato cruzado.
 * A AUSÊNCIA de uma pista NÃO demonstra ausência de alérgenos.
 */
const entries=[
 {code:"trigo",label:"Trigo (possível)",terms:["trigo","farinha de trigo","pao","paes","macarrao","seitan"]},
 {code:"centeio",label:"Centeio",terms:["centeio"]},
 {code:"cevada",label:"Cevada",terms:["cevada","malte de cevada"]},
 {code:"aveia",label:"Aveia",terms:["aveia","farelo de aveia"]},
 {code:"crustaceos",label:"Crustáceos",terms:["camarao","lagosta","caranguejo","siri","crustaceos"]},
 {code:"ovos",label:"Ovos (possível)",terms:["ovo","ovos","gema","gemas","clara","claras","maionese"]},
 {code:"peixes",label:"Peixes",terms:["peixe","peixes","salmao","atum","sardinha","tilapia","bacalhau","anchova"]},
 {code:"amendoim",label:"Amendoim",terms:["amendoim","amendoins"]},
 {code:"soja",label:"Soja (possível)",terms:["soja","tofu","shoyu","miso","tempeh","edamame"]},
 {code:"leite",label:"Leite e derivados (possível)",terms:["leite","queijo","queijos","iogurte","requeijao","manteiga","nata","caseina","soro de leite","creme de leite","leite condensado"]},
 {code:"amendoa",label:"Amêndoas",terms:["amendoa","amendoas"]},
 {code:"avela",label:"Avelãs",terms:["avela","avelas"]},
 {code:"castanha_caju",label:"Castanha de caju",terms:["castanha de caju","castanhas de caju"]},
 {code:"castanha_para",label:"Castanha-do-pará",terms:["castanha do para","castanhas do para","castanha do brasil","castanhas do brasil"]},
 {code:"macadamia",label:"Macadâmia",terms:["macadamia","macadamias"]},
 {code:"nozes",label:"Nozes",terms:["noz","nozes"]},
 {code:"peca",label:"Noz-pecã",terms:["noz peca","noz pecan","pecan"]},
 {code:"pistache",label:"Pistache",terms:["pistache","pistaches"]},
 {code:"pinoli",label:"Pinoli",terms:["pinoli","pignoli"]},
 {code:"castanhas",label:"Castanhas sem espécie definida",terms:["castanha","castanhas"]},
 {code:"latex",label:"Látex natural",terms:["latex natural","latex"]}
];
const composed=["molho pronto","caldo em cubo","tempero pronto","mistura pronta","embutido","embutidos"];
const normal=(text)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
 .replace(/[-–—]/g," ").replace(/\s+/g," ").trim();
const matches=(whole,term)=>{
 // Termos são literais controlados no código (letras e espaços).
 const rx=new RegExp("(^|[^a-z0-9])"+term+"(?=$|[^a-z0-9])","g");
 for(const m of whole.matchAll(rx)){
  const start=m.index+m[1].length;
  if(term==="leite"&&/^leite\s+de\s+(coco|soja|aveia|amendoas?|castanhas?|arroz)\b/.test(whole.slice(start)))continue;
  if(term==="manteiga"&&/^manteiga\s+de\s+(amendoim|coco|castanhas?|amendoas?)\b/.test(whole.slice(start)))continue;
  if(term==="noz"&&/^noz\s+moscada\b/.test(whole.slice(start)))continue;
  return true;
 }
 return false;
};

/** @param {string | null | undefined} originalIngredients */
export function collectAllergenTriageHints(originalIngredients){
 if(typeof originalIngredients!=="string"||!originalIngredients.trim())return {sourceAvailable:false,hints:[],composedTerms:[]};
 const normalized=normal(originalIngredients);
 const hints=entries.map(entry=>({
  code:entry.code,label:entry.label,
  terms:entry.terms.filter(term=>matches(normalized,term))
 })).filter(entry=>entry.terms.length>0);
 const composedTerms=composed.filter(term=>matches(normalized,term));
 return {sourceAvailable:true,hints,composedTerms};
}
