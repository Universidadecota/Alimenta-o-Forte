-- Costa&Costa / Fase 1 Beta — favoritos persistentes e privados.
-- Cada usuário só pode consultar, favoritar e desfavoritar suas próprias receitas visíveis.
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists cc_favorites_recipe_id_idx on public.favorites(recipe_id);

alter table public.favorites enable row level security;
revoke all on table public.favorites from public, anon, authenticated;
grant select, insert, delete on table public.favorites to authenticated;

drop policy if exists cc_favorites_owner_select on public.favorites;
create policy cc_favorites_owner_select
 on public.favorites for select to authenticated
 using (user_id = (select auth.uid()));

drop policy if exists cc_favorites_owner_insert on public.favorites;
create policy cc_favorites_owner_insert
 on public.favorites for insert to authenticated
 with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.recipes r where r.id = favorites.recipe_id
  )
 );

drop policy if exists cc_favorites_owner_delete on public.favorites;
create policy cc_favorites_owner_delete
 on public.favorites for delete to authenticated
 using (user_id = (select auth.uid()));

comment on table public.favorites is
 'Receitas favoritas privadas por usuário. Não implica aprovação nutricional nem liberação de alergênicos.';
