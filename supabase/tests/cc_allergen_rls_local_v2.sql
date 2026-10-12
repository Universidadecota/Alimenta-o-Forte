-- Costa&Costa / QA local. NUNCA executar no Supabase remoto de producao.
-- Executar com psql -X -v ON_ERROR_STOP=1. Qualquer erro encerra a sessao;
-- sem COMMIT, a transacao e desfeita automaticamente.
BEGIN;
INSERT INTO auth.users (id,aud,role,email,created_at,updated_at) VALUES
('a11e0000-0000-4000-8000-000000000001','authenticated','authenticated','qa-admin-local@example.invalid',now(),now()),
('a11e0000-0000-4000-8000-000000000002','authenticated','authenticated','qa-common-local@example.invalid',now(),now());
INSERT INTO public.cc_admin_members(user_id) VALUES ('a11e0000-0000-4000-8000-000000000001');
-- published=true para a receita oficial ser visivel atraves da RLS de recipes.
-- A ausencia dessa visibilidade faz o guard rejeitar a receita antes do teste de RLS.
INSERT INTO public.recipes(id,title,category,prep_minutes,servings,published,owner_user_id)
VALUES ('a11e0000-0000-4000-8000-000000000011','[QA local] Receita oficial','lunch',15,1,true,null);
INSERT INTO public.cc_recipe_allergen_reviews(recipe_id,status)
VALUES ('a11e0000-0000-4000-8000-000000000011','pending');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a11e0000-0000-4000-8000-000000000002',true);
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.cc_recipe_allergen_reviews
  WHERE recipe_id='a11e0000-0000-4000-8000-000000000011';
 IF n<>0 THEN RAISE EXCEPTION 'FALHA: usuario comum consultou avaliacao'; END IF;
 BEGIN
  INSERT INTO public.cc_recipe_allergen_reviews(recipe_id,status)
  VALUES ('a11e0000-0000-4000-8000-000000000011','pending');
  RAISE EXCEPTION 'FALHA: usuario comum conseguiu inserir avaliacao';
 EXCEPTION
  WHEN insufficient_privilege THEN NULL;
 END;
 UPDATE public.cc_recipe_allergen_reviews SET status='in_review'
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000011';
 IF FOUND THEN RAISE EXCEPTION 'FALHA: usuario comum alterou avaliacao'; END IF;
 RAISE NOTICE 'OK: usuario comum nao le, nao insere e nao altera avaliacoes';
END $$;

SELECT set_config('request.jwt.claim.sub','a11e0000-0000-4000-8000-000000000001',true);
DO $$
DECLARE n integer; v_reviewer uuid; v_status text;
BEGIN
 SELECT count(*) INTO n FROM public.cc_recipe_allergen_reviews
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000011';
 IF n<>1 THEN RAISE EXCEPTION 'FALHA: administrador nao consultou avaliacao'; END IF;
 UPDATE public.cc_recipe_allergen_reviews
 SET status='verified',declared_allergens=ARRAY['leite'],cross_contact_status='possible',
 evidence_notes='Verificacao ficticia no banco local',
 reviewed_by='a11e0000-0000-4000-8000-000000000002'
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000011';
 SELECT reviewed_by,status INTO v_reviewer,v_status
 FROM public.cc_recipe_allergen_reviews
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000011';
 IF v_reviewer IS DISTINCT FROM 'a11e0000-0000-4000-8000-000000000001'::uuid OR v_status<>'verified'
 THEN RAISE EXCEPTION 'FALHA: identidade do revisor nao foi protegida'; END IF;
 RAISE NOTICE 'OK: administrador le/atualiza e reviewed_by nao pode ser falsificado';
END $$;
RESET ROLE;
INSERT INTO public.recipe_ingredients(recipe_id,name,quantity,unit,position)
VALUES ('a11e0000-0000-4000-8000-000000000011','Leite',200,'ml',0);
DO $$
DECLARE v_status text;
BEGIN
 SELECT status INTO v_status FROM public.cc_recipe_allergen_reviews
 WHERE recipe_id='a11e0000-0000-4000-8000-000000000011';
 IF v_status<>'pending' THEN RAISE EXCEPTION 'FALHA: ingrediente nao invalidou revisao'; END IF;
 RAISE NOTICE 'OK: alteracao de ingrediente invalida avaliacao verificada';
END $$;
ROLLBACK;
