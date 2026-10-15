# Costa&Costa — Fase 2C: variantes de alimentos, preparo e fonte
**Data:** 15/10/2026. **Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** aberto em rascunho; não mesclar/deploy sem homologação.

## Motivação
O catálogo `food_items` contém nomes genéricos como `Abobrinha`, `Alface` e `Cenoura`. A TACO (NEPA/UNICAMP, 4ª ed. 2011) distingue composição por variedade/estado (italiana crua, italiana cozida, paulista crua; alface crespa/lisa/americana/roxa; cenoura crua/cozida). Um rascunho nutricional único por alimento não permitia representar essas linhas separadas, e um vínculo apenas com `food_items` não determina qual composição usar.

**Fonte primária consultada:** https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf · Tabela 1, páginas impressas 30 (linhas 70–73 e 77–80) e 32 (linhas 109–110).

## Migração executada
Arquivo: `supabase/migrations/20261015200000_cc_food_nutrition_variants_phase2c.sql` · aplicada como `cc_food_nutrition_variants_phase2c_cloud` **com sucesso** no projeto principal.

- Criada `cc_food_nutrition_variants`, com múltiplos registros por alimento: descrição exata, estado/preparo, fonte, código/página, URL, 6 nutrientes opcionais por 100 g, notas, status editorial, autoria/data; identificador único de cada variante.
- **RLS**: SELECT/INSERT/UPDATE apenas para administrador autenticado via `cc_is_admin()`; anônimo sem privilégios de leitura; sem policy de DELETE; funções de gatilho sem EXECUTE de cliente.
- `cc_recipe_ingredient_food_links` recebeu `nutrition_variant_id` nullable e FK composta para impedir conectar uma variante de outro `food_item_id`; o estado `confirmed` exige variante exata, além da justificativa preexistente.
- Alterações relevantes de receita removem a confirmação/variante e a massa correspondente; alterações do cadastro da variante rebaixam vínculos confirmados a candidatos. Essas regras exigem homologação posterior com gravações controladas.
- A tabela anterior `cc_food_nutrition_drafts` foi mantida sem dados e não é mais a entrada principal da interface. Nenhuma receita ou planejamento foi alterado.
- Metadados **sem nutrientes** registrados em **10 variantes**: 4 de Abobrinha, 4 de Alface, 2 de Cenoura. Todas com status `needs_source`; a referência identifica a linha, mas **não** representa valor nutricional transcrito/revisado.

## Código alterado
- `src/FoodNutritionAdmin.tsx`: em Administração > Receitas oficiais > Base nutricional, seleciona alimento e **variante** (lista ou nova), estado/preparo, código exato e fonte, valores por 100 g (vazios até comprovação), observações e andamento; grava apenas na tabela de variantes. A seleção não configura aprovação.
- `src/RecipeIngredientFoodLinks.tsx`: em ficha técnica, após selecionar um alimento, exige selecionar uma variante daquela família para confirmar; mostra ausência de variantes quando aplicável. Nunca sugere um vínculo pelo nome.
- `src/lib/recipeNutrition.ts`: contrato matemático foi endurecido para exigir que `link.variantId` corresponda a `food.variantId`, além dos demais requisitos anteriores de fonte, revisão, massa e rendimento. **Motor ainda não conectado ao consumidor**.
- Sem alteração na navegação pública, cardápio, lista de compras, receitas ou classificação de alergênicos.

## Verificação independente após a migração
| Indicador | Resultado |
|---|---:|
| Variantes catalogadas | 10 |
| Variantes com nutrientes | 0 |
| Vínculos de ingredientes | 0 |
| Alimentos totais | 49 |
| Alimentos publicados | 34 |
| Receitas ativas | 9 |
| Refeições planejadas | 25 |
| Sessão autenticada simulada sem privilégio master | 0 linhas visíveis nas variantes e nos vínculos |
| Privilégio `anon` de SELECT na nova tabela | negado; RLS ativa |

A simulação de usuário não administrador foi feita em SQL com transação `ROLLBACK`. Testes de escrita com sessões reais de usuário comum e admin ainda faltam.

## Próximos testes (pendentes)
1. `git pull --ff-only` seguido de `npm run build` no PowerShell da branch atual. **Ainda não compilado no Windows após esta alteração.**
2. Administração > Receitas oficiais > Base nutricional: selecionar **Abobrinha** e confirmar **4 variantes**, com nomes italiana crua/cozida/refogada e paulista crua; nutrientes devem estar vazios. Selecionar **Alface** (4) e **Cenoura** (2), sem alterar valores.
3. Administração > Iogurte Turbo > Ficha técnica > Ingredientes e Biblioteca: os vínculos permanecem 0/8, sem variante de iogurte selecionada por suposição. Selecionar um alimento que possua variantes apenas para confirmar que o menu correto aparece; **não salvar uma associação incorreta**.
4. Conferir layout 390 px e desktop. Testar gravação/recuperação somente de metadados reais com fonte/documentação identificada; não cadastrar macros inventados.
5. Testes backend de integridade (FK cruzada, alteração de variante invalidando confirmação, edição de ingrediente, RLS não-admin com tentativas de escrita) antes de liberar cálculo ou mesclar o PR.
6. Trabalhar importação nutricional controlada somente depois de checar alimento, unidade, estado, código da TACO e interpretação de valores especiais como `Tr` e `NA`. Não usar `0` em campos ausentes.

**Limite do escopo:** nenhum nutriente verificado, nenhuma promessa de ausência de alergênicos, nenhum tratamento médico, nenhum merge. Histórico de migrações local/remoto requer reconciliação antes de `supabase db push`.
