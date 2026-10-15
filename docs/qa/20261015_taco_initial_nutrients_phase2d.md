# Costa&Costa — Fase 2D: primeira transcrição nutricional da TACO, sob revisão
**Data:** 15/10/2026. **Branch:** `feat/revisao-alergenos-fase1-12out2026`. **PR #16:** aberto, rascunho, sem merge.

## Documento primário
NEPA/UNICAMP, **Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada**, Campinas, 2011. Livro disponível em:
https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf

Valores **por 100 gramas da parte comestível**, extraídos da **Tabela 1**: centesimal (páginas impressas 30 e 32) e minerais/sódio (páginas impressas 31 e 33). Os valores abaixo preservam o arredondamento apresentado na obra e não foram extrapolados.

## Carga aplicada (dados editoriais NÃO aprovados)

Arquivo versionado: `supabase/migrations/20261015210000_cc_taco_nutrition_initial_review_2d.sql`.

Migração remota: `cc_taco_nutrition_initial_review_2d_cloud`. Resultado: **sucesso**, com verificação SQL independente após aplicação.

| Linha TACO | Variante exata | kcal | Proteína g | Lipídios g | Carboidratos g | Fibras g | Sódio mg |
|---:|---|---:|---:|---:|---:|---:|---:|
| 70 | Abobrinha, italiana, cozida | 15 | 1,1 | 0,2 | 3,0 | 1,6 | 1 |
| 71 | Abobrinha, italiana, crua | 19 | 1,1 | 0,1 | 4,3 | 1,4 | **NULL** |
| 72 | Abobrinha, italiana, refogada | 24 | 1,1 | 0,8 | 4,2 | 1,4 | 2 |
| 73 | Abobrinha, paulista, crua | 31 | 0,6 | 0,1 | 7,9 | 2,6 | 1 |
| 77 | Alface, americana, crua | 9 | 0,6 | 0,1 | 1,7 | 1,0 | 7 |
| 78 | Alface, crespa, crua | 11 | 1,3 | 0,2 | 1,7 | 1,8 | 3 |
| 79 | Alface, lisa, crua | 14 | 1,7 | 0,1 | 2,4 | 2,3 | 4 |
| 80 | Alface, roxa, crua | 13 | 0,9 | 0,2 | 2,5 | 2,0 | 7 |
| 109 | Cenoura, cozida | 30 | 0,8 | 0,2 | 6,7 | 2,6 | 8 |
| 110 | Cenoura, crua | 34 | 1,3 | 0,2 | 7,7 | 3,2 | 3 |

### Tratamento das exceções
A fonte registra **`Tr`** (traços) para o sódio da abobrinha italiana crua. O banco registra **`NULL`**, não zero. O motor não deve assumir que valores ausentes são 0. A fonte registra `NA` em outros nutrientes que não pertencem às seis colunas desta carga; não foram importados. Na variante refogada, o alimento da TACO tem um protocolo de preparo próprio (inclui óleo/temperos); não deve ser usado como sinônimo de abobrinha refogada de toda receita sem conciliar o preparo específico.

## Garantias técnicas e escopo
1. A migração verifica, antes de atualizar, **10 variantes com nomes, referências, fonte e estado pendente esperados**, todas com nutrientes `NULL`. Se a pré-condição ou número de linhas diferir, a transação aborta.
2. Dados incluídos exclusivamente na tabela administrativa `cc_food_nutrition_variants`; todas as dez linhas ficam com status `awaiting_specialist` (aguardando responsável técnico), **não verificadas**.
3. **Nenhum** campo público `food_items.nutrition_per_100g` foi alterado. **Nenhuma** receita recebeu cálculo ou vínculo; alertas de alergênicos e bloqueios permanecem vigentes.
4. Fontes são rastreáveis pelo alimento, código de linha, livro/edição e URL. Revisão responsável ainda deve validar transcrição, adequação ao produto real, rendimento e fórmula da receita.
5. Histórico de migrações remotas deve ser conciliado antes de `supabase db push`; não mesclar PR #16 sem homologação.

## Conferência pós-migração — SELECT no Supabase
- 10 variantes totais, 10 com energia preenchida e estado `awaiting_specialist`.
- 1 variante com sódio não quantificado (`NULL`), conforme `Tr` na fonte.
- 0 valores nutricionais publicados em `food_items.nutrition_per_100g`.
- 0 associações em `cc_recipe_ingredient_food_links`.
- 9 receitas ativas, 25 refeições planejadas e 34 alimentos públicos preservados.
- Sessão simulada `authenticated` não-administradora: `cc_is_admin()=false`, **0 variantes visíveis** pela RLS. Essa simulação não substitui teste de tentativa de escrita com uma conta comum real.

## Próximo teste
No navegador atualizado, entrar em **Administração → Receitas oficiais → Base nutricional dos alimentos**, selecionar `Abobrinha` e a variante `italiana cozida`. Verificar se aparecem **15 kcal, 1,1 g proteína, 0,2 g lipídios, 3,0 g carboidratos, 1,6 g fibras, 1 mg sódio** e o status `Aguardando profissional`. Não clicar em salvar ou alterar valores nesse teste. Não repetir compilação: esta etapa alterou apenas dados SQL e documentação, sem TSX/CSS.

**Depois:** validar os casos `Tr`, os estados no editor e o controle de permissões; somente após revisão de especialista considerar publicar valores e desenvolver cálculo para receitas específicas.
