-- Costa&Costa | Fase 2D: transcricao verificavel da composicao da TACO 4a edicao.
-- Fonte primária: NEPA/UNICAMP, TACO, 4a ed. revisada (2011), Tabela 1,
-- paginas impressas 30-33 (linhas 70-73, 77-80, 109-110).
-- https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf
-- Colunas per 100 g PARTE COMESTIVEL: kcal, proteina g, lipideos g, carboidratos g, fibras g, sodio mg.
-- "Tr" = traco: registrar NULL, NUNCA converter em zero.
-- A carga permanece EXCLUSIVAMENTE em cc_food_nutrition_variants, status awaiting_specialist.
-- Nenhum dado publicado em food_items, nem formula calculada ou afericao de alergênicos.
DO $transcribe$
DECLARE
  expected_count int;
  written_count int;
BEGIN
  CREATE TEMP TABLE _cc_taco_2d_data (
    food_name text,variant_name text,source_reference text,
    energy_kcal numeric,protein_g numeric,fats_g numeric,carbohydrates_g numeric,fiber_g numeric,sodium_mg numeric
  ) ON COMMIT DROP;
  INSERT INTO _cc_taco_2d_data
    (food_name,variant_name,source_reference,energy_kcal,protein_g,fats_g,carbohydrates_g,fiber_g,sodium_mg)
  VALUES
  ('Abobrinha', 'Abobrinha, italiana, cozida', 'Tabela 1, linha 70, pagina impressa 30', 15, 1.1, 0.2, 3, 1.6, 1),
  ('Abobrinha', 'Abobrinha, italiana, crua', 'Tabela 1, linha 71, pagina impressa 30', 19, 1.1, 0.1, 4.3, 1.4, NULL),
  ('Abobrinha', 'Abobrinha, italiana, refogada', 'Tabela 1, linha 72, pagina impressa 30', 24, 1.1, 0.8, 4.2, 1.4, 2),
  ('Abobrinha', 'Abobrinha, paulista, crua', 'Tabela 1, linha 73, pagina impressa 30', 31, 0.6, 0.1, 7.9, 2.6, 1),
  ('Alface', 'Alface, americana, crua', 'Tabela 1, linha 77, pagina impressa 30', 9, 0.6, 0.1, 1.7, 1, 7),
  ('Alface', 'Alface, crespa, crua', 'Tabela 1, linha 78, pagina impressa 30', 11, 1.3, 0.2, 1.7, 1.8, 3),
  ('Alface', 'Alface, lisa, crua', 'Tabela 1, linha 79, pagina impressa 30', 14, 1.7, 0.1, 2.4, 2.3, 4),
  ('Alface', 'Alface, roxa, crua', 'Tabela 1, linha 80, pagina impressa 30', 13, 0.9, 0.2, 2.5, 2, 7),
  ('Cenoura', 'Cenoura, cozida', 'Tabela 1, linha 109, pagina impressa 32', 30, 0.8, 0.2, 6.7, 2.6, 8),
  ('Cenoura', 'Cenoura, crua', 'Tabela 1, linha 110, pagina impressa 32', 34, 1.3, 0.2, 7.7, 3.2, 3);
  SELECT count(*) INTO expected_count FROM public.cc_food_nutrition_variants v
  JOIN public.food_items f ON f.id=v.food_item_id
  JOIN _cc_taco_2d_data d ON d.food_name=f.name AND d.variant_name=v.variant_name
      AND d.source_reference=v.source_reference
  WHERE v.review_status='needs_source'
    AND v.energy_kcal IS NULL AND v.protein_g IS NULL AND v.carbohydrates_g IS NULL
    AND v.fats_g IS NULL AND v.fiber_g IS NULL AND v.sodium_mg IS NULL
    AND v.source_name='NEPA/UNICAMP — TACO 4a edicao (2011)';
  IF expected_count<>10 THEN
    RAISE EXCEPTION 'Fase 2D abortada: precondicoes de 10 variantes TACO pendentes nao confirmadas; encontradas %',expected_count;
  END IF;

  UPDATE public.cc_food_nutrition_variants v
  SET energy_kcal=d.energy_kcal,
      protein_g=d.protein_g,
      fats_g=d.fats_g,
      carbohydrates_g=d.carbohydrates_g,
      fiber_g=d.fiber_g,
      sodium_mg=d.sodium_mg,
      review_status='awaiting_specialist',
      notes=CASE WHEN d.sodium_mg IS NULL THEN
        'Composicao da TACO 2011 transcrita em 15/10/2026 (100 g de parte comestivel); sodio = Tr na fonte, mantido NULL. Valores ainda dependem de revisao especializada e conciliacao do estado do alimento com as receitas.'
      ELSE
        'Composicao da TACO 2011 transcrita em 15/10/2026 (100 g de parte comestivel). Valores ainda dependem de revisao especializada e conciliacao do estado do alimento com as receitas.'
      END,
      updated_at=now()
  FROM _cc_taco_2d_data d
  JOIN public.food_items f ON f.name=d.food_name
  WHERE v.food_item_id=f.id
    AND v.variant_name=d.variant_name
    AND v.source_reference=d.source_reference
    AND v.review_status='needs_source'
    AND v.energy_kcal IS NULL AND v.protein_g IS NULL AND v.carbohydrates_g IS NULL
    AND v.fats_g IS NULL AND v.fiber_g IS NULL AND v.sodium_mg IS NULL;
  GET DIAGNOSTICS written_count=ROW_COUNT;
  IF written_count<>10 THEN
    RAISE EXCEPTION 'Fase 2D abortada: escritos % em vez de 10 registros',written_count;
  END IF;
END
$transcribe$;
