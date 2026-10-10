-- Seed de homologação: receitas demonstrativas, não constituem plano nutricional.
with entries(title,category,prep_minutes,ingredients) as (
 values
 ('[Exemplo] Omelete de tomate','breakfast',15,'[{"name":"Ovo","quantity":2,"unit":"un"},{"name":"Tomate","quantity":1,"unit":"un"}]'::jsonb),
 ('[Exemplo] Iogurte com banana e aveia','breakfast',5,'[{"name":"Iogurte natural","quantity":170,"unit":"g"},{"name":"Banana","quantity":1,"unit":"un"},{"name":"Aveia","quantity":30,"unit":"g"}]'::jsonb),
 ('[Exemplo] Frango com arroz, feijão e salada','lunch',35,'[{"name":"Peito de frango","quantity":150,"unit":"g"},{"name":"Arroz","quantity":80,"unit":"g"},{"name":"Feijão","quantity":100,"unit":"g"},{"name":"Alface","quantity":50,"unit":"g"}]'::jsonb),
 ('[Exemplo] Peixe assado e legumes','lunch',40,'[{"name":"Filé de peixe","quantity":180,"unit":"g"},{"name":"Batata","quantity":150,"unit":"g"},{"name":"Cenoura","quantity":80,"unit":"g"}]'::jsonb),
 ('[Exemplo] Sopa de legumes com frango','dinner',30,'[{"name":"Peito de frango","quantity":120,"unit":"g"},{"name":"Abobrinha","quantity":100,"unit":"g"},{"name":"Cenoura","quantity":100,"unit":"g"}]'::jsonb),
 ('[Exemplo] Salada de grão-de-bico e ovos','dinner',20,'[{"name":"Grão-de-bico cozido","quantity":140,"unit":"g"},{"name":"Ovo","quantity":2,"unit":"un"},{"name":"Tomate","quantity":1,"unit":"un"}]'::jsonb)
), inserted as (
 insert into public.recipes(title,category,prep_minutes,published,description)
 select title,category,prep_minutes,true,'Receita demonstrativa para homologação; sujeita a revisão editorial e nutricional.' from entries
 returning id,title
)
insert into public.recipe_ingredients(recipe_id,name,quantity,unit,position)
select inserted.id, ingredient->>'name',(ingredient->>'quantity')::numeric, ingredient->>'unit',ord::integer
from inserted join entries using(title)
cross join lateral jsonb_array_elements(entries.ingredients) with ordinality as j(ingredient,ord);
