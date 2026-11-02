# Costa&Costa — Auditoria de redução de tabelas do Supabase

**Data:** 02/11/2026  
**Projeto:** Alimentação Forte, produção Supabase `gclhailalyrokvmkwllm`  
**Método:** inspeção somente leitura de catálogo PostgreSQL, dados agregados, relações, funções, gatilhos, RLS e código identificado no GitHub.  
**Atualização após auditoria:** uma tabela legada vazia (`public.profiles`) foi excluída diretamente no Supabase em 02/11/2026, sem backup, conforme preferência expressa do responsável. O inventário de 37 tabelas abaixo é o retrato **anterior à remoção**; agora há 36 tabelas. A decisão anterior de 0 exclusões correspondia ao estado da auditoria antes de comprovar a ausência de referências a `profiles`.
**Decisão do responsável (02/11/2026):** preservar para uso futuro os módulos de **assinaturas** e **revisão nutricional profissional**. Eles não serão utilizados por enquanto, mas devem continuar disponíveis estruturalmente para retomada futura. A decisão não equivale à aprovação ou ativação clínica/comercial.

## Síntese executiva

- **37 tabelas públicas**, com **11 sem registros** e **26 contendo registros**.
- Todas com RLS ligada; acesso anônimo testado anteriormente retornou zero perfis, preferências, cardápios e listas pessoais, e acesso autorizado a receitas publicadas.
- Armazenamento total das tabelas públicas com seus índices: **2.949.120 bytes (aprox. 2,81 MiB)**, portanto a redução de tabelas não é, por si só, justificativa de performance/custo.
- `cc_beta_members` e `cc_beta_recipe_access` continuam referenciadas por funções de administração e revisão; `cc_pilot_ingredient_measure_reviews` por funções de medidas e vínculo de ingredientes.
- `cc_pilot_food_registry` tem **172 linhas**, sem dependências SQL de entrada observadas; porém ausência de FKs ou referências em funções não comprova ausência de uso no frontend ou em rotinas externas.
- Tabelas de assinatura vazias representam funcionalidades planejadas e foram explicitamente mantidas para implantação futura, assim como a infraestrutura de revisão nutricional profissional.

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

### Assinaturas futuras — PRESERVAR por decisão do responsável (2)

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
3. **Candidatas a avaliação mais profunda, NÃO autorizadas como desnecessárias por este laudo:** `cc_pilot_food_registry` (172 linhas, acervo) e possíveis estruturas legadas não utilizadas, ainda sujeitas a prova de ausência de vínculos. `profiles` permanece por estar vinculada à identidade. **Excluir da lista de candidatos as tabelas de assinatura e os elementos de revisão nutricional profissional**, preservados por decisão expressa mesmo quando vazios.
4. **Não descartar dados autorais nem direitos:** `source_recipe_review` tem 50 registros; as fontes de receitas e seus estados de licenciamento não devem ser apagados sem reconciliação editorial.
5. **Revisão nutricional:** as tabelas de casos, eventos, revisores, variantes, vínculos, evidências e rastreabilidade são parte de uma arquitetura de revisão e ficam **formalmente preservadas para retomada futura**, ainda que algumas estejam vazias. Manter seus requisitos de autorização, rastreabilidade e avaliação humana.


## Decisão de produto — preservação para uso futuro (02/11/2026)

O responsável confirmou: **“Desejo manter. No momento não pretendo utilizar, mas, futuramente poderei utilizar.”** A decisão refere-se explicitamente aos módulos de assinaturas e revisão nutricional profissional discutidos na auditoria.

| Grupo | Situação desejada | Consequência para a limpeza |
|---|---|---|
| Assinaturas, planos e permissões de assinatura | Reservado para implementação futura | **Preservar** `subscription_plans` e `user_entitlements` (e estruturas de autenticação e integração relacionadas) |
| Revisão nutricional profissional | Reservada para operação futura, sem homologação clínica neste momento | **Preservar** revisores, credenciamento, revisão de alimentos e receitas, casos, eventos, variantes, vínculos, evidências e rastreabilidade; nenhuma aprovação ou disponibilização automática |
| Catálogo e planejamento atuais | Em uso/beta | Preservar integralmente e manter funcionamento inalterado |
| Estruturas antigas piloto/beta | A esclarecer caso a caso | Somente investigar exclusão/arquivamento depois de verificar código, RPCs, fontes, integridade, backup restaurável e migração testada |

A decisão **não autoriza desabilitar tabelas, renomeá-las, revogar permissões, excluir registros ou fazer merge**. Também não implica que o produto esteja apto para monetização ou para orientações nutricionais profissionais.

## Passos obrigatórios antes de executar um DROP TABLE

