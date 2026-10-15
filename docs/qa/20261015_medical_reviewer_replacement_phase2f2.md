# Costa&Costa — Fase 2F.2: substituição da profissional médica indicada

**Data:** 15/10/2026  
**Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** manter em rascunho, sem merge.

## Solicitação recebida
O responsável informou divergências nos dados da indicação anterior e decidiu trabalhar com **Dra. Juliana Cristina Meireles Nogueira**, **CRM-SP 274950**. Não foi fornecido endereço de contato da nova indicada, RQE, especialidade comprovada ou comprovação de que ela já concordou em assumir a revisão.

**Não transportar** o e-mail, o aceite informado anteriormente, a especialidade ou qualquer credencial entre profissionais diferentes.

## Implementação e migração
- `supabase/migrations/20261015232000_cc_medical_candidate_replacement_phase2f2.sql` aplicada remotamente sob nome `cc_medical_candidate_replacement_phase2f2_cloud`; sucesso.
- Adicionados campos `onboarding_status` e `superseded_at` à tabela `cc_medical_reviewer_onboarding`. A candidata anterior permanece somente como trilha de auditoria administrativa, com status `superseded`, `contact_email=NULL`, `contact_verified_at=NULL`, `consent_reported=false`, conta não vinculada e nenhum convite.
- Inserido um único pré-cadastro da **Dra. Juliana Cristina Meireles Nogueira**, CRM-SP `274950`: `onboarding_status=candidate`, `credential_status=pending_official_check`, `invitation_status=not_invited`, `consent_reported=false`, `rqe_number=NULL`, `auth_user_id=NULL`, `contact_email=NULL`. **Não registrar ou assumir especialidade não informada.**
- Atualizada a função `cc_is_medical_reviewer()` para exigir também `onboarding_status='candidate'` e `contact_verified_at IS NOT NULL`; um registro substituído não pode receber acesso. CHECK impede registro substituído com contato ou conta ativa.
- `src/MedicalReviewerOnboarding.tsx`: filtragem explícita `onboarding_status='candidate'` na consulta do painel administrativo. O histórico permanece no banco restrito; somente candidata atual é exibida na seção operacional.

## Conferência independente no Supabase
| Indicador | Resultado |
|---|---|
| Candidatas atuais | **1** (Dra. Juliana Cristina Meireles Nogueira, CRM-SP 274950) |
| Registros substituídos/arquivados | 1 |
| Profissionais médicos ativos | **0** |
| Revisores nutricionais credenciados | **0** |
| Solicitações/pareceres nutricionais | **0** |
| Nutrientes publicados ao consumidor | **0** |
| Refeições planejadas | **25**, preservadas |
| Sessão autenticada simulada não-admin | Nenhuma candidata visível; `cc_is_medical_reviewer()=false` |

A pesquisa web de caráter público abriu o Guia Médico oficial do CREMESP e sua interface de busca; **não confirmou um resultado individual** para CRM-SP 274950. Verificação oficial de nome, situação do CRM, RQE e especialidade permanece obrigatória, sem deduzi-los por outros resultados.

## Pendências e protocolo
1. Confirmar com o responsável se a Dra. Juliana já aceitou participar; solicitar **e-mail que ela escolheu para o convite**, sem usar contato anterior.
2. Validar o CRM-SP 274950 em `https://guiamedico.cremesp.org.br/` ou `https://portal.cfm.org.br/busca-medicos/`, arquivando evidência da checagem. Se for apresentar título de especialista, verificar RQE correspondente.
3. Após essas validações, preparar convite individual autenticado, sem distribuir credenciais nem expor segredo Supabase ao frontend; testar apenas em ambiente controlado.
4. Homologar código atualizado no Windows (`git pull --ff-only` e `npm run build`) e visualmente na seção **Administração → Revisão médica · credenciamento de profissionais**. Devem aparecer somente a candidata atual, verificação pendente, sem contato e sem convite.
5. Não mesclar PR #16 nem publicar dados nutricionais antes de credenciamento, revisão técnica e reconciliação das migrações locais/remotas.

**Build já aprovado até commit `3063f34`** (Vite v6.4.4, build em 20,06s). **Novo código de substituição ainda não compilado no Windows.**


## Fase 2F.3 — evidência CFM e negociação de colaboração ainda pendente

Em **15/10/2026**, o responsável forneceu captura do **Portal CFM — Busca por Médicos** em `https://portal.cfm.org.br/busca-medicos/` com os seguintes dados visíveis:
- **JULIANA CRISTINA MEIRELES NOGUEIRA**, **CRM 274950/SP**; inscrição **Principal**; situação **Regular**;
- data da inscrição **08/07/2025** e primeira inscrição na UF **08/07/2025**;
- campo **Especialidades/Áreas de Atuação: Médico sem especialidade registrada**.
  
