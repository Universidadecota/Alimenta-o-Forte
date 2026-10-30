create or replace function public.cc_beta_can_view_recipe(p_recipe_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null
  and exists (select 1 from public.cc_beta_recipe_access a where a.recipe_id=p_recipe_id and a.enabled)
  and exists (select 1 from public.cc_official_recipe_source_records s where s.recipe_id=p_recipe_id and s.use_stage='personal_pilot' and s.is_plannable=true)
  and exists (select 1 from public.recipes r where r.id=p_recipe_id and r.owner_user_id is null and r.published=false);
$$;
revoke all on function public.cc_beta_can_view_recipe(uuid) from public,anon;
grant execute on function public.cc_beta_can_view_recipe(uuid) to authenticated;