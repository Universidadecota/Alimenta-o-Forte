# Costa&Costa — Fase 42: geração semanal após encerramento da Beta
**30/10/2026 · Ambiente de produção técnica · correção controlada**

## Incidente observado

O usuário comum tentou **Sugerir refeições da semana** para 26/10–01/11, com **21 refeições planejadas e 2 fixadas**. O navegador exibiu uma confirmação sobre 19 refeições não fixadas, seguida por:

> A atualização não foi confirmada integralmente. Recarregamos a semana salva para evitar divergências. [...] Falha de conexão.

A mensagem de conexão era genérica e imprecisa, pois o erro RPC do Supabase não é instância nativa de `Error`. O erro verdadeiro foi registrado em produção:

- Supabase Edge REST respondeu **HTTP 400 / PostgreSQL P0001** em `POST /rest/v1/rpc/cc_replace_week_main_meals`, cerca de **17:03–17:04 UTC de 30/10/2026**.
- PostgreSQL registrou **"Receita indisponível para este usuário"**.
- Consulta SQL **somente leitura** à semana específica confirmou: **21 refeições antigas inacessíveis, sendo 2 fixadas** para essa conta comum, por causa da retirada do antigo acesso Beta.
- A RPC, o trigger de validação e o RLS **bloquearam corretamente** a tentativa de persistir IDs privados.
- Houve também registro independente posterior de token de atualização inválido, mas ele **não é a causa demonstrada do erro HTTP 400 da RPC**. A UI mantém tratamento normal de sessão.

## Causa e solução

Ao retirar o perfil Beta, mantivemos corretamente os históricos de planejamento, mas as referências antigas deixaram de estar disponíveis ao usuário comum. A interface ainda tratava as duas escolhas fixadas como acessíveis. Ao reenviar as 21 linhas para a RPC, o trigger `guard_planned_recipe_owner` rejeitava referências privadas inacessíveis.

A correção não reabre a leitura das receitas privadas e não remove registros unilateralmente.

### Frontend

- `src/lib/legacyWeekAccess.ts` identifica quais refeições principais do plano atual não pertencem mais ao conjunto de receitas visíveis na sessão e prepara um **rascunho temporário**, sem mutação do plano salvo.
- `src/App.tsx` propõe alternativas para essas vagas; mantém as refeições fixadas que continuam disponíveis; informa explicitamente que duas fixações antigas inacessíveis precisam ser liberadas e substituídas. **Cancelar não faz gravação**.
- `src/lib/planner.ts` usa a nova RPC `cc_replace_week_main_meals_v2` e só envia a opção de liberar fixações inacessíveis quando existe uma escolha desse tipo; a leitura e comparação da semana anterior continuam servindo de controle de concorrência.
- A UI apresenta a mensagem correta do servidor quando há erro PostgreSQL; não converte qualquer `PostgrestError` em “Falha de conexão”.

### Banco (migração aditiva)
`supabase/migrations/20261030171742_cc_replace_week_main_meals_v2_legacy_access.sql`

Nova RPC autenticada de quatro parâmetros; mantém a RPC anterior e as políticas RLS existentes. A função:

1. Exige `auth.uid()`, preferências de usuário, exatamente 21 refeições válidas e snapshot anterior `p_expected`.
2. Compara o snapshot com as linhas reais; se outra sessão alterou o cardápio, **recusa a operação**.
3. Mantém a proteção de todas as fixações **ainda acessíveis**. Com `p_release_unavailable_locks=true`, permite substituir **somente** escolhas fixadas que deixaram de estar acessíveis à conta.
4. Desmarca fixação apenas nessas linhas efetivamente substituídas, conservando fixações legítimas que permanecem iguais.
5. Mantém pré-triagem de alergênicos e o trigger `guard_planned_recipe_owner`; **a nova receita também deve estar acessível ao usuário**. Nenhuma concessão Beta é restaurada.
6. Executa a substituição na mesma transação. Se ocorrer erro, o cardápio anterior permanece intacto.

**Esta etapa não altera o banco de dados do usuário durante a implantação.** A substituição de refeições ocorre exclusivamente quando a pessoa retornar ao site, clicar no gerador e confirmar a substituição das referências legadas.

## Regressões
`scripts/test-legacy-week-access.mjs`: casos simulados de refeição legada fixada e não fixada, preservação das demais fixações, opcionais e plano original, mensagens de erro PostgreSQL e inspeção das proteções declaradas na RPC. Incluído em `npm run build`.

**Limite:** testes estáticos e compilação não comprovam o sucesso do fluxo HTTP com a sessão real. A homologação final exige que a conta comum execute novamente a sugestão e confirme que o servidor devolve 21 refeições acessíveis, com as antigas fixações indisponíveis substituídas **somente após o aceite**.

## Instruções pós-publicação
1. Acesse a semana de 26/10–01/11 com a conta comum.
2. Clique em **Sugerir refeições da semana**.
3. Leia o aviso: devem aparecer 21 referências antigas indisponíveis, incluindo 2 que estavam fixadas. Confirme **somente se concordar em substituí-las**.
4. Aguarde a conclusão, recarregue a página e confira os 21 espaços e a nova lista de compras. As escolhas opcionais e as fixações que continuam acessíveis são preservadas.

Se a confirmação for cancelada, a semana antiga permanece no banco. Nenhum dado de receita, direitos, aprovação ou usuário é modificado pela implantação.
