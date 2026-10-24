# Costa&Costa — N2 P1: ampliação conservadora da pré-triagem (19/10/2026)

## Constatação no Supabase real (somente leitura)
- **197 alimentos** cadastrados em `food_items`.
- **34 publicados** na biblioteca dos testadores; **163 preliminares**, não publicados.
- Entre os preliminares já aparecem bacon, chá de camomila, tomate-cereja, sementes de abóbora, kefir, morango, chia, linhaça, manteiga, rúcula e outros insumos das receitas P1.
- A existência do nome na tabela **não aprova valor nutricional**, massa nem a equivalência entre produto/preparo e tabela de referência.
- As 9 receitas P1 possuem 40 ocorrências originais de ingredientes. Não foram alterados textos, receitas, valores ou decisões de publicação.

## Entregas do aplicativo
1. O painel N2 (exclusivo da Administração) agora pesquisa todos os alimentos cadastrados, incluindo os 163 preliminares; o catálogo público dos usuários **não muda**.
2. `src/lib/n2CandidateSuggestions.ts` contém regras estritas com correspondências explícitas e normalização Unicode. São candidatos textuais, nunca inferências de massas, preparo ou nutrientes. Expressões com `ou`, `a gosto`, `opcional`, etc. são bloqueadas.
3. O painel mostra o número de possíveis correspondências **publicadas**, **pré-cadastradas não publicadas** e **sem associação textual segura**, com avisos destacados quando um cadastro não publicado é selecionado.
4. O botão de pré-triagem preenche campos **somente no navegador**, depois de acionado pelo administrador. Não salva no Supabase nem valida nutricionalmente.
5. Ao salvar a triagem ou um vínculo candidato de um ingrediente, os rascunhos dos outros ingredientes permanecem no formulário, evitando trabalho duplicado.
6. Foram ampliadas as regressões `scripts/test-planner-shopping.mjs` para regras textuais, catálogos preliminares, alternativas, espécies de cogumelos, azeite sem tipo e prevenção de inferência de massa/variante.

## Barreiras preservadas
- `cc_recipe_ingredient_food_links.match_status = candidate` continua a ser o único estado inserido pelo painel.
- Para `confirmed`, o trigger exige medidas confirmadas, massa e evidência, variante nutricional verificada e revisor habilitado.
- 58 referências nutricionais de alimentos ainda aguardam revisão especializada. **Nenhum valor da receita pode ser apresentado como aprovado.**
- Não foram inseridos novos `food_items`, publicadas receitas, nem geradas quantidades alimentares fictícias.
- O repositório é público. Este relatório não contém listas completas privadas de receitas/ingredientes nem IDs de usuários.

## Próximo passo N2
Revisar as equivalências de alimento e preparo, aferir massas com evidência e qualificar o cadastro preliminar nutricionalmente. Itens sem espécie/produto certo devem permanecer em revisão manual; não há autorização para republicação automática.
