# Costa&Costa — Auditoria de redução de tabelas do Supabase

**Data:** 02/11/2026  
**Projeto:** Alimentação Forte, produção Supabase `gclhailalyrokvmkwllm`  
**Método:** inspeção somente leitura de catálogo PostgreSQL, dados agregados, relações, funções, gatilhos, RLS e código identificado no GitHub.  
**Alterações executadas:** **nenhuma exclusão de tabela**. Não existe até este momento candidato comprovadamente sem uso e com restauração garantida.

## Síntese executiva

- **37 tabelas públicas**, com **11 sem registros** e **26 contendo registros**.
- Todas com RLS ligada; acesso anônimo testado anteriormente retornou zero perfis, preferências, cardápios e listas pessoais, e acesso autorizado a receitas publicadas.
- Armazenamento total das tabelas públicas com seus índices: **2.949.120 bytes (aprox. 2,81 MiB)**, portanto a redução de tabelas não é, por si só, justificativa de performance/custo.
- `cc_beta_members` e `cc_beta_recipe_access` continuam referenciadas por funções de administração e revisão; `cc_pilot_ingredient_measure_reviews` por funções de medidas e vínculo de ingredientes.
- `cc_pilot_food_registry` tem **172 linhas**, sem dependências SQL de entrada observadas; porém ausência de FKs ou referências em funções não comprova ausência de uso no frontend ou em rotinas externas.
- Tabelas de assinatura vazias representam funcionalidades planejadas, portanto exigir decisão de arquitetura antes da remoção.

## Inventário completo (37)

Colunas `FK entra`, `FK sai`, `funções` e `gatilhos` representam objetos contados no catálogo, e **não equivalem a uma prova de que a tabela seja usada ou não**. `Linhas` reflete o inventário do Supabase consultado, que deve ser rechecado imediatamente antes de qualquer DDL.

### Operação atual — preservar (13)

| Tabela | Linhas | FK entra | FK sai | Funções SQL | Gatilhos |
|---|---:|---:|---:|---:|---:|
| `public.profiles` | 0 | 0 | 1 | 0 | 0 |
| `public.user_preferences` | 4 | 0 | 1 | 3 | 0 |
| `public.recipes` | 128 | 12 | 1 | 28 | 3 |
| `public.recipe_ingredients` | 1157 | 5 | 1 | 13 | 4 |
| `public.meal_plans` | 10 | 1 | 1 | 4 | 0 |
| `public.planned_meals` | 177 | 0 | 3 | 4 | 3 |
| `public.shopping_lists` | 2 | 1 | 1 | 0 | 0 |
| `public.shopping_list_items` | 2 | 0 | 2 | 0 | 0 |
| `public.cc_admin_members` | 1 | 0 | 1 | 1 | 0 |
| `public.cc_recipe_ratings` | 2 | 0 | 2 | 2 | 0 |
| `public.favorites` | 12 | 0 | 2 | 0 | 0 |
| `public.cc_shopping_decisions` | 2 | 0 | 1 | 0 | 0 |
| `public.cc_evolution_checkins` | 0 | 0 | 1 | 0 | 0 |

### Piloto, beta e fontes — dependência ou conteúdo a revisar (7)

| Tabela | Linhas | FK entra | FK sai | Funções SQL | Gatilhos |
|---|---:|---:|---:|---:|---:|
| `public.source_recipe_review` | 50 | 0 | 0 | 0 | 0 |
| `public.cc_official_recipe_source_records` | 119 | 0 | 1 | 19 | 1 |
| `public.cc_pilot_food_registry` | 172 | 0 | 1 | 0 | 0 |
| `public.cc_pilot_ingredient_measure_reviews` | 1072 | 1 | 3 | 7 | 1 |
| `public.cc_pilot_measure_review_events` | 1 | 0 | 2 | 2 | 0 |
| `public.cc_beta_members` | 1 | 0 | 1 | 2 | 0 |
| `public.cc_beta_recipe_access` | 114 | 0 | 1 | 4 | 0 |

### Assinaturas planejadas — decisão de produto pendente (2)

| Tabela | Linhas | FK entra | FK sai | Funções SQL | Gatilhos |
|---|---:|---:|---:|---:|---:|
| `public.subscription_plans` | 0 | 0 | 0 | 0 | 0 |
| `public.user_entitlements` | 0 | 0 | 1 | 0 | 0 |

### Nutrição, alergênicos e revisão editorial — fluxos regulados (15)

