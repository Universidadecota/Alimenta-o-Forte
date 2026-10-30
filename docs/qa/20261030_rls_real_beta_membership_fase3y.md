# Costa&Costa — Fase 3Y: acesso real de usuários, RLS e correção da Beta
**30/10/2026 — Pré-lançamento controlado no Supabase operacional**

## Diretriz aprovada
O projeto Supabase já conectado é o ambiente de pré-lançamento. Testes de leitura, políticas e funcionalidades podem ser feitos nele de forma controlada, com evidências e sem necessidade de duplicar toda a estrutura. Testes destrutivos, recuperação de backup e concorrência que alterem dados devem usar transações revertidas ou fixtures isoladas e ser autorizados conforme seu impacto.

## Escopo da auditoria real — SOMENTE LEITURA
Foram consultados `pg_policies`, privilégios de tabela, advisory de segurança e contagens agregadas. Comandos de teste usaram `BEGIN READ ONLY`, `SET LOCAL ROLE anon/authenticated` e, nas simulações autenticadas, `set_config('request.jwt.claim.sub', uuid, true)`, terminando em `ROLLBACK`.

**Limite essencial:** o PostgreSQL de fato avaliou RLS e as funções com o papel e claim informados; isso NÃO corresponde a autenticação HTTP com JWT emitido pelo Supabase Auth. Não foram executados testes reais de login, escritas, concorrência ou restauração.

### Resultados de isolamento (identidades anonimizadas)
| Escopo | Papel anônimo | Admin autenticado | Conta comum autenticada |
|---|---|---|---|
| Perfis, cardápios e lista de compras de outros usuários | 0 registros privados visíveis em anon | Nenhum cardápio de outro usuário | Nenhum cardápio de outro usuário |
| Favoritos de outros usuários | Sem privilégio SELECT para anon | Somente seus favoritos | Somente seus favoritos |
| Fontes originais administrativas | Sem privilégio SELECT para anon | 119 fontes administrativas acessíveis | 0 |
| Revisões históricas administrativas | Sem privilégio SELECT para anon | 1072 linhas acessíveis | 0 |
| Receitas publicadas | 7 receitas visíveis para anon | Continuam públicas | Continuam públicas |

Na amostra autenticada, o titular A possuía 4 cardápios, 7 favoritos e 1 lista de compras, e o titular B possuía 2 cardápios. As consultas sob cada papel deram **zero resultados de outro titular**. Não incluímos IDs de usuários nem conteúdo privado neste relatório.

## Problema concreto encontrado
Antes da correção, a função pública `cc_beta_can_view_recipe(uuid)` validava apenas login, ativação da receita e elegibilidade editorial. **Não exigia vínculo com `cc_beta_members`**, apesar de existir rotina administrativa para habilitar/desabilitar essa participação.

Havia 114 receitas privadas habilitadas como Beta e apenas um participante Beta habilitado. Sob a identidade de uma conta comum não participante e não administradora:
- `recipes` retornava **114 receitas não publicadas**;
- `cc_beta_recipe_sources()` retornava **114 fontes originais**.

Essa foi uma exposição para contas autenticadas, não anônimas. O problema foi confirmado em transação somente leitura e não dependeu de supor intenção da interface.

## Migração aplicada no projeto operacional

**Registro de migração do Supabase:** `20261030120956_cc_beta_recipe_membership_guard_20261030`

**Arquivo versionado:** `supabase/migrations/20261030120956_cc_beta_recipe_membership_guard_20261030.sql`

A função foi substituída mantendo assinatura, `STABLE SECURITY DEFINER` e `search_path=''`. A nova regra exige, além das condições de receita já existentes:
1. Sessão autenticada via `auth.uid()`;
2. **Administrador efetivo** via `cc_is_admin()` **OU participante Beta habilitado** em `cc_beta_members`;
3. Receita individual habilitada na Beta, fonte `personal_pilot`, `is_plannable=true`, receita sem titular e `published=false`.

Não houve INSERT, UPDATE ou DELETE em receitas, membros, compras, fontes ou usuários. O controle não concede novos papéis.

### Teste pós-migração, feito no banco real (SQL role/claim em transação de leitura)
| Perfil | Receitas privadas via regra Beta | Fontes privadas via RPC | Cardápios alheios |
|---|---:|---:|---:|
| Administrador | 114 via RPC; 120 receitas não publicadas via acesso administrativo | 114 | 0 |
| Participante Beta habilitado (não admin) | 114 | 114 | 0 |
| Conta comum não Beta (não admin) | **0** | **0** | 0 |

**Resultado: corrigido no caminho testado.** O usuário comum pode continuar acessando receitas **publicadas** conforme a política existente. Administradores conservam o acesso ao inventário privado. Quando o administrador habilitar explicitamente outros usuários Beta, eles terão acesso ao subconjunto de receitas habilitadas; isso pode alterar a experiência de quem antes visualizava o piloto sem matrícula.

## Segurança adicional a revisar
- O advisor do Supabase identificou **26 avisos** de `SECURITY DEFINER` executáveis por usuários autenticados. Estes são pontos de revisão, **não 26 vulnerabilidades confirmadas**. As funções administrativas de amostra possuem checagens internas de `cc_is_admin()`; outras verificam `auth.uid()`. É necessário auditar cada função e seus grants sem revogar permissões indiscriminadamente.
- Há três tabelas internas com RLS ativa e sem política (membros Beta, acesso Beta a receitas, revisores nutricionais). Não é automaticamente um problema: elas são acessadas por rotinas privilegiadas. Validar essa intenção antes de criar políticas.
- O advisor também recomenda ativar proteção contra senhas vazadas no Auth. Não houve mudança nessa configuração.

Referências oficiais:
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Testes ainda necessários antes da comercialização
- Sessões reais com JWT emitido pelo Supabase Auth: anônimo, usuário comum, administrador e participante Beta;
- Fluxos reais de escrita com contas de teste e reversão segura, incluindo tentativas de atravessar limites entre usuários;
- Revisão individual das 26 funções privilegiadas e do acesso a Storage;
- Segurança de alteração de receitas e direitos comerciais, concorrência, idempotência e restauração, em escopo seguro;
- Rechecagem de `get_advisors` depois de novas alterações e homologação da Beta com o usuário.

## Regressão de código
`scripts/test-beta-recipe-membership-guard.mjs` verifica, no **arquivo versionado**, os predicados essenciais e que não exista DML de receitas nesta migração. É executado por `npm run build`. **O teste de fonte não substitui as verificações reais de RLS pós-migração descritas acima.**

A branch `main` permanece preservada. O objetivo da Fase 3Y é melhorar a segurança do ambiente remoto já existente, não iniciar a comercialização.
