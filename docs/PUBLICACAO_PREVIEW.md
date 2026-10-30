# Publicação de testes — Costa&Costa

Status: **não publicado**. Esta orientação prepara um preview na Vercel sem liberar o produto ao público.

## 1. Verificação do build
A branch `feat/fundacao-costa-costa-10out2026` deve passar pela checagem de build no GitHub Actions antes de qualquer publicação.

## 2. Preview na Vercel
- Importe o repositório `Universidadecota/Alimenta-o-Forte` no painel da Vercel.
- Selecione Vite como framework, `npm run build` como comando de build, `dist` como diretório de saída.
- Configure no projeto apenas as variáveis públicas de cliente:
  - `VITE_SUPABASE_URL=https://gclhailalyrokvmkwllm.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<chave publicável ou anon do projeto>`
- **Nunca** coloque chaves `service_role` ou `sb_secret_` nas variáveis `VITE_*`.
- Use a URL de preview para testes internos. Evite indexação e distribuição pública enquanto houver receitas demonstrativas.

## 3. Supabase
No painel Supabase, acesse Authentication → URL Configuration:
- Defina o endereço principal aprovado em Site URL.
- Cadastre exatamente os URLs de preview que serão usados para autenticação e recuperação de senha em Redirect URLs.
- Mantenha confirmação de e-mail habilitada. Para testes externos, configure o envio SMTP.

## 4. Testes obrigatórios
- Login, cadastro com confirmação e recuperação de senha.
- Semana anterior/seguinte, cadastro e exclusão de refeições, geração da semana.
- Retorno ao mesmo cardápio após logout/login.
- Cadastro de duas contas e isolamento dos planos pelo RLS.
- Lista de compras consolidada e comportamento no celular.
- Ausência de chaves secretas no código ou nos logs.

## Bloqueadores de lançamento comercial
Termos, política de privacidade, governança de dados sensíveis, revisão nutricional, licenciamento de conteúdo, cobrança, auditoria de segurança e validação ponta a ponta.
