# Costa&Costa — Fase 3P: propostas de preparo mais seguro para três molhos (30/10/2026)

## Status
**Propostas editoriais preliminares. Não homologadas.** Os registros do Supabase permanecem `published=false`. Esta fase não edita `recipes.instructions`, `recipe_ingredients`, fontes oficiais, medidas, tabelas nutricionais, alergênicos nem lista de compras.

## Evidências das instruções atuais (fonte de dados interna)
Consultadas em 30/10/2026 em `public.recipes.instructions` e `public.cc_official_recipe_source_records`:

| Receita | ID | Referência da fonte | Motivo da revisão |
|---|---|---|---|
| Bolinhos de salmão com maionese caseira e salada de pepino | `bc72828c-22ad-4201-9672-86e754eabe9c` | `e18d1b485ac6c29971c98ca02f1f53d4` | Gema batida com limão e óleo, sem cozimento; prazo de armazenamento de 2 dias sem validação específica |
| Caesar sem queijo, com frango | `ccea2f76-a9b0-477a-a5b7-2e4594d2cac7` | `6538873f59c212a1ac6f7b8e080965f1` | Molho com gema sem cozimento; tempo fixo de grelha não garante segurança do frango |
| Salada de ovos em canoas de endívia | `fd9d66ab-d656-4bac-8ac6-2607ffad8cc4` | `f3babecdf97e8f272d3110824817556d` | Fonte fala explicitamente de maionese com ovo cru; não indica gema pasteurizada; propõe 2 dias de armazenamento |

**Fonte oficial imutável:** a proposta não altera a transcrição nem o hash registrados em `cc_official_recipe_source_records`. O trabalho é uma alternativa escrita para conferência.

## Princípios da proposta
1. Para molho/maionese sem cocção, usar **gema pasteurizada apropriada para consumo sem cozimento**, conforme rotulagem. Na indisponibilidade, **não** preparar com ovo cru comum. Pasteurizar ovo em casa, refrigerar ou acrescentar limão não são substitutos comprovados da pasteurização do ingrediente.
2. Preservar os dois usos de **suco de ½ limão** onde a receita separa prato principal e molho. Não converter em ml/gramas ou assumir rendimentos.
3. Corrigir a orientação de conservação: não repetir automaticamente o prazo de **2 dias** da fonte sem validação da receita, do produto pasteurizado e do processo de preparação.
4. Manter revisão de **alergênicos** pendente. Exemplos a conferir: ovo, peixe/anchovas, gergelim; sem afirmar completude ou segurança para alérgicos.
5. Não considerar tempo fixo de frigideira como prova de cocção. A alternativa Caesar sugere termômetro e referência de **74 °C para aves**.
6. Não substituir automaticamente por maionese industrializada nem alterar ingredientes, receitas ou porções sem aprovação editorial específica.

## Implementação
- `src/lib/pilotSauceSafetyProposals.ts` contém as três propostas integrais e checklists, sem serviços ou funções de gravação.
- O painel administrativo **Examinar fonte** mostra `Preparo registrado atualmente — preservado` ao lado de `Preparo alternativo proposto — ainda não aplicado`.
- O acesso à prévia requer correspondência exata: **ID da receita + hash oficial + estágio personal_pilot + receita não publicada + texto de preparo atual igual ao snapshot auditado**. Qualquer alteração posterior oculta a sugestão.
- A consulta à receita é sob demanda apenas para os três IDs desta fase; a fonte e a lista histórica são lidas pelos mecanismos administrativos já protegidos.
- Não há botão de aprovação, gravação ou publicação para essas propostas.
- `npm run build` executa primeiro `npm run test:sauce-safety`, garantindo regressões automáticas na Vercel.

## Referências externas de segurança
**Orientações externas, não presentes nas receitas originais:**
- Anvisa, [boas práticas de alimentos e advertência sobre maionese com ovo cru](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2020/anvisa-participa-de-evento-sobre-seguranca-de-alimentos/).
- FDA, [What You Need to Know About Egg Safety](https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety) — uso de ovos/ovoprodutos pasteurizados em molhos Caesar e preparos sem cocção.
- FDA, [Dairy and Eggs — Safe Eats](https://www.fda.gov/food/people-risk-foodborne-illness/dairy-and-eggs-food-safety-moms-be) — risco de gema crua, manuseio e refrigeração.
- FoodSafety.gov, [People at Risk of Food Poisoning](https://www.foodsafety.gov/people-at-risk) — opção pasteurizada e boas práticas de carnes e aves.

## Pendências antes de publicar as três receitas
1. Revisão culinária da substituição e da textura final do molho, ingredientes e medidas efetivas.
2. Revisão de segurança dos ingredientes, conservação, temperaturas e prazo de consumo por profissional habilitado quando necessário.
3. Revisão dos alergênicos e condições de preparo; conferir combinações e contato cruzado.
4. Validação de porções, possíveis sobras do molho, lista de compras e informações nutricionais.
5. Decisão editorial registrada, com alteração do conteúdo somente depois de aprovação específica, preservando o documento de origem e histórico.
