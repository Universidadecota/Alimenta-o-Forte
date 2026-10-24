-- Costa&Costa | acesso beta privado (PROPOSTA, NÃO EXECUTAR SEM HOMOLOGAÇÃO)
-- Mantém published=false e o trigger cc_guard_personal_pilot_publication.
create table if not exists public.cc_beta_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.cc_beta_recipe_access (
 recipe_id uuid primary key references public.recipes(id) on delete cascade,
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.cc_beta_members enable row level security;
alter table public.cc_beta_recipe_access enable row level security;
revoke all on public.cc_beta_members, public.cc_beta_recipe_access from anon, authenticated;
-- Administração dos convites e seleção editorial exclusivamente pelo banco/admin autorizado.

create or replace function public.cc_beta_can_view_recipe(p_recipe_id uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
 select (select auth.uid()) is not null
  and exists (select 1 from public.cc_beta_members m
              where m.user_id=(select auth.uid()) and m.enabled)
  and exists (select 1 from public.cc_beta_recipe_access a
              where a.recipe_id=p_recipe_id and a.enabled)
  and exists (select 1 from public.cc_official_recipe_source_records s
              where s.recipe_id=p_recipe_id and s.use_stage='personal_pilot' and s.is_plannable=true)
  and exists (select 1 from public.recipes r where r.id=p_recipe_id and r.owner_user_id is null and r.published=false);
$$;
revoke all on function public.cc_beta_can_view_recipe(uuid) from public, anon;
grant execute on function public.cc_beta_can_view_recipe(uuid) to authenticated;

create policy cc_beta_select_approved_recipes on public.recipes
 for select to authenticated using (public.cc_beta_can_view_recipe(id));
create policy cc_beta_select_approved_ingredients on public.recipe_ingredients
 for select to authenticated using (public.cc_beta_can_view_recipe(recipe_id));

-- Retorna somente campos necessários à interface, nunca documentação editorial completa.
create or replace function public.cc_beta_recipe_sources()
returns table(recipe_id uuid,source_kind text,source_meal_name text,
 original_ingredients text,original_time text,original_yield text,
 ingredient_review_status text,is_plannable boolean)
language sql stable security definer set search_path='' as $$
 select s.recipe_id,s.source_kind,s.source_meal_name,s.original_ingredients,
        s.original_time,s.original_yield,s.ingredient_review_status,s.is_plannable
 from public.cc_official_recipe_source_records s
 where public.cc_beta_can_view_recipe(s.recipe_id);
$$;
revoke all on function public.cc_beta_recipe_sources() from public, anon;
grant execute on function public.cc_beta_recipe_sources() to authenticated;
-- IMPORTANTE: não inserir usuários nem marcar receitas como enabled nesta migração.
