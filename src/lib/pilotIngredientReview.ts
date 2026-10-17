/**
 * Interpretação auxiliar para compras. NUNCA altera a receita armazenada.
 * Divide apenas cabeçalhos explícitos após ponto, seguidos por uma medida.
 */
export type PilotIngredientSegment = {
 text:string;
 rawFragment:string;
 section:string|null;
 requiresChoice:boolean;
 optional:boolean;
 ambiguousCompound:boolean;
 wasSplit:boolean;
};

const headings=[
 "Maionese caseira","Farofa de couve-flor","Por porção",
 "Acompanhamento","Chimichurri","Chermoula","Vinagrete",
 "Maionese","Tahine","Salada","Molho","Cenoura",
];
const headerRegex=new RegExp(
 "\\.\\s+("+headings.join("|")+"):?\\s*(?=\\d|[½¼¾⅓⅔⅛⅜⅝⅞])",
 "giu"
);
const isChoice=(value:string)=>/\bou\b/i.test(value);
const isOptional=(value:string)=>/\bopcional\b|\ba gosto\b|\bse desejar\b|\bse preferir\b|\bse precisar\b/i.test(value);
const hasUnresolvedCompound=(value:string)=>/(?:\.\s+\p{L}[^.]*:)|;/u.test(value)||value.includes(":");

export function splitPilotIngredient(raw:string):PilotIngredientSegment[]{
 const source=raw.trim();
 if(!source)return [];
 const matches=[...source.matchAll(headerRegex)];
 const results:Array<{text:string;section:string|null}>=[];
 let last=0;
 let section:string|null=null;
 for(const match of matches){
  const text=source.slice(last,match.index).trim().replace(/\.\s*$/,"");
  if(text)results.push({text,section});
  last=(match.index??0)+match[0].length;
  section=match[1];
 }
 const final=source.slice(last).trim();
 if(final)results.push({text:final,section});
 return results.map(item=>({
  ...item,
  rawFragment:source,
  requiresChoice:isChoice(item.text),
  optional:isOptional(item.text),
  ambiguousCompound:hasUnresolvedCompound(item.text),
  wasSplit:matches.length>0,
 }));
}
