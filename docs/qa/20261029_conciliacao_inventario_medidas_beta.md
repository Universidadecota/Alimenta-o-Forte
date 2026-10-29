# Costa&Costa — Conciliação read-only do inventário de medidas

**Data:** 29/10/2026 · **Escopo:** Fase 3I, 119 receitas do piloto pessoal, sem mutação no banco.

## Achado e fonte

Contagens executadas diretamente no Supabase (`public.cc_pilot_ingredient_measure_reviews`, `recipe_ingredients`, `cc_official_recipe_source_records`):

| Indicador | Resultado |
|---|---:|
| Receitas privadas no inventário | 119 |
| Expressões preservadas na fila de revisão | 1.072 |
| Ocorrências em `pending` | 1.068 |
| Ocorrências em `draft` | 3 |
| Ocorrências em `confirmed` | 1 |
| Ingredientes atualmente ligados às receitas privadas do piloto | 1.120 |
| Ingredientes atuais sem correspondência por `ingredient_id` no inventário | 48 |
| Fichas de inventário sem texto ou posição exatos no ingrediente atual | 100 |
| — Texto diferente, posição igual | 22 |
| — Texto igual, posição diferente | 76 |
| — Texto e posição diferentes | 2 |
| Correspondências exatas | 972 |
| Fichas da fila fora das receitas do piloto | 0 |

A documentação anterior mencionava **1.073 expressões**. O número atualmente recuperado é 1.072. Não inferir uma exclusão específica apenas dessa diferença histórica; requer reconciliação com a fonte e o histórico antes de qualquer correção.

## Interpretação conservadora

As diferenças **não provam corrupção**. Amostras mostram que algumas expressões compostas foram desmembradas em ingredientes separados na exibição atual:

- `pimenta. Molho: 4 tomates maduros` passou a aparecer no mesmo ingrediente como `pimenta`, com `4 tomates maduros` em outra posição.
- `1 colher (sopa) de azeite. Maionese: 1 gema` foi separado para facilitar leitura e preparo; a ficha histórica ainda descreve a expressão composta.
- As inserções/desmembramentos deslocaram posições de outros ingredientes que preservaram o mesmo texto.

Não atualizar `source_text`, `source_position`, `recipe_ingredients` ou os documentos de origem apenas para fazer as contagens coincidirem. A revisão deve distinguir uma expressão histórica de um ingrediente editorialmente separado (relações potencialmente 1:N).

## Proteção implementada no frontend do Beta

1. A pré-análise global traz `recipe_ingredients(name,position)` na leitura do mesmo item do inventário.
2. A preparação de rascunhos rápidos exige correspondência **exata** de texto e posição com a receita atual. Dados ausentes falham de forma conservadora.
3. A edição individual bloqueia texto **ou posição** divergente e orienta conciliação editorial.
4. A análise global informa quantas expressões não têm correspondência exata; o total é dinâmico, sem constante histórica 1.073.
5. Nenhuma validação alterou as tabelas, aprovou ingredientes, calculou porções ou publicou receitas. A RPC do servidor já mantinha verificação equivalente de texto e posição e continua inalterada.

## Próxima decisão técnica (não automatizar)

Para as 48 linhas atuais sem ficha e 100 fichas divergentes:

- Comparar cada ocorrência com `cc_official_recipe_source_records.original_ingredients` e o documento original.
- Identificar se é adição editorial legítima, divisão de expressão composta, alteração indevida ou problema de migração.
- Definir fluxo auditável que mantenha a proveniência **1:N**, sem substituir a fonte histórica por um texto editorial.
- Só depois preparar migração/RPC de conciliação com autorização explícita; não remapear IDs, posições ou rascunhos em lote por aproximação.

**Status:** diagnóstico read-only + proteção conservadora da interface. `main` fora do escopo.
