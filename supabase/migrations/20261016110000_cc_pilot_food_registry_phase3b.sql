-- Costa&Costa | Fase 3B — Alimentos do acervo piloto de 119 receitas.
-- O cadastro de alimentos e classificacao preliminar: NENHUM valor nutricional
-- ou declaracao de alergênico pode ser inferido pela fonte.
CREATE TABLE IF NOT EXISTS public.cc_pilot_food_registry (
 food_item_id uuid PRIMARY KEY REFERENCES public.food_items(id) ON DELETE RESTRICT,
 source_bundle text NOT NULL DEFAULT 'Seis PDFs Desafio 30 Dias enviados para uso pessoal',
 review_status text NOT NULL DEFAULT 'needs_ingredient_review'
   CHECK (review_status IN ('needs_ingredient_review','editorially_reviewed')),
 added_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cc_pilot_food_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cc_pilot_food_registry FROM public,anon,authenticated;
GRANT SELECT ON public.cc_pilot_food_registry TO authenticated;
DROP POLICY IF EXISTS cc_pilot_food_registry_admin_read ON public.cc_pilot_food_registry;
CREATE POLICY cc_pilot_food_registry_admin_read
 ON public.cc_pilot_food_registry FOR SELECT TO authenticated
 USING ((SELECT public.cc_is_admin()));
COMMENT ON TABLE public.cc_pilot_food_registry IS
 'Alimentos preliminares vinculados ao acervo pessoal; nao aprova composicao, alergênicos ou categoria de dieta.';
