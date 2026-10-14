-- Costa&Costa: transfere uma refeição entre dois dias da mesma semana de forma atomica.
-- Preserva user_id, meal_plan_id, recipe_id, servings e demais metadados da origem.
-- Nenhuma alteração no esquema das tabelas ou nos dados reais.
create or replace function public.cc_move_planned_meal(
 p_week_start date,
 p_source_date date,
 p_destination_date date,
 p_slot text,
 p_expected_source_recipe uuid,
 p_expected_source_servings integer,
 p_expected_destination_recipe uuid default null,
 p_expected_destination_servings integer default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
 v_user uuid := (select auth.uid());
 v_plan uuid;
 v_source public.planned_meals%rowtype;
 v_destination public.planned_meals%rowtype;
 v_updated integer;
begin
 if v_user is null then
  raise exception 'É necessário entrar na conta para mover uma refeição.' using errcode='42501';
 end if;
 if p_week_start is null or extract(isodow from p_week_start) <> 1
    or p_source_date is null or p_destination_date is null
    or p_source_date not between p_week_start and (p_week_start + 6)
    or p_destination_date not between p_week_start and (p_week_start + 6)
    or p_source_date = p_destination_date
    or p_slot not in ('breakfast','lunch','dinner') then
  raise exception 'Origem ou destino inválido para a semana selecionada.' using errcode='22023';
 end if;
 if p_expected_source_recipe is null or p_expected_source_servings not between 1 and 20
    or (p_expected_destination_recipe is null) <> (p_expected_destination_servings is null)
    or (p_expected_destination_servings is not null and
       p_expected_destination_servings not between 1 and 20) then
  raise exception 'Dados de confirmação da transferência inválidos.' using errcode='22023';
 end if;

 -- A trava do plano serializa movimentações da semana pelo mesmo titular.
 select mp.id into v_plan
 from public.meal_plans mp
 where mp.user_id = v_user and mp.week_start = p_week_start
 for update;
 if v_plan is null then
  raise exception 'O planejamento da semana não foi encontrado.' using errcode='P0001';
 end if;

 -- Trava origem e destino em ordem fixa. RLS continua aplicado (security invoker).
 perform 1
 from public.planned_meals pm
 where pm.user_id=v_user and pm.meal_plan_id=v_plan
   and pm.slot=p_slot and pm.meal_date in (p_source_date,p_destination_date)
 order by pm.meal_date
 for update;

 select pm.* into v_source
 from public.planned_meals pm
 where pm.user_id=v_user and pm.meal_plan_id=v_plan
   and pm.slot=p_slot and pm.meal_date=p_source_date;
 if v_source.id is null then
  raise exception 'A refeição de origem não está mais disponível. Atualize o cardápio.' using errcode='P0001';
 end if;
 if v_source.recipe_id is distinct from p_expected_source_recipe
    or v_source.servings is distinct from p_expected_source_servings then
  raise exception 'A refeição de origem mudou. Atualize o cardápio antes de mover.' using errcode='P0001';
 end if;

 select pm.* into v_destination
 from public.planned_meals pm
 where pm.user_id=v_user and pm.meal_plan_id=v_plan
   and pm.slot=p_slot and pm.meal_date=p_destination_date;
 if v_destination.id is null then
  if p_expected_destination_recipe is not null then
   raise exception 'A refeição no destino mudou. Atualize o cardápio.' using errcode='P0001';
  end if;
 else
  if p_expected_destination_recipe is null
     or v_destination.recipe_id is distinct from p_expected_destination_recipe
     or v_destination.servings is distinct from p_expected_destination_servings then
   raise exception 'A refeição no destino mudou. Atualize o cardápio antes de substituí-la.' using errcode='P0001';
  end if;
  delete from public.planned_meals
   where id=v_destination.id and user_id=v_user and meal_plan_id=v_plan;
 end if;

 update public.planned_meals
  set meal_date=p_destination_date
  where id=v_source.id and user_id=v_user and meal_plan_id=v_plan;
 get diagnostics v_updated = row_count;
 if v_updated <> 1 then
  raise exception 'Não foi possível concluir a transferência.' using errcode='P0001';
 end if;
end;
$$;
revoke all on function public.cc_move_planned_meal(date,date,date,text,uuid,integer,uuid,integer) from public;
revoke all on function public.cc_move_planned_meal(date,date,date,text,uuid,integer,uuid,integer) from anon;
grant execute on function public.cc_move_planned_meal(date,date,date,text,uuid,integer,uuid,integer) to authenticated;
comment on function public.cc_move_planned_meal(date,date,date,text,uuid,integer,uuid,integer) is
 'Transfere atomicamente refeição do próprio usuário para outro dia da semana, com checagem de mudanças e RLS.';
