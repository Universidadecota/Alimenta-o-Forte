-- Costa&Costa / Fase 2C: variedade + estado + identificador da fonte por alimento.
-- Estrutura administrativa. Os nutrientes permanecem nulos; nenhuma receita e recomendada.
-- A estrutura anterior cc_food_nutrition_drafts e preservada (sem registros hoje).
CREATE TABLE IF NOT EXISTS public.cc_food_nutrition_variants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 food_item_id uuid NOT NULL REFERENCES public.food_items(id) ON DELETE RESTRICT,
 variant_name text NOT NULL,
 food_state text NOT NULL DEFAULT 'unspecified',
 preparation_method text NOT NULL DEFAULT '',
 source_name text NOT NULL DEFAULT '',
 source_reference text NOT NULL DEFAULT '',
 source_url text NOT NULL DEFAULT '',
 energy_kcal numeric,
 protein_g numeric,
 carbohydrates_g numeric,
 fats_g numeric,
 fiber_g numeric,
 sodium_mg numeric,
 review_status text NOT NULL DEFAULT 'pending',
 notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES auth.users(id),
 CONSTRAINT cc_fv_label CHECK (char_length(btrim(variant_name)) BETWEEN 4 AND 180
   AND variant_name=btrim(variant_name)),
 CONSTRAINT cc_fv_state CHECK (food_state IN ('unspecified','raw','cooked','sauteed','fried','roasted','grilled','drained','prepared','packaged','other')),
 CONSTRAINT cc_fv_status CHECK (review_status IN ('pending','in_review','needs_source','awaiting_specialist')),
 CONSTRAINT cc_fv_length CHECK (char_length(preparation_method)<=240 AND char_length(source_name)<=240
   AND char_length(source_reference)<=500 AND char_length(source_url)<=1000 AND char_length(notes)<=4000),
 CONSTRAINT cc_fv_values CHECK (
  (energy_kcal IS NULL OR energy_kcal BETWEEN 0 AND 1000)
  AND (protein_g IS NULL OR protein_g BETWEEN 0 AND 100)
  AND (carbohydrates_g IS NULL OR carbohydrates_g BETWEEN 0 AND 100)
  AND (fats_g IS NULL OR fats_g BETWEEN 0 AND 100)
  AND (fiber_g IS NULL OR fiber_g BETWEEN 0 AND 100)
  AND (sodium_mg IS NULL OR sodium_mg BETWEEN 0 AND 50000)),
 CONSTRAINT cc_fv_values_source CHECK (
  (energy_kcal IS NULL AND protein_g IS NULL AND carbohydrates_g IS NULL
   AND fats_g IS NULL AND fiber_g IS NULL AND sodium_mg IS NULL)
  OR (char_length(btrim(source_name))>=3 AND char_length(btrim(source_reference))>=2
      AND food_state<>'unspecified')),
 CONSTRAINT cc_fv_unique_source UNIQUE(food_item_id,variant_name,food_state,source_name,source_reference),
 CONSTRAINT cc_fv_food_id_unique UNIQUE(food_item_id,id)
);
CREATE INDEX IF NOT EXISTS cc_fv_food_item_idx ON public.cc_food_nutrition_variants(food_item_id);
COMMENT ON TABLE public.cc_food_nutrition_variants IS 'Variantes, estados de preparo e fontes rastreaveis; registros administrativos sem aprovacao nem publicacao automatica.';

CREATE OR REPLACE FUNCTION public.cc_food_nutrition_variant_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF TG_OP='UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.food_item_id IS DISTINCT FROM OLD.food_item_id)
 THEN RAISE EXCEPTION 'Nao transfira uma variante entre alimentos'; END IF;
 NEW.updated_at=now();
 NEW.updated_by=(SELECT auth.uid());
 RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS cc_fv_guard_trg ON public.cc_food_nutrition_variants;
CREATE TRIGGER cc_fv_guard_trg BEFORE INSERT OR UPDATE
 ON public.cc_food_nutrition_variants FOR EACH ROW
 EXECUTE FUNCTION public.cc_food_nutrition_variant_guard();

-- Vinculo agora aponta tambem para a variante exata, nunca somente para "Alface" generica.
ALTER TABLE public.cc_recipe_ingredient_food_links
 ADD COLUMN IF NOT EXISTS nutrition_variant_id uuid NULL;
ALTER TABLE public.cc_recipe_ingredient_food_links
 ADD CONSTRAINT cc_rifl_same_food_variant_fk FOREIGN KEY(food_item_id,nutrition_variant_id)
 REFERENCES public.cc_food_nutrition_variants(food_item_id,id) ON DELETE RESTRICT;
ALTER TABLE public.cc_recipe_ingredient_food_links
 ADD CONSTRAINT cc_rifl_confirm_exact_variant CHECK (
  match_status<>'confirmed' OR nutrition_variant_id IS NOT NULL
 );
CREATE INDEX IF NOT EXISTS cc_rifl_variant_idx
 ON public.cc_recipe_ingredient_food_links(nutrition_variant_id);

-- Uma alteracao do ingrediente invalida a variante confirmada, nao apenas a massa.
CREATE OR REPLACE FUNCTION public.cc_invalidate_food_link_on_ingredient_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF OLD.name IS DISTINCT FROM NEW.name OR OLD.quantity IS DISTINCT FROM NEW.quantity
 OR OLD.unit IS DISTINCT FROM NEW.unit OR OLD.measure_mode IS DISTINCT FROM NEW.measure_mode
 OR OLD.is_optional IS DISTINCT FROM NEW.is_optional THEN
  UPDATE public.cc_recipe_ingredient_food_links
  SET match_status='candidate',nutrition_variant_id=NULL,total_mass_g=NULL,mass_evidence='',updated_at=now()
  WHERE ingredient_id=NEW.id;
 END IF;
 RETURN NULL;
