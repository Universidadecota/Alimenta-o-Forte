/** Duração editorial para fichas do piloto: mantém a fonte sem ocultar preparo prévio. */
export function formatPilotRecipeTime(recipe,compact=false){
 const base=recipe.pilotSource?.originalTime??`${recipe.minutes} minutos`;
 if(!recipe.pilotSource)return compact?`${recipe.minutes} min`:base;
 const optionalSoak=/v[oô]ngole|am[eê]ijoas?/iu.test(recipe.title)&&
  /de molho em água com sal por 30 minutos/iu.test(recipe.instructions??"")&&
  /Tempo:\s*20\s*min/iu.test(base);
 if(optionalSoak)return compact?"20 min + até 30 min de molho":
  base.replace(/20\s*min/iu,"20 min de preparo + até 30 min de molho (se necessário)");
 return compact?`${recipe.minutes} min`:base;
}
