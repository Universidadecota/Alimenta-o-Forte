# Costa&Costa — Medidas culinárias e qualidade de ingredientes
**Data:** 15/10/2026. **Branch:** `feat/revisao-alergenos-fase1-12out2026`. **PR #16:** sem merge.

## Escopo aprovado
Adicionar **colher de sopa** ao cadastro de ingredientes, corrigir inconsistências de alimentos marcados *a gosto* e *opcional*, e preservar o somatório confiável da lista de compras. Sem conversões automáticas de colher para gramas, sem inventar quantidades e sem iniciar vendas de produtos.

## Implementação
- `src/lib/ingredientMeasures.ts`: unidades `g`, `kg`, `ml`, `l`, `un`, `cm`, `lata`, `colher_cha`, **`colher_sopa`**, `fatia` e `pitada`; rótulos com singular/plural e números em pt-BR.
- `src/IngredientEditor.tsx`: editor compartilhado por receitas pessoais e oficiais. Cada ingrediente pode ter medida numérica, indicação *a gosto* ou *quantidade não informada*; flag opcional independente. O formulário só pede quantidade numérica para medidas numéricas.
- `src/PersonalRecipeForm.tsx` e `src/AdminRecipes.tsx`: usam o editor, enviando `measure_mode` e `is_optional` com `quantity:null` quando não se conhece o valor. Modo da receita e categoria não são alterados.
- `src/lib/planner.ts`: lê `measure_mode`/`is_optional` e preserva valores nulos.
- `src/RecipeDetails.tsx`: exibe valores formatados ou *a gosto*/*quantidade não informada*, incluindo indicação opcional.
- `src/lib/shopping.ts`: **só soma ingredientes obrigatórios com quantidade definida**, conservando as conversões já existentes de massa e volume. Não converte colher de sopa ou centímetros em outras unidades sem fator validado. Os opcionais e ingredientes sem medida vão para `shoppingNotes`.
- `src/App.tsx`: exibe separadamente **A gosto e opcionais**, sem caixas de compra e sem quantidades numéricas inventadas; inclui observações na cópia de texto. Itens obrigatórios, soma semanal e marcações já existentes são preservados.
- `src/styles.css`: editor e observações responsivos.

## Migração remota
`supabase/migrations/20261015030000_cc_ingredient_measure_quality.sql`, aplicada como `cc_ingredient_measure_quality_cloud` no Supabase principal. Adiciona `recipe_ingredients.measure_mode` (padrão `measured`) e `is_optional` (padrão false), permite quantidade NULL **apenas** para `taste` ou `unspecified`, adiciona `cm`/`colher_sopa` às constraints de ingredientes e marcações de compra, e atualiza validações das RPCs `save_personal_recipe` e `cc_save_official_recipe`. Direitos existentes foram preservados: receita oficial exige administrador; ambas não são executáveis por anônimo.

### Correção mínima de receita demonstrativa
Somente em `Chá Cremoso De  Cúrcuma`:
- Gengibre: descrição de origem **2 cm** → ingrediente identificado como **Gengibre fresco, cortado em pedaços menores**, quantidade 2 `cm` por porção de referência.
- Adoçante: descrição *a gosto* → `measure_mode=taste`, quantidade NULL. Nunca gerar `2 un`.
- Manteiga: descrição *opcional, um pedacinho* sem medida verificada → `is_optional=true`, `measure_mode=unspecified`, quantidade NULL. Não atribuir peso ou volume arbitrário.
- **Não** foram corrigidas por aproximação as demais medidas, como `1 lata` por porção de referência e `1 pitada`. A receita permanece identificada como demonstrativa em revisão.

## Validações concluídas
- Consulta read-only: 9 receitas e 30 ingredientes existentes, 25 refeições planejadas e 1 marcação de compra preservadas; dois ingredientes da receita demonstrativa têm `quantity=NULL` com o modo correspondente.
- Teste transacional de criação de receita pessoal com 2 `colher_sopa`, ingrediente *a gosto*, opcional sem quantidade e item em `ml`: **PASS**.
- Teste de rejeição de ingrediente numérico sem quantidade: **PASS**.
- Teste de permissão: usuário não administrador impedido de publicar/salvar receita oficial por RPC: **PASS**.
- Todos os testes com dados fictícios usaram `BEGIN ... ROLLBACK`; 0 receitas QA permaneceram.
- Vercel confirmou compilação na branch. **Pendente:** `npm run build` no Windows e testes de interface com as receitas reais.

## Homologação solicitada ao proprietário
1. `git pull --ff-only`; `npm run build`; atualizar localhost com `Ctrl + Shift + R`.
2. Na aba **Receitas**, abrir `Chá Cremoso De Cúrcuma` e confirmar **Gengibre 2 cm**, adoçante **a gosto**, manteiga **quantidade não informada · opcional**, sem erro de renderização.
3. Na aba **Compras** da semana 12–18/10, confirmar **Gengibre 4 cm** para o chá planejado em 2 porções. **Adoçante** e **Manteiga** devem aparecer em **A gosto e opcionais**, **não** como 2 unidades.
4. Conferir que o almoço continua com **Alface 450 g, Arroz 720 g, Feijão 900 g, Frango 1350 g** e a marcação de Alface não foi perdida.
5. Em **Nova receita pessoal**, adicionar ingrediente e conferir que **colher de sopa** aparece na lista de unidades. É possível verificar o seletor sem salvar uma nova receita.

## Pendências editoriais, separadas de bugs de software
- `Iogurte Turbo`: fonte demonstra **4 colheres de chá** de iogurte por porção. É necessário confirmar a referência original antes de substituir por colheres de sopa; nenhuma troca foi feita.
- `Chá Cremoso De Cúrcuma`: quantidade por porção de referência de **leite de coco em lata** e os demais ingredientes exigem revisão editorial/nutricional, inclusive riscos de alergia e contaminação cruzada.
- Dados de receitas são de demonstração, não afirmações nutricionais validadas. Não declarar adequação para alergias, emagrecimento ou tratamentos.

**Proteções operacionais:** não executar `supabase db push` nem merge do PR #16 até reconciliar históricos de migrações Cloud/local e concluir homologação da Fase 1.


## Homologação visual concluída — 15/10/2026

**Evidências fornecidas:** três capturas do aplicativo no Chrome localhost:5173 mostrando o Cardápio, Compras e o seletor de unidades em Nova Receita. Build local anterior da revisão `e90ea4d` concluído com sucesso em Windows (`tsc -b && vite build`, 1.639 módulos).

**Resultados confirmados visualmente:**
- Planejamento de terça-feira 13/10/2026 mantém **Chá Cremoso De Cúrcuma — Lanche da tarde opcional, 2 porções** e **[Exemplo] Frango com arroz, feijão e salada — Almoço, 3 porções**.
- Compras da semana 12–18/10: **gengibre fresco 4 cm**, **cúrcuma 2 colheres de chá**, **canela 2 pitadas**, **pimenta-caiena 2 pitadas**, leite de coco integral **2 latas** conforme receita demonstrativa cadastrada.
- Somatório de ingredientes principais permanece **Alface 450 g** (checkbox comprado continua marcado), **Arroz 720 g**, **Feijão 900 g**, **Peito de frango 1.350 g**.
- Bloco **A gosto e opcionais** mostra **Adoçante (ex.: estévia) — a gosto** e **Manteiga — quantidade não informada · opcional**; sem quantidades fictícias.
- No editor de nova receita, a lista nativa de unidades inclui **colher de chá** e **colher de sopa**, além de gramas, quilos, mL, litro, unidade, centímetro, lata, fatia e pitada.

**Decisão:** teste visual de medidas e separação da lista de compras **APROVADO**. Não houve novo cadastro de receita pessoal nesta verificação: comportamento de salvamento já foi testado anteriormente por SQL transacional; teste completo de gravação no formulário segue para a regressão final. Layout responsivo em dispositivo móvel permanece pendente.

**Ressalva editorial, não correção automática:** `2 latas` de leite de coco para 2 porções pode não representar uma quantidade adequada para a receita. A origem, o volume por lata e o rendimento devem ser verificados e aprovados antes da publicação; nenhuma proporção foi inventada. Não declarar esta receita como nutricionalmente validada.

**Próximo eixo de produto:** Biblioteca de Alimentos Brasileiros, conforme Fase 1 do Prompt Mestre, começando por modelo de dados e interface de leitura sem substituir diretamente ingredientes ou unidades de receitas existentes. PR #16 permanece sem merge.
