-- Costa&Costa | Fase 3C: permitir ao admin testar o acervo de receitas
-- oficiais ainda não publicadas, somente em seu próprio planejamento.
-- A autorização é conferida no banco, não no frontend.
CREATE OR REPLACE FUNCTION public.guard_planned_recipe_owner()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $fn$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM public.recipes r
  WHERE r.id=NEW.recipe_id AND (
   (r.owner_user_id IS NULL AND r.published=true)
   OR (r.owner_user_id=NEW.user_id)
   OR (
    r.owner_user_id IS NULL AND r.published=false
    AND NEW.user_id=(SELECT auth.uid())
    AND public.cc_is_admin()
    AND EXISTS (
      SELECT 1 FROM public.cc_official_recipe_source_records p
      WHERE p.recipe_id=r.id AND p.use_stage='personal_pilot' AND p.is_plannable
    )
   )
  )
 ) THEN
  RAISE EXCEPTION 'Receita indisponível para este usuário';
 END IF;
 RETURN NEW;
END
$fn$;
-- O trigger guard_planned_recipe_owner_trg existente continua usando a função.
COMMENT ON FUNCTION public.guard_planned_recipe_owner() IS
 'Guarda planos: receitas publicadas, receitas privadas do dono ou piloto oficial para conta administradora autenticada; nunca expõe piloto ao público.';
