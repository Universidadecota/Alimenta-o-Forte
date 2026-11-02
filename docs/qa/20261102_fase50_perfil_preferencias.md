# Costa&Costa — Fase 50: perfil permanente (primeiro incremento)

**Situação:** branch de teste sem merge. Base `main@b24a074` (Fase 47 em produção). PR #57 (Fase 48) e PR #58 (Fase 49) seguem separados.

## Objetivo de produto

Permitir que o usuário autenticado **consulte e edite as próprias preferências e alergias depois do onboarding**, sem nova migração nem mudanças em receitas, plano semanal, compras, favoritos e dados de outros usuários. Avançar no requisito Perfil do Prompt Mestre, preservando a diretriz do beta gratuito.

## Recursos
- Nova aba **Perfil**, disponível ao usuário autenticado e na navegação móvel.
- Conta/e-mail somente leitura, objetivo, gostos, alimentos evitados, alergias, pessoas em casa e minutos para cozinhar.
- Formulário pré-preenchido com a tabela `user_preferences`, anteriormente utilizada pelo onboarding e planejador.
- Validação local coerente com os limites SQL: **1–20 pessoas**, **5–360 minutos**, objetivos da lista oficial.
- Preservação de escolhas personalizadas já presentes no cadastro, sem excluí-las por não estarem nas opções fixas.
- `Salvar` exige autenticação conferida, `user_id` da sessão igual à conta e confirmação da gravação; protege contra alterações já feitas por outra sessão ao reler o estado antes da escrita.
- Com mudança de alergias, o usuário deve reconhecer expressamente que o cardápio anterior **não foi reavaliado**. O aviso continua no Cardápio quando há alergias.
- Estado do planejador é atualizado após resposta positiva do servidor; geração futura usa novas preferências. Não faz regeneração de refeições nem muda receitas, listas de compras ou cardápios automaticamente.
- Botão Descartar alterações e feedback explícito de erro/sucesso. Controles desabilitados durante gravação.

## Privacidade e limites

- Somente `SELECT` e `UPDATE` restritos ao próprio usuário em `user_preferences`; não cria tabelas ou muda RLS.
- No banco inspecionado: RLS em `user_preferences` e constraints de objetivo, tamanho da casa e tempo de preparo.
- Nenhum dado sensível deve ser registrado em log, URL, analytics, localStorage ou mensagem pública.
- A confirmação de alterações em alergias **não implica certificação** do cardápio, nem deve ser confundida com consentimento LGPD para outros tratamentos.
- Perfil ainda não cobre edição de e-mail, nome público, exportação, exclusão de dados, configurações de privacidade avançadas ou funcionalidade de Evolução.

## Validação técnica

- `npm run test:profile-phase50` integrado ao build.
- Verifica limites e defaults, comparação de alergias mesmo após reordenação, preservação de opções não-padronizadas, RLS no fluxo de escrita, ausência de mutações de compras, renderização do menu e CSS móvel.
- Executar GitHub CI e Vercel Preview da branch.
- Consultar em Supabase somente agregados de integridade anteriores e posteriores; não editar dados pessoais reais.

## Homologação visual recomendada

1. Na prévia, abrir Perfil com conta autorizada e confirmar que os campos atuais estão pré-preenchidos.
2. Alterar um campo **não sensível**, como tempo de cozinha, salvar, pressionar F5 e confirmar persistência; voltar ao valor original.
3. Alterar uma alergia **apenas com conta de testes**, confirmar que aparece o reconhecimento obrigatório e verificar que as 21 refeições não mudam. Reverter após teste.
4. Conferir se Perfil aparece e é utilizável em tela de celular, inclusive teclado e botão Salvar.
5. Realizar teste de isolamento com duas contas de teste independentes antes de classificar o módulo como homologado.
6. Confirmar novamente no banco as duas compras de leite de coco/azeite e as duas decisões, sem alterações.

**Bloqueios para merge:** CI, preview READY e homologação funcional. Não publicar esta branch por simples conclusão dos testes unitários.
