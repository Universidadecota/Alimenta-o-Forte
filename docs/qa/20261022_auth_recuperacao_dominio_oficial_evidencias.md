# Costa&Costa — Homologação de recuperação de senha no domínio oficial

**Data do ensaio:** 22/10/2026, horário local America/Sao_Paulo.
**Domínio:** https://alimentacaoforte.epsacore.com.br
**Branch:** `feat/revisao-alergenos-fase1-12out2026`, PR #16 em rascunho.
**Escopo:** fluxo de recuperação de senha no Supabase Auth; nenhuma senha ou token é armazenado neste relatório.

## Evidência da sessão de testes

1. A URL Configuration do Supabase foi registrada nas capturas: `Site URL` no domínio oficial, além de redirecionamento para a raiz e `/?cc_auth_action=recover`.
2. O usuário apresentou captura do recebimento do e-mail **Reset your password** enviado pelo Supabase Auth em 22/10/2026 por volta de 16h18.
3. A captura seguinte mostra o usuário autenticado na página inicial de Costa&Costa, no domínio oficial, por volta de 16h20.
4. Leitura agregada e restrita de `auth_audit_logs` para a conta testada, no intervalo 16h10–16h25:
   - `user_recovery_requested`: 2 eventos;
   - `user_updated_password`: 1 evento às 16h19;
   - `user_modified`: 1 evento às 16h19;
   - `logout`: 2 eventos;
   - `login`: 2 eventos.
   A comparação com a conta de teste foi realizada de forma agregada; nenhum identificador, e-mail, código, token ou valor secreto é exposto aqui.

## Conclusões e limites

- **Aprovado pelo backend:** a conta testada solicitou a recuperação, teve a senha atualizada com sucesso e registrou eventos de logout/login.
- **Aprovado visualmente:** recebimento do e-mail e carregamento da sessão no domínio próprio.
- **Não documentado visualmente:** a tela de definição e confirmação da nova senha; não foi incluída uma captura dessa etapa. A ausência de screenshot **não comprova falha**, pois o log registra atualização bem-sucedida.
- A execução não prova que outras contas, navegadores, links expirados e celulares já foram homologados.
- Não foi necessário alterar o código da recuperação após essa verificação.
- A branch beta continua vinculada ao domínio oficial; a `main` e o PR #16 permanecem preservados.

## Próxima etapa

Homologação de conta nova convidada no beta: cadastro, confirmação de e-mail, onboarding, isolamento RLS, catálogo publicado, planejamento da semana, compras e retorno após logout, preferencialmente com duas contas de teste. Nenhuma credencial deve ser compartilhada em capturas ou registros.
