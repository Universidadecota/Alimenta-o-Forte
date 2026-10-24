-- Costa&Costa: dados de ingrediente sem quantidades inventadas.
-- Preserva registros originais e permite colher de sopa e cm como unidades independentes.
ALTER TABLE public.recipe_ingredients
  ADD COLUMN IF NOT EXISTS measure_mode text NOT NULL DEFAULT 'measured',
  ADD COLUMN IF NOT EXISTS is_optional boolean NOT NULL DEFAULT false;
ALTER TABLE public.recipe_ingredients ALTER COLUMN quantity DROP NOT NULL;
ALTER TABLE public.recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_quantity_check;
ALTER TABLE public.recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_quantity_check
  CHECK ((measure_mode='measured' AND quantity>0 AND quantity<=100000)
     OR (measure_mode IN ('taste','unspecified') AND quantity IS NULL));
ALTER TABLE public.recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_unit_check;
ALTER TABLE public.recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_unit_check
  CHECK (unit IN ('g','kg','ml','l','un','cm','lata','colher_cha','colher_sopa','fatia','pitada'));
ALTER TABLE public.shopping_list_items DROP CONSTRAINT IF EXISTS shopping_list_items_unit_check;
ALTER TABLE public.shopping_list_items
  ADD CONSTRAINT shopping_list_items_unit_check
  CHECK (unit IN ('g','kg','ml','l','un','cm','lata','colher_cha','colher_sopa','fatia','pitada'));

-- Atualização cirúrgica da receita demonstrativa: sem inferir medidas faltantes.
DO $qa$
DECLARE v_recipe uuid; v_count integer;
BEGIN
 SELECT id INTO STRICT v_recipe FROM public.recipes
 WHERE title ILIKE 'Chá Cremoso De  Cúrcuma' AND owner_user_id IS NULL;
 SELECT count(*) INTO v_count FROM public.recipe_ingredients
 WHERE recipe_id=v_recipe AND name='2 cm de gengibre fresco, cortado em pedaços menores'
 AND unit='un' AND quantity=1;
 IF v_count<>1 THEN RAISE EXCEPTION 'Gengibre de referência alterado: revisão manual necessária'; END IF;
 SELECT count(*) INTO v_count FROM public.recipe_ingredients
 WHERE recipe_id=v_recipe AND name='Adoçante a gosto (ex: stevia)'
 AND unit='un' AND quantity=1;
 IF v_count<>1 THEN RAISE EXCEPTION 'Adoçante de referência alterado: revisão manual necessária'; END IF;
 SELECT count(*) INTO v_count FROM public.recipe_ingredients
 WHERE recipe_id=v_recipe AND name='Opcional: um pedacinho de manteiga'
 AND unit='un' AND quantity=1;
 IF v_count<>1 THEN RAISE EXCEPTION 'Manteiga de referência alterada: revisão manual necessária'; END IF;

 UPDATE public.recipe_ingredients
 SET name='Gengibre fresco, cortado em pedaços menores',quantity=2,unit='cm'
 WHERE recipe_id=v_recipe AND name='2 cm de gengibre fresco, cortado em pedaços menores';
 UPDATE public.recipe_ingredients
 SET name='Adoçante (ex.: estévia)',quantity=null,measure_mode='taste'
 WHERE recipe_id=v_recipe AND name='Adoçante a gosto (ex: stevia)';
 UPDATE public.recipe_ingredients
 SET name='Manteiga',quantity=null,measure_mode='unspecified',is_optional=true
 WHERE recipe_id=v_recipe AND name='Opcional: um pedacinho de manteiga';
END $qa$;

