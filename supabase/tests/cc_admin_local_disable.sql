-- EXCLUSIVAMENTE no Supabase LOCAL (Docker). Reverte privilegio de homologacao.
\set ON_ERROR_STOP on
BEGIN;
DELETE FROM public.cc_admin_members
WHERE user_id='7ad91acd-67ed-47cd-b4cf-f56daa87b719';
COMMIT;
SELECT count(*) AS privilegios_restantes FROM public.cc_admin_members
WHERE user_id='7ad91acd-67ed-47cd-b4cf-f56daa87b719';
