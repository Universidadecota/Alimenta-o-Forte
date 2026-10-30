-- Complemento da Fase 1: evita revisão falsificada e invalida avaliações após mudanças relevantes.
-- Executar somente após homologação da migração base, em ambiente controlado.
create or replace function public.cc_allergen_review_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare is_official boolean;
begin
 select (r.owner_user_id is null) into is_official
 from public.recipes r where r.id = new.recipe_id;
 if is_official is distinct from true then
   raise exception 'Avaliações de alérgenos são restritas às receitas oficiais';
 end if;
 if tg_op = 'UPDATE' and new.recipe_id is distinct from old.recipe_id then
   raise exception 'Não é permitido transferir uma avaliação para outra receita';
 end if;
 if new.status = 'verified' then
   if tg_op = 'INSERT' or old.status is distinct from 'verified' or
      new.declared_allergens is distinct from old.declared_allergens or
      new.cross_contact_status is distinct from old.cross_contact_status or
      new.cross_contact_notes is distinct from old.cross_contact_notes or
      new.evidence_notes is distinct from old.evidence_notes then
     new.reviewed_by := (select auth.uid());
     new.reviewed_at := now();
   else
     new.reviewed_by := old.reviewed_by;
     new.reviewed_at := old.reviewed_at;
   end if;
 else
   new.reviewed_by := null;
   new.reviewed_at := null;
 end if;
 new.updated_at := now();
 return new;
end; $$;
drop trigger if exists cc_allergen_review_guard_trigger on public.cc_recipe_allergen_reviews;
create trigger cc_allergen_review_guard_trigger
before insert or update on public.cc_recipe_allergen_reviews
for each row execute function public.cc_allergen_review_guard();

create or replace function public.cc_invalidate_allergen_review()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_id uuid;
begin
 target_id := case when tg_op = 'DELETE' then old.recipe_id else new.recipe_id end;
 update public.cc_recipe_allergen_reviews
 set status='pending',reviewed_by=null,reviewed_at=null,updated_at=now()
 where recipe_id=target_id and status <> 'pending';
 if tg_op = 'UPDATE' and old.recipe_id is distinct from new.recipe_id then
   update public.cc_recipe_allergen_reviews
   set status='pending',reviewed_by=null,reviewed_at=null,updated_at=now()
   where recipe_id=old.recipe_id and status <> 'pending';
 end if;
 return null;
end; $$;
revoke all on function public.cc_invalidate_allergen_review() from public,anon,authenticated;
drop trigger if exists cc_allergen_ingredients_invalidate on public.recipe_ingredients;
create trigger cc_allergen_ingredients_invalidate
after insert or update or delete on public.recipe_ingredients
for each row execute function public.cc_invalidate_allergen_review();

create or replace function public.cc_invalidate_allergen_review_recipe()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 update public.cc_recipe_allergen_reviews
 set status='pending',reviewed_by=null,reviewed_at=null,updated_at=now()
 where recipe_id=new.id and status <> 'pending';
 return null;
end; $$;
revoke all on function public.cc_invalidate_allergen_review_recipe() from public,anon,authenticated;
drop trigger if exists cc_allergen_recipe_invalidate on public.recipes;
create trigger cc_allergen_recipe_invalidate
after update of instructions,description,title,servings on public.recipes
for each row when (
 old.instructions is distinct from new.instructions or
 old.description is distinct from new.description or
 old.title is distinct from new.title or
 old.servings is distinct from new.servings
)
execute function public.cc_invalidate_allergen_review_recipe();
