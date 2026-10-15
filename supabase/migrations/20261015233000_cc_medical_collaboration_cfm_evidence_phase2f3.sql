-- Costa&Costa | Fase 2F.3: evidencia de consulta CFM e negociacao, SEM credenciamento.
-- A captura foi fornecida pelo responsavel do projeto, nao constitui verificacao
-- independente da equipe de compliance; preservar os estados separados.
ALTER TABLE public.cc_medical_reviewer_onboarding
 ADD COLUMN IF NOT EXISTS collaboration_status text NOT NULL DEFAULT 'not_contacted',
 ADD COLUMN IF NOT EXISTS cfm_screenshot_registration_status text NOT NULL DEFAULT 'not_documented',
 ADD COLUMN IF NOT EXISTS cfm_screenshot_specialty_status text NOT NULL DEFAULT 'not_documented',
 ADD COLUMN IF NOT EXISTS cfm_screenshot_date date,
 ADD COLUMN IF NOT EXISTS cfm_evidence_source text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS cfm_evidence_notes text NOT NULL DEFAULT '';

ALTER TABLE public.cc_medical_reviewer_onboarding
 ADD CONSTRAINT cc_medical_collaboration_status_check
 CHECK (collaboration_status IN ('not_contacted','invited_pending_negotiation','agreed','declined')),
 ADD CONSTRAINT cc_medical_cfm_registration_evidence_check
 CHECK (cfm_screenshot_registration_status IN ('not_documented','regular','irregular')),
 ADD CONSTRAINT cc_medical_cfm_specialty_evidence_check
 CHECK (cfm_screenshot_specialty_status IN ('not_documented','none_registered','registered')),
 ADD CONSTRAINT cc_medical_cfm_evidence_lengths_check
 CHECK (length(cfm_evidence_source) <= 500 AND length(cfm_evidence_notes)<=1400),
 ADD CONSTRAINT cc_medical_cfm_evidence_required_check
 CHECK (
  (cfm_screenshot_registration_status='not_documented'
    AND cfm_screenshot_specialty_status='not_documented'
    AND cfm_screenshot_date IS NULL)
  OR
  (cfm_screenshot_registration_status<>'not_documented'
    AND cfm_screenshot_specialty_status<>'not_documented'
    AND cfm_screenshot_date IS NOT NULL
    AND length(btrim(cfm_evidence_source)) >= 10
    AND length(btrim(cfm_evidence_notes)) >= 20)
 ),
 ADD CONSTRAINT cc_medical_collaboration_not_a_consent_check
 CHECK (collaboration_status <> 'invited_pending_negotiation' OR consent_reported=false);

-- Recusa de acesso e aprovacao enquanto negociacao nao foi concluida.
-- Mantem a protecao antiga de RQE: nenhum revisor novo pode ser habilitado
-- apenas com um CRM regular visualizado na captura.
ALTER TABLE public.cc_medical_reviewer_onboarding
 ADD CONSTRAINT cc_medical_activation_requires_collaboration_check
 CHECK (invitation_status <> 'active' OR collaboration_status='agreed');

CREATE OR REPLACE FUNCTION public.cc_is_medical_reviewer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
 SELECT EXISTS (
  SELECT 1 FROM public.cc_medical_reviewer_onboarding m
  WHERE m.auth_user_id=(SELECT auth.uid())
    AND m.onboarding_status='candidate'
    AND m.collaboration_status='agreed'
    AND m.invitation_status='active'
    AND m.credential_status='specialty_verified'
    AND m.rqe_number IS NOT NULL
    AND m.verified_at IS NOT NULL
    AND m.contact_verified_at IS NOT NULL
 )
$fn$;
REVOKE ALL ON FUNCTION public.cc_is_medical_reviewer() FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cc_is_medical_reviewer() TO authenticated;

DO $registration$
DECLARE found_count integer;
BEGIN
 SELECT count(*) INTO found_count
 FROM public.cc_medical_reviewer_onboarding
 WHERE council='CRM'
  AND registration_region='SP'
  AND registration_number='274950'
  AND display_name='Dra. Juliana Cristina Meireles Nogueira'
  AND onboarding_status='candidate'
  AND credential_status='pending_official_check'
  AND invitation_status='not_invited'
  AND consent_reported=false
  AND auth_user_id IS NULL
  AND contact_email IS NULL
  AND rqe_number IS NULL
  AND collaboration_status='not_contacted'
  AND cfm_screenshot_registration_status='not_documented';
 IF found_count <> 1 THEN
  RAISE EXCEPTION 'Precondicao do pre-cadastro de Juliana nao atendida: %',found_count;
 END IF;
 UPDATE public.cc_medical_reviewer_onboarding
 SET collaboration_status='invited_pending_negotiation',
     cfm_screenshot_registration_status='regular',
     cfm_screenshot_specialty_status='none_registered',
     cfm_screenshot_date=DATE '2026-10-15',
     cfm_evidence_source='https://portal.cfm.org.br/busca-medicos/',
     cfm_evidence_notes='Captura fornecida pelo responsavel em 15/10/2026: CRM 274950/SP, inscricao principal, situacao regular, 08/07/2025; CFM informa medico sem especialidade registrada. Captura relatada: nao substituir por validacao independente, nem atribuir RQE.',
     updated_at=now()
 WHERE council='CRM' AND registration_region='SP' AND registration_number='274950';
END
$registration$;
COMMENT ON COLUMN public.cc_medical_reviewer_onboarding.collaboration_status IS
 'Situacao da negociacao para colaboracao, distinta de invitation_status (convite de acesso ao app).';
COMMENT ON COLUMN public.cc_medical_reviewer_onboarding.cfm_screenshot_registration_status IS
 'Observacao baseada em captura do cadastro CFM enviada pelo contratante; nao equivale a credenciamento formal.';
COMMENT ON COLUMN public.cc_medical_reviewer_onboarding.cfm_screenshot_specialty_status IS
 'Especialidade visivel na captura CFM, nao inferir titulo ou RQE quando none_registered.';
