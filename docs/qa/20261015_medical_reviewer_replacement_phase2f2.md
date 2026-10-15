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
