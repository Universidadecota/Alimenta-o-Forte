-- Fase 3I.4 — ações administrativas auditadas de revisão culinária das medidas.
-- Não altera recipe_ingredients nem libera porções, compras ou nutrição.
CREATE TABLE IF NOT EXISTS public.cc_pilot_measure_review_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 ingredient_id uuid NOT NULL REFERENCES public.cc_pilot_ingredient_measure_reviews(ingredient_id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 action text NOT NULL CHECK (action IN ('draft_saved','needs_manual_review','editorially_confirmed')),
 old_status text NOT NULL,
 new_status text NOT NULL,
 source_text text NOT NULL,
 old_proposal jsonb NOT NULL,
 new_proposal jsonb NOT NULL,
 decision_note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT cc_pilot_measure_event_notes CHECK (length(decision_note) <= 1200)
);
CREATE INDEX IF NOT EXISTS cc_pilot_measure_review_events_lookup_idx
 ON public.cc_pilot_measure_review_events(ingredient_id,created_at DESC);
ALTER TABLE public.cc_pilot_measure_review_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cc_pilot_measure_review_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.cc_pilot_measure_review_events TO authenticated;
DROP POLICY IF EXISTS cc_pilot_measure_events_admin_read ON public.cc_pilot_measure_review_events;
CREATE POLICY cc_pilot_measure_events_admin_read
 ON public.cc_pilot_measure_review_events FOR SELECT TO authenticated
 USING ((SELECT public.cc_is_admin()));

-- Mudanças de estado e campos de proposta passam exclusivamente por RPCs auditadas.
REVOKE UPDATE ON public.cc_pilot_ingredient_measure_reviews FROM authenticated;
DROP POLICY IF EXISTS cc_pilot_measure_admin_update ON public.cc_pilot_ingredient_measure_reviews;

