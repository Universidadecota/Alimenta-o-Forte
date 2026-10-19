-- Troca atômica das 21 refeições principais; horários opcionais ficam intocados.
-- SECURITY INVOKER: preserva RLS e os gatilhos de elegibilidade existentes.
create or replace function public.cc_replace_week_main_meals(
 p_week_start date, p_meals jsonb, p_expected jsonb
) returns void
language plpgsql security invoker set search_path='' as $$
declare
 v_user uuid := (select auth.uid());
 v_plan uuid;
 v_actual jsonb;
 v_count integer;
 v_unique integer;
 v_invalid integer;
begin
 if v_user is null then raise exception 'Sessão não autenticada'; end if;
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
 -- O UPSERT garante o bloqueio da linha e funciona com RLS do proprietário.
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
 -- Qualquer falha em um registro cancela a transação inteira, sem salvamento parcial.
 insert into public.planned_meals(user_id,meal_plan_id,meal_date,slot,recipe_id,servings)
 select v_user,v_plan,m.meal_date,m.slot,m.recipe_id,m.servings
 from jsonb_to_recordset(p_meals) as m(
  meal_date date,slot text,recipe_id uuid,servings integer)
 on conflict(meal_plan_id,meal_date,slot)
 do update set recipe_id=excluded.recipe_id,servings=excluded.servings;
end
$$;
revoke all on function public.cc_replace_week_main_meals(date,jsonb,jsonb) from public,anon;
grant execute on function public.cc_replace_week_main_meals(date,jsonb,jsonb) to authenticated;
