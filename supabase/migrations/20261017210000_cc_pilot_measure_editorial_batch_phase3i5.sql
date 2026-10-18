-- Costa&Costa — Fase 3I.5: decisões editoriais individuais em lote pequeno.
-- Cada rascunho requer justificativa e versão próprias; a função é atômica.
-- Nenhuma chamada altera recipes, recipe_ingredients, shopping, nutrition ou planned_meals.
CREATE OR REPLACE FUNCTION public.cc_decide_pilot_measure_drafts_batch(p_items jsonb)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_count integer;
 v_item jsonb;
 v_expected_status text;
 v_result text;
 v_saved integer := 0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.cc_is_admin() THEN
  RAISE EXCEPTION 'Sem permissão administrativa para decisões editoriais';
 END IF;
 IF p_items IS NULL OR jsonb_typeof(p_items)<>'array' THEN
  RAISE EXCEPTION 'Lote editorial inválido: informe uma lista';
 END IF;
 v_count := jsonb_array_length(p_items);
 IF v_count NOT BETWEEN 1 AND 5 THEN
  RAISE EXCEPTION 'Selecione de 1 a 5 rascunhos conferidos por lote';
 END IF;
 IF (SELECT count(DISTINCT obj.value->>'ingredient_id')
     FROM jsonb_array_elements(p_items) obj(value)) <> v_count THEN
  RAISE EXCEPTION 'O lote contém ingredientes repetidos';
 END IF;
 -- Ordem fixa reduz conflitos entre dois administradores trabalhando ao mesmo tempo.
 FOR v_item IN
  SELECT obj.value FROM jsonb_array_elements(p_items) obj(value)
  ORDER BY obj.value->>'ingredient_id'
 LOOP
  IF jsonb_typeof(v_item)<>'object'
   OR coalesce(v_item->>'ingredient_id','') !~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR coalesce(jsonb_typeof(v_item->'source_text'),'') <> 'string'
   OR coalesce(jsonb_typeof(v_item->'expected_updated_at'),'') <> 'string'
   OR coalesce(jsonb_typeof(v_item->'expected_quantity'),'') <> 'number'
   OR coalesce(jsonb_typeof(v_item->'expected_unit'),'') <> 'string'
   OR coalesce(jsonb_typeof(v_item->'expected_ingredient'),'') <> 'string'
   OR coalesce(jsonb_typeof(v_item->'action'),'') <> 'string'
   OR coalesce(jsonb_typeof(v_item->'note'),'') <> 'string'
  THEN RAISE EXCEPTION 'Cada rascunho exige origem, versão, medida e justificativa completas';
  END IF;
  IF (v_item->>'action') NOT IN ('confirm','return')
   OR length(btrim(v_item->>'note')) NOT BETWEEN 8 AND 1200
   OR length(v_item->>'source_text')<2
  THEN RAISE EXCEPTION 'Decisão individual ou justificativa inválida';
  END IF;
  v_expected_status := CASE WHEN v_item->>'action'='confirm'
                            THEN 'confirmed' ELSE 'needs_manual_review' END;
  -- Mesma função já homologada individualmente: fonte intacta, draft,
  -- versão de atualização e proposta são novamente verificadas no servidor.
  v_result := public.cc_decide_pilot_measure_draft(
   (v_item->>'ingredient_id')::uuid,
   v_item->>'source_text',
   (v_item->>'expected_updated_at')::timestamptz,
   (v_item->>'expected_quantity')::numeric,
   v_item->>'expected_unit',
   v_item->>'expected_ingredient',
   v_item->>'action',
   btrim(v_item->>'note')
  );
  IF v_result IS DISTINCT FROM v_expected_status THEN
   RAISE EXCEPTION 'Decisão editorial inconsistente; lote cancelado';
  END IF;
  v_saved := v_saved + 1;
 END LOOP;
 RETURN v_saved;
END
$fn$;
REVOKE ALL ON FUNCTION public.cc_decide_pilot_measure_drafts_batch(jsonb)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_decide_pilot_measure_drafts_batch(jsonb) TO authenticated;
COMMENT ON FUNCTION public.cc_decide_pilot_measure_drafts_batch(jsonb) IS
 'Decisão editorial em lote de 1 a 5 rascunhos, atômica, justificada individualmente, com histórico por ingrediente. Não libera cálculos nem altera receitas.';
