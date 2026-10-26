/**
 * Converte listas simples separadas por vírgulas em itens visuais.
 * Não altera o registro de origem e mantém fichas complexas como texto integral.
 * Não divide vírgulas dentro de parênteses (ex.: "(picado, sem sementes)").
 */
export function parsePilotIngredientDisplay(source) {
  if (typeof source !== "string") return null;
  const original = source.trim();
  if (!original || /[\r\n;:]/u.test(original)) return null;

  let parentheses = 0;
  const items = [];
  let start = 0;
  for (let i = 0; i < original.length; i++) {
    const character = original[i];
    if (character === "(") parentheses++;
    if (character === ")") parentheses--;
    if (parentheses < 0) return null;
    if (character === "," && parentheses === 0) {
      items.push(original.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (parentheses !== 0) return null;
  items.push(original.slice(start).trim());

  if (items.length < 3 || items.some(item => !item || item.length > 120)) return null;
  // Uma vírgula também pode separar observações do ingrediente anterior.
  // Nesses casos, é mais fiel exibir o texto original sem transformá-lo.
  const qualifier = /^(?:a gosto\b|sem\b|com\b|opcional\b|picad[oa]s?\b|cortad[oa]s?\b|fatiad[oa]s?\b|cozid[oa]s?\b|assad[oa]s?\b|temperad[oa]s?\b|para\b)/iu;
  if (items.slice(1).some(item => qualifier.test(item))) return null;
  return items;
}
