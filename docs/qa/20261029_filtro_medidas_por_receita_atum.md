# Costa&Costa — Filtro de receitas na revisão de medidas (29/10/2026)

**Branch-base:** `feat/revisao-alergenos-fase1-12out2026`  
**Objetivo:** facilitar a conferência individual das 22 ocorrências das três receitas de atum já revisadas editorialmente.

## Alteração

No componente `src/PilotIngredientMeasureReview.tsx`, o inventário administrativo passou a oferecer **Pesquisar receita pelo título** (ex.: `atum`), além dos filtros existentes de situação e texto original.

- Utiliza a relação `recipes!inner(title)` e o filtro `ilike("recipes.title", ...)`, com paginação e contagem mantidas no backend.
- Ao mudar título, página volta para 1 e o editor de medida aberto é fechado, evitando confusão entre receitas.
- Caracteres curinga `%` e `_` são removidos da entrada, como já ocorria no filtro de texto original.
- A navegação a partir de exemplos da análise global limpa o filtro de título, para não ocultar o ingrediente selecionado.
- Não muda `Analisar todos os ingredientes`: a pré-análise e sua prévia de até 20 candidatos continuam globais. Para focar as 22 ocorrências de atum, utilize a **lista paginada de revisão** abaixo dos painéis editoriais.
- Nenhuma mudança de tabela, RPC, RLS, ingrediente, fonte, porção, lista de compras, nutrição, planejamento ou publicação.

A consulta com relação `!inner` acompanha a documentação oficial: https://supabase.com/docs/guides/database/joins-and-nesting

## Homologação pontual (não repetir outros testes)

1. Confirmar compilação em CI para a branch de trabalho.
2. Após revisão/merge na **branch Beta**, abrir Administração → Receitas oficiais → Medidas das receitas autorais → seção de filtros da lista.
3. Em **Pesquisar receita pelo título**, digitar `atum` e manter situação **Aguardando revisão**.
4. Esperado no estado atual: **22 ocorrências / 3 receitas** (8 + 8 + 6), na página 1. A ordem continua por `recipe_id` e `source_position`.
5. Pesquisar também `gergelim` em **Pesquisar texto original**; verificar interseção com o título e a mesma ocorrência não duplicada.
6. Limpar filtros. Não registrar ou confirmar nenhuma medida somente para testar o filtro.

## Próximo trabalho editorial

Todas as 22 ocorrências ainda estavam `pending` após as correções de preparo. Cinco exemplos com expressão de medida explícita para **pré-análise humana**, sem pré-aprovação:

- Atum com crosta de gergelim: `1 colher (chá) de gergelim`; `1 punhado de rúcula`.
- Carpaccio de abobrinha: `1 colher (sopa) de azeite`; `1 colher (chá) de gergelim`.
- Patê de atum: `1 colher (sopa) de cebolinha`.

Os demais itens incluem valores sem unidade reconhecida, termos sem quantidade, opções e casos que exigem juízo editorial. **Maionese caseira** exige atenção especial à segurança: não confirmar apenas pela quantidade numérica. Para cada proposta, usar os controles de conferência existentes, com justificativa e histórico. `confirmed` editorial não habilita redimensionamento nem homologação clínica/nutricional.

**Status:** implementação do filtro em branch de desenvolvimento; esta nota não documenta homologação visual nem deploy. `main` permanece fora do escopo.
