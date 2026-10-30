# Costa&Costa — Fase 3X: preparação de testes em ambiente isolado
**30/10/2026 · Preparação offline; sem conexão ao Supabase**

## Objetivo

A Fase 3W enumerou 14 cenários de segurança para o futuro fluxo de aprovação de preparos auxiliares. Esta etapa adiciona uma barreira de configuração para reduzir o risco de apontar testes ao Supabase operacional. **Não** cria projeto, instala schema, executa SQL, acessa autenticação ou realiza qualquer teste real de RLS.

O repositório Beta não continha supabase/config.toml na auditoria inicial. Portanto não se presume que um laboratório local já exista.

## Arquivos entregues

| Arquivo | Função |
|---|---|
| scripts/lib/pilot-isolated-target-guard.mjs | Valida apenas a forma do destino, recusa o project ref operacional conhecido, URL com credenciais, query, caminho ou host suspeito e exige confirmação explícita |
| scripts/pilot-isolated-preflight.mjs | Lê cinco variáveis de seleção de ambiente, não aceita API keys e imprime relatório JSON **sem usar rede** |
| scripts/test-pilot-isolated-preflight.mjs | Verifica 14 IDs em conjunto com a Fase 3W, URLs de ataque e proteção contra alvo operacional |
| package.json | Executa testes offline no build; disponibiliza comando manual de preflight, que não é executado pelo build |

O status **prepared_not_executed** significa somente que o endereço e as confirmações passaram na verificação sintática. Não comprova que o Supabase local esteja no ar, que o projeto remoto pertença à equipe ou que seus dados e políticas estejam protegidos. A saída sempre indica zero conexões, zero SQL, zero testes reais de RLS e nenhuma autorização de execução.

## Preparação LOCAL sugerida, não executada nesta fase

Usar um diretório completamente separado do aplicativo e do Supabase operacional, com dados sintéticos. A documentação atual do Supabase recomenda CLI e Docker para desenvolvimento local; a stack local não tem endurecimento de produção e não deve ser exposta à internet.

1. No computador de desenvolvimento, verificar supabase --help, supabase start --help e disponibilidade do Docker. Não presumir instalação de CLI.
2. Criar diretório novo exclusivo do laboratório (exemplo CostaCosta-Editorial-Lab), fora do repositório.
3. Após conferir os comandos da CLI, executar supabase init e supabase start **apenas dentro do laboratório** e verificar com supabase status.
4. **Não executar** supabase link, db pull, db push, db dump ou comandos --linked. Esses comandos podem atingir o projeto remoto e são desnecessários para criar laboratório sintético.
5. Não copiar dados de produção, histórico de usuários, fontes licenciadas ou segredos para o laboratório. Construir fixtures e usuários fictícios só após revisão do schema de testes.

### Pré-verificação offline no PowerShell

No repositório do aplicativo, após instalar as dependências de desenvolvimento:

~~~powershell
$env:CC_ISOLATED_TEST_MODE = "local"
$env:CC_ISOLATED_TEST_URL = "http://127.0.0.1:54321"
$env:CC_ISOLATED_TEST_CONFIRMATION = "CONFIRMO_FIXTURES_SINTETICAS_LOCAIS"
npm run pilot:isolated-preflight
Remove-Item Env:CC_ISOLATED_TEST_MODE,Env:CC_ISOLATED_TEST_URL,Env:CC_ISOLATED_TEST_CONFIRMATION
~~~

A porta local aceita é intencionalmente fixa em 54321. Se o laboratório usar porta diferente, revisar a proteção e seus testes antes de qualquer ajuste. O resultado positivo **não conecta ao banco**, mesmo se o serviço local estiver desligado.

## Projeto remoto de teste (somente planejamento)

Para um remoto distinto, os cinco campos previstos são CC_ISOLATED_TEST_MODE=remote-test; CC_ISOLATED_TEST_URL; CC_ISOLATED_TEST_PROJECT_REF; CC_ISOLATED_TEST_APPROVED_REF; CC_ISOLATED_TEST_CONFIRMATION. O URL deve ser HTTPS exato, com hostname construído diretamente do ref de teste, sem caminho nem credenciais. O ref deve diferir do projeto operacional e coincidir com o ref explicitamente declarado como aprovado. A confirmação precisa ser CONFIRMO_TESTE_ISOLADO_ seguido do ref.

O script não conecta mesmo quando passa essas verificações. **A confirmação não prova propriedade nem isolamento**; essa comprovação deve acontecer em revisão separada do projeto. Não salvar chaves secretas ou service_role no GitHub, documentação, logs ou frontend.

## Os 14 cenários permanecem não executados

Os IDs são comparados com a matriz da Fase 3W: anonimato, conta padrão, administrador sem especialidade, revisor limitado ao papel, autoaprovação, aprovação independente, papel expirado, concorrência, idempotência, mudança de fonte, imutabilidade, evidência privada, proibição de autopublicação e recuperação.

O manifesto usa somente dois estados: **blocked_no_isolated_target** (falta destino válido) e **prepared_not_executed** (configuração aceita, sem prova). Nenhum cenário pode ser marcado como aprovado ou executado por esses scripts. O teste de integração com RLS de verdade depende da próxima etapa.

## Condições para a futura execução REAL

- Instância isolada verificada de maneira independente, sem dados operacionais;
- Esquema sintético e RPCs revisados antes de qualquer migração local;
- RLS habilitada e contas separadas para anônimo, comum, revisor técnico, proponente e aprovador;
- Testes autenticados e concorrentes com evidências de execução, não apenas simulações;
- Backup e restauração validados exclusivamente no laboratório;
- Revisão de privilégios e GRANT EXECUTE, com usuário autenticado obtido no servidor;
- Autorização específica antes de qualquer SQL que crie ou modifique tabelas.

**Nenhuma migração SQL, conta, RPC, política RLS, atualização de receita, aprovação ou publicação foi criada nesta fase.**

## Referências

- Supabase: https://supabase.com/docs/guides/local-development/cli-workflows
- Supabase: https://supabase.com/docs/guides/database/postgres/row-level-security
- Auditoria anterior: docs/qa/20261030_auditoria_rpcs_plano_migracao_fase3w.md
