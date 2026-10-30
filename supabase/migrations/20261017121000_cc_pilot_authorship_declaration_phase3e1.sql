-- Costa&Costa | Fase 3E.1: declaração de autoria das 119 receitas do piloto.
-- A informação foi declarada pelo responsável do projeto em 17/10/2026.
-- Não é certificação jurídica, aprovação clínica ou autorização de publicação.
ALTER TABLE public.cc_official_recipe_source_records
 ADD COLUMN IF NOT EXISTS authorship_reported boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS ai_assistance_reported boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS authorship_statement text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS authorship_reported_at date,
 ADD COLUMN IF NOT EXISTS commercial_rights_status text NOT NULL DEFAULT 'pending_review';

ALTER TABLE public.cc_official_recipe_source_records
 ADD CONSTRAINT cc_official_source_authorship_statement_length
 CHECK (char_length(authorship_statement)<=500),
 ADD CONSTRAINT cc_official_source_commercial_rights_status_check
 CHECK (commercial_rights_status IN ('pending_review','reviewed_for_launch')),
 ADD CONSTRAINT cc_official_source_authorship_date_check
 CHECK (NOT authorship_reported OR (authorship_reported_at IS NOT NULL AND char_length(btrim(authorship_statement))>=15));

DO $declare$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.cc_official_recipe_source_records
 WHERE use_stage='personal_pilot';
 IF n<>119 THEN
  RAISE EXCEPTION 'Declaração de autoria exige o acervo piloto esperado de 119 registros; atual %',n;
 END IF;
 UPDATE public.cc_official_recipe_source_records
 SET authorship_reported=true,
     ai_assistance_reported=true,
     authorship_statement='Responsável pelo Costa&Costa declara que criou as receitas e utilizou Claude IA para adaptações; declaração não verificada juridicamente.',
     authorship_reported_at=DATE '2026-10-17',
     commercial_rights_status='pending_review'
 WHERE use_stage='personal_pilot';
END
$declare$;

COMMENT ON COLUMN public.cc_official_recipe_source_records.authorship_reported IS
 'Declaração de autoria feita pelo responsável, não prova independente de direitos.';
COMMENT ON COLUMN public.cc_official_recipe_source_records.commercial_rights_status IS
 'Separado de autoria declarada: nenhuma liberação comercial na Fase 3E.';
