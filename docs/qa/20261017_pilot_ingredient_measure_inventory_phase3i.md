# Costa&Costa — Fase 3I: Inventário editorial das medidas

**Data:** 17/10/2026. **Branch:** `feat/revisao-alergenos-fase1-12out2026`. **PR #16:** draft, sem merge.

## Objetivo e regras de proteção

Prosseguir com a estruturação das quantidades de ingredientes das **119 receitas autorais** durante o piloto pessoal de três meses, sem modificar o conteúdo original, sem reimportar PDFs e sem presumir equivalências ou segurança de alergias.

O inventário é **administrativo, não clínico**. Os pareceres editoriais são separados dos dados de compras, nutrição e redimensionamento de porções. Nenhum rascunho gera efeitos nesses módulos.

## Auditoria da origem (SQL somente leitura)

- **1.073** linhas originais em `public.recipe_ingredients`, vinculadas às 119 receitas do `personal_pilot`.
- As **1.073** tinham `quantity=NULL`, `measure_mode='unspecified'` e descrição literal em `name` — a ausência do número separado **não significa** que a quantidade não foi informada pelo autor.
- **747** dessas descrições começam com algarismo ou fração segundo o reconhecimento de prefixos utilizado na auditoria; isso não equivale a 747 medidas completamente reconhecidas ou aptas a ajustar porções.
- Há expressões numéricas e palavras com dependência do preparo (`1 lata de sardinha em água ou azeite`, `suco de ½ limão`, `por porção`, molhos e subtítulos); não transformar automaticamente em quantidade consolidável.

## Banco: migração aplicada com sucesso

`supabase/migrations/20261017180000_cc_pilot_measure_review_phase3i.sql`, aplicada remotamente como `cc_pilot_measure_review_phase3i_cloud`.

Criada tabela `public.cc_pilot_ingredient_measure_reviews` com:

- `ingredient_id` (chave e FK), `recipe_id`, `source_text` (cópia de referência do texto original), `source_position`;
- `proposed_quantity`, `proposed_unit`, `proposed_ingredient` inicialmente **NULL**;
- `review_status`: `pending`, `draft`, `needs_manual_review`, `confirmed` com os campos de confirmação condicionados por CHECK;
- notas editoriais, autor, data e carimbo de atualização.

**Não houve UPDATE em `recipes`, `recipe_ingredients`, `planned_meals` nem Storage**. O seed faz `INSERT ... ON CONFLICT DO NOTHING`, preservando revisões anteriores na reexecução.

**Validações realizadas:**

| Auditoria | Resultado |
|---|---:|
| Registros originais em `recipe_ingredients` | 1.073 |
| Registros no inventário | 1.073 |
| Estado `pending` | 1.073 |
| Propostas numéricas registradas | 0 |
| Divergências `source_text` vs. `name` | 0 |
| Leitura como administrador autenticado (simulada) | 1.073 |
| Leitura com identidade autenticada não administradora (simulada) | 0 |

As verificações de papéis foram feitas com `SET LOCAL ROLE authenticated` e identidade de sessão simulada dentro de transações revertidas (`ROLLBACK`), sem criar usuário nem persistir modificações.

## Interface administrativa preparada, ainda sem build Windows

- `src/PilotIngredientMeasureReview.tsx`: painel **Medidas das receitas autorais · inventário e revisão** em Administração → catálogo, paginado em **25 registros por vez com paginação no Supabase**, filtro por situação, pesquisa textual e nome da receita vinculada.
- Sugestão **temporária apenas na interface** derivada de `parsePilotMeasure` para expressões conservadoras como `150 g de fraldinha`, `1 colher (sopa) de azeite` ou `2 ovos`. A sugestão **não grava automaticamente**.
- Revisão de um item inclui número, unidade, ingrediente e observação. A ação **Salvar como rascunho** registra `review_status='draft'`, sem aprovação ou redimensionamento; **Exige revisão manual** mantém quantidade/unidade nulas.
- Antes do registro, o componente confere que o texto `source_text` continua igual ao `recipe_ingredients.name`; divergências bloqueiam edição.
- O estado `confirmed` é reservado para fluxo de confirmação editorial futura, **não há botão de confirmação automática nesta fase**. Sem integração do rascunho com cálculos de porções, nutrição ou o mecanismo de compras.
- `src/AdminRecipes.tsx` integra o painel e atualiza a pré-visualização como **receita autoral**; `src/RecipeDetails.tsx` corrige a frase sobre compras: já existe soma parcial e conservadora, embora não exista redimensionamento automático completo.
- `src/styles.css` inclui apresentação responsiva da fila e do editor.

## Critérios de próxima homologação

**Ainda não executar nova importação dos 1.073 ingredientes nem publicar dados.** O banco já contém o inventário.

1. Executar **`git pull --ff-only` e `npm run build`** uma vez no Windows. O código ainda não foi homologado no frontend.
2. No `localhost:5173`, Administração → Receitas oficiais → **Medidas das receitas autorais · inventário e revisão**: confirmar a lista de registros, texto completo, pesquisa `fraldinha` e proposta visual da unidade `g` para `150 g de fraldinha`.
3. **Não é necessário salvar nenhum rascunho** neste teste de apresentação, nem editar as receitas ou fotografias; a execução do teste de gravação ficará para etapa separada após verificar a UI.
4. Para receitas sem leitura segura, o sistema deve mostrar **Sem extração inequívoca** sem inventar unidade/quantidade.
5. Preservar PR #16 aberto em draft, sem merge; não repetir testes de fotografia, zoom, ceias, soma de azeite, direitos médicos ou dados nutricionais já homologados.

## Etapas futuras e limites explícitos

- Gradualmente estruturar ingredientes com títulos compostos, alternativas, frações contáveis, unidades por embalagem, marca/preparo e quantidades dependentes de porção, com revisão editorial.
- Após revisão consistente, criar regras auditadas de escalonamento e compras, sem trocar as fontes. A confirmação de medida culinária **não** é verificação de dados nutricionais ou segurança para alergênicos.
- Revisar textos de marketing e termos antes da venda; fase de piloto pessoal permanece privada.


## Proteção imutável da fonte — Fase 3I.1

Migração adicional aplicada: `supabase/migrations/20261017181000_cc_pilot_measure_source_guard_phase3i1.sql` como `cc_pilot_measure_source_guard_phase3i1_cloud`. Um trigger administrativo em `cc_pilot_ingredient_measure_reviews`:

- Impede alterar `ingredient_id`, `recipe_id`, `source_text` ou `source_position` após a inclusão no inventário.
- Antes de salvar qualquer revisão, confere novamente se o `source_text` ainda é idêntico ao `recipe_ingredients.name`; se houve divergência no original, bloqueia a edição para reconciliação.
- Atualiza o horário de edição no banco; não permite que alterações de frontend contornem o snapshot protegido.
- Foi exercitado em SQL transacional com papel `authenticated` e identidade de administrador simulado: alteração de `review_notes` foi aceita dentro da transação; tentativa de mudar o texto fonte produziu a exceção esperada; **`ROLLBACK` final**, sem alteração persistida.

As 1.073 propostas permanecem `pending` até decisão editorial. A migração não confirmou medidas, não reescreveu a receita, não liberou escala de porções e não mexeu nas marcações de compras.

**Status desta etapa:** migrações aplicadas, integridade e proteção de acesso verificadas. A compilação de `src/PilotIngredientMeasureReview.tsx` no Windows e a validação da interface ainda estão **pendentes**.
