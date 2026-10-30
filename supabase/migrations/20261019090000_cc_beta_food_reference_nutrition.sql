-- Valores referenciais da fonte, sem alterar o status da revisão especializada.
-- Visíveis somente para alimentos publicados no beta e usuários autenticados.
create or replace function public.cc_beta_food_nutrition_references(p_food_id uuid)
returns table(
 variant_name text, food_state text, reference_basis text,
 energy_kcal numeric, protein_g numeric, carbohydrates_g numeric,
 fats_g numeric, fiber_g numeric, sodium_mg numeric,
 source_name text, source_reference text, source_url text, review_status text
)
language sql stable security definer set search_path='' as $$
 select v.variant_name,v.food_state,'100 g da parte comestível'::text,
  v.energy_kcal,v.protein_g,v.carbohydrates_g,v.fats_g,v.fiber_g,v.sodium_mg,
  v.source_name,v.source_reference,v.source_url,v.review_status
 from public.cc_food_nutrition_variants v
 join public.food_items f on f.id=v.food_item_id
 where v.food_item_id=p_food_id
 and auth.uid() is not null
 and (f.published=true or public.cc_is_admin())
 and v.source_name<>'' and v.source_reference<>''
 order by v.variant_name limit 30;
$$;
revoke all on function public.cc_beta_food_nutrition_references(uuid) from PUBLIC, anon;
grant execute on function public.cc_beta_food_nutrition_references(uuid) to authenticated;
