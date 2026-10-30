-- Costa&Costa 3C.1 — Respeitar as categorias originais ao planejar
-- sem vincular receitas a datas. Atua somente em receitas provenientes dos seis PDFs.
CREATE OR REPLACE FUNCTION public.cc_pilot_recipe_slot_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $fn$
DECLARE v_kind text; v_meal text; v_ok boolean;
BEGIN
 SELECT p.source_kind,p.source_meal_name INTO v_kind,v_meal
 FROM public.cc_official_recipe_source_records p
 WHERE p.recipe_id=NEW.recipe_id;
 IF NOT FOUND THEN RETURN NEW; END IF;

 v_ok:=CASE v_kind
  WHEN 'salad' THEN NEW.slot IN ('lunch','dinner')
  WHEN 'supper' THEN NEW.slot='supper'
  WHEN 'snack' THEN NEW.slot IN ('morning_snack','afternoon_snack')
  WHEN 'week' THEN
    (v_meal='Café da manhã' AND NEW.slot='breakfast')
    OR (v_meal='Almoço' AND NEW.slot='lunch')
    OR (v_meal='Jantar' AND NEW.slot='dinner')
  ELSE false
 END;
 IF NOT v_ok THEN
  RAISE EXCEPTION 'Este tipo de receita piloto não corresponde ao horário selecionado';
 END IF;
 RETURN NEW;
END
$fn$;
DROP TRIGGER IF EXISTS cc_pilot_recipe_slot_check ON public.planned_meals;
CREATE TRIGGER cc_pilot_recipe_slot_check
 BEFORE INSERT OR UPDATE OF recipe_id,slot ON public.planned_meals
 FOR EACH ROW EXECUTE FUNCTION public.cc_pilot_recipe_slot_guard();
REVOKE ALL ON FUNCTION public.cc_pilot_recipe_slot_guard() FROM public,anon,authenticated;
