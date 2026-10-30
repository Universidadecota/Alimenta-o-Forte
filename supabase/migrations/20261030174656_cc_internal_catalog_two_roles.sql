-- Costa&Costa: catálogo interno, SOMENTE para sessões explicitamente habilitadas.
-- Mantém published=false e não concede acesso ao público ou a qualquer cadastrado.
-- Acervo sujeito a revisão editorial, direitos, segurança e alergênicos.
CREATE SCHEMA IF NOT EXISTS cc_internal_catalog;
REVOKE ALL ON SCHEMA cc_internal_catalog FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS cc_internal_catalog.readers (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 granted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cc_internal_catalog.readers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cc_internal_catalog.readers FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.cc_internal_can_view_recipe(p_recipe_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT (SELECT auth.uid()) IS NOT NULL
 AND EXISTS(
  SELECT 1 FROM cc_internal_catalog.readers a
  WHERE a.user_id=(SELECT auth.uid())
 )
 AND EXISTS(
  SELECT 1 FROM public.recipes r JOIN public.cc_official_recipe_source_records s ON s.recipe_id=r.id
  WHERE r.id=p_recipe_id AND r.owner_user_id IS NULL AND r.published=false
    AND r.archived_at IS NULL AND s.use_stage='personal_pilot'
 );
$$;
REVOKE ALL ON FUNCTION public.cc_internal_can_view_recipe(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_internal_can_view_recipe(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cc_internal_can_plan_recipe(p_recipe_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT public.cc_internal_can_view_recipe(p_recipe_id)
 AND EXISTS(
  SELECT 1 FROM public.cc_official_recipe_source_records s
  WHERE s.recipe_id=p_recipe_id AND s.use_stage='personal_pilot' AND s.is_plannable=true
 );
$$;
REVOKE ALL ON FUNCTION public.cc_internal_can_plan_recipe(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_internal_can_plan_recipe(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cc_internal_recipe_source_summary()
RETURNS TABLE(
 recipe_id uuid,source_kind text,source_meal_name text,source_document text,
 original_ingredients text,original_time text,original_yield text,
 ingredient_review_status text,is_plannable boolean,use_stage text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT s.recipe_id,s.source_kind,s.source_meal_name,s.source_document,
        s.original_ingredients,s.original_time,s.original_yield,
        s.ingredient_review_status,s.is_plannable,s.use_stage
 FROM public.cc_official_recipe_source_records s
 WHERE s.use_stage='personal_pilot'
   AND public.cc_internal_can_view_recipe(s.recipe_id);
$$;
REVOKE ALL ON FUNCTION public.cc_internal_recipe_source_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_internal_recipe_source_summary() TO authenticated;

DROP POLICY IF EXISTS cc_internal_pilot_recipe_read ON public.recipes;
CREATE POLICY cc_internal_pilot_recipe_read ON public.recipes FOR SELECT TO authenticated
USING (owner_user_id IS NULL AND published=false AND (SELECT auth.uid()) IS NOT NULL
 AND public.cc_internal_can_view_recipe(id));

DROP POLICY IF EXISTS cc_internal_pilot_ingredients_read ON public.recipe_ingredients;
CREATE POLICY cc_internal_pilot_ingredients_read ON public.recipe_ingredients FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND public.cc_internal_can_view_recipe(recipe_id));

-- O usuário habilitado pode planejar receitas do piloto que sejam elegíveis,
-- sem contornar RLS, validação de titularidade ou triagem de alergênicos.
CREATE OR REPLACE FUNCTION public.guard_planned_recipe_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if not exists (
  select 1 from public.recipes r where r.id=NEW.recipe_id and (
   (r.owner_user_id is null and r.published=true)
   or r.owner_user_id=NEW.user_id
   or (
    r.owner_user_id is null and r.published=false
    and NEW.user_id=(select auth.uid())
    and (
     (public.cc_is_admin() and exists (
      select 1 from public.cc_official_recipe_source_records p
      where p.recipe_id=r.id and p.use_stage='personal_pilot' and p.is_plannable
     ))
     or public.cc_internal_can_plan_recipe(r.id)
    )
   )
  )
 ) then
  raise exception 'Receita indisponível para este usuário';
 end if;
 return NEW;
end $function$
;
CREATE OR REPLACE FUNCTION public.cc_replace_week_main_meals_v2(p_week_start date, p_meals jsonb, p_expected jsonb, p_release_unavailable_locks boolean)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 v_user uuid := (select auth.uid());
 v_allergies text[];
 v_plan uuid;
 v_actual jsonb;
 v_count integer;
 v_unique integer;
 v_invalid integer;
begin
 if v_user is null then raise exception 'Sessão não autenticada'; end if;
 select p.allergies into v_allergies
 from public.user_preferences p where p.user_id=v_user for share;
 if not found or v_allergies is null then
  raise exception 'Preferências e alergias indisponíveis. Recarregue seu perfil.';
 end if;
 if p_week_start is null or extract(isodow from p_week_start)<>1 then
  raise exception 'Semana inicial inválida';
 end if;
 if jsonb_typeof(p_meals) is distinct from 'array'
    or jsonb_array_length(p_meals)<>21
    or jsonb_typeof(p_expected) is distinct from 'object' then
  raise exception 'É necessário informar as 21 refeições e o estado anterior';
 end if;
 select count(*),count(distinct (m.meal_date,m.slot)),
        count(*) filter (where m.meal_date is null
          or m.meal_date<p_week_start or m.meal_date>p_week_start+6
          or m.slot is null or m.slot not in ('breakfast','lunch','dinner')
          or m.recipe_id is null or m.servings is null or m.servings<1 or m.servings>20)
 into v_count,v_unique,v_invalid
 from jsonb_to_recordset(p_meals) as m(
  meal_date date,slot text,recipe_id uuid,servings integer);
 if v_count<>21 or v_unique<>21 or v_invalid<>0 then
  raise exception 'Refeições inválidas, repetidas ou fora da semana';
 end if;

 -- A trava no plano serializa substituições da semana com upserts manuais.
 insert into public.meal_plans(user_id,week_start)
 values(v_user,p_week_start)
 on conflict(user_id,week_start) do update set week_start=excluded.week_start
 returning id into v_plan;

 select coalesce(jsonb_object_agg(
  to_char(meal_date,'YYYY-MM-DD')||':'||slot,
  jsonb_build_object('recipe_id',recipe_id::text,'servings',servings)), '{}'::jsonb)
 into v_actual
 from public.planned_meals
 where user_id=v_user and meal_plan_id=v_plan
 and slot in ('breakfast','lunch','dinner');
 if v_actual<>p_expected then
  raise exception 'Cardápio alterado em outra sessão. Atualize a semana e tente novamente.';
 end if;

 if exists (
  select 1 from public.planned_meals current_meal
  join jsonb_to_recordset(p_meals) as m(
    meal_date date,slot text,recipe_id uuid,servings integer)
   on m.meal_date=current_meal.meal_date and m.slot=current_meal.slot
  where current_meal.user_id=v_user and current_meal.meal_plan_id=v_plan
    and current_meal.is_locked
    and (current_meal.recipe_id is distinct from m.recipe_id
      or current_meal.servings is distinct from m.servings)
    and not (
      coalesce(p_release_unavailable_locks,false)
      and not exists (
        select 1 from public.recipes r
        where r.id=current_meal.recipe_id
          and (
            (r.owner_user_id is null and r.published=true)
            or r.owner_user_id=v_user
            or public.cc_internal_can_plan_recipe(r.id)
            or (public.cc_is_admin() and exists (
              select 1 from public.cc_official_recipe_source_records s
              where s.recipe_id=r.id and s.use_stage='personal_pilot' and s.is_plannable
            ))
          )
      )
    )
 ) then
  raise exception 'Uma escolha fixada mudou. Libere a refeição no cardápio antes de substituí-la.';
 end if;

 -- Apenas refeições AUTO-GERADAS precisam passar pela pré-triagem de alergias.
 -- A refeição MANUAL fixada não é uma recomendação: ela permanece inalterada,
 -- com aviso de conferência de ingredientes e possível contato cruzado.
 if cardinality(v_allergies)>0 and exists (
  select 1 from jsonb_to_recordset(p_meals) as m(
    meal_date date,slot text,recipe_id uuid,servings integer)
  left join public.planned_meals existing
   on existing.user_id=v_user and existing.meal_plan_id=v_plan
   and existing.meal_date=m.meal_date and existing.slot=m.slot
  where not (coalesce(existing.is_locked,false)
   and existing.recipe_id=m.recipe_id and existing.servings=m.servings)
   and m.recipe_id not in (select public.cc_allergy_candidate_ids())
 ) then
  raise exception 'Uma ou mais sugestões não passaram pela pré-triagem atual de alergênicos. O cardápio não foi alterado.';
 end if;

 insert into public.planned_meals(user_id,meal_plan_id,meal_date,slot,recipe_id,servings)
 select v_user,v_plan,m.meal_date,m.slot,m.recipe_id,m.servings
 from jsonb_to_recordset(p_meals) as m(
  meal_date date,slot text,recipe_id uuid,servings integer)
 on conflict(meal_plan_id,meal_date,slot)
 do update set
  recipe_id=excluded.recipe_id,
  servings=excluded.servings,
  is_locked=case
    when coalesce(p_release_unavailable_locks,false)
     and public.planned_meals.is_locked
     and public.planned_meals.recipe_id is distinct from excluded.recipe_id
     and not exists (
       select 1 from public.recipes r where r.id=public.planned_meals.recipe_id
       and ((r.owner_user_id is null and r.published=true)
         or r.owner_user_id=v_user
         or public.cc_internal_can_plan_recipe(r.id)
            or (public.cc_is_admin() and exists (
           select 1 from public.cc_official_recipe_source_records s
           where s.recipe_id=r.id and s.use_stage='personal_pilot' and s.is_plannable
         )))
     )
    then false else public.planned_meals.is_locked
   end;
 -- A fixação só pode ser liberada quando era inacessível e o usuário consentiu.
end
$function$
;

-- A relação de leitores é gerenciada no banco apenas pela administração.
-- Não cadastrar/autorizar todos os usuários automaticamente.
