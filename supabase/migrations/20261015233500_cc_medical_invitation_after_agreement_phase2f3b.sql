-- Costa&Costa 2F.3b: nao liberar sequer convite de acesso durante negociacao.
-- Convite para participar do projeto (externo) e convite de acesso ao app sao eventos distintos.
ALTER TABLE public.cc_medical_reviewer_onboarding
 ADD CONSTRAINT cc_medical_invitation_requires_agreement
 CHECK (
   invitation_status NOT IN ('invited','active')
   OR (collaboration_status='agreed' AND consent_reported)
 );
