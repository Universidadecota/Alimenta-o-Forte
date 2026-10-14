# Costa&Costa — transição para Supabase Cloud principal (13/10/2026)

**Decisão do proprietário:** deixar Docker local de lado e trabalhar diretamente no Supabase Cloud principal `gclhailalyrokvmkwllm`. Proprietário informa que já possui backup. Plano Free, sem ambiente cloud de homologação separado.

**Limites operacionais:** mudanças graduais, preferencialmente aditivas; não desativar RLS; não fazer `db push` automático; não resetar o banco; não mesclar o PR #16 sem sua compatibilidade ter sido validada. Antes de cada mudança de esquema, identificar impacto, dependências, reversão e critério de aceite. Não interpretar a existência declarada de backup como comprovação de teste de restauração.

## Inventário inicial observado, somente leitura (antes da implantação)

- Supabase `ACTIVE_HEALTHY`; 22 migrações registradas na produção, versões divergentes das migrações versionadas do repositório.
- 12 tabelas no schema público, com RLS ativo; 25 policies públicas e 5 policies em `storage.objects`.
- 9 receitas, 30 linhas de ingredientes, 21 refeições planejadas e 5 objetos no bucket `personal-recipe-images`; bucket privado, somente WebP, até 2 MiB.
- A produção **não contém** `public.cc_recipe_allergen_reviews`, `cc_archive_personal_recipe(uuid)` nem `cc_restore_personal_recipe(uuid)`.
- Existe migração `optional_meal_slots` na produção, sem paridade confirmada com o histórico GitHub local.
- `public.recipes` usa a coluna `url`, não `image_url`.
- Policies de receitas, ingredientes, planos e fotos usam usuário autenticado; isso exige teste de acesso cruzado pela API real para comprovar isolamento ponta a ponta.
- Supabase Security Advisor aponta `SECURITY DEFINER` executáveis por authenticated: `cc_is_admin` (consulta admin) e `cc_save_official_recipe` (verifica admin antes das alterações), além de aviso de proteção contra senhas vazadas desabilitada. Não revogar EXECUTE indiscriminadamente: pode romper o painel administrativo. Revisar permissões/intencionalidade antes de eventual alteração.

## Ordem proposta de implantação gradual

1. Conciliar as migrações e a coluna `url` com o schema remoto; mapear efeitos e dependências (não alterar o histórico remotamente de forma artificial).
2. Inspecionar políticas e funções e desenhar testes de acesso cruzado diretamente no Supabase Cloud, sem tocar em dados de clientes. Usar contas/dados fictícios claramente identificados e com limpeza verificável; nunca armazenar chaves secretas no frontend ou GitHub.
3. Aplicar **somente após revisão** a migração editorial de alérgenos juntamente com seu guard de integridade; não ativar sugestões automáticas para usuários com alergias.
4. Aplicar RPCs de arquivar/listar/restaurar receitas pessoais, com autorização em `auth.uid()`, e testar propriedade das receitas.
5. Testar receitas pessoais, imagens, publicação admin, troca de refeições, porções e compras contra o schema principal, antes de qualquer deploy/merge de frontend.
6. Documentar SQL aplicado, versões, verificação pós-migração, reversão e resultados dos critérios da Fase 1 do Prompt Mestre.

## Implantação autorizada e realizada no Cloud principal (14/10/2026 UTC)

O proprietário autorizou expressamente a primeira migração de revisão de alergênicos diretamente no projeto principal, preservando os dados existentes. Foram aplicados **somente** os dois arquivos SQL de revisão editorial/guard já validados no ambiente local. Nenhum outro módulo foi migrado.

| Supabase Cloud — versão aplicada | Nome registrado | Origem no GitHub |
|---|---|---|
| `20261014004533` | `cc_recipe_allergen_reviews_fase1_base` | `supabase/migrations/20261012010000_cc_recipe_allergen_reviews.sql` |
| `20261014004626` | `cc_allergen_review_integrity_guard` | `supabase/migrations/20261012011000_cc_allergen_review_guard.sql` |

**Validações remotas de leitura após aplicar:** `public.cc_recipe_allergen_reviews` existe com RLS ativo; três políticas de uso administrativo (`SELECT`, `INSERT`, `UPDATE`) e nenhuma política `DELETE`; `anon` sem `SELECT` e `authenticated` sem privilégio de `DELETE`. Os gatilhos `cc_allergen_review_guard_trigger` (tabela de avaliações), `cc_allergen_ingredients_invalidate` (ingredientes) e `cc_allergen_recipe_invalidate` (receitas) estão habilitados. As duas funções `SECURITY DEFINER` de invalidação não concedem execução a `anon` nem `authenticated`. A função de guarda é `SECURITY INVOKER`, e só funciona no contexto de trigger. Não foram inseridas avaliações.

