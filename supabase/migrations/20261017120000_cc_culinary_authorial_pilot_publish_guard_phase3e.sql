-- Costa&Costa | Fase 3E: piloto culinario autoral.
-- Nunca permitir publicacao acidental de receitas importadas para uso pessoal.
-- Nenhuma receita e alterada por esta migracao; a eventual venda requer
-- uma transicao editorial explicita, posterior e auditada.
CREATE OR REPLACE FUNCTION public.cc_guard_personal_pilot_publication()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $fn$
BEGIN
 IF NEW.published AND EXISTS (
  SELECT 1 FROM public.cc_official_recipe_source_records s
  WHERE s.recipe_id=NEW.id AND s.use_stage='personal_pilot'
 ) THEN
  RAISE EXCEPTION 'Receita do piloto pessoal: publicacao bloqueada ate liberacao editorial/comercial.';
 END IF;
 RETURN NEW;
END
$fn$;
DROP TRIGGER IF EXISTS cc_guard_personal_pilot_recipe_publish ON public.recipes;
CREATE TRIGGER cc_guard_personal_pilot_recipe_publish
 BEFORE INSERT OR UPDATE OF published ON public.recipes
 FOR EACH ROW EXECUTE FUNCTION public.cc_guard_personal_pilot_publication();

-- Tambem nao permitir vincular a fonte piloto a uma receita previamente publica.
CREATE OR REPLACE FUNCTION public.cc_guard_personal_pilot_source()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $fn$
BEGIN
 IF NEW.use_stage='personal_pilot' AND EXISTS (
  SELECT 1 FROM public.recipes r WHERE r.id=NEW.recipe_id AND r.published
 ) THEN
  RAISE EXCEPTION 'Fonte de piloto pessoal nao pode estar vinculada a receita publicada.';
 END IF;
 RETURN NEW;
END
$fn$;
DROP TRIGGER IF EXISTS cc_guard_personal_pilot_source_stage
 ON public.cc_official_recipe_source_records;
CREATE TRIGGER cc_guard_personal_pilot_source_stage
 BEFORE INSERT OR UPDATE OF recipe_id,use_stage
 ON public.cc_official_recipe_source_records
 FOR EACH ROW EXECUTE FUNCTION public.cc_guard_personal_pilot_source();
REVOKE ALL ON FUNCTION public.cc_guard_personal_pilot_publication() FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.cc_guard_personal_pilot_source() FROM public,anon,authenticated;
