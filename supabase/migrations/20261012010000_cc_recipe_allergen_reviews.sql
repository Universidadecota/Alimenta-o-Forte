-- Costa&Costa: base editorial para revisão de alérgenos. NÃO habilita sugestões automáticas.
create table if not exists public.cc_recipe_allergen_reviews (
 recipe_id uuid primary key references public.recipes(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','in_review','verified','rejected')),
 declared_allergens text[] not null default '{}',
 cross_contact_status text not null default 'unknown' check (cross_contact_status in ('unknown','possible','assessed')),
 cross_contact_notes text not null default '',
 evidence_notes text not null default '',
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 updated_at timestamptz not null default now(),
 constraint verified_requires_reviewer check (status <> 'verified' or (reviewed_by is not null and reviewed_at is not null and length(trim(evidence_notes)) > 0 and cross_contact_status <> 'unknown'))
);
alter table public.cc_recipe_allergen_reviews enable row level security;
revoke all on public.cc_recipe_allergen_reviews from public, anon;
grant select, insert, update, delete on public.cc_recipe_allergen_reviews to authenticated;
drop policy if exists "cc_allergen_reviews_admin_select" on public.cc_recipe_allergen_reviews;
create policy "cc_allergen_reviews_admin_select" on public.cc_recipe_allergen_reviews for select to authenticated
using (exists(select 1 from public.cc_admin_members m where m.user_id = (select auth.uid())));
drop policy if exists "cc_allergen_reviews_admin_insert" on public.cc_recipe_allergen_reviews;
create policy "cc_allergen_reviews_admin_insert" on public.cc_recipe_allergen_reviews for insert to authenticated
with check (exists(select 1 from public.cc_admin_members m where m.user_id = (select auth.uid())));
drop policy if exists "cc_allergen_reviews_admin_update" on public.cc_recipe_allergen_reviews;
create policy "cc_allergen_reviews_admin_update" on public.cc_recipe_allergen_reviews for update to authenticated
using (exists(select 1 from public.cc_admin_members m where m.user_id = (select auth.uid())))
with check (exists(select 1 from public.cc_admin_members m where m.user_id = (select auth.uid())));
-- Sem policy DELETE: exclusão de avaliações não é permitida no app.
revoke delete on public.cc_recipe_allergen_reviews from authenticated;
comment on table public.cc_recipe_allergen_reviews is 'Avaliação editorial restrita a administradores; não implica segurança para usuários com alergias nem ativa recomendações.';
