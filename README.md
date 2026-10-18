# Costa&Costa — Alimentação Forte

Aplicativo de **organização culinária e planejamento de refeições**, atualmente em **piloto de uso pessoal por três meses**. A comercialização do acesso é uma etapa futura e depende de avaliação separada; o piloto não está liberado comercialmente.

## Funcionalidades do piloto

- Catálogo privado de receitas autorais e consulta ao modo de preparo.
- Escolha livre de café da manhã, almoço, jantar, lanches e ceia no cardápio diário/semanal.
- Lista de compras, com soma de medidas estruturadas confiáveis e apresentação separada das expressões originais das receitas do piloto quando houver ambiguidade.
- Marcação de itens comprados.
- Cadastro de fotos, organização editorial e revisão de medidas das receitas sem alterar a fonte original.

**Regras de conteúdo:** não alterar ingredientes, quantidades, modo de preparo e rendimento das receitas autorais sem revisão explícita. Medidas não verificadas, equivalências e valores nutricionais não são inferidos automaticamente. A revisão editorial de medidas não equivale à revisão médica, nutricional ou de alérgenos. Não existe prescrição de dieta nem promessa de resultado de saúde.

## Tecnologias

React, TypeScript, Vite, Supabase (autenticação, PostgreSQL e Storage) e interface responsiva/PWA.

## Validação automática: sem depender de PowerShell

O workflow [Costa&Costa CI](.github/workflows/ci.yml) é executado em cada push na `main` ou em branches `feat/**` e nos PRs direcionados à `main`. Executa, nesta ordem:

1. `npm run build` — TypeScript e bundle do Vite.
2. `npm run test:ingredients` — leitura conservadora das expressões originais.
3. `npm run test:measure-batch` — preparação de propostas sem aprová-las.
4. `npm run test:editorial-batch` — revisão individual por ingrediente, limite de cinco e controle de versão.
5. `npm run test:pilot-flow` — horários de refeição, soma de compras, alternativas, itens opcionais e bloqueio de sugestões quando há alergias cadastradas sem verificação.

Os testes de lógica não usam credenciais de produção nem modificam o banco. Os resultados do workflow ficam na aba **Actions** do GitHub. A aprovação automática dos testes **não implica** publicação, merge, homologação visual ou aprovação clínica de conteúdo.

## Fluxo de desenvolvimento enxuto

- Implementar alterações em branch isolada e manter as migrações versionadas.
- Deixar o GitHub executar compilação e testes a cada atualização.
- Quando houver alteração em banco, validar controles de acesso e integridade com consultas transacionais seguras, evitando alterações de produção desnecessárias.
- Solicitar ao responsável **somente uma conferência integrada por entrega relevante**, ou uma decisão editorial específica que exija sua autorização. Não repetir testes já aprovados sem mudança correspondente.
- Proteger a `main` e **não mesclar o PR #16 nem liberar o piloto comercialmente** sem autorização expressa.

## Segurança

Nunca incluir segredos, credenciais, chaves de serviço ou dados pessoais de usuários no repositório. A publicação comercial futura exigirá revisão de privacidade, segurança, conteúdo e fluxos de pagamento.