-- Não afrouxar autorização existente: apenas ampliar unidades e tipos de medida.
CREATE OR REPLACE FUNCTION public.save_personal_recipe(p_id uuid, p_title text, p_category text, p_description text, p_instructions text, p_minutes integer, p_servings integer, p_ingredients jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_id uuid; v_item jsonb; v_count integer; v_pos integer := 0; v_mode text; v_optional boolean; v_quantity numeric;
begin
 if (select auth.uid()) is null then raise exception 'Autenticação obrigatória'; end if;
 if length(trim(coalesce(p_title,''))) not between 2 and 180 or p_category not in ('breakfast','lunch','dinner','snack') or p_minutes not between 0 and 1440 or p_servings not between 1 and 20 then raise exception 'Campos inválidos'; end if;
 if length(coalesce(p_description,''))>2000 or length(coalesce(p_instructions,''))>10000 then raise exception 'Texto demasiado longo'; end if;
 if jsonb_typeof(p_ingredients) <> 'array' then raise exception 'Ingredientes inválidos'; end if;
 v_count=jsonb_array_length(p_ingredients);
 if v_count < 1 or v_count > 40 then raise exception 'Informe de 1 a 40 ingredientes'; end if;
 if p_id is null then
  insert into public.recipes(title,category,description,instructions,prep_minutes,servings,published,owner_user_id)
  values(trim(p_title),p_category,p_description,p_instructions,p_minutes,p_servings,false,(select auth.uid())) returning id into v_id;
 else
  update public.recipes set title=trim(p_title),category=p_category,description=p_description,instructions=p_instructions,prep_minutes=p_minutes,servings=p_servings
  where id=p_id and owner_user_id=(select auth.uid()) and archived_at is null returning id into v_id;
  if v_id is null then raise exception 'Receita não encontrada ou sem permissão'; end if;
  delete from public.recipe_ingredients where recipe_id=v_id;
 end if;
 for v_item in select value from jsonb_array_elements(p_ingredients) loop
  v_mode := coalesce(nullif(v_item->>'measure_mode', ''), 'measured');
  v_optional := coalesce((v_item->>'is_optional')::boolean, false);
  if length(trim(coalesce(v_item->>'name',''))) not between 1 and 140
     or (v_item->>'unit') not in ('g','kg','ml','l','un','cm','lata','colher_cha','colher_sopa','fatia','pitada')
     or v_mode not in ('measured','taste','unspecified') then
     raise exception 'Ingrediente inválido';
  end if;
  if v_mode = 'measured' then
    if jsonb_typeof(v_item->'quantity') is distinct from 'number' then
      raise exception 'Quantidade numérica obrigatória para ingrediente medido';
    end if;
    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity <= 0 or v_quantity > 100000 then
      raise exception 'Quantidade de ingrediente fora dos limites';
    end if;
  else
    if v_item ? 'quantity' and v_item->'quantity' <> 'null'::jsonb then
      raise exception 'Ingrediente a gosto ou sem medida não admite quantidade numérica';
    end if;
    v_quantity := null;
  end if;
  insert into public.recipe_ingredients(recipe_id,name,quantity,unit,position,measure_mode,is_optional)
  values(v_id,trim(v_item->>'name'),v_quantity,v_item->>'unit',v_pos,v_mode,v_optional);

  v_pos=v_pos+1;
 end loop;
 return v_id;
end $function$;


CREATE OR REPLACE FUNCTION public.cc_save_official_recipe(p_id uuid, p_title text, p_category text, p_description text, p_instructions text, p_minutes integer, p_servings integer, p_ingredients jsonb, p_published boolean, p_url text, p_image_is_ai boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; v_item jsonb; v_position int:=0; v_mode text; v_optional boolean; v_quantity numeric;
begin
 if not public.cc_is_admin() then raise exception 'Sem permissão administrativa'; end if;
 if length(trim(coalesce(p_title,''))) not between 2 and 180 or p_category not in ('breakfast','lunch','dinner','snack') or p_minutes not between 0 and 1440 or p_servings not between 1 and 20 then raise exception 'Campos inválidos'; end if;
 if jsonb_typeof(p_ingredients)<>'array' or jsonb_array_length(p_ingredients) not between 1 and 40 then raise exception 'Ingredientes inválidos'; end if;
 if length(coalesce(p_description,''))>2000 or length(coalesce(p_instructions,''))>10000 then raise exception 'Descrição longa demais'; end if;
 if p_url is not null and (length(p_url)>2048 or p_url !~ '^https://gclhailalyrokvmkwllm[.]supabase[.]co/storage/v1/object/public/recipe-illustrations/[a-zA-Z0-9_%.-]+([.]webp|/([0-9a-f-]{36})[.]webp)$') then raise exception 'Imagem oficial inválida'; end if;
 if p_id is null then
  insert into public.recipes(title,category,description,instructions,prep_minutes,servings,published,owner_user_id,url,image_is_ai)
  values(trim(p_title),p_category,p_description,p_instructions,p_minutes,p_servings,p_published,null,p_url,coalesce(p_image_is_ai,false)) returning id into v_id;
 else
  update public.recipes set title=trim(p_title),category=p_category,description=p_description,instructions=p_instructions,prep_minutes=p_minutes,servings=p_servings,published=p_published,url=p_url,image_is_ai=coalesce(p_image_is_ai,false)
   where id=p_id and owner_user_id is null and archived_at is null returning id into v_id;
  if v_id is null then raise exception 'Receita oficial indisponível'; end if;
  delete from public.recipe_ingredients where recipe_id=v_id;
 end if;
 for v_item in select value from jsonb_array_elements(p_ingredients) loop
  v_mode := coalesce(nullif(v_item->>'measure_mode', ''), 'measured');
  v_optional := coalesce((v_item->>'is_optional')::boolean, false);
  if length(trim(coalesce(v_item->>'name',''))) not between 1 and 140
     or (v_item->>'unit') not in ('g','kg','ml','l','un','cm','lata','colher_cha','colher_sopa','fatia','pitada')
     or v_mode not in ('measured','taste','unspecified') then
     raise exception 'Ingrediente inválido';
  end if;
  if v_mode = 'measured' then
    if jsonb_typeof(v_item->'quantity') is distinct from 'number' then
      raise exception 'Quantidade numérica obrigatória para ingrediente medido';
    end if;
    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity <= 0 or v_quantity > 100000 then
      raise exception 'Quantidade de ingrediente fora dos limites';
    end if;
  else
    if v_item ? 'quantity' and v_item->'quantity' <> 'null'::jsonb then
      raise exception 'Ingrediente a gosto ou sem medida não admite quantidade numérica';
    end if;
    v_quantity := null;
  end if;
  insert into public.recipe_ingredients(recipe_id,name,quantity,unit,position,measure_mode,is_optional)
  values(v_id,trim(v_item->>'name'),v_quantity,v_item->>'unit',v_position,v_mode,v_optional);

  v_position:=v_position+1;
 end loop;
 return v_id;
end $function$;

