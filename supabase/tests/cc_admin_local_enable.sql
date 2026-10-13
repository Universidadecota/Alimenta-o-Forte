-- EXCLUSIVAMENTE no Supabase LOCAL (Docker). Nao executar em producao.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id='7ad91acd-67ed-47cd-b4cf-f56daa87b719') THEN
  RAISE EXCEPTION 'Conta de homologacao ausente. Interrompido.';
 END IF;
END $$;
INSERT INTO public.cc_admin_members(user_id)
VALUES ('7ad91acd-67ed-47cd-b4cf-f56daa87b719')
ON CONFLICT(user_id) DO NOTHING;
COMMIT;
SELECT count(*) AS administradores_teste FROM public.cc_admin_members
WHERE user_id='7ad91acd-67ed-47cd-b4cf-f56daa87b719';
