-- Costa&Costa Beta: escolhas manuais persistentes entre regenerações da semana.
-- ALTER apenas aditivo: cardápios antigos continuam destravados por padrão.
alter table public.planned_meals
 add column if not exists is_locked boolean not null default false;

comment on column public.planned_meals.is_locked is
 'Escolha manual preservada ao regenerar refeições principais; pertence ao usuário do cardápio.';

-- Mantém a assinatura RPC existente para compatibilidade com clientes já abertos.
-- Revalida o perfil no servidor e proíbe substituir uma refeição fixada.
create or replace function public.cc_replace_week_main_meals(
 p_week_start date, p_meals jsonb, p_expected jsonb
) returns void
language plpgsql security invoker set search_path='' as $$
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
 do update set recipe_id=excluded.recipe_id,servings=excluded.servings;
 -- is_locked nunca é zerado pelo gerador; novas entradas usam default false.
end
$$;
revoke all on function public.cc_replace_week_main_meals(date,jsonb,jsonb)
 from public,anon;
grant execute on function public.cc_replace_week_main_meals(date,jsonb,jsonb)
 to authenticated;
comment on function public.cc_replace_week_main_meals(date,jsonb,jsonb) is
 'Beta: regenera somente refeições não fixadas e mantém filtros de alergia no servidor; escolhas manuais fixadas não são certificadas.';
