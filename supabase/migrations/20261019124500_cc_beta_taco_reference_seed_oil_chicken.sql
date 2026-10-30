-- Referências TACO adicionais, sem aprovação nutricional automática.
with source(food_name,variant_name,food_state,taco_number,printed_page,energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g) as (
 values
 ('Óleo de soja','Óleo, de soja','prepared',272,42,884,NULL,NULL,100.0,NULL),
 ('Peito de frango','Frango, peito, sem pele, cru','raw',409,52,119,21.5,0.0,3.0,NULL),
 ('Peito de frango','Frango, peito, sem pele, cozido','cooked',408,52,163,31.5,0.0,3.2,NULL),
 ('Peito de frango','Frango, peito, sem pele, grelhado','grilled',410,52,159,32.0,0.0,2.5,NULL)
)
insert into public.cc_food_nutrition_variants(food_item_id,variant_name,food_state,preparation_method,
 source_name,source_reference,source_url,energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g,
 sodium_mg,review_status,notes)
select f.id,s.variant_name,s.food_state,'','NEPA/UNICAMP — TACO 4a edicao (2011)',
 'Tabela 1, alimento '||s.taco_number||', página impressa '||s.printed_page,
 'https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf',
 s.energy_kcal,s.protein_g,s.carbohydrates_g,s.fats_g,s.fiber_g::numeric,
 null,'awaiting_specialist','Tabela de referência por 100g. Associação alimento-base/variante e composição aguardam especialista.'
from source s join public.food_items f on f.name=s.food_name and f.published=true
on conflict(food_item_id,variant_name,food_state,source_name,source_reference) do nothing;