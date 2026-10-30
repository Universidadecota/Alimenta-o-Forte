-- Avaliações simples de receitas: nenhuma escrita em receitas ou ingredientes.
create table if not exists public.cc_recipe_ratings (
 recipe_id uuid not null references public.recipes(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 stars smallint not null check (stars between 1 and 5),
 liked boolean,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(recipe_id,user_id)
);
alter table public.cc_recipe_ratings enable row level security;
revoke all on public.cc_recipe_ratings from anon,authenticated;
grant select,insert,update(stars,liked,updated_at),delete on public.cc_recipe_ratings to authenticated;
create policy cc_rating_own_read on public.cc_recipe_ratings for select to authenticated
 using (user_id=(select auth.uid()));
create policy cc_rating_own_insert on public.cc_recipe_ratings for insert to authenticated
 with check (user_id=(select auth.uid()) and exists (
 select 1 from public.recipes r where r.id=recipe_id and
 (r.published or r.owner_user_id=(select auth.uid()) or public.cc_beta_can_view_recipe(r.id))));
create policy cc_rating_own_update on public.cc_recipe_ratings for update to authenticated
 using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy cc_rating_own_delete on public.cc_recipe_ratings for delete to authenticated
 using (user_id=(select auth.uid()));

-- Estatísticas são agregadas, sem divulgar autores das avaliações.
create or replace function public.cc_recipe_rating_summary(p_recipe_id uuid)
returns table(total bigint,average_stars numeric,likes bigint,dislikes bigint)
language sql stable security definer set search_path='' as $$
 select count(*)::bigint,round(avg(stars)::numeric,1),
 count(*) filter(where liked=true)::bigint,
 count(*) filter(where liked=false)::bigint
 from public.cc_recipe_ratings v
 where v.recipe_id=p_recipe_id and (select auth.uid()) is not null
 and exists(select 1 from public.recipes r where r.id=p_recipe_id and
 (r.published or r.owner_user_id=(select auth.uid()) or public.cc_beta_can_view_recipe(r.id) or public.cc_is_admin()));
$$;
revoke all on function public.cc_recipe_rating_summary(uuid) from public,anon;
grant execute on function public.cc_recipe_rating_summary(uuid) to authenticated;

create or replace function public.cc_admin_recipe_rating_overview()
returns table(recipe_id uuid,title text,total bigint,average_stars numeric,likes bigint,dislikes bigint,published boolean)
language sql stable security definer set search_path='' as $$
 select r.id,r.title,count(v.user_id)::bigint,round(avg(v.stars)::numeric,1),
 count(v.user_id) filter(where v.liked=true)::bigint,
 count(v.user_id) filter(where v.liked=false)::bigint,r.published
 from public.recipes r left join public.cc_recipe_ratings v on v.recipe_id=r.id
 where public.cc_is_admin() and r.owner_user_id is null
 group by r.id,r.title,r.published order by count(v.user_id) desc,r.title
 limit 500;
$$;
revoke all on function public.cc_admin_recipe_rating_overview() from public,anon;
grant execute on function public.cc_admin_recipe_rating_overview() to authenticated;
