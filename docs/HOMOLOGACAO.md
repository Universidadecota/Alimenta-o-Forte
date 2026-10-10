# Homologação Costa&Costa

## Configuração de ambiente
Defina em sua hospedagem, sem colocar chaves privadas no repositório:
- `VITE_SUPABASE_URL=https://gclhailalyrokvmkwllm.supabase.co`
- `VITE_SUPABASE_ANON_KEY` com a chave **publicável/anon** do projeto (nunca service_role).

## Supabase Auth
Em **Authentication > URL Configuration**, configure o endereço do site de testes e os Redirect URLs aprovados. Mantenha a confirmação de e-mail ativada. Configure um provedor SMTP apropriado antes de abrir cadastro público.

## Teste manual obrigatório
1. Execute `npm install` e `npm run build` em ambiente com acesso às dependências.
2. Cadastre uma conta de teste A e valide a confirmação por e-mail.
3. Entre, selecione a semana atual, escolha e substitua refeições, gere a semana e saia.
4. Entre novamente com A e confirme que o cardápio foi restaurado.
5. Entre com conta B e verifique que o cardápio de A não aparece. Tente acesso cruzado por IDs apenas em ambiente de teste.
6. Confira a lista de compras consolidada.
7. Verifique tentativas de criar ou alterar receitas pelo usuário comum: devem ser bloqueadas.
8. Revise as seis receitas marcadas `[Exemplo]` antes de liberar conteúdo ao público.

## Limitações atuais
- A lista de compras é calculada em memória a partir das refeições salvas; o status "comprado" não é persistido no Supabase.
- A geração semanal grava cada refeição sequencialmente; uma falha pode resultar em semana parcialmente atualizada, que o aplicativo relê.
- Cadastro, login e sincronização não foram testados ponta a ponta num site publicado.
- Ainda não há painel administrativo de receitas, assinatura, termos comerciais e conteúdo nutricional revisado.
- Não publique a aplicação como produto comercial até validar segurança, saúde, direitos autorais, privacidade e cobrança.