- Verificar backup restaurável do banco e teste de recuperação; não foi verificada uma cópia restaurável nesta auditoria.
- Identificar todos os pontos de uso no código da branch `main`, nas funções e triggers, no histórico de migrações, nas políticas, nas tarefas agendadas e nas integrações.
- Avaliar apenas funcionalidades piloto/legadas realmente abandonadas, **excluindo da limpeza os módulos de assinaturas e revisão nutricional profissional, que não serão descontinuados**, e sem apagar o acervo das receitas.
- Criar migração versionada de remoção **explícita**, sem `CASCADE` genérico, com verificações prévias de FK/linhas, `lock_timeout` e plano de reversão.
- Realizar em ambiente isolado de homologação; testar login, autorização beta, catálogo, administração, cardápio, compras e Evolução; só depois aplicar à produção em janela controlada.
- Conferir que a execução ocorreu realmente no projeto correto e documentar tabelas removidas e os backups disponíveis.

## Conclusão

**Não foram identificadas tabelas comprovadamente dispensáveis com segurança suficiente para remoção imediata em produção.** A exclusão automática de todas as tabelas chamadas “beta” ou “pilot” poderia remover dados de catálogo e funções que ainda participam do aplicativo; a redução deve seguir uma matriz de dependências e decisão de produto. O objetivo desta etapa é manter a operação atual intacta e preparar a limpeza auditável.


## Segunda passada: uso real no código e proveniência (02/11/2026)

### Cruzamento da aplicação publicada

A árvore da `main@63bd28f` contém **87 arquivos-fonte** sob `src/`; foram examinados para nomes diretos das tabelas potencialmente removíveis. Há usos efetivos de estruturas piloto/beta:

- `src/AdminBetaAccess.tsx` chama `cc_admin_beta_catalog_overview`, `cc_admin_beta_members_overview`, `cc_admin_set_beta_member` e `cc_admin_set_beta_recipe`: dependem da autorização beta.
- `src/AdminRecipes.tsx`, `src/AdminAllergenReviewQueue.tsx`, `src/AccessSecurityDiagnostics.tsx` e `src/lib/planner.ts` consultam `cc_official_recipe_source_records`; o planejador precisa distinguir fontes piloto antes de escolher receitas.
- `src/PilotIngredientMeasureReview.tsx`, `src/PilotMeasureEditorialReview.tsx`, `src/PilotMeasureSourceEvidence.tsx` e diagnósticos consultam `cc_pilot_ingredient_measure_reviews`; a trilha de revisão não é descartável.
- `src/PilotMeasureEditorialReview.tsx` consulta `cc_pilot_measure_review_events`.
- `src/EdvCollection.tsx` consulta `source_recipe_review`: preservar registro das fontes/licenças.
- `src/MedicalReviewerOnboarding.tsx`, `src/AdminNutritionN2.tsx` e `src/FoodNutritionReviewPanel.tsx` usam módulos que o responsável decidiu manter para o futuro.

**Limites da análise:** buscas literais não detectam automaticamente toda referência dinâmica, SQL externo, tarefa agendada ou integrações fora do repositório. Foram observados também scripts de teste e migrações históricas, mas a ausência de ocorrência textual não prova obsolescência.

### Caso `cc_pilot_food_registry` — reclassificado para preservação

- **172 registros**, todos com status `needs_ingredient_review`.
- Sua origem declarada é **“Seis PDFs Desafio 30 Dias enviados para uso pessoal”**; o objetivo da migration `20261016110000_cc_pilot_food_registry_phase3b.sql` é registrar proveniência preliminar, não aprovar nutriente nem alergênico.
- Os 172 registros possuem correspondência com `food_items`; **16 alimentos aparecem vinculados a variantes nutricionais**, sem que isso represente aprovação clínica.
- Não se encontrou referência direta a essa tabela nos 87 arquivos-fonte consultados, nem referência textual em função SQL pública ou FK entrando nela. **Ainda assim, a proveniência poderá ser necessária à revisão profissional futura**, explicitamente preservada pelo responsável. Por isso **não propor DROP neste ciclo**.

### Estruturas vazias protegidas

As **11 tabelas vazias** não são automaticamente resíduos. Exemplos preservados: `profiles` (identidade), `cc_evolution_checkins` (diário opcional já publicado), `subscription_plans` e `user_entitlements` (monetização futura), além de `cc_food_nutrition_drafts`, `cc_recipe_ingredient_food_links`, `cc_nutrition_reviewers`, `cc_food_nutrition_review_cases`, `cc_food_nutrition_review_events`, `cc_recipe_nutrition_facts` e `cc_n2_ingredient_review_notes` (revisão editorial/nutricional futura). Algumas têm gatilhos, outras integram fluxos administrativos.

### Resultado objetivo

**Quantidade de tabelas liberadas para exclusão imediata: 0.**

