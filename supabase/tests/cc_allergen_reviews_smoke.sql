-- EXECUTAR EXCLUSIVAMENTE EM BRANCH DE TESTES DO SUPABASE.
-- Pré-requisitos: migrações 20261012010000 e 20261012011000 já aplicadas.
-- Este teste usa receitas e IDs efêmeros, com ROLLBACK incondicional.
begin;
do $$
declare
  v_admin uuid;
  v_recipe uuid;
  v_status text;
begin
  select user_id into v_admin from public.cc_admin_members limit 1;
  if v_admin is null then
    raise exception 'Homologação bloqueada: cadastre administrador somente na branch de testes';
  end if;
  insert into public.recipes(title,category,prep_minutes,servings,published,owner_user_id)
  values ('[QA] Teste isolado de alérgenos', 'lunch', 15, 1, false, null)
  returning id into v_recipe;

  insert into public.cc_recipe_allergen_reviews
    (recipe_id,status,declared_allergens,cross_contact_status,evidence_notes)
  values (v_recipe,'pending',array['leite'],'unknown','');
  select status into v_status from public.cc_recipe_allergen_reviews where recipe_id=v_recipe;
  if v_status <> 'pending' then raise exception 'Falha: estado inicial'; end if;

  insert into public.recipe_ingredients(recipe_id,name,quantity,unit,position)
  values (v_recipe,'Leite',200,'ml',0);
  update public.cc_recipe_allergen_reviews
  set status='in_review', cross_contact_status='possible',evidence_notes='Evidência de teste'
  where recipe_id=v_recipe;
  update public.recipe_ingredients set quantity=250
  where recipe_id=v_recipe and name='Leite';
  select status into v_status from public.cc_recipe_allergen_reviews where recipe_id=v_recipe;
  if v_status <> 'pending' then raise exception 'Falha: alteração de ingredientes não invalidou a revisão'; end if;
end $$;
rollback;
-- Testes manuais ainda obrigatórios em uma branch:
-- 1) autenticar usuário comum e verificar SELECT/INSERT/UPDATE negados;
-- 2) autenticar administrador e verificar criação e alteração permitidas;
-- 3) verificar que status verified sem revisor/evidência/contato cruzado é rejeitado;
-- 4) confirmar que sugestões automáticas para perfis com alergias seguem bloqueadas;
-- 5) observar se todos os gatilhos executam sem erros de permissão e sem recursão.
