-- Reconciliação in-place de ingredientes oficiais.
-- Mantém IDs e protege vínculos históricos/técnicos; toda alteração é atômica.
CREATE OR REPLACE FUNCTION public.cc_save_official_recipe(
 p_id uuid, p_title text, p_category text, p_description text, p_instructions text,
 p_minutes integer, p_servings integer, p_ingredients jsonb,
 p_published boolean, p_url text, p_image_is_ai boolean
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 v_id uuid;
 v_item jsonb;
 v_position integer := 0;
 v_mode text;
 v_optional boolean;
 v_quantity numeric;
 v_row_id uuid;
 v_old record;
 v_seen uuid[] := ARRAY[]::uuid[];
 v_kept integer := 0;
 v_old_count integer := 0;
 v_has_links boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT public.cc_is_admin() THEN
  RAISE EXCEPTION 'Sem permissão administrativa' USING ERRCODE='42501';
 END IF;
 IF length(btrim(coalesce(p_title,''))) NOT BETWEEN 2 AND 180
    OR p_category NOT IN ('breakfast','lunch','dinner','snack')
    OR p_minutes NOT BETWEEN 0 AND 1440
    OR p_servings NOT BETWEEN 1 AND 20
    OR p_published IS NULL THEN
  RAISE EXCEPTION 'Campos inválidos';
 END IF;
 IF jsonb_typeof(p_ingredients) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_ingredients) NOT BETWEEN 1 AND 40 THEN
  RAISE EXCEPTION 'Ingredientes inválidos';
 END IF;
 IF length(coalesce(p_description,''))>2000
    OR length(coalesce(p_instructions,''))>10000 THEN
  RAISE EXCEPTION 'Descrição longa demais';
 END IF;
 IF p_url IS NOT NULL AND
   (length(p_url)>2048 OR p_url !~
    '^https://gclhailalyrokvmkwllm[.]supabase[.]co/storage/v1/object/public/recipe-illustrations/[a-zA-Z0-9_%.-]+([.]webp|/([0-9a-f-]{36})[.]webp)$') THEN
  RAISE EXCEPTION 'Imagem oficial inválida';
 END IF;

 IF p_id IS NULL THEN
  INSERT INTO public.recipes(title,category,description,instructions,prep_minutes,servings,published,owner_user_id,url,image_is_ai)
  VALUES(btrim(p_title),p_category,p_description,p_instructions,p_minutes,p_servings,p_published,NULL,p_url,coalesce(p_image_is_ai,false))
  RETURNING id INTO v_id;
 ELSE
  SELECT r.id INTO v_id FROM public.recipes r
   WHERE r.id=p_id AND r.owner_user_id IS NULL AND r.archived_at IS NULL
   FOR UPDATE;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Receita oficial indisponível'; END IF;
  SELECT count(*) INTO v_old_count FROM public.recipe_ingredients WHERE recipe_id=v_id;
  UPDATE public.recipes
    SET title=btrim(p_title),category=p_category,description=p_description,
        instructions=p_instructions,prep_minutes=p_minutes,servings=p_servings,
        published=p_published,url=p_url,image_is_ai=coalesce(p_image_is_ai,false)
    WHERE id=v_id;
 END IF;

 FOR v_item IN SELECT value FROM jsonb_array_elements(p_ingredients) LOOP
  IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Ingrediente inválido'; END IF;
  v_mode:=coalesce(nullif(v_item->>'measure_mode',''),'measured');
  v_optional:=coalesce((v_item->>'is_optional')::boolean,false);
  IF length(btrim(coalesce(v_item->>'name',''))) NOT BETWEEN 1 AND 140
    OR v_item->>'unit' NOT IN ('g','kg','ml','l','un','cm','lata','colher_cha','colher_sopa','fatia','pitada')
    OR v_mode NOT IN ('measured','taste','unspecified') THEN
    RAISE EXCEPTION 'Ingrediente inválido';
  END IF;
  IF v_mode='measured' THEN
    IF jsonb_typeof(v_item->'quantity') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'Quantidade numérica obrigatória para ingrediente medido';
    END IF;
    v_quantity:=(v_item->>'quantity')::numeric;
    IF v_quantity<=0 OR v_quantity>100000 THEN RAISE EXCEPTION 'Quantidade fora dos limites'; END IF;
  ELSE
    IF v_item ? 'quantity' AND v_item->'quantity' <> 'null'::jsonb THEN
      RAISE EXCEPTION 'Ingrediente sem medida não admite quantidade numérica';
    END IF;
    v_quantity:=NULL;
  END IF;

  IF nullif(v_item->>'id','') IS NOT NULL THEN
    IF p_id IS NULL OR (v_item->>'id') !~
       '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      RAISE EXCEPTION 'Identificador de ingrediente inválido';
    END IF;
    v_row_id:=(v_item->>'id')::uuid;
    IF v_row_id=ANY(v_seen) THEN RAISE EXCEPTION 'Ingrediente repetido na edição'; END IF;
    IF NOT (v_item ?& ARRAY['expected_name','expected_position','expected_quantity',
                              'expected_unit','expected_mode','expected_optional']) THEN
      RAISE EXCEPTION 'Prévia de ingrediente incompleta; recarregue a receita';
    END IF;
    SELECT ri.* INTO v_old
      FROM public.recipe_ingredients ri
      WHERE ri.id=v_row_id AND ri.recipe_id=v_id
      FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Ingrediente antigo indisponível; recarregue a receita'; END IF;
    IF v_old.name IS DISTINCT FROM v_item->>'expected_name'
       OR v_old.position IS DISTINCT FROM (v_item->>'expected_position')::integer
       OR v_old.quantity IS DISTINCT FROM (v_item->>'expected_quantity')::numeric
       OR v_old.unit IS DISTINCT FROM v_item->>'expected_unit'
       OR v_old.measure_mode IS DISTINCT FROM v_item->>'expected_mode'
       OR v_old.is_optional IS DISTINCT FROM (v_item->>'expected_optional')::boolean THEN
      RAISE EXCEPTION 'Ingrediente mudou desde a prévia; recarregue antes de salvar';
    END IF;

    IF (v_old.name,v_old.quantity,v_old.unit,v_old.position,v_old.measure_mode,v_old.is_optional)
        IS DISTINCT FROM
       (btrim(v_item->>'name'),v_quantity,v_item->>'unit',v_position,v_mode,v_optional) THEN
      SELECT
       EXISTS(SELECT 1 FROM public.cc_pilot_ingredient_measure_reviews WHERE ingredient_id=v_row_id)
       OR EXISTS(SELECT 1 FROM public.cc_allergen_ingredient_evidence WHERE ingredient_id=v_row_id)
       OR EXISTS(SELECT 1 FROM public.cc_allergen_a4_ingredient_findings WHERE ingredient_id=v_row_id)
       OR EXISTS(SELECT 1 FROM public.cc_n2_ingredient_review_notes WHERE ingredient_id=v_row_id)
       OR EXISTS(SELECT 1 FROM public.cc_recipe_ingredient_food_links WHERE ingredient_id=v_row_id)
      INTO v_has_links;
      IF v_has_links THEN
       RAISE EXCEPTION 'Ingrediente com evidência técnica vinculada; ajuste exige revisão versionada';
      END IF;
      UPDATE public.recipe_ingredients
       SET name=btrim(v_item->>'name'),quantity=v_quantity,unit=v_item->>'unit',
           position=v_position,measure_mode=v_mode,is_optional=v_optional
       WHERE id=v_row_id AND recipe_id=v_id;
    END IF;
    v_seen:=array_append(v_seen,v_row_id);
    v_kept:=v_kept+1;
  ELSE
    INSERT INTO public.recipe_ingredients(recipe_id,name,quantity,unit,position,measure_mode,is_optional)
    VALUES(v_id,btrim(v_item->>'name'),v_quantity,v_item->>'unit',v_position,v_mode,v_optional)
    RETURNING id INTO v_row_id;
    v_seen:=array_append(v_seen,v_row_id);
  END IF;
  v_position:=v_position+1;
 END LOOP;

 IF p_id IS NOT NULL THEN
  IF v_old_count>0 AND v_kept=0 THEN
   RAISE EXCEPTION 'Envie os IDs dos ingredientes existentes; atualize o formulário antes de salvar';
  END IF;
  IF EXISTS (
   SELECT 1 FROM public.recipe_ingredients ri
   WHERE ri.recipe_id=v_id AND NOT (ri.id=ANY(v_seen))
    AND (
     EXISTS(SELECT 1 FROM public.cc_pilot_ingredient_measure_reviews x WHERE x.ingredient_id=ri.id)
     OR EXISTS(SELECT 1 FROM public.cc_allergen_ingredient_evidence x WHERE x.ingredient_id=ri.id)
     OR EXISTS(SELECT 1 FROM public.cc_allergen_a4_ingredient_findings x WHERE x.ingredient_id=ri.id)
     OR EXISTS(SELECT 1 FROM public.cc_n2_ingredient_review_notes x WHERE x.ingredient_id=ri.id)
     OR EXISTS(SELECT 1 FROM public.cc_recipe_ingredient_food_links x WHERE x.ingredient_id=ri.id)
    )
  ) THEN
    RAISE EXCEPTION 'Remoção de ingrediente com evidência técnica bloqueada';
  END IF;
  DELETE FROM public.recipe_ingredients ri
   WHERE ri.recipe_id=v_id AND NOT (ri.id=ANY(v_seen));
 END IF;
 RETURN v_id;
END
$function$;
REVOKE ALL ON FUNCTION public.cc_save_official_recipe(uuid,text,text,text,text,integer,integer,jsonb,boolean,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cc_save_official_recipe(uuid,text,text,text,text,integer,integer,jsonb,boolean,text,boolean) TO authenticated;
