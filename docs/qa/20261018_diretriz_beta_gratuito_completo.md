# Costa&Costa — decisão de produto: Beta gratuito completo (18/10/2026)

## Decisão do responsável
O produto deve ser funcional para um grupo pequeno de testadores **gratuitos**. Não é mais um piloto exclusivamente pessoal, nem uma versão com funcionalidades deliberadamente bloqueadas. A cobrança e comercialização ficam adiadas, mas o escopo funcional do Prompt Mestre permanece como objetivo de aceite.

## Requisitos de acesso
- Testadores autorizados podem entrar, preencher perfil, criar e editar cardápio, utilizar lista de compras, salvar receitas pessoais, favoritos e demais módulos funcionais previstos no Prompt Mestre assim que implementados e homologados.
- Administração e curadoria editorial permanecem somente para administradores; acesso beta não implica acesso administrativo.
- Biblioteca oficial deve ser disponibilizada a testadores autorizados **somente após uma decisão explícita de liberação do acervo**, sem publicar globalmente nem aprovar automaticamente conteúdo editorial.
- Não exibir alegações nutricionais, garantias de ausência de alérgenos ou recomendações clínicas sem validação. Manter avisos e restrições correspondentes.
- Isolamento multiusuário com RLS, armazenamento privado, capacidade de revogar acesso beta, logs minimizados e proteção de dados.
- Cobrança/assinatura desativada no beta; preparar arquitetura para monetização posterior sem exigir cobrança para testes.

## Diagnóstico atual (somente leitura)
- Em `cc_official_recipe_source_records` existem **119 registros com `use_stage=personal_pilot`**.
- Em `src/lib/planner.ts`, o carregamento de metadados oficiais do piloto depende de `cc_is_admin()` e filtra `use_stage=personal_pilot` + `is_plannable=true`. Essa lógica explica por que uma conta comum pode apresentar catálogo vazio; o diagnóstico exato da disponibilidade de receitas publicadas requer conferência separada.
- As políticas `recipes_read_published` e `cc_admin_read_official` distinguem conteúdo publicado de acervo administrativo. **Não modificar** `published`, `use_stage` ou regras de RLS sem migração revisada, prova de isolamento e autorização editorial específica.
- Meta: substituir o filtro exclusivo de admin por uma autorização beta controlada, que respeite origem, visibilidade, status editorial e as mesmas restrições de consumo já aplicadas ao acervo.

## Sequência de implementação
1. Auditar o modelo de participação beta e acesso ao acervo, funções SECURITY DEFINER e políticas RLS. Especificar concessão/revogação por usuário e sem exposição pública.
2. Criar camada de permissões `admin / beta_tester / usuário não autorizado`, com acesso restrito ao catálogo beta, sem conceder administração.
3. Integrar interface e consultar receitas com autorização efetiva do servidor (não apenas ocultar/mostrar UI). Validar com duas contas.
4. Implementar e homologar lacunas do Prompt Mestre (favoritos, evolução/hábitos, jornada de 30 dias, assistente nos limites de segurança, perfil, mobile e persistência).
5. Aceite beta: login/perfil; catálogo autorizado; receitas pessoais; sete dias e seis horários; porções com restrições honestas; compras e checkboxes; favoritos; ausência de acessos cruzados; sessões/dispositivos; experiência móvel; desligamento de acesso.
6. Só após aceite técnico e autorização explícita de conteúdo: habilitar o catálogo beta para o grupo definido; cobrança permanece desligada.

## Segurança de mudança
Registro documental apenas. Nenhuma alteração de dados, publicações, aprovações editoriais, RLS, `main`, PR #16 ou Storage nesta etapa.