**Contagens antes e depois:** 9 receitas, 30 ingredientes, 21 refeições planejadas; 0 avaliações de alergênicos após a implantação. As 22 migrações anteriores foram preservadas, totalizando 24 versões no Cloud após esta operação.

**Limitações:** verificação estrutural e de permissões concluída; testes de comportamento com sessão autenticada, tentativa de escrita por não administrador, revisão verificada e invalidação efetiva ainda **pendentes no Cloud**. A estrutura `verified` é revisão editorial e **não certifica segurança alimentar**; sugestões automáticas continuam proibidas no frontend para perfis com alergias. Não houve merge do PR #16 nem publicação do frontend.

**Reversão planejada (não executada):** caso haja regressão, avaliar desabilitar pontualmente os gatilhos de invalidação e restaurar o comportamento anterior, com autorização expressa e testes; remoção da tabela exigiria avaliação dos registros existentes e aprovação específica. Nunca executar `db push` automático, pois os nomes e versões das migrações do GitHub não coincidem com o histórico do Cloud.

## Homologação transacional no Supabase Cloud principal

**Método:** SQL via Supabase conectado, com transações explícitas `BEGIN ... ROLLBACK` e `SET LOCAL ROLE authenticated` + `request.jwt.claim.sub` fictício ou identidade administrativa já autorizada. Nenhuma conta nova foi criada, e todos os dados temporários foram revertidos. Este método testa políticas RLS e gatilhos dentro do PostgreSQL; **não substitui testes de autenticação e Storage/API/browser em sessões reais**.

| Cenário | Resultado |
|---|---|
| Sessão autenticada comum tenta ler avaliação temporária | 0 linhas visíveis; aprovado |
| Sessão autenticada comum tenta inserir avaliação | RLS bloqueou (`insufficient_privilege`); aprovado |
| Sessão administrativa registra revisão verificada válida | Aceita; `reviewed_by=auth.uid()` e `reviewed_at` preenchidos pelo trigger |
| Sessão administrativa tenta verificar revisão sem evidências/contato cruzado | Check constraint rejeitou; aprovado |
| Nova avaliação para receita pessoal fictícia | Trigger rejeitou; aprovado |
| Alteração de ingredientes de receita fictícia verificada | Status passou a `pending`, revisor/data limpos |
| Alteração do título de receita fictícia reverificada | Status passou a `pending`, revisor/data limpos |
| Verificação de persistência após os testes | 9 receitas, 30 ingredientes, 21 refeições planejadas, 0 avaliações e 0 receitas `[QA-TEMP]` remanescentes |

**Pendências reais:** testar via API/cliente com sessões distintas e identidade administrativa; validar o painel de revisão editorial quando for implementado; revisar riscos de alérgenos e fornecedor e não liberar recomendações automáticas para quem declarou alergias; conciliar migrações com a branch antes do deploy.

**Nenhuma nova migração aplicada nesta rodada de homologação.** O banco segue com 24 versões, inclusive `20261014004533` e `20261014004626`, já instaladas na etapa anterior.

## Implantação das RPCs de receitas pessoais (14/10/2026 UTC)

O proprietário concordou em avançar diretamente no Supabase Cloud principal, dispensando o Docker local. Após confrontar `public.recipes`, `public.planned_meals`, constraints, RLS e ausência prévia de RPCs com os scripts da branch, foram aplicadas as duas migrações **sem alterar schema de tabelas ou dados persistidos**:

| Versão Supabase Cloud | Nome registrado | Arquivo GitHub |
|---|---|---|
| `20261014005651` | `cc_archive_personal_recipe_cloud` | `supabase/migrations/20261013010000_cc_archive_personal_recipe_rpc.sql` |
| `20261014005708` | `cc_restore_personal_recipes_cloud` | `supabase/migrations/20261013011000_cc_restore_personal_recipes.sql` |

**Estrutura verificada:** `cc_archive_personal_recipe(uuid)`, `cc_list_archived_personal_recipes()` e `cc_restore_personal_recipe(uuid)` presentes como `SECURITY DEFINER` com `search_path` vazio; `EXECUTE` concedido a `authenticated`, negado a `anon`. As funções conferem `auth.uid()` e a propriedade da receita; o arquivamento impede receitas já referenciadas por refeições planejadas.

