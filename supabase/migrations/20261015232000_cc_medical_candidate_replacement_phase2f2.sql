-- Costa&Costa | Fase 2F.2: substituicao da candidata a revisora medica
-- Preserva o registro anterior para auditoria, mas exclui do painel operacional.
-- Credenciais da substituta NAO foram validadas e nao ha convite, e-mail ou conta ativa.

ALTER TABLE public.cc_medical_reviewer_onboarding
 ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'candidate',
 ADD COLUMN IF NOT EXISTS superseded_at timestamptz;

ALTER TABLE public.cc_medical_reviewer_onboarding
 ADD CONSTRAINT cc_medical_onboarding_status_check
 CHECK (onboarding_status IN ('candidate','superseded')),
 ADD CONSTRAINT cc_medical_superseded_guard
 CHECK (
   onboarding_status <> 'superseded'
   OR (
     superseded_at IS NOT NULL
     AND invitation_status = 'not_invited'
     AND auth_user_id IS NULL
     AND contact_email IS NULL
     AND contact_verified_at IS NULL
   )
 ),
 ADD CONSTRAINT cc_medical_current_not_archived
 CHECK (onboarding_status <> 'candidate' OR superseded_at IS NULL);

-- Nenhum registro arquivado/superado concede perfil de revisor, mesmo com alterações futuras
-- indevidas em outros campos.
CREATE OR REPLACE FUNCTION public.cc_is_medical_reviewer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $fn$
 SELECT EXISTS (
   SELECT 1 FROM public.cc_medical_reviewer_onboarding m
   WHERE m.auth_user_id = (SELECT auth.uid())
     AND m.onboarding_status = 'candidate'
     AND m.invitation_status = 'active'
     AND m.credential_status = 'specialty_verified'
     AND m.rqe_number IS NOT NULL
     AND m.verified_at IS NOT NULL
     AND m.contact_verified_at IS NOT NULL
 )
$fn$;
REVOKE ALL ON FUNCTION public.cc_is_medical_reviewer() FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cc_is_medical_reviewer() TO authenticated;

DO $swap$
DECLARE prior_count int;
        current_count int;
BEGIN
  -- Nao arquivar um acesso que possa estar ativo; exigimos o estado previamente auditado.
  SELECT count(*) INTO prior_count
  FROM public.cc_medical_reviewer_onboarding
  WHERE council='CRM' AND registration_region='SP' AND registration_number='170476'
    AND onboarding_status='candidate'
    AND invitation_status='not_invited'
    AND auth_user_id IS NULL
    AND credential_status='pending_official_check';
  SELECT count(*) INTO current_count
  FROM public.cc_medical_reviewer_onboarding
  WHERE council='CRM' AND registration_region='SP' AND registration_number='274950';
  IF prior_count <> 1 OR current_count <> 0 THEN
    RAISE EXCEPTION 'Substituicao abortada: precondicoes nao atendidas (anterior %, nova %)', prior_count,current_count;
  END IF;

  UPDATE public.cc_medical_reviewer_onboarding
  SET onboarding_status='superseded',
      superseded_at=now(),
      contact_email=NULL,
      contact_verified_at=NULL,
      consent_reported=false,
      updated_at=now()
  WHERE council='CRM' AND registration_region='SP' AND registration_number='170476';

  INSERT INTO public.cc_medical_reviewer_onboarding
   (display_name,council,registration_region,registration_number,claimed_specialty,
    consent_reported,credential_status,invitation_status,onboarding_status)
  VALUES
   ('Dra. Juliana Cristina Meireles Nogueira','CRM','SP','274950','',
    false,'pending_official_check','not_invited','candidate');
END
$swap$;

COMMENT ON COLUMN public.cc_medical_reviewer_onboarding.onboarding_status IS
 'candidate: indicada e em preparacao; superseded: substituida e inativa, mantida para trilha administrativa.';