| Tabela | Linhas | FK entra | FK sai | Funções SQL | Gatilhos |
|---|---:|---:|---:|---:|---:|
| `public.cc_recipe_allergen_reviews` | 1 | 0 | 2 | 2 | 1 |
| `public.food_items` | 197 | 4 | 0 | 2 | 0 |
| `public.cc_recipe_technical_sheets` | 7 | 0 | 2 | 2 | 1 |
| `public.cc_food_nutrition_drafts` | 0 | 0 | 2 | 0 | 1 |
| `public.cc_recipe_ingredient_food_links` | 0 | 0 | 4 | 4 | 1 |
| `public.cc_food_nutrition_variants` | 58 | 3 | 2 | 6 | 3 |
| `public.cc_nutrition_reviewers` | 0 | 2 | 2 | 3 | 0 |
| `public.cc_food_nutrition_review_cases` | 0 | 0 | 3 | 3 | 0 |
| `public.cc_food_nutrition_review_events` | 0 | 0 | 2 | 3 | 0 |
| `public.cc_medical_reviewer_onboarding` | 2 | 0 | 2 | 1 | 0 |
| `public.cc_recipe_nutrition_facts` | 0 | 0 | 2 | 1 | 1 |
| `public.cc_n2_ingredient_review_notes` | 0 | 0 | 2 | 2 | 1 |
| `public.cc_allergen_ingredient_evidence` | 1 | 1 | 3 | 2 | 1 |
| `public.cc_allergen_a4_taxonomy` | 22 | 1 | 0 | 0 | 0 |
| `public.cc_allergen_a4_ingredient_findings` | 1 | 0 | 5 | 1 | 1 |

## Classificação inicial de possíveis simplificações

1. **Preservar sem alteração:** núcleo do planejamento e compras, preferências, favoritos, Evolução privada, permissões administrativas, receitas e ingredientes.
2. **Preservar até reestruturação controlada:** tabelas beta/piloto com linhas e dependências (`cc_beta_members`, `cc_beta_recipe_access`, `cc_pilot_ingredient_measure_reviews`, `cc_pilot_measure_review_events`, `cc_official_recipe_source_records`). Eliminar sem adaptar RPCs, front-end e testes quebraria fluxos.
3. **Candidatas a avaliação mais profunda, NÃO autorizadas como desnecessárias por este laudo:** `cc_pilot_food_registry` (172 linhas, acervo), `cc_food_nutrition_drafts` (vazia, mas com trigger/políticas/FKs), `profiles` (vazia, ligada à identidade), `subscription_plans` e `user_entitlements` (vazias, associadas à monetização futura). Outras tabelas vazias com funções/FKs também aguardam validação.
4. **Não descartar dados autorais nem direitos:** `source_recipe_review` tem 50 registros; as fontes de receitas e seus estados de licenciamento não devem ser apagados sem reconciliação editorial.
5. **Revisão nutricional:** as tabelas de casos, eventos, revisores, variantes, vínculos, evidências e rastreabilidade são parte de uma arquitetura de revisão. Mesmo com zero linhas, não se podem eliminar sem substituir o fluxo e suas dependências.

## Passos obrigatórios antes de executar um DROP TABLE

- Verificar backup restaurável do banco e teste de recuperação; não foi verificada uma cópia restaurável nesta auditoria.
- Identificar todos os pontos de uso no código da branch `main`, nas funções e triggers, no histórico de migrações, nas políticas, nas tarefas agendadas e nas integrações.
- Escolher quais módulos serão descontinuados (beta controlado, nutrição editorial, assinaturas futuras) sem apagar o acervo das receitas.
- Criar migração versionada de remoção **explícita**, sem `CASCADE` genérico, com verificações prévias de FK/linhas, `lock_timeout` e plano de reversão.
- Realizar em ambiente isolado de homologação; testar login, autorização beta, catálogo, administração, cardápio, compras e Evolução; só depois aplicar à produção em janela controlada.
- Conferir que a execução ocorreu realmente no projeto correto e documentar tabelas removidas e os backups disponíveis.

## Conclusão

**Não foram identificadas tabelas comprovadamente dispensáveis com segurança suficiente para remoção imediata em produção.** A exclusão automática de todas as tabelas chamadas “beta” ou “pilot” poderia remover dados de catálogo e funções que ainda participam do aplicativo; a redução deve seguir uma matriz de dependências e decisão de produto. O objetivo desta etapa é manter a operação atual intacta e preparar a limpeza auditável.
