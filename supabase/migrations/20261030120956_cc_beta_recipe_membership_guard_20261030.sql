-- Fase 3Y (2026-10-30)
-- Migration registrada e aplicada ao projeto Alimentação Forte em 20261030120956.
-- Objetivo: acesso privado do piloto apenas para administradores ou beta members habilitados.
-- Preserva assinatura, privileges, SECURITY DEFINER e search_path da função original.
-- Não modifica linhas de receitas, fontes ou membros.
CREATE OR REPLACE FUNCTION public.cc_beta_can_view_recipe(p_recipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
 SELECT (SELECT auth.uid()) IS NOT NULL
   AND (
     (SELECT public.cc_is_admin())
     OR EXISTS (
       SELECT 1
       FROM public.cc_beta_members AS m
       WHERE m.user_id = (SELECT auth.uid())
         AND m.enabled IS TRUE
     )
   )
   AND EXISTS (
     SELECT 1 FROM public.cc_beta_recipe_access AS a
     WHERE a.recipe_id = p_recipe_id AND a.enabled IS TRUE
   )
   AND EXISTS (
     SELECT 1 FROM public.cc_official_recipe_source_records AS s
     WHERE s.recipe_id = p_recipe_id
       AND s.use_stage = 'personal_pilot'
       AND s.is_plannable IS TRUE
   )
   AND EXISTS (
     SELECT 1 FROM public.recipes AS r
     WHERE r.id = p_recipe_id
       AND r.owner_user_id IS NULL
       AND r.published IS FALSE
   );
$function$;
