# Costa&Costa — Homologação beta: entrada do usuário e isolamento RLS (22/10/2026)

## Objetivo
Validar cadastro → onboarding → catálogo beta → cardápio → compras para uma conta nova, sem criar identidades fictícias nem manipular dados pessoais de testadores.

## Inventário de leitura do Supabase real
- Contas de autenticação: **3**.
- Registros de preferências/onboarding: **3**, todos marcados como concluídos.
- Receitas liberadas no catálogo beta: **114**.
- Marcações de membro beta `enabled`: **1**.
- Contêineres de planejamento existentes: **5**; refeições persistidas: **72**.
- Listas de compras persistidas: **1**, sem itens comprados persistidos no momento da verificação.

## Testes RLS executados (somente leitura)
- Simulação de duas contas autenticadas reais, usando `SET LOCAL ROLE authenticated` e `request.jwt.claim.sub` em transações **READ ONLY**.
- Em ambas: **0** preferências, planejamentos, refeições, listas e itens de compras de outros usuários visíveis; **0** receitas pessoais de outros usuários visíveis.
- Em uma conta autenticada sem `cc_beta_members.enabled`, a consulta retornou **114** fontes aprovadas para beta e **120** receitas oficiais não publicadas visíveis. A diferença decorre de permissões administrativas ou receitas fora do catálogo aprovado e **não significa** que todas estejam disponíveis no aplicativo do participante; o catálogo autorizado consta na RPC de 114 fontes.
- Sob `SET LOCAL ROLE anon`: **0** receitas oficiais não publicadas, **0** preferências e **0** planos visíveis.
- Nenhum registro criado, alterado ou excluído nesses testes. A simulação de papéis não substitui a prova de comportamento em dois navegadores reais, mas verifica as políticas ativas contra a base atual.

## Defeito encontrado e corrigido
Em `src/AuthGate.tsx`, antes desta correção, uma falha na consulta de `user_preferences` era tratada como onboarding concluído:
```ts
setOnboarding(error?"done":data?.onboarding_completed_at?"done":"needed");
```
Essa lógica poderia abrir o aplicativo sem perfil confirmado após falha temporária de rede ou de permissão.

Agora a consulta sinaliza a falha e apresenta tela **Não foi possível carregar seu perfil**, com botão **Tentar novamente**. A sessão permanece intacta; nenhum onboarding é considerado concluído sem confirmação.

Adicionada regressão estática em `scripts/test-beta-private-access.mjs` para impedir retorno desse bypass.

## Regra vigente de participação: ponto de governança
- A migração `20261019013000_cc_catalog_all_authenticated.sql` permite catálogo autorizado para **qualquer conta autenticada**, mesmo sem a flag `cc_beta_members.enabled`.
- Isso foi intencionalmente adotado para disponibilizar as receitas a novos cadastrados, mas significa que o beta não está efetivamente fechado por convites. A flag de convidados não restringe a leitura desse catálogo.
- **Não alterar silenciosamente essa regra**: fechar o cadastro apenas aos convidados afetaria usuários e funcionalidades previamente combinadas. Antes da distribuição externa, definir se a estratégia é beta por compartilhamento de link ou acesso efetivamente restrito por convite.
- Ajustada a suíte estática que validava apenas o comportamento histórico da migração original: agora verifica também a política vigente e esclarece a diferença.

## Testes automatizados e deploy
- GitHub Actions: compilação e regressões **aprovadas** no commit `7eca331c0b079ecdfc696399279b369659481a19`.
- Vercel: deploy concluído para a branch beta.
- A `main` permanece sem alteração e o PR #16 em rascunho.

## Pendências para homologação final de participante beta
1. Cadastro e confirmação de e-mail de nova conta real no domínio oficial, sem compartilhar credenciais.
2. Primeiro acesso passa por todas as cinco etapas do onboarding, salvo com sucesso; reabertura não repete onboarding.
3. Novo usuário consegue visualizar as 114 receitas autorizadas e montar sete dias de refeições, respeitando restrições de alergia.
4. Lista de compras gerada, marcações salvas e recuperadas após sair e entrar.
5. Repetir checagem cruzada com duas sessões reais; as verificações RLS do banco são apenas uma camada.
6. Testar interface no celular e comportamento PWA.
7. Verificar se acesso por convite deve ser imposto no cadastro antes da distribuição pública.

**Nenhum dado de autenticação, e-mail, identidade, segredo ou conteúdo editorial privado está incluído neste relatório.**
