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

## Estado atual

Primeiro conjunto editorial **implantado e verificado estruturalmente**, sem perda observada nas contagens. Aguardar próximo ciclo de homologação de segurança e, depois, avaliar separadamente RPCs de arquivamento/restauração, reconciliação da história de migrações e os requisitos remanescentes da Fase 1.
