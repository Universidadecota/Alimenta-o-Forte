-- Costa&Costa N2: painel administrativo de triagem, SEM aprovação automática.
-- Não publica números, nem altera textos de receitas ou inventário original.

create or replace function public.cc_beta_n2_p1_queue()
returns table(
 recipe_id uuid, recipe_title text, recipe_category text,
 original_yield text, ingredient_count bigint,
 ingredient_id uuid, ingredient_position integer, ingredient_text text,
 measure_status text, measure_quantity numeric, measure_unit text,
 measure_ingredient text, food_item_id uuid, nutrition_variant_id uuid,
 match_status text, total_mass_g numeric, mass_evidence text,
 match_notes text, variant_status text
)
language plpgsql stable security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or not (select public.cc_is_admin()) then
  raise exception 'Acesso restrito à revisão administrativa N2'
   using errcode='42501';
 end if;
 return query
 with p1 as (
  select b.recipe_id,count(ri.id)::bigint as ingredient_count
  from public.cc_beta_recipe_access b
  join public.recipes r on r.id=b.recipe_id
  join public.recipe_ingredients ri on ri.recipe_id=r.id
  where b.enabled=true and r.owner_user_id is null and r.archived_at is null
  group by b.recipe_id
  having count(ri.id) between 1 and 5
 )
 select r.id, r.title, r.category::text, sr.original_yield,
  p1.ingredient_count,ri.id,ri.position,ri.name,
  coalesce(mr.review_status,'sem_inventario'),mr.proposed_quantity,
  mr.proposed_unit,mr.proposed_ingredient,
  l.food_item_id,l.nutrition_variant_id,
  coalesce(l.match_status,'sem_vinculo'),l.total_mass_g,
  coalesce(l.mass_evidence,''),coalesce(l.match_notes,''),
  coalesce(v.review_status,'sem_variante')
 from p1
 join public.recipes r on r.id=p1.recipe_id
 join public.cc_official_recipe_source_records sr on sr.recipe_id=r.id
 join public.recipe_ingredients ri on ri.recipe_id=r.id
 left join public.cc_pilot_ingredient_measure_reviews mr on mr.ingredient_id=ri.id
 left join public.cc_recipe_ingredient_food_links l on l.ingredient_id=ri.id
 left join public.cc_food_nutrition_variants v on v.id=l.nutrition_variant_id
 order by p1.ingredient_count,r.title,ri.position;
end $$;
revoke all on function public.cc_beta_n2_p1_queue() from public,anon;
grant execute on function public.cc_beta_n2_p1_queue() to authenticated;

-- A interface só grava candidatos. Uma futura confirmação precisa comprovar
-- massa, ingrediente revisado, variante verificada e revisor credenciado.
create or replace function public.cc_recipe_ingredient_food_link_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.ingredient_id is distinct from old.ingredient_id then
  raise exception 'Nao transfira vinculo entre ingredientes';
 end if;
 if not exists (
  select 1 from public.recipe_ingredients i
  join public.recipes r on r.id=i.recipe_id
  where i.id=new.ingredient_id
   and r.owner_user_id is null and r.archived_at is null
 ) then
  raise exception 'Vinculo permitido apenas para ingrediente de receita oficial ativa';
 end if;
 if not exists (select 1 from public.food_items f where f.id=new.food_item_id) then
  raise exception 'Alimento nao encontrado';
 end if;
 if new.match_status='confirmed' then
  if new.total_mass_g is null or new.total_mass_g<=0
   or length(btrim(new.mass_evidence))<15
   or length(btrim(new.match_notes))<10
   or new.nutrition_variant_id is null then
   raise exception 'Confirmacao exige massa aferida, evidencia, justificativa e variante';
  end if;
  if not exists(
   select 1 from public.cc_pilot_ingredient_measure_reviews mr
   where mr.ingredient_id=new.ingredient_id and mr.review_status='confirmed'
  ) then
   raise exception 'Medida original precisa estar confirmada';
  end if;
  if not exists(
   select 1 from public.cc_food_nutrition_variants v
   where v.id=new.nutrition_variant_id
    and v.food_item_id=new.food_item_id and v.review_status='verified'
  ) then
   raise exception 'Variante nutricional ainda nao verificada';
  end if;
  if not exists(
   select 1 from public.cc_nutrition_reviewers nr
   where nr.user_id=(select auth.uid())
    and nr.active=true and nr.credential_verified_at is not null
  ) then
   raise exception 'Confirmacao exige revisor nutricional credenciado e ativo';
  end if;
 end if;
 new.updated_at=now();
 new.updated_by=(select auth.uid());
 return new;
end $$;
revoke all on function public.cc_recipe_ingredient_food_link_guard() from public,anon,authenticated;
