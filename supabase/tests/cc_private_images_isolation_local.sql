-- TESTE LOCAL: isolamento das fotografias privadas entre dois usuarios autenticados.
-- ROLLBACK incondicional; nao altera dados permanentes. NAO EXECUTAR EM PRODUCAO.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE
  v_owner uuid := '7ad91acd-67ed-47cd-b4cf-f56daa87b719';
  v_other uuid := 'a11e0000-0000-4000-8000-000000000091';
  v_recipe uuid := '9edfd1c7-f73a-450e-b251-9d63c994af08';
  v_object text;
  v_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=v_owner) THEN
    RAISE EXCEPTION 'Usuario proprietario de homologacao ausente.';
  END IF;
  INSERT INTO auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
  VALUES (v_other,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'cc-qa-isolamento-local@example.invalid','',now(),now(),now());
  SELECT name INTO v_object FROM storage.objects
    WHERE bucket_id='personal-recipe-images'
      AND name LIKE v_owner::text || '/' || v_recipe::text || '/%'
    LIMIT 1;
  IF v_object IS NULL THEN
    RAISE EXCEPTION 'Fotografia privada de homologacao nao encontrada no Storage local.';
  END IF;
  -- Simula credenciais da segunda conta. A tabela continua com RLS ativa.
  PERFORM set_config('request.jwt.claim.sub',v_other::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_count FROM storage.objects
   WHERE bucket_id='personal-recipe-images' AND name=v_object;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FALHA: outro usuario pode listar a fotografia privada.';
  END IF;
  SELECT count(*) INTO v_count FROM public.recipes WHERE id=v_recipe;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FALHA: outro usuario pode ler a receita pessoal.';
  END IF;
  BEGIN
    DELETE FROM storage.objects WHERE bucket_id='personal-recipe-images' AND name=v_object;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> 0 THEN
      RAISE EXCEPTION 'FALHA: outro usuario excluiu objeto privado.';
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RAISE NOTICE 'OK: outro usuario nao ve receita/foto nem exclui a fotografia.';
END $$;
ROLLBACK;
