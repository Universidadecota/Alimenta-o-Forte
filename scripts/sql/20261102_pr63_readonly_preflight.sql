-- Costa&Costa — PR #63: preflight SOMENTE LEITURA.
-- Não executar DROP, DELETE, TRUNCATE, ALTER, REVOKE ou desativação em produção.
-- A consulta não exibe notas pessoais, e-mails, ingredientes privados nem UUIDs.
-- Rever resultados ANTES de qualquer proposta futura de migração.

-- 1. Inventário e proteção RLS.
select
  count(*)::int as public_table_count,
  count(*) filter(where not c.relrowsecurity)::int as tables_without_rls,
  pg_size_pretty(sum(pg_total_relation_size(c.oid))) as total_size_with_indexes
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r';

-- 2. Fontes do catálogo piloto: NÃO excluir até rastreabilidade migrada.
select
  count(*)::int as pilot_food_sources,
  count(*) filter(where r.review_status='needs_ingredient_review')::int as pending_ingredient_review,
  count(distinct v.food_item_id)::int as foods_with_nutrition_variants
from public.cc_pilot_food_registry r
left join public.cc_food_nutrition_variants v on v.food_item_id=r.food_item_id;

-- 3. Contratos reservados de futuras assinaturas e revisão nutricional.
select 'subscription_plans' as protected_table, count(*)::int as rows from public.subscription_plans
union all select 'user_entitlements',count(*)::int from public.user_entitlements
union all select 'cc_nutrition_reviewers',count(*)::int from public.cc_nutrition_reviewers
union all select 'cc_food_nutrition_review_cases',count(*)::int from public.cc_food_nutrition_review_cases
union all select 'cc_food_nutrition_review_events',count(*)::int from public.cc_food_nutrition_review_events
union all select 'cc_medical_reviewer_onboarding',count(*)::int from public.cc_medical_reviewer_onboarding
union all select 'cc_food_nutrition_drafts',count(*)::int from public.cc_food_nutrition_drafts
union all select 'cc_recipe_nutrition_facts',count(*)::int from public.cc_recipe_nutrition_facts;

-- 4. Dependências de funções e FKs das estruturas piloto.
select c.relname as table_name,
 (select count(*)::int from pg_constraint k where k.contype='f' and k.confrelid=c.oid) as incoming_fk,
 (select count(*)::int from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f'
     and pg_get_functiondef(p.oid) ilike '%'||c.relname||'%') as referring_functions
from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
where ns.nspname='public'
 and c.relname in ('cc_beta_members','cc_beta_recipe_access','cc_pilot_food_registry',
                  'cc_pilot_ingredient_measure_reviews','cc_official_recipe_source_records')
order by c.relname;

-- 5. Integridade de dados já homologados (somente contagens).
with target as (
 select s.id,s.user_id from public.shopping_lists s
 where s.week_start=date '2026-11-02'
   and exists(select 1 from public.cc_shopping_decisions d
     where d.user_id=s.user_id and d.week_start=s.week_start
       and d.kind='choice' and d.choice_text='azeite')
)
select
 (select count(*)::int from public.planned_meals m join target t on t.user_id=m.user_id
   where m.meal_date between date '2026-11-02' and date '2026-11-08') as meals,
 (select count(*)::int from public.shopping_list_items i join target t
   on t.id=i.shopping_list_id and t.user_id=i.user_id where i.completed) as completed_purchases,
 (select count(*)::int from public.cc_shopping_decisions d join target t
   on t.user_id=d.user_id where d.week_start=date '2026-11-02') as shopping_decisions;
