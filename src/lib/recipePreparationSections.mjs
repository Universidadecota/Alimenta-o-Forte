/**
 * Divide o preparo em passos, dicas e avisos quando o conteúdo cadastrado
 * possui cabeçalhos explícitos. Receitas antigas permanecem inalteradas.
 */
export function parseRecipePreparation(instructions) {
  const sections = {steps: [], tips: [], safety: []};
  let current = "steps";
  const lines = (instructions ?? "").split(/(?:\\n|\r?\n)+/).map(s => s.trim()).filter(Boolean);
  // O cadastro de muitas receitas antigas contém 2–4 frases em uma só linha.
  // Transformamos essas frases em passos numerados, sem criar instruções novas.
  // Fichas que já usam linhas/etapas explícitas são mantidas integralmente.
  const splitParagraphIntoSteps = lines.length === 1;
  for (const line of lines) {
    if (/^DICAS PARA DAR CERTO:\s*$/iu.test(line)) {
      current = "tips";
    } else if (/^INFORMAÇÕES DE SEGURANÇA:\s*$/iu.test(line)) {
      current = "safety";
    } else {
      if (current === "steps" && splitParagraphIntoSteps) {
        sections.steps.push(...line.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/u).filter(Boolean));
      } else {
        sections[current].push(line);
      }
    }
  }
  return sections;
}
