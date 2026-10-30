alter table public.recipes add column owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.recipes add column archived_at timestamptz;
alter table public.recipes add constraint recipes_private_never_published check (owner_user_id is null or published = false);
create index recipes_owner_idx on public.recipes(owner_user_id) where owner_user_id is not null;
create policy "recipes_owner_read" on public.recipes for select to authenticated using (owner_user_id = (select auth.uid()) and archived_at is null);
create policy "recipes_owner_create" on public.recipes for insert to authenticated with check (owner_user_id = (select auth.uid()) and published = false and archived_at is null);
create policy "recipes_owner_edit" on public.recipes for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()) and published = false);
create policy "ingredients_owner_read" on public.recipe_ingredients for select to authenticated using (exists (select 1 from public.recipes r where r.id=recipe_id and r.owner_user_id=(select auth.uid())));
create policy "ingredients_owner_create" on public.recipe_ingredients for insert to authenticated with check (exists (select 1 from public.recipes r where r.id=recipe_id and r.owner_user_id=(select auth.uid()) and r.archived_at is null));
create policy "ingredients_owner_edit" on public.recipe_ingredients for update to authenticated using (exists (select 1 from public.recipes r where r.id=recipe_id and r.owner_user_id=(select auth.uid()))) with check (exists (select 1 from public.recipes r where r.id=recipe_id and r.owner_user_id=(select auth.uid())));
create policy "ingredients_owner_delete" on public.recipe_ingredients for delete to authenticated using (exists (select 1 from public.recipes r where r.id=recipe_id and r.owner_user_id=(select auth.uid())));
create or replace function public.guard_planned_recipe_owner() returns trigger language plpgsql set search_path = '' as $$
begin
 if not exists (select 1 from public.recipes r where r.id=new.recipe_id and (r.owner_user_id is null and r.published=true or r.owner_user_id=new.user_id)) then
  raise exception 'Receita indisponível para este usuário';
 end if;
 return new;
end $$;
create trigger guard_planned_recipe_owner_trg before insert or update on public.planned_meals for each row execute function public.guard_planned_recipe_owner();
