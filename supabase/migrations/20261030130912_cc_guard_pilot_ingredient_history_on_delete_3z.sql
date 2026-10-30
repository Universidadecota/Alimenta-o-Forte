-- Fase 3Z, migration efetivamente registrada no Supabase operacional.
-- Id real do histórico: 20261030130912.
-- Protege somente ingredientes que já tenham histórico de medidas.
-- Não insere, altera ou remove nenhuma linha existente.
CREATE OR REPLACE FUNCTION public.cc_guard_pilot_ingredient_history_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.cc_pilot_ingredient_measure_reviews h
    WHERE h.ingredient_id = OLD.id
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'Ingrediente com historico editorial: exclusao bloqueada para preservar revisoes.',
      HINT = 'Use um processo de edicao versionada que preserve o historico e a identidade do ingrediente.';
  END IF;
  RETURN OLD;
END;
$guard$;
REVOKE ALL ON FUNCTION public.cc_guard_pilot_ingredient_history_on_delete() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER cc_guard_pilot_ingredient_history_on_delete
BEFORE DELETE ON public.recipe_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.cc_guard_pilot_ingredient_history_on_delete();
