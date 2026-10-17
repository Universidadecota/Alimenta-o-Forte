-- Costa&Costa Fase 3H — edição isolada da fotografia de receita autoral privada.
-- A RPC jamais edita titulo, ingredientes, preparo, rendimento, estado de
-- publicação nem registros de fonte. Evita cc_save_official_recipe, que
-- reescreve recipe_ingredients mesmo ao trocar apenas a imagem.
CREATE OR REPLACE FUNCTION public.cc_set_personal_pilot_recipe_photo(
 p_recipe_id uuid,
 p_url text,
 p_image_is_ai boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE v_url text := nullif(btrim(p_url),'');
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT public.cc_is_admin() THEN
   RAISE EXCEPTION 'Sem permissao administrativa';
 END IF;
 IF p_recipe_id IS NULL THEN
   RAISE EXCEPTION 'Receita obrigatoria';
 END IF;
 IF v_url IS NOT NULL AND (
  char_length(v_url)>2048 OR
  v_url !~ '^https://gclhailalyrokvmkwllm[.]supabase[.]co/storage/v1/object/public/recipe-illustrations/official/[0-9a-f-]{36}[.]webp$'
 ) THEN
  RAISE EXCEPTION 'Fotografia deve pertencer ao Storage oficial, em WebP';
 END IF;
 UPDATE public.recipes r
 SET url=v_url,image_is_ai=coalesce(p_image_is_ai,false)
 WHERE r.id=p_recipe_id
   AND r.owner_user_id IS NULL
   AND r.published=false
   AND r.archived_at IS NULL
   AND EXISTS(
    SELECT 1 FROM public.cc_official_recipe_source_records src
    WHERE src.recipe_id=r.id AND src.use_stage='personal_pilot'
   );
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Receita do piloto pessoal nao encontrada ou indisponivel';
 END IF;
END
$fn$;
REVOKE ALL ON FUNCTION public.cc_set_personal_pilot_recipe_photo(uuid,text,boolean)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cc_set_personal_pilot_recipe_photo(uuid,text,boolean)
 TO authenticated;
COMMENT ON FUNCTION public.cc_set_personal_pilot_recipe_photo(uuid,text,boolean) IS
 'Atualiza exclusivamente a fotografia da receita autoral no piloto privado; nao altera ingredientes, preparo nem publicacao.';