CREATE OR REPLACE FUNCTION public.cc_save_pilot_measure_draft_single(
 p_id uuid,p_source_text text,p_quantity numeric,p_unit text,
 p_ingredient text,p_notes text,p_status text DEFAULT 'draft'
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_actor uuid:=auth.uid(); v_row record; v_status text; v_name text:=btrim(coalesce(p_ingredient,'')); v_note text:=btrim(coalesce(p_notes,''));
BEGIN
 IF v_actor IS NULL OR NOT public.cc_is_admin() THEN RAISE EXCEPTION 'Sem permissão administrativa'; END IF;
 IF p_status NOT IN ('draft','needs_manual_review') OR p_status IS NULL THEN
  RAISE EXCEPTION 'Ação editorial inválida';
 END IF;
 IF length(v_note)>1200 THEN RAISE EXCEPTION 'Observação muito longa'; END IF;
 SELECT rv.*,ri.name AS current_name,ri.position AS current_position,r.published AS recipe_published,s.use_stage
 INTO v_row
 FROM public.cc_pilot_ingredient_measure_reviews rv
 JOIN public.recipe_ingredients ri ON ri.id=rv.ingredient_id AND ri.recipe_id=rv.recipe_id
 JOIN public.recipes r ON r.id=rv.recipe_id
 JOIN public.cc_official_recipe_source_records s ON s.recipe_id=rv.recipe_id
 WHERE rv.ingredient_id=p_id AND rv.source_text=p_source_text
 FOR UPDATE OF rv;
 IF NOT FOUND OR v_row.source_text IS DISTINCT FROM v_row.current_name OR
 v_row.source_position IS DISTINCT FROM v_row.current_position OR
 v_row.recipe_published IS DISTINCT FROM false OR v_row.use_stage IS DISTINCT FROM 'personal_pilot'
 THEN RAISE EXCEPTION 'Fonte alterada ou receita fora do piloto'; END IF;
 IF v_row.review_status='confirmed' THEN RAISE EXCEPTION 'Medida já confirmada; edição direta bloqueada'; END IF;
 IF p_status='draft' THEN
  IF p_quantity IS NULL OR p_quantity<=0 OR p_quantity>100000 OR p_quantity<>round(p_quantity,4)
   OR length(v_name) NOT BETWEEN 2 AND 180 OR
   p_unit IS NULL OR p_unit NOT IN
    ('g','kg','ml','l','colher_cha','colher_sopa','xicara','dente','fatia','pitada','ramo','lata','copo','unidade','punhado','ovo','cebola','tomate')
  THEN RAISE EXCEPTION 'Proposta incompleta ou inválida'; END IF;
 ELSE
  IF length(v_note)<8 THEN RAISE EXCEPTION 'Explique por que a medida exige revisão manual'; END IF;
 END IF;
 UPDATE public.cc_pilot_ingredient_measure_reviews SET
  proposed_quantity=CASE WHEN p_status='draft' THEN p_quantity ELSE NULL END,
  proposed_unit=CASE WHEN p_status='draft' THEN p_unit ELSE NULL END,
  proposed_ingredient=CASE WHEN p_status='draft' THEN v_name ELSE NULL END,
  review_status=p_status, review_notes=v_note, reviewed_by=NULL,reviewed_at=NULL
 WHERE ingredient_id=p_id;
 INSERT INTO public.cc_pilot_measure_review_events
  (ingredient_id,actor_id,action,old_status,new_status,source_text,old_proposal,new_proposal,decision_note)
 VALUES
  (p_id,v_actor,CASE WHEN p_status='draft' THEN 'draft_saved' ELSE 'needs_manual_review' END,
   v_row.review_status,p_status,p_source_text,
   jsonb_build_object('quantity',v_row.proposed_quantity,'unit',v_row.proposed_unit,'ingredient',v_row.proposed_ingredient,'previous_note',v_row.review_notes),
   jsonb_build_object('quantity',CASE WHEN p_status='draft' THEN p_quantity ELSE NULL END,
    'unit',CASE WHEN p_status='draft' THEN p_unit ELSE NULL END,
    'ingredient',CASE WHEN p_status='draft' THEN v_name ELSE NULL END,'decision_note',v_note),
   v_note);
 RETURN p_status;
END $fn$;

CREATE OR REPLACE FUNCTION public.cc_decide_pilot_measure_draft(
 p_id uuid,p_source_text text,
 p_expected_updated_at timestamptz,
 p_expected_quantity numeric,p_expected_unit text,p_expected_ingredient text,
 p_action text,p_note text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_actor uuid:=auth.uid(); v_row record; v_note text:=btrim(coalesce(p_note,''));
DECLARE v_target text;
BEGIN
 IF v_actor IS NULL OR NOT public.cc_is_admin() THEN RAISE EXCEPTION 'Sem permissão administrativa'; END IF;
 IF p_action NOT IN ('confirm','return') OR p_action IS NULL THEN RAISE EXCEPTION 'Decisão inválida'; END IF;
 IF p_expected_updated_at IS NULL OR p_expected_quantity IS NULL OR
  p_expected_unit IS NULL OR p_expected_ingredient IS NULL THEN RAISE EXCEPTION 'Prévia incompleta'; END IF;
 IF length(v_note)>1200 THEN RAISE EXCEPTION 'Observação muito longa'; END IF;
 IF length(v_note)<8 THEN RAISE EXCEPTION 'Registre a justificativa da decisão editorial'; END IF;

 SELECT rv.*,ri.name AS current_name,ri.position AS current_position,r.published AS recipe_published,s.use_stage
 INTO v_row
 FROM public.cc_pilot_ingredient_measure_reviews rv
 JOIN public.recipe_ingredients ri ON ri.id=rv.ingredient_id AND ri.recipe_id=rv.recipe_id
 JOIN public.recipes r ON r.id=rv.recipe_id
 JOIN public.cc_official_recipe_source_records s ON s.recipe_id=rv.recipe_id
 WHERE rv.ingredient_id=p_id AND rv.source_text=p_source_text
 FOR UPDATE OF rv;
 IF NOT FOUND OR v_row.source_text IS DISTINCT FROM v_row.current_name OR
  v_row.source_position IS DISTINCT FROM v_row.current_position OR
  v_row.recipe_published IS DISTINCT FROM false OR v_row.use_stage IS DISTINCT FROM 'personal_pilot'
 THEN RAISE EXCEPTION 'Fonte alterada ou receita fora do piloto'; END IF;
 IF v_row.review_status <> 'draft' OR v_row.proposed_quantity IS NULL OR
  v_row.proposed_unit IS NULL OR length(btrim(coalesce(v_row.proposed_ingredient,'')))<2 THEN
  RAISE EXCEPTION 'Apenas rascunhos completos podem receber decisão'; END IF;
 IF v_row.updated_at IS DISTINCT FROM p_expected_updated_at OR
  v_row.proposed_quantity IS DISTINCT FROM p_expected_quantity OR
  v_row.proposed_unit IS DISTINCT FROM p_expected_unit OR
  v_row.proposed_ingredient IS DISTINCT FROM p_expected_ingredient THEN
  RAISE EXCEPTION 'Rascunho mudou após a prévia; atualize antes de decidir';
 END IF;
 v_target:=CASE WHEN p_action='confirm' THEN 'confirmed' ELSE 'needs_manual_review' END;
 UPDATE public.cc_pilot_ingredient_measure_reviews SET
  review_status=v_target,
  proposed_quantity=CASE WHEN p_action='confirm' THEN v_row.proposed_quantity ELSE NULL END,
  proposed_unit=CASE WHEN p_action='confirm' THEN v_row.proposed_unit ELSE NULL END,
  proposed_ingredient=CASE WHEN p_action='confirm' THEN v_row.proposed_ingredient ELSE NULL END,
  reviewed_by=CASE WHEN p_action='confirm' THEN v_actor ELSE NULL END,
  reviewed_at=CASE WHEN p_action='confirm' THEN now() ELSE NULL END,
  review_notes=v_note
 WHERE ingredient_id=p_id;
 INSERT INTO public.cc_pilot_measure_review_events
  (ingredient_id,actor_id,action,old_status,new_status,source_text,old_proposal,new_proposal,decision_note)
 VALUES(p_id,v_actor,CASE WHEN p_action='confirm' THEN 'editorially_confirmed' ELSE 'needs_manual_review' END,
  v_row.review_status,v_target,p_source_text,
  jsonb_build_object('quantity',v_row.proposed_quantity,'unit',v_row.proposed_unit,'ingredient',v_row.proposed_ingredient),
  jsonb_build_object('quantity',CASE WHEN p_action='confirm' THEN v_row.proposed_quantity ELSE NULL END,
  'unit',CASE WHEN p_action='confirm' THEN v_row.proposed_unit ELSE NULL END,
  'ingredient',CASE WHEN p_action='confirm' THEN v_row.proposed_ingredient ELSE NULL END,'decision_note',v_note),v_note);
 RETURN v_target;
END $fn$;

REVOKE ALL ON FUNCTION public.cc_save_pilot_measure_draft_single(uuid,text,numeric,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cc_save_pilot_measure_draft_single(uuid,text,numeric,text,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.cc_decide_pilot_measure_draft(uuid,text,timestamptz,numeric,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cc_decide_pilot_measure_draft(uuid,text,timestamptz,numeric,text,text,text,text) TO authenticated;

COMMENT ON TABLE public.cc_pilot_measure_review_events IS
 'Historico de acoes editoriais em medidas culinarias do piloto. Nao implica validacao nutricional ou clinica.';
COMMENT ON FUNCTION public.cc_decide_pilot_measure_draft(uuid,text,timestamptz,numeric,text,text,text,text) IS
 'Decisao editorial individual com controle de concorrencia e trilha de auditoria. Nunca altera receitas, compras nem nutricao.';
