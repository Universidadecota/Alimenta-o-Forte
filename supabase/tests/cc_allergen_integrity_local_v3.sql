-- Costa&Costa: homologacao complementar LOCAL, sem COMMIT e sem uso em producao.
-- Executar com psql -X -v ON_ERROR_STOP=1; qualquer falha encerra a conexao e faz rollback.
BEGIN;
INSERT INTO auth.users(id,aud,role,email,created_at,updated_at)
VALUES ('a11e0000-0000-4000-8000-000000000031','authenticated','authenticated','qa-reviewer-local@example.invalid',now(),now());
INSERT INTO public.cc_admin_members(user_id) VALUES ('a11e0000-0000-4000-8000-000000000031');
INSERT INTO public.recipes(id,title,category,prep_minutes,servings,published,owner_user_id)
VALUES ('a11e0000-0000-4000-8000-000000000041','[QA] Alergenos - validacao','lunch',15,1,true,null);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a11e0000-0000-4000-8000-000000000031',true);
DO $$
DECLARE v_status text; v_reviewer uuid; v_date timestamptz;
BEGIN
 -- INSERT administrativo efetivo.
 INSERT INTO public.cc_recipe_allergen_reviews(recipe_id,status)
 VALUES ('a11e0000-0000-4000-8000-000000000041','pending');
 IF NOT EXISTS(SELECT 1 FROM public.cc_recipe_allergen_reviews
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000041')
 THEN RAISE EXCEPTION 'FALHA: administrador nao inseriu avaliacao'; END IF;
 RAISE NOTICE 'OK: administrador pode inserir avaliacao';

 -- Verificacao sem evidencia obrigatoria deve falhar por CHECK.
 BEGIN
   UPDATE public.cc_recipe_allergen_reviews
   SET status='verified',cross_contact_status='possible',evidence_notes=''
   WHERE recipe_id='a11e0000-0000-4000-8000-000000000041';
   RAISE EXCEPTION 'FALHA: verified sem evidencia foi aceito';
 EXCEPTION WHEN check_violation THEN NULL; END;
 -- Verificacao sem avaliacao de contato cruzado deve falhar.
 BEGIN
   UPDATE public.cc_recipe_allergen_reviews
   SET status='verified',cross_contact_status='unknown',evidence_notes='Evidencia de QA'
   WHERE recipe_id='a11e0000-0000-4000-8000-000000000041';
   RAISE EXCEPTION 'FALHA: verified com contato desconhecido foi aceito';
 EXCEPTION WHEN check_violation THEN NULL; END;
 RAISE NOTICE 'OK: verified sem evidencia/contato avaliado e bloqueado';

 UPDATE public.cc_recipe_allergen_reviews
 SET status='verified',cross_contact_status='assessed',
 cross_contact_notes='Avaliacao ficticia',evidence_notes='Evidencia ficticia',
 declared_allergens=ARRAY['leite']
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000041';
 SELECT status,reviewed_by,reviewed_at INTO v_status,v_reviewer,v_date
 FROM public.cc_recipe_allergen_reviews
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000041';
 IF v_status<>'verified' OR v_date IS NULL
 OR v_reviewer IS DISTINCT FROM 'a11e0000-0000-4000-8000-000000000031'::uuid
 THEN RAISE EXCEPTION 'FALHA: revisao valida nao registrou identidade/data'; END IF;
 RAISE NOTICE 'OK: verificacao valida registra administrador e data';
END $$;
RESET ROLE;
-- Alterar conteudo da receita oficial invalida uma verificacao anterior.
UPDATE public.recipes SET title='[QA] Receita editada localmente'
WHERE id='a11e0000-0000-4000-8000-000000000041';
DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.cc_recipe_allergen_reviews
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000041'
 AND status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
 THEN RAISE EXCEPTION 'FALHA: edicao da receita nao invalidou revisao'; END IF;
 RAISE NOTICE 'OK: edicao de receita invalida revisao verificada';
END $$;
ROLLBACK;
