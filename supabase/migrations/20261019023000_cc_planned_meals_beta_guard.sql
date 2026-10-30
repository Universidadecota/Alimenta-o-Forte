create or replace function public.guard_planned_recipe_owner()
returns trigger language plpgsql set search_path='' as $$
begin
 if not exists (
  select 1 from public.recipes r where r.id=NEW.recipe_id and (
   (r.owner_user_id is null and r.published=true)
   or r.owner_user_id=NEW.user_id
   or (
    r.owner_user_id is null and r.published=false
    and NEW.user_id=(select auth.uid())
    and (
     (public.cc_is_admin() and exists (
      select 1 from public.cc_official_recipe_source_records p
      where p.recipe_id=r.id and p.use_stage='personal_pilot' and p.is_plannable
     ))
     or public.cc_beta_can_view_recipe(r.id)
    )
   )
  )
 ) then
  raise exception 'Receita indisponível para este usuário';
 end if;
 return NEW;
end $$;