-- Fase 3I.1: snapshot do texto é metadado imutável.
CREATE OR REPLACE FUNCTION public.cc_protect_pilot_measure_review_source()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE actual_name text;
BEGIN
 IF NEW.ingredient_id IS DISTINCT FROM OLD.ingredient_id
    OR NEW.recipe_id IS DISTINCT FROM OLD.recipe_id
    OR NEW.source_text IS DISTINCT FROM OLD.source_text
    OR NEW.source_position IS DISTINCT FROM OLD.source_position THEN
   RAISE EXCEPTION 'O texto e o vínculo do inventário não podem ser alterados.';
 END IF;
 SELECT name INTO actual_name
 FROM public.recipe_ingredients WHERE id=OLD.ingredient_id AND recipe_id=OLD.recipe_id;
 IF actual_name IS DISTINCT FROM OLD.source_text THEN
   RAISE EXCEPTION 'O ingrediente original foi alterado; a revisão deve ser reconciliada antes de gravar.';
 END IF;
 NEW.updated_at=now();
 RETURN NEW;
END
$fn$;
DROP TRIGGER IF EXISTS cc_protect_pilot_measure_review_source_trigger
 ON public.cc_pilot_ingredient_measure_reviews;
CREATE TRIGGER cc_protect_pilot_measure_review_source_trigger
 BEFORE UPDATE ON public.cc_pilot_ingredient_measure_reviews
 FOR EACH ROW EXECUTE FUNCTION public.cc_protect_pilot_measure_review_source();
REVOKE ALL ON FUNCTION public.cc_protect_pilot_measure_review_source() FROM PUBLIC,anon,authenticated;
