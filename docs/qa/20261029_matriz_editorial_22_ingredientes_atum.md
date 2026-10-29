# Costa&Costa — Matriz editorial das 22 expressões de atum

**Data:** 29/10/2026 · **Escopo:** piloto privado, três receitas de atum, somente leitura e preparação editorial.

## Estado confirmado no Supabase

- **22 ocorrências**: 8 + 8 + 6; todas em `pending`, com `recipe_ingredients.name = source_text`.
- As três receitas estão com `published=false` e `use_stage=personal_pilot`.
- O texto de origem é imutável nesta revisão. Este documento **não aprova medidas, não salva rascunhos e não libera redimensionamento, lista de compras, calorias ou recomendações clínicas**.
- A matriz abaixo classifica **prioridade editorial**, não necessariamente o grupo calculado pelo parser; uma fração reconhecível pode ainda exigir decisão humana para padronização comercial.

## Critério editorial

- **Rascunho possível:** quantidade e unidade aparecem expressamente e são compatíveis com a taxonomia atual. Ainda exige seleção explícita e conferência da receita antes de qualquer rascunho; rascunho não é aprovação.
- **Manual:** produto com alternativa, porção sem padrão, unidade não homologada, ingrediente sem quantidade ou preparação que exige cuidados específicos. Não inventar conversões nem preencher lacunas por estimativa.

### Atum com crosta de gergelim e salada de rúcula (8 expressões)

| Nº | Ingrediente original | Encaminhamento | Justificativa / leitura preliminar |
|---:|---|---|---|
| 1 | 1 posta de atum (150 g) | Manual | Posta e massa aparecem juntas; não presumir equivalência entre unidade e gramas. |
| 2 | 1 colher (chá) de gergelim | Rascunho possível | 1 · colher_cha · gergelim. |
| 3 | 1 punhado de rúcula | Rascunho possível | 1 · punhado · rúcula; não converter para gramas. |
| 4 | ½ tomate | Manual | Fração de tomate legível, mas padronização de unidade e compras ainda não homologada. |
| 5 | 4 azeitonas | Manual | Contagem de azeitonas sem unidade estruturada no texto. |
| 6 | azeite | Manual | Quantidade de azeite ausente. |
| 7 | limão | Manual | Quantidade de limão ausente. |
| 8 | sal. | Manual | Quantidade de sal ausente. |

### Carpaccio de abobrinha com atum (8 expressões)

| Nº | Ingrediente original | Encaminhamento | Justificativa / leitura preliminar |
|---:|---|---|---|
| 1 | 1 abobrinha pequena | Manual | Tamanho 'pequena' sem massa ou unidade de compra padronizada. |
| 2 | 1 lata de atum em água ou azeite (cerca de 80 g) | Manual | Alternativa 'água ou azeite' e massa aproximada; revisar produto escolhido. |
| 3 | suco de ½ limão | Manual | Suco extraído de meio limão; não presumir volume em ml. |
| 4 | 1 colher (sopa) de azeite | Rascunho possível | 1 · colher_sopa · azeite. |
| 5 | 1 colher (chá) de gergelim | Rascunho possível | 1 · colher_cha · gergelim. |
| 6 | cebolinha | Manual | Quantidade de cebolinha ausente. |
| 7 | pimenta | Manual | Quantidade de pimenta ausente. |
| 8 | sal. | Manual | Quantidade de sal ausente. |

### Talos de aipo recheados com patê de atum (6 expressões)

| Nº | Ingrediente original | Encaminhamento | Justificativa / leitura preliminar |
|---:|---|---|---|
| 1 | 1 lata de atum em água ou azeite (cerca de 80 g) | Manual | Alternativa 'água ou azeite' e massa aproximada; revisar produto escolhido. |
| 2 | 1 colher (sopa) de maionese caseira | Manual prioritária — segurança | Maionese caseira: verificar formulação/ovos pasteurizados; não tratar só pela quantidade. |
| 3 | suco de ½ limão | Manual | Suco extraído de meio limão; não presumir volume em ml. |
| 4 | 1 colher (sopa) de cebolinha | Rascunho possível | 1 · colher_sopa · cebolinha. |
| 5 | pimenta | Manual | Quantidade de pimenta ausente. |
| 6 | 3 talos de aipo. | Manual | Unidade 'talo' não está homologada na taxonomia estruturada. |

## Primeira seleção recomendada: cinco propostas para revisão humana

1. Atum com crosta de gergelim: `1 colher (chá) de gergelim` → `1 colher_cha` de `gergelim`.
2. Atum com crosta de gergelim: `1 punhado de rúcula` → `1 punhado` de `rúcula`.
3. Carpaccio: `1 colher (sopa) de azeite` → `1 colher_sopa` de `azeite`.
4. Carpaccio: `1 colher (chá) de gergelim` → `1 colher_cha` de `gergelim`.
5. Talos de aipo: `1 colher (sopa) de cebolinha` → `1 colher_sopa` de `cebolinha`.

Nenhuma destas cinco propostas foi gravada por esta etapa. O fluxo do Beta exige checkbox individual, confirmação de rascunho e, posteriormente, confirmação editorial com justificativa e histórico próprios.

## Atenção especial à maionese caseira

A expressão `1 colher (sopa) de maionese caseira` informa a quantidade, mas **não descreve o método de preparo nem comprova uso de ovos pasteurizados**. Deve permanecer fora das propostas rápidas e seguir para conferência individual de segurança e origem. A receita exibida já orienta utilizar ovos pasteurizados; a lista de ingredientes original continua preservada.

Fontes oficiais para contextualizar o cuidado, sem substituir análise técnica do produto:

- [Anvisa — segurança de alimentos e prevenção de preparações com ovos crus](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2020/anvisa-participa-de-evento-sobre-seguranca-de-alimentos/).
- [FDA — uso de ovos pasteurizados em preparações como maionese](https://www.fda.gov/food/retail-food-industryregulatory-assistance-training/assuring-safety-eggs-and-menu-and-deli-items-made-raw-shell-eggs).

## Regras de continuidade

1. Preservar fontes, textos e ingredientes originais.
2. Não publicar as três receitas ou preencher informação nutricional sem homologação específica.
3. Não converter `punhado`, `talo`, `posta`, `lata` ou frações em gramas/ml automaticamente.
4. Não confirmar uma proposta apenas por ser classificada como simples pelo parser.
5. Respeitar rascunhos, confirmações e histórico preexistentes de outras receitas; este lote não os altera.
6. Manter a `main` fora das alterações do Beta.
