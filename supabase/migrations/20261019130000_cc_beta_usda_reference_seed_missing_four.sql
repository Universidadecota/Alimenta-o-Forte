-- USDA FoodData Central (CC0 1.0, domínio público).
-- Fontes especificadas como variantes dos EUA: não são valores típicos garantidos para produtos brasileiros.
-- Todas as associações aguardam revisão nutricional. Não calcular receitas com dados pendentes.
-- https://fdc.nal.usda.gov/api-guide/ (licença e atribuição)
with source(food_name,variant_name,food_state,fdc_id,energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g,sodium_mg,notes) as (
 values
 ('Água potável','Água engarrafada, composição genérica (USDA, EUA)','prepared','174158',0,0,0,0,0,NULL,'Água e minerais variam conforme origem. Zero energia e macronutrientes no registro dos EUA.'),
 ('Cogumelo paris','Cogumelo branco (Agaricus bisporus), cru (USDA, EUA)','raw','169251',22,3.09,3.26,0.34,1,5,'Equivalência taxonômica candidata, não necessariamente do mesmo cultivo no Brasil.'),
 ('Leite de vaca integral','Leite integral 3,25% de gordura, com vitamina D adicionada (USDA, EUA)','prepared','746782',60,3.27,4.63,3.2,NULL,NULL,'Produto de referência dos EUA com fortificação; pode diferir de leite integral UHT comercializado no Brasil.'),
 ('Tilápia','Tilápia, peixe cru (USDA, EUA)','raw','175176',96,20.08,0,1.7,0,52,'Espécie, criação, corte e origem podem alterar composição. Valores USDA SR Legacy, não análise de tilápia brasileira.')
)
insert into public.cc_food_nutrition_variants
(food_item_id,variant_name,food_state,preparation_method,source_name,source_reference,source_url,
 energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g,sodium_mg,review_status,notes)
select f.id,s.variant_name,s.food_state,'','USDA FoodData Central (CC0, Estados Unidos)',
 'USDA FoodData Central ID '||s.fdc_id,
 'https://fdc.nal.usda.gov/food-details/'||s.fdc_id||'/nutrients',
 s.energy_kcal,s.protein_g,s.carbohydrates_g,s.fats_g,s.fiber_g,s.sodium_mg,
 'awaiting_specialist',s.notes
from source s join public.food_items f on f.name=s.food_name and f.published
on conflict(food_item_id,variant_name,food_state,source_name,source_reference) do nothing;
