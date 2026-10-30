-- Endurece a validação: nenhuma ficha nutricional pode ser publicada como
-- verificada sem um revisor credenciado e ativo.
alter table public.cc_recipe_nutrition_facts
 add column if not exists reviewed_by uuid references public.cc_nutrition_reviewers(user_id);
alter table public.cc_recipe_nutrition_facts
 drop constraint if exists cc_recipe_nutrition_reviewed_by_required;
alter table public.cc_recipe_nutrition_facts
 add constraint cc_recipe_nutrition_reviewed_by_required
 check (status<>'verified' or reviewed_by is not null);
create or replace function public.cc_recipe_nutrition_reviewer_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if NEW.status='verified' and not exists (
  select 1 from public.cc_nutrition_reviewers nr
   where nr.user_id=NEW.reviewed_by and nr.active=true
   and nr.credential_verified_at is not null
 ) then
  raise exception 'A publicação nutricional exige revisor credenciado e ativo';
 end if;
 return NEW;
end $$;
drop trigger if exists cc_recipe_nutrition_reviewer_check on public.cc_recipe_nutrition_facts;
create trigger cc_recipe_nutrition_reviewer_check
before insert or update on public.cc_recipe_nutrition_facts
for each row execute function public.cc_recipe_nutrition_reviewer_guard();
revoke all on function public.cc_recipe_nutrition_reviewer_guard() from public,anon,authenticated;
