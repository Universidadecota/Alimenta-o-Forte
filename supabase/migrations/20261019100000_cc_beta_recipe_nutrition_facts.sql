-- Fichas nutricionais de receitas: publicação condicionada à validação.
-- Nenhum dado nutricional é presumido ou calculado a partir de textos ambíguos.
create table if not exists public.cc_recipe_nutrition_facts (
 recipe_id uuid primary key references public.recipes(id) on delete cascade,
 basis text not null check (basis in ('whole_recipe','portion')),
 basis_servings numeric not null check (basis_servings>0 and basis_servings<=1000),
 energy_kcal numeric check (energy_kcal>=0 and energy_kcal<=100000),
 protein_g numeric check (protein_g>=0 and protein_g<=100000),
 carbohydrates_g numeric check (carbohydrates_g>=0 and carbohydrates_g<=100000),
 fats_g numeric check (fats_g>=0 and fats_g<=100000),
 fiber_g numeric check (fiber_g>=0 and fiber_g<=100000),
 sodium_mg numeric check (sodium_mg>=0 and sodium_mg<=10000000),
 source_name text not null,
 source_reference text not null,
 method_notes text not null default '',
 status text not null default 'pending' check(status in ('pending','verified')),
 reviewed_at timestamptz,
 updated_at timestamptz not null default now(),
 constraint cc_nutrition_verified_provenance check (
  status<>'verified' or
  (reviewed_at is not null and length(btrim(source_name))>=3 and
   length(btrim(source_reference))>=3 and energy_kcal is not null and
   protein_g is not null and carbohydrates_g is not null and fats_g is not null)
 );
);
alter table public.cc_recipe_nutrition_facts enable row level security;
drop policy if exists cc_recipe_nutrition_admin_read on public.cc_recipe_nutrition_facts;
create policy cc_recipe_nutrition_admin_read on public.cc_recipe_nutrition_facts for select to authenticated
 using(public.cc_is_admin());
drop policy if exists cc_recipe_nutrition_admin_insert on public.cc_recipe_nutrition_facts;
create policy cc_recipe_nutrition_admin_insert on public.cc_recipe_nutrition_facts for insert to authenticated
 with check(public.cc_is_admin());
drop policy if exists cc_recipe_nutrition_admin_update on public.cc_recipe_nutrition_facts;
create policy cc_recipe_nutrition_admin_update on public.cc_recipe_nutrition_facts for update to authenticated
 using(public.cc_is_admin()) with check(public.cc_is_admin());
revoke all on public.cc_recipe_nutrition_facts from public, anon;
grant select,insert,update on public.cc_recipe_nutrition_facts to authenticated;

create or replace function public.cc_beta_recipe_nutrition(p_recipe_id uuid)
returns table(
 basis text, basis_servings numeric,
 energy_kcal numeric,protein_g numeric,carbohydrates_g numeric,
 fats_g numeric,fiber_g numeric,sodium_mg numeric,
 source_name text,source_reference text,method_notes text
)
language sql stable security definer set search_path='' as $$
 select n.basis,n.basis_servings,n.energy_kcal,n.protein_g,n.carbohydrates_g,
 n.fats_g,n.fiber_g,n.sodium_mg,n.source_name,n.source_reference,n.method_notes
 from public.cc_recipe_nutrition_facts n
 join public.recipes r on r.id=n.recipe_id
 where n.recipe_id=p_recipe_id and n.status='verified'
 and auth.uid() is not null and
 (r.published or r.owner_user_id=auth.uid() or public.cc_beta_can_view_recipe(r.id))
 limit 1;
$$;
revoke all on function public.cc_beta_recipe_nutrition(uuid) from public,anon;
grant execute on function public.cc_beta_recipe_nutrition(uuid) to authenticated;
