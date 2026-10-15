# Costa&Costa — Fase 2F | Preparação de credenciamento de revisora médica
**Data:** 15/10/2026 · **Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** rascunho, sem merge.

## Informação recebida do contratante
- Profissional indicada: **Dra. Thaisa Helena** (nome informado, **não** é confirmação do nome civil completo perante o CFM).
- Conselho: CRM-SP **170476**, número informado.
- Área informada: **Endocrinologia**; especialidade e RQE **não foram confirmados no cadastro oficial**.
- Participação: contratante declarou que ela **já concordou** com o projeto. Declaração administrativa de concordância não equivale a convite, aceite da plataforma, contrato, confirmação de credenciais ou assinatura técnica.

## Referências para verificação externa
- Cadastro oficial: https://portal.cfm.org.br/busca-medicos/ (pesquisa por UF=SP e CRM=170476, situação de inscrição e especialidades registradas/RQE).
- Fontes públicas secundárias oferecem informações profissionais divergentes. Não utilizar esses perfis para habilitar a função de especialista, nem inferir o RQE.
- Lei 8.234/1991, art. 3º, define atribuições privativas de nutricionistas, incluindo planejamento e avaliação de dietas. Revisão médica de conteúdo clínico e revisão nutricional técnica devem permanecer atribuições separadas.

## Migração versionada e aplicada
`supabase/migrations/20261015230000_cc_medical_reviewer_onboarding_phase2f.sql`, aplicada como `cc_medical_reviewer_onboarding_phase2f_cloud`.

- Tabela `cc_medical_reviewer_onboarding`, com CRM, UF, nome indicado, área informada, RQE opcional, comprovação oficial, conta auth individual e estado do convite.
- Registro preliminar para CRM-SP 170476 gravado como `pending_official_check`, `not_invited`, `auth_user_id=NULL`, `rqe_number=NULL` e `consent_reported=true`.
- CHECK de integridade impede estado `active` sem CRM/RQE verificados, referência de verificação, identificador do usuário e confirmação de participação relatada.
- **Nenhum credenciamento profissional é permitido pelo navegador**: a tabela só concede SELECT a autenticados com RLS exigindo `cc_is_admin()`. Não há INSERT/UPDATE/DELETE para `authenticated` e nenhum acesso a `anon`.
- A função `cc_is_medical_reviewer()` só retorna verdadeiro para usuário vinculado, ativo e com especialidade verificada, é negada a acesso anônimo; sem dados habilitados, não concede papel a nenhum usuário.
- **Separação de funções:** não escreve em `cc_nutrition_reviewers`, não chama `cc_decide_food_nutrition_review` e não permite à médica emitir parecer nutricional com base na autorização de revisão médica.

## Código do painel
- Novo `src/MedicalReviewerOnboarding.tsx`: seção apenas de leitura, com indicação profissional, CRM, especialidade relatada, status de credenciais e de convite; informa a necessidade de verificação antes da ativação.
- `src/AdminRecipes.tsx`: seção administrativa expansível **Revisão médica · credenciamento de profissionais**, separada da Biblioteca Nutricional.
- `src/styles.css`: apresentação responsiva.
- A aplicação **ainda não envia convite**, não cria conta Auth e não possui fluxo de parecer médico. Isso será implementado somente após confirmar contato e identidade da profissional.

## Verificações independentes no Supabase
- 1 pré-cadastro, status `pending_official_check`, `not_invited`, sem RQE ou auth_user_id.
- `anon_read=false`, `authenticated_insert=false`, `authenticated_update=false`, RLS ativa.
- Simulação transacional de usuário autenticado não administrador: `cc_is_admin=false`, `cc_is_medical_reviewer=false` e 0 linhas visíveis.
- 0 revisores nutricionais credenciados, 0 pareceres nutricionais, 0 nutrientes publicados. Nenhuma receita ou planejamento foi alterado.

## Pendente para continuar
1. Confirmar com a médica o **endereço de e-mail profissional** que deverá receber o convite (não pesquisar nem presumir e-mail de perfis públicos).
2. Validar diretamente em fonte oficial o nome completo, situação do CRM e **RQE de Endocrinologia**, caso exista. Registrar evidência e data; caso a especialidade não esteja registrada, não usar o título de endocrinologista no aplicativo.
3. Definir escopo clínico da colaboração, termo de responsabilidade profissional e fluxos de parecer, independentemente do registro nutricional; validar juridicamente os termos de uso e atribuições.
4. Implantar **convite individual e autenticação segura** sem expor service_role na interface; requer confirmação explícita do destinatário e testes de e-mail.
5. Homologar `git pull --ff-only` + `npm run build` no Windows, validar a nova seção no desktop e 390px. PR #16 continua rascunho, sem merge.

**Sem efeitos de produção:** nenhum profissional recebeu acesso, nenhuma aprovação foi publicada, nenhuma avaliação nutricional foi alterada. A concordância comunicada pelo administrador foi registrada apenas como contexto.


## Continuação 2F.1 — contato de convite e compilação Windows

Em 15/10/2026, o responsável comunicou o endereço de e-mail de contato escolhido para o convite. **Por privacidade, o endereço completo não foi escrito no repositório**; ficou restrito ao Supabase com RLS administrativa.

- Migração `supabase/migrations/20261015231000_cc_medical_reviewer_contact_phase2f1.sql` aplicada no banco: adiciona `contact_email` (normalização/validação, unicidade) e `contact_verified_at` (nulo por padrão); ativação exige confirmação de e-mail.
- `UPDATE` restrito ao registro CRM-SP 170476 e ao pré-cadastro ainda não convidado; retorno confirmou `contact_registered=true`, `email_verified=false`, `invitation_status=not_invited`, `credential_status=pending_official_check` e `has_account=false`.
- `src/MedicalReviewerOnboarding.tsx` agora exibe o e-mail indicado e informa se houve verificação de posse do contato, **sem recurso de envio automático**.
- Não foi criado nenhum usuário, token, senha ou convite. Não foram atribuídos RQE, qualificação verificada, papel de revisor médico, pareceres ou permissões de publicação.
- Pesquisa em diretórios públicos menciona CRM-SP 170476 e RQE 130834, mas **não comprova oficialmente a especialidade associada ao RQE**; consultar a situação do registro no CFM/CREMESP antes de ativar título de Endocrinologia na plataforma.

### Build local anterior à migração de contato
O responsável enviou resultado Windows: `git pull --ff-only` atualizou o commit até `e21cfa4`; `npm run build` executou `tsc -b && vite build` sem erros, Vite 6.4.4, **1.646 módulos transformados**, compilação em **23,54 segundos**. Essa homologação cobre o estado anterior à inclusão de `contact_email` no frontend. **Nova alteração de interface ainda exige build do estado atual** antes de merge.

### Homologação seguinte
`git pull --ff-only` e `npm run build`; no painel administrativo, abrir **Revisão médica · credenciamento de profissionais** e confirmar contato indicado com estado **pendente**, sem convite e sem ativação. Não repetir testes de outras fases. Antes de enviar qualquer e-mail, obter confirmação do RQE/especialidade na fonte oficial, confirmar o destinatário e exigir fluxo individual de convite autenticado. PR #16 continua rascunho, sem merge.
