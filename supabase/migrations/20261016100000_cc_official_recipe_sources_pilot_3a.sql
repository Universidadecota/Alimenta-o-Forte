-- Costa&Costa | Fase 3A — Catálogo piloto privado de receitas exatamente como os PDFs.
-- O texto original de ingredientes, preparo, tempo e rendimento é a fonte da verdade.
-- Os registros são rascunhos oficiais (recipes.published=false), acessíveis somente
-- para montagem pessoal por administrador; publicação comercial permanece separada.
CREATE TABLE IF NOT EXISTS public.cc_official_recipe_source_records (
  recipe_id uuid PRIMARY KEY REFERENCES public.recipes(id) ON DELETE RESTRICT,
  source_document text NOT NULL CHECK (length(btrim(source_document)) BETWEEN 8 AND 240),
  entry_number integer NOT NULL CHECK (entry_number BETWEEN 1 AND 250),
  source_page smallint CHECK (source_page BETWEEN 1 AND 100),
  source_kind text NOT NULL CHECK (source_kind IN ('week','salad','snack','supper','sauce')),
  source_day integer CHECK (source_day BETWEEN 1 AND 31),
  source_meal_name text NOT NULL,
  original_title text NOT NULL,
  original_time text NOT NULL,
  original_yield text NOT NULL,
  original_ingredients text NOT NULL CHECK (length(original_ingredients) BETWEEN 4 AND 10000),
  original_preparation text NOT NULL CHECK (length(original_preparation) BETWEEN 4 AND 10000),
  reference_hash text NOT NULL CHECK (length(reference_hash)=32),
  is_plannable boolean NOT NULL DEFAULT true,
  ingredient_review_status text NOT NULL DEFAULT 'needs_structuring'
    CHECK (ingredient_review_status IN ('needs_structuring','structured_confirmed')),
  use_stage text NOT NULL DEFAULT 'personal_pilot'
    CHECK (use_stage IN ('personal_pilot','ready_for_publication')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cc_official_source_unique_entry UNIQUE (source_document,entry_number),
  CONSTRAINT cc_official_source_sauce_not_plannable CHECK
    (source_kind <> 'sauce' OR is_plannable=false),
  CONSTRAINT cc_official_source_week_slot CHECK
    (source_kind <> 'week' OR source_meal_name IN ('Café da manhã','Almoço','Jantar'))
);
CREATE INDEX IF NOT EXISTS cc_official_recipe_source_stage_idx
  ON public.cc_official_recipe_source_records(use_stage,is_plannable,source_kind);
ALTER TABLE public.cc_official_recipe_source_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cc_official_recipe_source_records FROM public,anon,authenticated;
GRANT SELECT ON public.cc_official_recipe_source_records TO authenticated;
DROP POLICY IF EXISTS cc_official_recipe_source_admin_select
 ON public.cc_official_recipe_source_records;
CREATE POLICY cc_official_recipe_source_admin_select
 ON public.cc_official_recipe_source_records FOR SELECT TO authenticated
 USING ((SELECT public.cc_is_admin()));
COMMENT ON TABLE public.cc_official_recipe_source_records IS
 'Transcrição fiel dos PDFs do desafio; catalogação piloto, sem calendário, sem inferir quantidades, sem publicar e sem homologação nutricional.';

-- Preserva categorização detalhada sem alterar a categoria legada das receitas.
-- Os subtipos são informativos, nunca usados para afirmar segurança clínica.
