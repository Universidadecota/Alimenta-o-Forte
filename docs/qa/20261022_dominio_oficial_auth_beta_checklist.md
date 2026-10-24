# Costa&Costa — Homologação do domínio oficial e autenticação beta (22/10/2026)

**Domínio:** https://alimentacaoforte.epsacore.com.br/

## Confirmado até agora

- Registro DNS Cloudflare: `alimentacaoforte` CNAME `cname.vercel-dns.com`, proxy DNS only, TTL Auto, criado pelo administrador.
- Vercel `get_domain_config`: `misconfigured=false`, sem conflitos.
- Vercel `get_project_domain`: `verified=true`; associação à branch `feat/revisao-alergenos-fase1-12out2026`, não à `main`.
- Capturas do usuário em 22/10/2026: app abre no domínio oficial, sessão autenticada, tela inicial e cardápio visíveis, conta com preferência de alergia a soja e sem indicação vermelha “Perigoso” no Chrome.
- O bloqueio de sugestões automáticas para perfil com alergia, enquanto alergênicos não forem verificados, permanece correto.
- Código: confirmações por e-mail usam origem oficial e recuperação envia o usuário para `/?cc_auth_action=recover`. O retorno apresenta definição/confirmação de senha, exige pelo menos 8 caracteres, chama `auth.updateUser`, encerra a sessão após sucesso e orienta novo login.
- CI build e testes de redirecionamento passaram; Vercel marcou implantação `Ready`.

## Configuração no painel Supabase (a confirmar)

Em https://supabase.com/dashboard/project/gclhailalyrokvmkwllm/auth/url-configuration

- `Site URL`: `https://alimentacaoforte.epsacore.com.br`.
- Adicionar à lista `Redirect URLs` as URLs exatas:
  - `https://alimentacaoforte.epsacore.com.br/`
  - `https://alimentacaoforte.epsacore.com.br/?cc_auth_action=recover`
- Outras URLs necessárias à operação legada devem ser avaliadas e preservadas deliberadamente; não abrir allowlist com padrão irrestrito.
- A ferramenta Supabase conectada nesta sessão **não expõe leitura/escrita dessa configuração de Auth**. Não afirmar que já está definida.
- Confirmar limites/serviço SMTP antes de convidar usuários; o serviço de e-mail padrão Supabase é limitado e de melhor esforço.

## Critérios para homologação final do beta

1. Abre o domínio oficial por HTTPS sem alertas de risco no navegador real.
2. Cadastro de novo usuário direciona o e-mail de confirmação para o endereço oficial.
3. Login, logout e nova autenticação funcionam.
4. Esqueci a senha → recebe o e-mail → abre formulário no domínio oficial → salva senha nova → precisa fazer novo login.
5. Teste de link expirado mostra orientação para pedir outro e-mail.
6. Segundo usuário não vê receitas privadas, planos, compras ou dados sensíveis do primeiro.
7. Alergias continuam bloqueando sugestões automáticas sem revisão técnica.
8. Experiência mobile e PWA validadas separadamente.

## Observações

- **Build/Ready não é prova** de envio real de e-mail nem de reputação global de segurança do domínio.
- O aviso vermelho do Chrome nas URLs antigas `*.vercel.app` não implica que o domínio oficial está automaticamente seguro para todos; monitorar os sinais de segurança.
- Não compartilhar senha, códigos de recuperação nem links contendo tokens de autenticação em capturas.
- Nenhum merge automático na `main` ou alteração das receitas originais.
