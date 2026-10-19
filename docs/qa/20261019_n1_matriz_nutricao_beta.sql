-- COSTA&COSTA N1 - MATRIZ DE AUDITORIA NUTRICIONAL DAS RECEITAS BETA
-- SOMENTE LEITURA. Executar no SQL Editor Supabase com acesso administrativo.
-- O resultado inclui títulos: não exportar os títulos a um repositório público.
-- Critério de prontidão: não basta possuir rendimento nominal ou expressão
-- de ingrediente; a massa, a variante alimentar e a origem do valor nutricional
-- precisam de comprovação, e a ficha técnica deve estar revisada.
WITH beta AS (
 SELECT b.recipe_id,r.title,r.category,r.servings,
  s.source_kind,s.original_yield,s.ingredient_review_status,
  ts.review_status AS technical_sheet_status,
  ts.reference_yield_quantity,ts.reference_yield_unit
 FROM public.cc_beta_recipe_access b
 JOIN public.recipes r ON r.id=b.recipe_id
 JOIN public.cc_official_recipe_source_records s ON s.recipe_id=r.id
 LEFT JOIN public.cc_recipe_technical_sheets ts ON ts.recipe_id=r.id
 WHERE b.enabled=true
), ingredient_summary AS (
 SELECT recipe_id,count(*) ingredient_count,
  count(*) FILTER (WHERE quantity>0 AND lower(unit) IN ('g','kg','ml','l')) metric_amounts
 FROM public.recipe_ingredients GROUP BY recipe_id
), measure_summary AS (
 SELECT recipe_id,count(*) measure_reviews,
  count(*) FILTER (WHERE review_status='confirmed') confirmed_measures,
  count(*) FILTER (WHERE review_status='draft') draft_measures,
  count(*) FILTER (WHERE review_status='pending') pending_measures
 FROM public.cc_pilot_ingredient_measure_reviews GROUP BY recipe_id
), link_summary AS (
 SELECT ri.recipe_id,count(l.ingredient_id) food_links,
  count(l.ingredient_id) FILTER (
   WHERE l.match_status='confirmed' AND l.total_mass_g>0
    AND l.nutrition_variant_id IS NOT NULL AND v.review_status='verified'
  ) verified_mass_variant_links
 FROM public.recipe_ingredients ri
 LEFT JOIN public.cc_recipe_ingredient_food_links l ON l.ingredient_id=ri.id
 LEFT JOIN public.cc_food_nutrition_variants v ON v.id=l.nutrition_variant_id
 GROUP BY ri.recipe_id
)
SELECT substring(md5(beta.recipe_id::text) from 1 for 12) AS codigo_auditoria,
 beta.title, beta.category, beta.source_kind,beta.servings,beta.original_yield,
 coalesce(i.ingredient_count,0) AS ingredientes_total,
 coalesce(m.measure_reviews,0) AS medidas_em_inventario,
 coalesce(m.confirmed_measures,0) AS medidas_confirmadas,
 coalesce(m.draft_measures,0) AS medidas_em_rascunho,
 coalesce(m.pending_measures,0) AS medidas_pendentes,
 coalesce(i.metric_amounts,0) AS medidas_metricas_estruturadas,
 coalesce(l.food_links,0) AS vinculos_alimento,
 coalesce(l.verified_mass_variant_links,0) AS vinculos_massa_variante_validados,
 coalesce(beta.technical_sheet_status,'ausente') AS ficha_tecnica,
 coalesce(beta.reference_yield_quantity::text||' '||beta.reference_yield_unit,'nao_aferido') AS rendimento_tecnico,
 beta.ingredient_review_status AS revisao_ingredientes,
 CASE WHEN coalesce(i.ingredient_count,0)<=5 THEN 'P1'
  WHEN coalesce(i.ingredient_count,0)<=9 THEN 'P2' ELSE 'P3' END AS prioridade_triagem,
 CASE WHEN
  beta.ingredient_review_status='structured_confirmed'
  AND beta.technical_sheet_status IN ('verified','approved')
  AND beta.reference_yield_quantity>0
  AND coalesce(m.confirmed_measures,0)=coalesce(i.ingredient_count,0)
  AND coalesce(l.verified_mass_variant_links,0)=coalesce(i.ingredient_count,0)
  AND coalesce(i.ingredient_count,0)>0
 THEN 'PRONTA_PARA_REVISAO_FINAL_DO_CALCULO'
 ELSE 'BLOQUEADA_PARA_CALCULO' END AS status_atual,
 concat_ws(' | ',
  CASE WHEN beta.ingredient_review_status<>'structured_confirmed' THEN 'ESTRUTURAR_INGREDIENTES' END,
  CASE WHEN coalesce(m.confirmed_measures,0)<coalesce(i.ingredient_count,0) THEN 'CONFIRMAR_MEDIDAS' END,
  CASE WHEN coalesce(l.verified_mass_variant_links,0)<coalesce(i.ingredient_count,0) THEN 'PESAR_E_VINCULAR_VARIANTES' END,
  CASE WHEN beta.technical_sheet_status NOT IN ('verified','approved') OR beta.technical_sheet_status IS NULL OR beta.reference_yield_quantity IS NULL THEN 'REVISAR_FICHA_E_RENDIMENTO' END
 ) AS bloqueios
FROM beta
LEFT JOIN ingredient_summary i ON i.recipe_id=beta.recipe_id
LEFT JOIN measure_summary m ON m.recipe_id=beta.recipe_id
LEFT JOIN link_summary l ON l.recipe_id=beta.recipe_id
ORDER BY ingredientes_total,beta.category,beta.title;
