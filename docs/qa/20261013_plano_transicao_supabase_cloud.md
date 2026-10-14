# Costa&Costa — transição para Supabase Cloud principal (13/10/2026)

**Decisão do proprietário:** deixar Docker local de lado e trabalhar diretamente no Supabase Cloud principal `gclhailalyrokvmkwllm`. Proprietário informa que já possui backup. Plano Free, sem ambiente cloud de homologação separado.

**Limites operacionais:** mudanças graduais, preferencialmente aditivas; não desativar RLS; não fazer `db push` automático; não resetar o banco; não mesclar o PR #16 sem sua compatibilidade ter sido validada. Antes de cada mudança de esquema, identificar impacto, dependências, reversão e critério de aceite. Não interpretar a existência declarada de backup como comprovação de teste de restauração.

## Inventário observado, somente leitura

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

## Estado

Esta documentação registra o plano e inventário **sem executar DDL nem alterar dados no Supabase Cloud**. As migrações e testes ainda requerem validação antes de execução.
