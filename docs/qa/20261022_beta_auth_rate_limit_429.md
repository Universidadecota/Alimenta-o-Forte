# Costa&Costa Beta — incidente de recuperação de senha, HTTP 429

Data: 22/10/2026. Domínio: `https://alimentacaoforte.epsacore.com.br`.

## Evidências enviadas pelo testador
- A página de recuperação mostrou a mensagem genérica de solicitação recebida.
- Em outra tentativa, o DevTools mostrou resposta **HTTP 429** da API Supabase Auth `/auth/v1/recover`.
- As imagens não comprovam que a primeira tentativa tenha enviado novo e-mail; apenas que a solicitação retornou como aceita. O erro 429 **não permite distinguir** se o limite atingido foi o volume de e-mails do projeto, o intervalo do usuário ou a cota de requisições por IP.
- Não há indicação de defeito de DNS, de senha inválida ou de RLS.

## Causa provável e regras oficiais
O Supabase Auth possui múltiplas cotas para recuperação. No provedor de e-mails padrão, a documentação indica **2 e-mails por hora compartilhados pelo projeto**; a API `/auth/v1/recover` também possui intervalo mínimo por usuário e proteção por IP. Quando alguma cota é excedida, retorna HTTP 429.
Fontes: https://supabase.com/docs/guides/auth/rate-limits e https://supabase.com/docs/guides/auth/debugging/error-codes.

## Correção aplicada no frontend beta
- `src/lib/authEmailFeedback.ts` reconhece status HTTP 429 e códigos oficiais `over_email_send_rate_limit` / `over_request_rate_limit`.
- `src/AuthGate.tsx` mostra mensagem amigável e diferente de confirmação de solicitação; evita repetição do mesmo pedido por um intervalo local de 60 segundos. O intervalo **não amplia nem contorna** qualquer cota do Supabase.
- A resposta de sucesso é apresentada como **solicitação recebida**, sem garantir entrega. A política para não revelar existência da conta é preservada.
- A suíte `scripts/test-planner-shopping.mjs` cobre erros 429, códigos e outros erros sem dar falso positivo de envio.
- Nenhuma conta, senha, limite da plataforma ou tabela foi alterada.

## Pendência importante antes de abrir cadastro a diversos convidados
- A conta Free do Supabase pode usar SMTP externo configurado corretamente, sem que isso implique mudar a assinatura. Porém, isso exige provedor de e-mail com suas próprias cotas e credenciais.
- Abrir **Authentication → SMTP Settings**, configurar um provedor transacional verificado e habilitado (por exemplo, Resend, AWS SES ou Zoho quando adequado) utilizando exclusivamente o painel seguro. **Nunca** colocar usuário/senha SMTP, chaves de API ou tokens no GitHub, em capturas ou nesta conversa.
- Confirmar SPF/DKIM/DMARC e entregabilidade, sem sobrescrever DNS já utilizado por outros serviços da EPSA Core.
- Após ativar SMTP próprio, revisar **Authentication → Rate Limits** respeitando a capacidade contratada. Não elevar limites ou desativar proteções sem necessidade.
- Homologar cadastro e recuperação em uma conta nova e por link real, sem repetidas solicitações imediatas.

## Governança
As alterações estão somente na branch `feat/revisao-alergenos-fase1-12out2026`. Preservar `main` e PR #16 draft até aceite consolidado.