**Interpretação:** os dados do registro principal e a situação regular constam da captura enviada pelo usuário, mas essa evidência visual não equivale a uma verificação documental independente, nem permite anunciar título de especialista/RQE. Não equiparar ausência de especialidade registrada a impossibilidade de exercício geral da medicina. Não criar aprovação médica ou nutricional.

O responsável esclareceu que a profissional **foi convidada para negociar participação**, mas **o acordo ainda não foi concluído**. Isso **não é** convite enviado pela plataforma nem concordância contratual. Não procurar nem transferir o e-mail da médica anterior.

### Migrações implementadas e aplicadas
- `supabase/migrations/20261015233000_cc_medical_collaboration_cfm_evidence_phase2f3.sql`, aplicada como `cc_medical_collaboration_cfm_evidence_phase2f3_cloud`: `collaboration_status='invited_pending_negotiation'`, `cfm_screenshot_registration_status='regular'`, `cfm_screenshot_specialty_status='none_registered'`, `cfm_screenshot_date=2026-10-15`, fonte URL do Portal CFM, notas de evidência com ressalva de captura. `credential_status` **permanece** `pending_official_check`, enquanto não houver confirmação documental administrativa.
- `supabase/migrations/20261015233500_cc_medical_invitation_after_agreement_phase2f3b.sql`, aplicada como `cc_medical_invitation_after_agreement_phase2f3b_cloud`: CHECK exige **`collaboration_status='agreed'` e `consent_reported=true`** para `invitation_status` passar a `invited` ou `active`. A função `cc_is_medical_reviewer()` também requer acordo, conta autenticada e credenciamento especializado, ainda ausentes.
- Nenhum contato foi informado para esta profissional, nenhum convite foi enviado, nenhuma conta foi criada, nenhuma concessão de acesso foi realizada.

### Interface
`src/MedicalReviewerOnboarding.tsx` foi atualizado para mostrar separadamente o andamento da negociação e do convite de acesso, situação do CRM e ausência de especialidade registrada conforme captura, a data da consulta, e o credenciamento interno ainda pendente. A seção continua limitada a administradores. **Novo código ainda não homologado visualmente**.

### Build Windows informado pelo responsável
`git pull --ff-only` avançou de `3063f34` para `f14ea38`. `npm run build` (**`tsc -b && vite build`**) concluiu sem erros com Vite 6.4.4, **1.646 módulos transformados**, `index-nDeS1V6H.css`, `index-DIMbo6PB.js`, **20,06 segundos**. Esse resultado homologa o estado anterior à Fase 2F.3. Não exigir repetição de testes anteriores; apenas compilar a nova alteração de interface.

### Verificação no Supabase após a mudança
- Única candidata atual: CRM-SP 274950, negociação convidada/pendente, CRM regular e nenhuma especialidade registrada **conforme captura**.
- `consent_reported=false`, `invitation_status='not_invited'`, `auth_user_id=NULL`, `contact_email=NULL`, `rqe_number=NULL`, `verified_at=NULL`.
- **0** contas médicas ativas, **0** revisores nutricionais, **0** pareceres nutricionais e **0** nutrientes públicos; **25** refeições planejadas preservadas.
- Simulação de sessão sem administração: **0** candidatas visíveis e função de revisão médica retorna `false`.

**Próximas ações:** aguardar resultado da negociação; somente se o acordo for concluído, definir escopo de atuação (sem divulgar título de especialista não registrado), obter e confirmar canal de contato, realizar verificação documental final, preparar autenticação e convite individual. PR #16 permanece rascunho sem merge.

## Homologação de build Windows — Fase 2F.3 (15/10/2026)

Evidência enviada pelo responsável no PowerShell:

- `git pull --ff-only`: fast-forward do commit `f14ea38` ao `1caf164`, na branch `feat/revisao-alergenos-fase1-12out2026`.
- `npm run build`: `tsc -b && vite build` concluídos sem erro de TypeScript. Vite **6.4.4**, **1.646 módulos**, **9,61 s**.
- Saídas: CSS `dist/assets/index-nDeS1V6H.css` (51,26 kB), JS `dist/assets/index-D-tmZV2k.js` (**501,14 kB**; gzip **141,84 kB**).
- Aviso não bloqueante do Rollup/Vite: alguns chunks ultrapassam **500 kB** após minificação. Melhorar code splitting em trabalho futuro; o aviso não reprova o build.

**Classificação:** sincronização e compilação da interface médica com situação CFM e negociação separadas: **APROVADAS**. A captura visual da seção atualizada **não foi enviada ainda**, assim como não houve teste real de convite, aceite, acesso médico ou parecer; não atribuir esse estado como homologado. Não repetir este build nem os testes já concluídos. PR #16 continua em draft sem merge.