END;
$fn$;

-- Uma alteracao do cadastro de variante torna links vinculados pendentes novamente.
CREATE OR REPLACE FUNCTION public.cc_invalidate_food_links_on_variant_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF OLD.variant_name IS DISTINCT FROM NEW.variant_name
 OR OLD.food_state IS DISTINCT FROM NEW.food_state
 OR OLD.preparation_method IS DISTINCT FROM NEW.preparation_method
 OR OLD.source_name IS DISTINCT FROM NEW.source_name
 OR OLD.source_reference IS DISTINCT FROM NEW.source_reference
 OR OLD.source_url IS DISTINCT FROM NEW.source_url
 OR OLD.energy_kcal IS DISTINCT FROM NEW.energy_kcal
 OR OLD.protein_g IS DISTINCT FROM NEW.protein_g
 OR OLD.carbohydrates_g IS DISTINCT FROM NEW.carbohydrates_g
 OR OLD.fats_g IS DISTINCT FROM NEW.fats_g
 OR OLD.fiber_g IS DISTINCT FROM NEW.fiber_g
 OR OLD.sodium_mg IS DISTINCT FROM NEW.sodium_mg THEN
  UPDATE public.cc_recipe_ingredient_food_links
  SET match_status='candidate',updated_at=now()
  WHERE nutrition_variant_id=NEW.id AND match_status='confirmed';
 END IF;
 RETURN NULL;
END;
$fn$;
DROP TRIGGER IF EXISTS cc_fv_invalidate_links ON public.cc_food_nutrition_variants;
CREATE TRIGGER cc_fv_invalidate_links AFTER UPDATE ON public.cc_food_nutrition_variants
 FOR EACH ROW EXECUTE FUNCTION public.cc_invalidate_food_links_on_variant_change();

ALTER TABLE public.cc_food_nutrition_variants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cc_food_nutrition_variants FROM public, anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON public.cc_food_nutrition_variants TO authenticated;
DROP POLICY IF EXISTS cc_fv_admin_select ON public.cc_food_nutrition_variants;
CREATE POLICY cc_fv_admin_select ON public.cc_food_nutrition_variants
 FOR SELECT TO authenticated USING ((SELECT public.cc_is_admin()));
DROP POLICY IF EXISTS cc_fv_admin_insert ON public.cc_food_nutrition_variants;
CREATE POLICY cc_fv_admin_insert ON public.cc_food_nutrition_variants
 FOR INSERT TO authenticated WITH CHECK ((SELECT public.cc_is_admin()));
DROP POLICY IF EXISTS cc_fv_admin_update ON public.cc_food_nutrition_variants;
CREATE POLICY cc_fv_admin_update ON public.cc_food_nutrition_variants
 FOR UPDATE TO authenticated
 USING ((SELECT public.cc_is_admin())) WITH CHECK ((SELECT public.cc_is_admin()));
REVOKE ALL ON FUNCTION public.cc_food_nutrition_variant_guard() FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.cc_invalidate_food_links_on_variant_change() FROM public,anon,authenticated;
-- Reaplicar o endurecimento da funcao ja existente apos substituir sua definicao.
REVOKE ALL ON FUNCTION public.cc_invalidate_food_link_on_ingredient_edit() FROM public,anon,authenticated;

-- Identificacoes registradas na TACO 4a edicao (NEPA/UNICAMP, 2011).
-- Cada linha e uma VARIANTE METADADOS: zero campos nutricionais preenchidos,
-- revisao pendente e nenhuma associacao com receitas.
INSERT INTO public.cc_food_nutrition_variants
 (food_item_id,variant_name,food_state,preparation_method,source_name,source_reference,source_url,review_status,notes)
SELECT f.id,v.variant_name,v.food_state,v.preparation_method,
 'NEPA/UNICAMP — TACO 4a edicao (2011)',v.source_reference,
 'https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf',
 'needs_source','Nome e codigo da linha conferidos na TACO; composicao nutricional ainda nao transcrita nem revisada.'
FROM (VALUES
 ('Abobrinha','Abobrinha, italiana, cozida','cooked','','Tabela 1, linha 70, pagina impressa 30'),
 ('Abobrinha','Abobrinha, italiana, crua','raw','','Tabela 1, linha 71, pagina impressa 30'),
 ('Abobrinha','Abobrinha, italiana, refogada','sauteed','Refogada','Tabela 1, linha 72, pagina impressa 30'),
 ('Abobrinha','Abobrinha, paulista, crua','raw','','Tabela 1, linha 73, pagina impressa 30'),
 ('Alface','Alface, americana, crua','raw','','Tabela 1, linha 77, pagina impressa 30'),
 ('Alface','Alface, crespa, crua','raw','','Tabela 1, linha 78, pagina impressa 30'),
 ('Alface','Alface, lisa, crua','raw','','Tabela 1, linha 79, pagina impressa 30'),
 ('Alface','Alface, roxa, crua','raw','','Tabela 1, linha 80, pagina impressa 30'),
 ('Cenoura','Cenoura, cozida','cooked','','Tabela 1, linha 109, pagina impressa 32'),
 ('Cenoura','Cenoura, crua','raw','','Tabela 1, linha 110, pagina impressa 32')
) v(food_name,variant_name,food_state,preparation_method,source_reference)
JOIN public.food_items f ON f.name=v.food_name
ON CONFLICT ON CONSTRAINT cc_fv_unique_source DO NOTHING;