Não há backup restaurável confirmado, e as estruturas suspeitas têm uso atual, dados editoriais a preservar ou relevância futura autorizada. A análise progrediu da triagem por nome até o cruzamento com a aplicação e a proveniência, sem comprometer o banco.

Foi criado `scripts/sql/20261102_pr63_readonly_preflight.sql`, **somente SELECT**, e executado no projeto correto; a verificação final preservou **21 refeições, 2 compras concluídas e 2 decisões**. O script não contém operações destrutivas.

**Regra para limpeza posterior:** não executar `DROP TABLE` baseado apenas em nomes `pilot`, `beta`, volume de linhas ou ausência de referência textual. Exigir isolamento em homologação, fonte de backup verificada, alternativa de restauração, inventário de permissões e aprovação do conjunto explícito de objetos a remover.


## Terceira passada — segurança de backup antes de limpeza (02/11/2026)

- Supabase conectado confirma a organização **Free**, sem backup diário automático garantido pelo plano. Guia do Supabase recomenda exportação periódica via CLI para Free.
- Projeto PostgreSQL **17**, ativo/saudável.
- **87 migrações** registradas no banco; árvore GitHub `main@63bd28f` contém **86 arquivos de migração**. Nomes e carimbos de migração historicamente divergem; não tentar `migration repair`, `db push` nem `db reset` em produção sem reconciliação.
- Integridade por consulta SQL: **37 tabelas, 0 sem RLS, 4 contas Auth, 128 receitas, 1.157 ingredientes, 177 refeições planejadas, 2 listas de compras, 2 itens persistidos e 2 decisões**.
- Storage confirmado: **130 arquivos públicos** em `recipe-illustrations` e **5 privados** em `personal-recipe-images`; metadados SQL não recuperam os bytes originais.
- Preparado `scripts/backup/20261102_pr63_export_local_wsl.sh` (exportação local manual, verifica projeto, arquivos e checksums, mas **não cria backup completo por si só**).
- Preparado e **executado com sucesso no banco de produção, somente SELECT**, `scripts/sql/20261102_pr63_compare_restore.sql` para comparar contagens e RLS após restauração.
- Plano operacional e links da documentação oficial em `docs/qa/20261102_pr63_backup_e_restauracao.md`.
- **Ainda não houve dump real, cópia dos arquivos do Storage, exportação confirmada de Auth ou ensaio de restauração**. Esses são pré-requisitos obrigatórios; nenhuma tabela está aprovada para exclusão.


## Resultado da ação direta autorizada — 02/11/2026

O responsável informou expressamente: **“Eu não tenho interesse em fazer backup. Podemos trabalhar diretamente no supabase.”** A etapa de backup deixou de ser um pré-requisito exigido por ele para a limpeza pontual. **Isso não elimina o risco**: excluir uma tabela sem cópia recuperável pode ser irreversível.

Foi aprofundada a avaliação de `public.profiles`: **0 registros**, campos `id`, `display_name`, `created_at`; **0 gatilhos de aplicação, 0 FKs de entrada, nenhuma função SQL ou view referenciando-a** segundo inspeção dinâmica. Código atual de autenticação/Perfil consulta `user_preferences`, e não `profiles`. A tabela não possuía gatilho de criação em `auth.users`.

**AÇÃO EXECUTADA:** `DROP TABLE public.profiles RESTRICT`, via migração no Supabase `20261102141835_remove_unused_empty_legacy_profiles_20261102`. A migração abortaria se houvesse registros, gatilhos, dependências/ funções conhecidas. O mesmo SQL foi versionado em `supabase/migrations/20261102141835_remove_unused_empty_legacy_profiles_20261102.sql`.

### Validação imediata
- `to_regclass('public.profiles') IS NULL`: **verdadeiro**.
- **36 tabelas públicas** restantes, **0 sem RLS**.
- **4 usuários** em `auth.users` e **4 preferências** em `user_preferences`.
- **128 receitas**, **1.157 ingredientes**, **10 planos** e **177 refeições planejadas**.
- **2 listas**, **2 decisões de compra** e **12 favoritos**.
- **119 fontes oficiais** e **172 registros de alimentos piloto**.
- `subscription_plans`, `cc_nutrition_reviewers` e `cc_evolution_checkins` continuam existentes.

**Limites:** foi confirmada a integridade estrutural e de contagens; a operação não comprova que consumidores externos antigos não utilizem `profiles`. A homologação visual pós-migração ainda está pendente. Sem backup, a tabela não pode ser recuperada automaticamente com seus direitos/permissões anteriores.

**Próximas exclusões:** nenhuma das outras 36 tabelas demonstrou inutilidade suficiente no escopo já revisado. Tabelas vazias de assinaturas, perfis atuais, nutrição e evolução são mantidas conforme decisões anteriores. Não utilizar `CASCADE` ou excluir por nomenclatura.
