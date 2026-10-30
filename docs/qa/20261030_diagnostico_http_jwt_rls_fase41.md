# Costa&Costa — Fase 41: diagnóstico HTTP/JWT de leitura das políticas RLS
**30/10/2026 · Supabase operacional de pré-lançamento / Vercel Beta**

## Objetivo

A Fase 3Y corrigiu o acesso a receitas Beta e testou RLS no PostgreSQL com papéis e claims simulados em transações read-only. Isso não equivalia a autenticação HTTP com um JWT emitido pelo Supabase Auth. Esta fase cria uma página de diagnóstico que usa a sessão real do navegador e o cliente Supabase do aplicativo.

A conexão de administração do projeto não permite entrar automaticamente na conta dos usuários. **A entrega é a ferramenta de testes com JWT real, não uma certificação de que as quatro sessões já foram testadas.**

## Acesso

https://alimentacaoforte.epsacore.com.br/?diagnostico-acesso=1

Abrir o endereço em cada navegador/sessão controlada. Funciona sem login (anônimo) e após login e onboarding do usuário. Clicar em **Executar verificações de leitura**; os testes só rodam mediante o clique. Há botão para voltar ao site e copiar um relatório com contagens, perfil, data e estados — sem e-mails, IDs de usuário, dados privados ou tokens.

A saída de uma sessão não representa outra conta. Para conferir usuário comum, participante Beta e administrador, cada uma dessas contas deve entrar normalmente pelo fluxo de autenticação. Não enviar senhas, tokens ou cookies ao ChatGPT.

## Definição do papel

- Anônimo: sem sessão.
- Administrador: Supabase Auth confirma o usuário e cc_is_admin() retorna true.
- Participante Beta elegível: não administrador, mas cc_beta_can_view_recipe() retorna true para a receita de referência que estava habilitada em 30/10/2026.
- Conta comum: não administrador e sem acesso à receita de referência.
- Inconclusivo: falha ao confirmar identidade ou papel, sem assumir permissão de qualquer tipo.

Se o administrador retirar a receita de referência do Beta, a classificação poderá indicar uma conta comum mesmo que a pessoa tenha acesso a outras receitas. Revalidar a configuração antes de atribuir um alerta a uma vulnerabilidade.

## Sete consultas read-only

| Categoria | Consulta | Resultado esperado para anônimo/comum |
|---|---|---|
| Receitas privadas oficiais | recipes com published=false, owner_user_id nulo e count/head | Zero |
| Fontes administrativas | cc_official_recipe_source_records com count/head | Zero ou acesso negado |
| Medidas históricas | cc_pilot_ingredient_measure_reviews com count/head | Zero ou acesso negado |
| Catálogo administrado | cc_admin_beta_catalog_overview() com contagem do retorno | Zero ou acesso negado |
| Cardápios de outros titulares | planned_meals com user_id diferente do usuário | Zero ou acesso negado |
| Favoritos de outros titulares | favorites com user_id diferente do usuário | Zero ou acesso negado |
| Preferências de outros titulares | user_preferences com user_id diferente do usuário | Zero ou acesso negado |

Para participante Beta, acesso positivo a algumas receitas privadas pode ser legítimo; porém fontes administrativas, histórico de medidas e visão administrativa continuam restritos. Para administrador, dados administrativos podem estar visíveis, mas nenhum registro particular de outra conta deve aparecer.

A verificação de outros titulares fica **inconclusiva para anônimo** pois não há ID de usuário para comparar. Não inventar um titular para produzir falso sucesso.

## Interpretação

- **Conforme ao teste:** consulta negada onde a negação era esperada, ou contagem zero para dados de outro titular.
- **Alerta:** acesso administrativo/privado por perfil indevido ou linhas de outra conta visíveis.
- **Inconclusivo:** erro técnico que não comprova acesso negado, ausência de contagem, dúvida sobre papel.
- Uma avaliação conforme não certifica segurança global, prevenção de IDOR em todas as RPCs ou sucesso dos testes de escrita.

## Garantias da ferramenta

- Não recebe senha/token em formulário, não cria sessão artificial e não utiliza service_role.
- Faz apenas seleções com head/count e consultas de funções de leitura sob a sessão existente.
- Não executa INSERT/UPDATE/DELETE, publicação, upload, administração de membros, migração ou testes concorrentes.
- Não mostra conteúdo das receitas, dados de outro usuário nem registros de fonte — apenas contagens.
- Não roda automaticamente ao entrar: exige clique real do testador.
- Relatório exportável não contém IDs, e-mails, tokens ou mensagens técnicas da API.

## Verificação automatizada da implementação

O script scripts/test-jwt-rls-diagnostics.mjs valida as sete categorias, perfis e tratamento conservador de erros, e verifica que o novo componente não contém comandos de escrita. Faz parte do npm run build.

**O teste de código não comprova testes HTTP executados**. Eles só se completam quando as contas controladas acessarem esta página e executarem a verificação.

## Limites da fase

Não foi aplicada nenhuma migração, política de banco, alteração de usuário, cadastro de Beta, edição de ingrediente, mudança de compras ou publicação. Fases 3Y, 3Z e 40 permanecem ativas; branch main preservada.

**Etapa seguinte:** comparar relatórios reais das sessões anônima, conta comum, participante Beta e administrador. Depois, executar testes de escrita negativa com dados exclusivamente de teste e transações delimitadas; não testar DELETE em conteúdo real.
