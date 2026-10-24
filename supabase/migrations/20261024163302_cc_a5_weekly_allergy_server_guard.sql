-- A5: pre-triagem conservadora das receitas para sugestoes semanais de
-- participantes com alergias conhecidas. NAO certifica ausencia de alergenos.
-- Ingredientes ocultos, rotulos e contato cruzado permanecem nao verificados.
-- Outras alergias nao especificadas ("Outros") falham fechadas.
-- O mesmo predicado e usado na lista de candidatos e na gravacao atomica.

create or replace function public.cc_allergy_preliminary_pass(
 p_recipe_id uuid, p_allergies text[]
) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare
 v_user uuid := (select auth.uid());
 v_ingredients text;
 v_title text;
 v_text text;
 v_milk_text text;
 v_allergy text;
begin
 if v_user is null or p_recipe_id is null
    or p_allergies is null or cardinality(p_allergies)=0 then
  return false;
 end if;

 -- Conferir elegibilidade de acesso antes de ler a fonte reservada.
 select r.title,
   coalesce(nullif(btrim(s.original_ingredients),''),
     (select nullif(string_agg(btrim(ri.name), '; '),'')
      from public.recipe_ingredients ri where ri.recipe_id=r.id))
 into v_title,v_ingredients
 from public.recipes r
 left join public.cc_official_recipe_source_records s
   on s.recipe_id=r.id and s.use_stage='personal_pilot' and s.is_plannable=true
 where r.id=p_recipe_id
   and (r.published=true or r.owner_user_id=v_user
        or public.cc_beta_can_view_recipe(r.id));
 if v_ingredients is null or length(btrim(v_ingredients))<15 then
  return false;
 end if;

 -- Triagem por nomes conhecidos em titulo e ingredientes ORIGINAIS completos.
 -- Esta lista e propositalmente restritiva, nao uma prova de seguranca.
 v_text := translate(lower(coalesce(v_title,'')||' '||v_ingredients),
   'áàâãäéèêëíìîïóòôõöúùûüçñ',
   'aaaaaeeeeiiiiooooouuuucn');

 -- Rejeitar descricoes com componentes compostos de composicao nao detalhada.
 -- O aviso da interface tambem explica que outros componentes podem ser incertos.
 if v_text ~ '\m(bacon|linguica|salsicha|salame|presunto|embutidos?|molho pronto|tempero pronto|mistura pronta|caldo em cubo|caldo industrializado|molho industrializado|granola pronta)\M' then
  return false;
 end if;

 -- Uma bebida vegetal nao e leite animal, mas o termo original permanece em
 -- v_text para detectar separadamente soja, amendoas, castanhas ou aveia.
 v_milk_text := regexp_replace(v_text,
   '\m(leite de (coco|soja|aveia|amendoa|amendoas|castanha|castanhas|arroz)|manteiga de (amendoim|coco|amendoa|amendoas|castanha|castanhas))\M',
   'bebida vegetal', 'g');

 foreach v_allergy in array p_allergies loop
  v_allergy := btrim(translate(lower(v_allergy),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn'));
  if v_allergy='leite' then
   if v_milk_text ~ '\m(leite|queijos?|iogurte|kefir|coalhada|requeijao|manteiga|ghee|nata|caseina|whey|soro de leite|creme de leite|parmesao|ricota|mussarela|mozzarella|lactose|lacteo|lactea)\M' then return false; end if;
  elsif v_allergy='gluten' then
   if v_text ~ '\m(trigo|centeio|cevada|aveia|malte|seitan|paes?|macarrao|massa|farinha|cuscuz|semola|farro|panko|croutons?|biscoitos?|torradas?|shoyu|molho ingles|graos de cevada)\M' then return false; end if;
  elsif v_allergy='amendoim' then
   if v_text ~ '\m(amendoins?|peanut|peanuts|pasta de amendoim)\M' then return false; end if;
  elsif v_allergy='castanhas' then
   if v_text ~ '\m(castanhas?|amendoas?|avelas?|macadamias?|nozes|noz|pecan|peca|pistaches?|pinoli|pignoli)\M' then
    -- "noz-moscada" e uma especiaria, nao uma castanha arborea.
    if regexp_replace(v_text,'\mnoz moscada\M','','g')
      ~ '\m(castanhas?|amendoas?|avelas?|macadamias?|nozes|noz|pecan|peca|pistaches?|pinoli|pignoli)\M' then return false; end if;
   end if;
  elsif v_allergy='ovo' then
   if v_text ~ '\m(ovos?|gemas?|claras?|maionese|aioli|omelete|frittata|merengue|albumina)\M' then return false; end if;
  elsif v_allergy='peixes' then
   if v_text ~ '\m(peixes?|salmao|atum|sardinhas?|tilapia|bacalhau|anchovas?|anchovies|anchovy|aliches?|molho de peixe|nori com peixe)\M' then return false; end if;
  elsif v_allergy='crustaceos' then
   if v_text ~ '\m(crustaceos?|camaroes?|camarao|lagostas?|caranguejos?|siris?|krill)\M' then return false; end if;
  elsif v_allergy='soja' then
   if v_text ~ '\m(soja|tofu|shoyu|miso|tempeh|edamame|proteina de soja|lecitina de soja)\M' then return false; end if;
  elsif v_allergy='gergelim' then
   if v_text ~ '\m(gergelim|sesamo|sesame|tahine|tahini)\M' then return false; end if;
  else
   -- "Outros" e qualquer classe nao mapeada precisam ser especificados.
   return false;
  end if;
 end loop;
 return true;
end
$$;

revoke all on function public.cc_allergy_preliminary_pass(uuid,text[])
 from public,anon,authenticated;
comment on function public.cc_allergy_preliminary_pass(uuid,text[]) is
 'Filtro textual interno da pre-triagem A5. Resultado positivo NAO comprova ausencia de alergenos nem de contato cruzado.';

create or replace function public.cc_allergy_candidate_ids()
 returns setof uuid
 language plpgsql stable security definer set search_path='' as $$
declare
 v_user uuid := (select auth.uid());
 v_allergies text[];
begin
 if v_user is null then raise exception 'Sessão não autenticada'; end if;
 select p.allergies into v_allergies
 from public.user_preferences p where p.user_id=v_user;
 if not found or v_allergies is null then
  raise exception 'Preferências e alergias indisponíveis';
 end if;
 if cardinality(v_allergies)=0 then return; end if;
 return query
 select r.id from public.recipes r
 where (r.published=true or r.owner_user_id=v_user
        or public.cc_beta_can_view_recipe(r.id))
   and public.cc_allergy_preliminary_pass(r.id,v_allergies);
end
$$;
revoke all on function public.cc_allergy_candidate_ids() from public,anon;
grant execute on function public.cc_allergy_candidate_ids() to authenticated;
comment on function public.cc_allergy_candidate_ids() is
 'Receitas sem risco textual reconhecido para alergias informadas; nao sao receitas verificadas ou seguras.';

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
 -- Protecao contra alteracoes simultaneas do perfil e chamadas por outros clientes.
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
 if cardinality(v_allergies)>0 and exists (
   select 1 from jsonb_to_recordset(p_meals)
     as m(meal_date date,slot text,recipe_id uuid,servings integer)
   where m.recipe_id not in (select public.cc_allergy_candidate_ids())
 ) then
  raise exception 'Uma ou mais receitas não passaram pela pré-triagem atual de alergênicos. O cardápio não foi alterado.';
 end if;

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
 insert into public.planned_meals(user_id,meal_plan_id,meal_date,slot,recipe_id,servings)
 select v_user,v_plan,m.meal_date,m.slot,m.recipe_id,m.servings
 from jsonb_to_recordset(p_meals) as m(
  meal_date date,slot text,recipe_id uuid,servings integer)
 on conflict(meal_plan_id,meal_date,slot)
 do update set recipe_id=excluded.recipe_id,servings=excluded.servings;
end
$$;
revoke all on function public.cc_replace_week_main_meals(date,jsonb,jsonb)
 from public,anon;
grant execute on function public.cc_replace_week_main_meals(date,jsonb,jsonb)
 to authenticated;
comment on function public.cc_replace_week_main_meals(date,jsonb,jsonb) is
 'A5: troca atomica das 21 refeicoes com filtro textual para alergias no servidor; nao representa certificacao de seguranca alimentar.';
