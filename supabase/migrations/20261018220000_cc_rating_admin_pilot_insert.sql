drop policy if exists cc_rating_own_insert on public.cc_recipe_ratings;
create policy cc_rating_own_insert on public.cc_recipe_ratings
for insert to authenticated with check (
 user_id=(select auth.uid())
 and exists (
  select 1 from public.recipes r where r.id=recipe_id
  and (
   r.published
   or r.owner_user_id=(select auth.uid())
   or public.cc_beta_can_view_recipe(r.id)
   or (public.cc_is_admin() and r.owner_user_id is null
       and exists (select 1 from public.cc_official_recipe_source_records s
                   where s.recipe_id=r.id and s.use_stage='personal_pilot'))
  )
 )
);