# Costa&Costa Alimentação Forte — Fase 3K
## Hipóteses literais de desmembramento e reorganização — 29/10/2026

**Ambiente:** Beta, branch de desenvolvimento independente e PR para `feat/revisao-alergenos-fase1-12out2026`. **Natureza:** análise efêmera, exclusivamente de leitura, sem banco, migração ou aprovação.

### Objetivo
A Fase 3J já apresenta a fonte oficial, o registro histórico e o ingrediente atual lado a lado. Esta fase adiciona um **mapa preliminar de hipóteses textuais**, para facilitar a conferência do que parece ter sido dividido durante a edição das receitas.

### Regra de elegibilidade conservadora
Uma expressão histórica só gera hipótese de desmembramento quando TODOS estes pontos são verdadeiros:

1. O histórico e o ingrediente atual com o mesmo `ingredient_id` apresentam diferença textual.
2. `splitPilotIngredient` encontra entre 2 e 4 segmentos separados por cabeçalho explícito da receita (por exemplo, `Molho:`, `Salada:`, `Vinagrete:`). Não utilizar separação livre por vírgulas.
3. A expressão histórica completa ocorre **uma única vez** no texto integral dos ingredientes da fonte oficial da receita.
4. O primeiro segmento corresponde literalmente (ignorando somente diferenças de maiúsculas, espaços e pontuação terminal) ao ingrediente que preserva o mesmo ID histórico.
5. Os demais segmentos têm, cada um, um **único** ingrediente atual com ID novo e texto literalmente correspondente. As posições são contíguas a partir do segmento com ID histórico.
6. Segmentos com alternativas (`ou`), opcionais, subtítulos internos ambíguos ou concorrência por um mesmo ID novo são recusados. Não aplicar correspondência aproximada nem sinônimos.

**Resultado:** somente indicação `possível desmembramento`; nunca criar um vínculo comprovado. Exibir também:
- Ingredientes com **texto preservado e posição diferente** (reorganizações por ID, sem autorização de medida);
- Expressões históricas alteradas ou ausentes sem hipótese literal;
- Novos ingredientes atuais que permanecem sem associação literal sugerida.

### Exemplos da base real vistos por SELECT read-only
- `pimenta. Molho: 4 tomates maduros` foi separada em `pimenta` e `4 tomates maduros`: caso apto a hipótese literal se os IDs/posições coincidirem.
- `pimenta chili a gosto. Salada: 2 tomates` e novo `2 tomates (salada)`: diferença editorial **não literal**; não oferecer hipótese automática.
- `1 colher (sopa) de azeite. Maionese: 1 gema` e novo `1 gema (maionese)`: mesma restrição; deixar pendente.

### Testes de regressão
- Exibir grupo de fragmentos literais com ID histórico + novo ID, sem persisti-los.
- Listar deslocamentos de posição em separado.
- Rejeitar fonte que não contenha a expressão, expressão duplicada no original, múltiplos IDs com o mesmo texto, posições descontínuas e acréscimos editoriais não literais.
- Manter sem hipótese os casos que exigem interpretação culinária, alergênica ou de segurança alimentar.

### Portões preservados
- Nenhuma escrita em `cc_pilot_ingredient_measure_reviews`, `cc_official_recipe_source_records` ou `recipe_ingredients`.
- Nada habilita porções, nutrição, compras ou alergênicos.
- O próximo passo para **qualquer** vínculo persistente 1:N exigirá proposta explícita, rastreabilidade ao documento oficial, decisão editorial e autorização específica do responsável.
- Não repetir testes funcionais já homologados no Beta.
