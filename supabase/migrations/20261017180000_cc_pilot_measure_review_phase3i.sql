-- Costa&Costa — Fase 3I: inventário revisável de medidas do piloto.
-- Não atualiza recipes, recipe_ingredients nem seus textos.
CREATE TABLE IF NOT EXISTS public.cc_pilot_ingredient_measure_reviews (
 ingredient_id uuid PRIMARY KEY REFERENCES public.recipe_ingredients(id) ON DELETE CASCADE,
 recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
 source_text text NOT NULL,
 source_position integer NOT NULL,
 proposed_quantity numeric(12,4),
 proposed_unit text,
 proposed_ingredient text,
 review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','draft','confirmed','needs_manual_review')),
 review_notes text NOT NULL DEFAULT '',
 reviewed_by uuid REFERENCES auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT cc_pilot_measure_positive CHECK (
   proposed_quantity IS NULL OR (proposed_quantity > 0 AND proposed_quantity <= 100000)
 ),
 CONSTRAINT cc_pilot_measure_unit CHECK (
   proposed_unit IS NULL OR proposed_unit IN (
    'g','kg','ml','l','colher_cha','colher_sopa','xicara',
    'dente','fatia','pitada','ramo','lata','copo','unidade','punhado','ovo','cebola','tomate'
   )
 ),
 CONSTRAINT cc_pilot_measure_confirmed_check CHECK (
   review_status <> 'confirmed' OR (
     proposed_quantity IS NOT NULL AND proposed_unit IS NOT NULL
     AND length(btrim(coalesce(proposed_ingredient,''))) BETWEEN 2 AND 180
     AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL
   )
 ),
 CONSTRAINT cc_pilot_measure_notes_length CHECK (length(review_notes)<=1200)
);
CREATE INDEX IF NOT EXISTS cc_pilot_measure_review_queue_idx
 ON public.cc_pilot_ingredient_measure_reviews(review_status,recipe_id,source_position);

ALTER TABLE public.cc_pilot_ingredient_measure_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cc_pilot_ingredient_measure_reviews FROM anon;
GRANT SELECT,UPDATE ON public.cc_pilot_ingredient_measure_reviews TO authenticated;
DROP POLICY IF EXISTS cc_pilot_measure_admin_select ON public.cc_pilot_ingredient_measure_reviews;
CREATE POLICY cc_pilot_measure_admin_select ON public.cc_pilot_ingredient_measure_reviews
 FOR SELECT TO authenticated USING ((SELECT public.cc_is_admin()));
DROP POLICY IF EXISTS cc_pilot_measure_admin_update ON public.cc_pilot_ingredient_measure_reviews;
CREATE POLICY cc_pilot_measure_admin_update ON public.cc_pilot_ingredient_measure_reviews
 FOR UPDATE TO authenticated USING ((SELECT public.cc_is_admin()))
 WITH CHECK ((SELECT public.cc_is_admin()));

-- Guarda o texto fonte na tabela de revisão: nenhuma medida é inferida no banco.
-- Somente cria registros que ainda não existem; avaliações prévias são preservadas.
INSERT INTO public.cc_pilot_ingredient_measure_reviews
 (ingredient_id,recipe_id,source_text,source_position)
SELECT i.id,i.recipe_id,i.name,i.position
FROM public.recipe_ingredients i
JOIN public.cc_official_recipe_source_records s ON s.recipe_id=i.recipe_id
WHERE s.use_stage='personal_pilot'
ON CONFLICT (ingredient_id) DO NOTHING;

COMMENT ON TABLE public.cc_pilot_ingredient_measure_reviews IS
 'Inventário editorial de medidas do acervo autoral. Confirmado aqui NÃO altera receita, compras, porções nem nutrição.';
COMMENT ON COLUMN public.cc_pilot_ingredient_measure_reviews.source_text IS
 'Snapshot imutável do texto original de recipe_ingredients.name para detectar divergências antes de usar um parecer.';
