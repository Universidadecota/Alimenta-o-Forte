-- Costa&Costa Fase 3I.3 — gravação transacional de ATÉ 20 rascunhos editoriais.
-- Exige confirmação no frontend. Nunca marca "confirmed" nem edita receitas.
CREATE OR REPLACE FUNCTION public.cc_save_pilot_measure_drafts_batch(p_items jsonb)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid := auth.uid();
  v_count integer;
  v_item jsonb;
  v_id uuid;
  v_text text;
  v_qty numeric;
  v_unit text;
  v_name text;
  v_db record;
  v_done integer := 0;
BEGIN
  IF v_user IS NULL OR NOT public.cc_is_admin() THEN
    RAISE EXCEPTION 'Sem permissão para revisar medidas';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items)<>'array' THEN
    RAISE EXCEPTION 'Lote inválido: esperado array';
  END IF;
  v_count := jsonb_array_length(p_items);
  IF v_count<1 OR v_count>20 THEN
    RAISE EXCEPTION 'Selecione de 1 a 20 medidas por lote';
  END IF;
  IF (SELECT count(DISTINCT entry.item->>'ingredient_id') FROM jsonb_array_elements(p_items) AS entry(item))<>v_count THEN
    RAISE EXCEPTION 'O lote contém ingredientes repetidos';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) AS t(value)
  LOOP
    IF jsonb_typeof(v_item)<>'object'
       OR coalesce(v_item->>'ingredient_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR coalesce(jsonb_typeof(v_item->'quantity'),'')<>'number'
       OR coalesce(jsonb_typeof(v_item->'source_text'),'')<>'string'
       OR coalesce(jsonb_typeof(v_item->'unit'),'')<>'string'
       OR coalesce(jsonb_typeof(v_item->'ingredient'),'')<>'string' THEN
      RAISE EXCEPTION 'Item do lote inválido ou incompleto';
    END IF;
    v_id := (v_item->>'ingredient_id')::uuid;
    v_text := v_item->>'source_text';
    v_qty := (v_item->>'quantity')::numeric;
    v_unit := v_item->>'unit';
    v_name := btrim(v_item->>'ingredient');

    IF length(v_text)<2 OR v_qty<=0 OR v_qty>100000 OR v_qty<>round(v_qty,4)
       OR char_length(v_name) NOT BETWEEN 2 AND 180
       OR v_unit NOT IN (
        'g','kg','ml','l','colher_cha','colher_sopa','xicara',
        'dente','fatia','pitada','ramo','lata','copo','unidade','punhado','ovo','cebola','tomate'
       ) THEN
       RAISE EXCEPTION 'Medida, unidade ou ingrediente inválido';
    END IF;

    -- Uma segunda defesa: expressões ambíguas NÃO podem entrar no lote automático.
    -- Se o caso tiver qualquer dúvida, usar exclusivamente a revisão individual.
    IF v_text ~* '(^|[[:space:]])[[:digit:]]+[[:space:]]+a[[:space:]]+[[:digit:]]+'
       OR v_text ~* '(^|[[:space:]])ou([[:space:]]|$)'
       OR v_text ~* '(opcional|a gosto|quanto bastar|se preferir|se desejar|se precisar)'
       OR position(':' IN v_text)>0 OR position(';' IN v_text)>0 THEN
       RAISE EXCEPTION 'Expressão ambígua deve ser revisada individualmente';
    END IF;

    SELECT r.ingredient_id, r.review_status, r.source_text,
           r.proposed_quantity, r.proposed_unit, r.proposed_ingredient
      INTO v_db
      FROM public.cc_pilot_ingredient_measure_reviews r
      JOIN public.recipe_ingredients i ON i.id=r.ingredient_id AND i.recipe_id=r.recipe_id
      JOIN public.cc_official_recipe_source_records s ON s.recipe_id=r.recipe_id
      JOIN public.recipes recipe ON recipe.id=r.recipe_id
      WHERE r.ingredient_id=v_id
        AND r.source_text=v_text
        AND i.name=r.source_text
        AND i.position=r.source_position
        AND s.use_stage='personal_pilot'
        AND recipe.published=false
      FOR UPDATE OF r;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Origem divergente ou ingrediente fora do piloto; lote cancelado';
    END IF;
    IF v_db.review_status<>'pending'
       OR v_db.proposed_quantity IS NOT NULL
       OR v_db.proposed_unit IS NOT NULL
       OR v_db.proposed_ingredient IS NOT NULL THEN
      RAISE EXCEPTION 'Ingrediente já revisado; lote cancelado';
    END IF;

    UPDATE public.cc_pilot_ingredient_measure_reviews
      SET proposed_quantity=v_qty,
          proposed_unit=v_unit,
          proposed_ingredient=v_name,
          review_status='draft',
          review_notes='Proposta em lote (fase 3I.3); pendente de confirmação editorial individual.',
          reviewed_by=NULL,
          reviewed_at=NULL
      WHERE ingredient_id=v_id;

    v_done := v_done+1;
  END LOOP;
  RETURN v_done;
END
$fn$;

REVOKE ALL ON FUNCTION public.cc_save_pilot_measure_drafts_batch(jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cc_save_pilot_measure_drafts_batch(jsonb) TO authenticated;
COMMENT ON FUNCTION public.cc_save_pilot_measure_drafts_batch(jsonb) IS
 'Rascunhos em lote de até 20 ingredientes. Atomicidade, origem imutável, sessão admin. Não atualiza receitas nem confirma medidas.';