**Testes SQL em transações `BEGIN ... ROLLBACK` no Cloud:**
- Proprietário fictício (reutilizando a identidade de um usuário existente apenas como contexto de sessão simulado) arquivou uma receita **temporária**, listou-a e restaurou-a; depois ela voltou à lista ativa e saiu da lista de arquivadas.
- Identidade diferente foi impedida de arquivar e restaurar e obteve lista de arquivadas vazia.
- Uma receita temporária referenciada por refeição planejada temporariamente alterada não pôde ser arquivada; nenhuma refeição persistida foi modificada.
- Verificação final após rollback: 9 receitas, 30 ingredientes, 21 refeições planejadas, 5 imagens privadas, 0 avaliações de alérgenos, 0 receitas `[QA-TEMP]`.
- Total de migrações Supabase Cloud após a operação: **26**. Nenhuma alteração no PR #16 além desta documentação; PR permanece sem merge.

**Limites e pendências:** esses testes validam permissões e comportamento no PostgreSQL, **não** sessões reais de Auth pela API nem a UI. Próximo passo: configurar o frontend de desenvolvimento para as credenciais **públicas** do projeto Supabase Cloud (sem nunca expor `service_role`/secret), realizar testes end-to-end com contas de QA e conferir isolamento via Storage REST. Se a UI ainda aponta para `127.0.0.1:54321`, encerrar o Docker torna esses recursos indisponíveis até reconfigurar o frontend. O projeto usa ambiente de produção para testes por decisão do proprietário: evitar modificar dados de outros usuários; usar QA identificado, reversão e verificações.

## Homologação visual de arquivamento/restauração no Supabase Cloud (14/10/2026)

Foi realizado o fluxo real pela interface Vite (`localhost:5173` conectada ao Supabase Cloud), sem Docker, usando a receita pessoal já existente **Ovos Mexidos com Bacon**. O usuário arquivou a receita e a interface exibiu-a em `Minhas arquivadas`, inclusive após atualização. A consulta ao Cloud confirmou `archived_at IS NOT NULL`.

Em seguida, a interface exibiu o diálogo de confirmação de restauração; após confirmar, a receita voltou à biblioteca normal com ações `Editar` e `Arquivar`, e a lista de arquivadas informou `Nenhuma receita arquivada`.

**Consulta de leitura pós-restauração:** receita pessoal `owner_user_id IS NOT NULL`; `archived_at IS NULL`; `published = false`; a receita conserva URL de fotografia e 4 linhas de ingredientes. Contagens gerais: 9 receitas, 21 refeições planejadas, 5 objetos no bucket privado e 0 receitas pessoais arquivadas. Não houve limpeza/destruição de dados.

**Resultado:** ciclo de arquivar, persistir e restaurar aprovado na interface Cloud para a conta testada. **Pendente:** isolamento das fotografias privadas na API com duas sessões de usuários distintos, sem compartilhar tokens em mensagens nem usar chaves administrativas no browser.

## Homologação de isolamento entre sessões reais via Supabase Cloud (14/10/2026)

O proprietário abriu uma janela anônima do Chrome e realizou login com a **segunda conta confirmada** do projeto. Na página Receitas, essa identidade visualizou as receitas oficiais, mas **não** a receita privada `Ovos Mexidos com Bacon` da primeira conta.

Executado no Console dessa sessão, usando apenas a biblioteca `supabase` do frontend (chave pública; sem segredos e sem operações mutáveis), um teste direto das APIs retornou:

| Cenário | Resultado da segunda conta | Aprovação |
|---|---|---|
| `public.recipes` com filtro pelo UUID da receita privada | 0 registros, sem erro | Sim |
| `storage.from("personal-recipe-images").download(path)` | HTTP 400, acesso negado | Sim |
| `storage.from("personal-recipe-images").createSignedUrl(path, 60)` | HTTP 400, acesso negado | Sim |

**Validação complementar de leitura no Supabase Cloud:** o objeto privado associado a `Ovos Mexidos com Bacon` continua presente em `storage.objects` (`matching_private_photos=1`). Bucket continua com 5 objetos. Portanto, a negação da segunda conta não se explica por ausência do arquivo. Nenhum token de sessão foi divulgado, não houve alteração de dados.

**Escopo aprovado:** isolamento de leitura da receita, download do Storage e emissão de link assinado entre duas sessões reais na API. Ainda não foram executados testes cruzados de listagem de caminhos, upload em pasta alheia ou exclusão, nem teste positivo de download na sessão proprietária durante este ciclo. O 400 é a recusa esperada; não inferir que cada operação do Storage foi testada.

## Estado atual

Primeiro conjunto editorial **implantado e verificado estruturalmente**, sem perda observada nas contagens. As RPCs de arquivamento/restauração foram implantadas e homologadas em SQL. O fluxo de arquivamento/restauração foi aprovado pela interface e o isolamento de leitura/download/link assinado foi aprovado em duas sessões reais. Ainda pendem testes complementares de Storage, reconciliação do histórico de migrações e demais requisitos da Fase 1.
