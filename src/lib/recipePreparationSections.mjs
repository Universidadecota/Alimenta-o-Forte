/**
 * Divide o preparo em passos, dicas e avisos quando o conteúdo cadastrado
 * possui cabeçalhos explícitos. Receitas antigas permanecem inalteradas.
 */
export function parseRecipePreparation(instructions) {
  const sections = {steps: [], tips: [], safety: []};
  let current = "steps";
  for (const line of (instructions ?? "").split(/(?:\\n|\r?\n)+/).map(s => s.trim()).filter(Boolean)) {
    if (/^DICAS PARA DAR CERTO:\s*$/iu.test(line)) {
      current = "tips";
    } else if (/^INFORMAÇÕES DE SEGURANÇA:\s*$/iu.test(line)) {
      current = "safety";
    } else {
      sections[current].push(line);
    }
  }
  return sections;
}
