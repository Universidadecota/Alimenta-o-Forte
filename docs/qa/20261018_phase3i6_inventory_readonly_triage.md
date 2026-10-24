# Costa&Costa — Fase 3I.6: triagem integral preliminar, somente leitura

**Data:** 18/10/2026. **Escopo:** 119 receitas autorais / 1.073 ingredientes. **PR #16:** manter draft, sem merge.

## Auditoria no Supabase conectado
Consulta de contagem de `public.cc_pilot_ingredient_measure_reviews`:
- `pending`: 1.069
- `draft`: 3 (as três cebolas)
- `confirmed`: 1 (aprovação editorial anterior)
- Total: 1.073

Uma triagem **SQL preliminar** por expressões regulares sobre `source_text` devolveu:

| Categoria SQL preliminar | Total |
| --- | ---: |
| Candidato com prefixo numérico | 551 (547 pending, 3 draft, 1 confirmed) |
| Demais textos, inclusive frações / medidas por extenso | 430 |
| Alternativas contendo “ou” | 40 |
| Preparos com separadores `:` ou `;` | 40 |
| Opcionais / a gosto | 6 |
| Intervalos numéricos | 6 |
| **Total** | **1.073** |

**Limitação crítica:** as categorias SQL são aproximadas e **não equivalem** à classificação TypeScript de `classifyMeasure`. O grupo de 551 prefixos numéricos inclui itens que NÃO são simples nem aprováveis; a contagem de 430 não significa 430 casos que dependem de revisão humana. Não usar estes números para gravar propostas ou homologar porções.

## Direção de implementação
1. Executar classificação fiel ao **mesmo parser TypeScript existente**, sobre todos os registros, com integridade por `ingredient_id`, `recipe_id`, `source_position`, `source_text` e `review_status`.
2. Gerar relatório reprodutível de categorias, exemplos, duplicações e ambiguidades; evitar que uma categoria mascarada seja considerada automaticamente aprovada.
3. Agrupar **apenas sugestões** de expressões equivalentes; preservar rastreabilidade em cada receita, posição e ingrediente.
4. Separar `pending`, `draft`, `needs_manual_review` e `confirmed` e manter o estado de edição original intocado.
5. Antes de qualquer persistência, exigir correspondência literal entre `source_text` e o nome original, cobertura completa, idempotência, testes de execução simulada e autorização explícita para alterações editoriais.
6. Não liberar medidas não confirmadas para lista de compras, escala de porções, nutrição ou proteção de alergias.

## Resultado e garantias desta etapa
- Leitura SQL concluída, sem `UPDATE`, `INSERT`, `DELETE` ou migrations.
- **Nenhum** texto original, rascunho, receita publicada, compra ou cardápio alterado.
- Próxima entrega concreta: relatório integral gerado pelo parser real em modo dry-run, com testes CI. Não realizar 1.069 decisões manuais.
