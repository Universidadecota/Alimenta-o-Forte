-- Costa&Costa | Revisão editorial de 16 preparos curtos — SOMENTE LEITURA.
-- Não altera receitas, transcrições-fonte ou classificação de alergênicos.
-- Executar no projeto Supabase Alimentação Forte gclhailalyrokvmkwllm.
WITH fila(titulo,ordem) AS (
  VALUES
    ('Rolinhos de peru com abacate e rúcula',1),
    ('Rodelas de pepino com sardinha',2),
    ('Pão de linhaça com ovo e abacate',3),
    ('Tilápia grelhada com salada de alface, pepino e cenoura',4),
    ('Smoothie de coco e framboesa + ovo cozido',5),
    ('Peru grelhado com abobrinha e cogumelos',6),
    ('Ovos mexidos com cogumelos',7),
    ('Frutas vermelhas com creme de coco',8),
    ('Salmão assado com abobrinha e aspargos',9),
    ('Guacamole com palitos de pepino e cenoura',10),
    ('Chá de camomila com sementes de abóbora',11),
    ('Salada de ovos com rúcula e tomate-cereja',12),
    ('Molho cremoso de abacate e ervas',13),
    ('Sobrecoxa assada com alecrim e couve-flor assada',14),
    ('Ovos cozidos com páprica e azeitonas',15),
    ('Gazpacho verde de pepino e abacate',16)
)
SELECT f.ordem,
       f.titulo AS titulo_procurado,
       r.id AS recipe_id,
       r.title AS titulo_atual,
       r.instructions AS preparo_exibido,
       r.prep_minutes,
       r.servings,
       s.source_document,
       s.original_ingredients,
       s.original_preparation,
       s.original_time,
       s.original_yield,
       s.ingredient_review_status,
       s.use_stage,
       s.is_plannable
FROM fila f
LEFT JOIN public.recipes r ON r.title = f.titulo
LEFT JOIN public.cc_official_recipe_source_records s
  ON s.recipe_id = r.id AND s.use_stage='personal_pilot'
ORDER BY f.ordem,r.id;
