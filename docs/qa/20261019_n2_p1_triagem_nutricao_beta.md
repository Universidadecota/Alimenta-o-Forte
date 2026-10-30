# Costa&Costa — Etapa N2, lote P1: triagem e vínculos candidatos

**Data:** 19/10/2026. **Escopo:** branch `feat/revisao-alergenos-fase1-12out2026`, PR #16 draft.

## Implementação entregue

1. **Fila administrativa N2** `cc_beta_n2_p1_queue()`: limitada a contas administrativas. Traz as nove receitas habilitadas com até cinco ingredientes e seus 40 ingredientes originais, pendências de medida, eventuais vínculos, quantidade e evidências. A fila não altera receitas.
2. **Painel `AdminNutritionN2`**: aparece no início de **Administração**, permite consultar por receita, registrar classificação/observações da triagem e selecionar alimentos/variantes disponíveis. É possível registrar massa em gramas **somente com comprovação descritiva**; campo vazio significa massa não aferida.
3. **`cc_n2_ingredient_review_notes`**: armazena apenas o andamento administrativo (`pending`, `need_mass`, `need_food`, `ambiguous_or_optional`, `candidate_documented`) e as observações. Controle RLS exclusivo do administrador.
4. **Vínculos em `cc_recipe_ingredient_food_links`**: a interface insere ou atualiza **somente `match_status='candidate'`**. A associação e a variante não são convertidas em fatos nutricionais.
5. **Guard de confirmação reforçado**: uma associação só pode passar a `confirmed` quando a medida original está confirmada, a massa real e a evidência são registradas, a variante nutricional está verificada, há justificativa e a conta é de revisor nutricional credenciado e ativo. Os demais requisitos preexistentes de integridade também continuam aplicados.

## Provas verificadas no banco real

- Conta administrativa simulada: 9 receitas / 40 ingredientes retornados.
- Conta comum simulada: RPC N2 negada por ausência de autorização; tabela de notas sem acesso aos registros.
- A função N2 não concede `EXECUTE` ao papel anônimo.
- Transação de teste: uma associação `candidate` e uma nota `need_mass` foram gravadas; tentativa de promovê-la a `confirmed` foi bloqueada porque a medida não estava aprovada; `ROLLBACK` reverteu tudo.
- Verificação pós-teste: **0 vínculos persistentes, 0 notas de triagem persistentes** no momento da auditoria.
- 114 receitas permanecem no catálogo beta, **0 fichas de receitas nutricionalmente aprovadas**.

## Como usar no beta

1. Entre com conta administradora, abra **Administração** e procure **Nutrição das receitas — Etapa N2** (primeira seção).
2. Escolha uma das nove receitas priorizadas.
3. Para cada ingrediente, escolha e justifique a classificação da pendência (`Salvar triagem`).
4. Se houver correspondência candidata inequívoca, selecione o alimento e, quando aplicável, a variante do preparo. Anote explicitamente dúvidas e diferenças.
5. Não preencha massa em gramas sem pesagem ou outra evidência adequada; registre-a com descrição verificável.
6. Use **Salvar vínculo como candidato**; esta ação **não aprova** o vínculo nem libera números nutricionais.
7. Revisores competentes deverão aferir o rendimento e validar variantes, massas e fonte. Só então a trilha de confirmação e cálculo poderá avançar.

## Bloqueios que permanecem (não resolvidos por interface)

- Ingredientes em xícaras, fatias, pitadas ou unidades sem massa/peso aferidos.
- Ingredientes que ainda não existem na biblioteca (não inventar equivalências com itens semelhantes).
- Alternativas explícitas (`ou`), itens opcionais e preparos que exigem escolha do ingrediente realmente usado.
- 58 variantes alimentares ainda aguardam revisão especializada; **nenhuma** está `verified`.
- Sem revisor nutricional credenciado e ativo, o banco bloqueia confirmação de vínculos e publicação dos nutrientes.
- Nenhum cálculo publicado de receitas será gerado a partir de dados pendentes.

## Próximo ciclo

- Preencher de maneira supervisionada os 40 registros P1, priorizando evidências de massa real, variedade e rendimento. Separar alimentos ausentes da biblioteca para ampliação **com fonte**.
- Revisar a correção do painel no navegador (desktop e móvel) após o deploy; build verde não substitui a inspeção visual.
- Iniciar a homologação do cálculo somente quando houver receitas com vínculos verificados, sem modificar os textos originais.

**Garantias:** Nenhuma receita original, registro nutricional ou aprovação editorial foi alterado nesta etapa. A `main` não foi alterada. Não divulgar textos do catálogo em repositórios públicos.
