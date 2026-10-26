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

/**
 * Fichas compostas (ex.: prato + Molho: + Salada:) são exibidas por grupos.
 * O parser não supõe rendimento nem transforma medidas da receita original.
 * Se não for possível separar sem ambiguidade, devolve null para usar o texto.
 */
export function parsePilotIngredientGroups(source) {
  if (typeof source !== "string" || !source.trim()) return null;
  const original = source.replace(/\\n/g, "\n").trim();
  if (!/[\n;:]|\.\s+[A-ZÀ-Ü][^.:]{2,48}:/u.test(original)) return null;
  // Referências editoriais que ainda não são ingredientes não devem virar itens.
  if (/\b(?:ver receita|receita abaixo)\b/iu.test(original)) return null;

  const chunks = original.split(/(?<=\.)\s+(?=[A-ZÀ-Ü][\p{L}\p{M}\d ()-]{2,48}:)|\n{2,}|;\s*/u)
    .map(chunk => chunk.trim()).filter(Boolean);
  if (chunks.length < 2) return null;
  const groups = [];
  for (const chunk of chunks) {
    const label = /^([\p{L}][\p{L}\p{M}\d ()-]{1,48}):\s+(.+)$/u.exec(chunk);
    const title = label ? label[1] : null;
    const text = label ? label[2] : chunk;
    groups.push({title, text, items: parsePilotIngredientDisplay(text)});
  }
  return groups;
}
