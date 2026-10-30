-- Base TACO 4a edição, 2011, Tabela 1. Pré-cadastro para o beta.
-- Reproduz exclusivamente linhas específicas da obra original; não atribui valores a um alimento genérico.
-- Os campos "Tr", "NA", '*' e ausências na fonte permanecem NULL, nunca zero estimado.
-- O status awaiting_specialist é obrigatório. Sem cálculo de receitas ou alteração do food_items.
-- Fonte: https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf
with source(food_name,variant_name,food_state,taco_number,printed_page,energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g) as (
 values
 ('Arroz branco','Arroz, tipo 1, cozido','cooked',3,26,128,2.5,28.1,0.2,1.6),
 ('Arroz branco','Arroz, tipo 1, cru','raw',4,26,358,7.2,78.8,0.3,1.6),
 ('Aveia em flocos','Aveia, flocos, crua','raw',7,26,394,13.9,66.6,8.5,9.1),
 ('Amendoim','Amendoim, grão, cru','raw',557,62,544,27.2,20.3,43.9,8),
 ('Amendoim','Amendoim, torrado, salgado','prepared',558,62,606,22.5,18.7,54,7.8),
 ('Azeite de oliva','Azeite, de oliva, extra virgem','prepared',260,42,884,NULL,NULL,100,NULL),
 ('Banana','Banana, nanica, crua','raw',179,36,92,1.4,23.8,0.1,1.9),
 ('Banana','Banana, prata, crua','raw',182,36,98,1.3,26,0.1,2),
 ('Batata-doce','Batata, doce, cozida','cooked',88,30,77,0.6,18.4,0.1,2.2),
 ('Batata-doce','Batata, doce, crua','raw',89,30,118,1.3,28.2,0.1,2.6),
 ('Brócolis','Brócolis, cozido','cooked',100,32,25,2.1,4.4,0.5,3.4),
 ('Brócolis','Brócolis, cru','raw',101,32,25,3.6,4,0.3,2.9),
 ('Café','Café, infusão 10%','prepared',471,56,9,0.7,1.5,0.1,NULL),
 ('Carne bovina','Carne, bovina, patinho, sem gordura, cru','raw',376,50,133,21.7,0,4.5,NULL),
 ('Carne bovina','Carne, bovina, patinho, sem gordura, grelhado','grilled',377,50,219,35.9,0,7.3,NULL),
 ('Castanha-de-caju','Castanha-de-caju, torrada, salgada','prepared',588,64,570,18.5,29.1,46.3,3.7),
 ('Couve-manteiga','Couve, manteiga, crua','raw',115,32,27,2.9,4.3,0.5,3.1),
 ('Couve-manteiga','Couve, manteiga, refogada','sauteed',116,32,90,1.7,8.7,6.6,5.7),
 ('Espinafre','Espinafre, Nova Zelândia, cru','raw',119,32,16,2,2.6,0.2,2.1),
 ('Espinafre','Espinafre, Nova Zelândia, refogado','sauteed',120,32,67,2.7,4.2,5.4,2.5),
 ('Feijão carioca','Feijão, carioca, cozido','cooked',561,62,76,4.8,13.6,0.5,8.5),
 ('Feijão carioca','Feijão, carioca, cru','raw',562,62,329,20,61.2,1.3,18.4),
 ('Feijão preto','Feijão, preto, cozido','cooked',567,62,77,4.5,14,0.5,8.4),
 ('Feijão preto','Feijão, preto, cru','raw',568,62,324,21.3,58.8,1.2,21.8),
 ('Grão-de-bico','Grão-de-bico, cru','raw',575,62,355,21.2,57.9,5.4,12.4),
 ('Iogurte natural','Iogurte, natural','prepared',448,54,51,4.1,1.9,3,NULL),
 ('Laranja','Laranja, pêra, crua','raw',214,38,37,1,8.9,0.1,0.8),
 ('Lentilha','Lentilha, cozida','cooked',577,62,93,6.3,16.3,0.5,7.9),
 ('Lentilha','Lentilha, crua','raw',578,64,339,23.2,62,0.8,16.9),
 ('Maçã','Maçã, Fuji, com casca, crua','raw',222,40,56,0.3,15.2,NULL,1.3),
 ('Mamão','Mamão, Formosa, cru','raw',225,40,45,0.8,11.6,0.1,1.8),
 ('Mamão','Mamão, Papaia, cru','raw',226,40,40,0.5,10.4,0.1,1),
 ('Mandioca','Mandioca, cozida','cooked',129,34,125,0.6,30.1,0.3,1.6),
 ('Mandioca','Mandioca, crua','raw',130,34,151,1.1,36.2,0.3,1.9),
 ('Ovo de galinha','Ovo, de galinha, inteiro, cozido/10minutos','cooked',488,56,146,13.3,0.6,9.5,NULL),
 ('Ovo de galinha','Ovo, de galinha, inteiro, cru','raw',489,56,143,13,1.6,8.9,NULL),
 ('Sardinha','Sardinha, assada','roasted',318,46,164,32.2,0,3,NULL),
 ('Sardinha','Sardinha, inteira, crua','raw',321,46,114,21.1,0,2.7,NULL),
 ('Tofu','Soja, queijo (tofu)','prepared',584,64,64,6.6,2.1,4,0.8),
 ('Tomate','Tomate, com semente, cru','raw',157,34,15,1.1,3.1,0.2,1.2)
)
insert into public.cc_food_nutrition_variants
(food_item_id,variant_name,food_state,preparation_method,source_name,source_reference,source_url,
 energy_kcal,protein_g,carbohydrates_g,fats_g,fiber_g,sodium_mg,review_status,notes)
select f.id,s.variant_name,s.food_state,'',
 'NEPA/UNICAMP — TACO 4a edicao (2011)',
 'Tabela 1, alimento '||s.taco_number||', página impressa '||s.printed_page,
 'https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf',
 s.energy_kcal,s.protein_g,s.carbohydrates_g,s.fats_g,s.fiber_g,NULL,
 'awaiting_specialist',
 'Valores referenciais da TACO por 100g; variedade/preparo descritos no rótulo TACO. Correspondência com o alimento-base depende de revisão especializada. Sódio ainda não transcrito.'
from source s join public.food_items f on f.name=s.food_name and f.published=true
on conflict(food_item_id,variant_name,food_state,source_name,source_reference) do nothing;
