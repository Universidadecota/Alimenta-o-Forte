-- Costa&Costa | Fase 2E: solicitacao, decisao e trilha imutavel da revisao de nutrientes.
-- Nenhum revisor e cadastrado nesta migracao; nenhuma aprovacao/publicacao e criada.
-- Somente credenciamento tecnico externo, verificado previamente, pode habilitar uma decisao.
CREATE TABLE IF NOT EXISTS public.cc_nutrition_reviewers (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 5 AND 180),
 qualification text NOT NULL CHECK (char_length(btrim(qualification)) BETWEEN 5 AND 180),
 registration_number text NOT NULL CHECK (char_length(btrim(registration_number)) BETWEEN 3 AND 80),
 registration_region text NOT NULL CHECK (char_length(btrim(registration_region)) BETWEEN 2 AND 80),
 credential_verified_at timestamptz NOT NULL,
 credential_verified_by uuid NOT NULL REFERENCES auth.users(id),
 active boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.cc_nutrition_reviewers IS
 'Credenciamento manual de responsaveis tecnicos, fora da interface. Esta migracao nao cadastra nenhum.';

CREATE TABLE IF NOT EXISTS public.cc_food_nutrition_review_cases (
 variant_id uuid PRIMARY KEY REFERENCES public.cc_food_nutrition_variants(id) ON DELETE RESTRICT,
 status text NOT NULL CHECK(status IN ('requested','changes_requested','approved','invalidated')),
 requested_by uuid NOT NULL REFERENCES auth.users(id),
 requested_at timestamptz NOT NULL,
 request_notes text NOT NULL DEFAULT '',
 submitted_snapshot jsonb NOT NULL,
 reviewer_id uuid REFERENCES public.cc_nutrition_reviewers(user_id),
 reviewed_at timestamptz,
 decision_notes text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT cc_fnrc_request_note_length CHECK (char_length(request_notes) <= 2000),
 CONSTRAINT cc_fnrc_decision_note_length CHECK (char_length(decision_notes) <= 2000),
 CONSTRAINT cc_fnrc_review_fields CHECK (
   (status IN ('requested','invalidated') AND (reviewer_id IS NULL OR status='invalidated'))
   OR (status IN ('approved','changes_requested') AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)
 )
);
CREATE TABLE IF NOT EXISTS public.cc_food_nutrition_review_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 variant_id uuid NOT NULL REFERENCES public.cc_food_nutrition_variants(id) ON DELETE RESTRICT,
 event_type text NOT NULL CHECK(event_type IN ('requested','approved','changes_requested','invalidated')),
 actor_id uuid REFERENCES auth.users(id),
 event_at timestamptz NOT NULL DEFAULT now(),
 note text NOT NULL CHECK (char_length(note) <= 2000),
 source_snapshot jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS cc_fnre_variant_order_idx
 ON public.cc_food_nutrition_review_events(variant_id,event_at DESC,id DESC);
COMMENT ON TABLE public.cc_food_nutrition_review_events IS
 'Historico append-only de solicitacao, decisao e invalidacao; nunca altera nutrientes publicos.';

-- Snapshot nao inclui estados de workflow, IDs ou timestamps. Captura todo conteudo tecnico.
CREATE OR REPLACE FUNCTION public.cc_nutrition_variant_snapshot(p_variant public.cc_food_nutrition_variants)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $fn$
 SELECT jsonb_build_object(
  'food_item_id',p_variant.food_item_id,
  'variant_name',p_variant.variant_name,'food_state',p_variant.food_state,
  'preparation_method',p_variant.preparation_method,
  'source_name',p_variant.source_name,'source_reference',p_variant.source_reference,
  'source_url',p_variant.source_url,
  'energy_kcal',p_variant.energy_kcal,'protein_g',p_variant.protein_g,
  'carbohydrates_g',p_variant.carbohydrates_g,'fats_g',p_variant.fats_g,
  'fiber_g',p_variant.fiber_g,'sodium_mg',p_variant.sodium_mg,
  'notes',p_variant.notes
 )
$fn$;

-- Eventos permanecem gravados mesmo se a variante for editada.
CREATE OR REPLACE FUNCTION public.cc_invalidate_nutrition_review_on_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE previous_case public.cc_food_nutrition_review_cases%ROWTYPE;
BEGIN
 IF public.cc_nutrition_variant_snapshot(OLD) IS DISTINCT FROM public.cc_nutrition_variant_snapshot(NEW) THEN
  UPDATE public.cc_food_nutrition_review_cases
    SET status='invalidated',updated_at=now(),decision_notes='',
        reviewer_id=NULL,reviewed_at=NULL
   WHERE variant_id=NEW.id AND status IN ('requested','approved','changes_requested')
   RETURNING * INTO previous_case;
  IF FOUND THEN
    INSERT INTO public.cc_food_nutrition_review_events(variant_id,event_type,actor_id,note,source_snapshot)
    VALUES (NEW.id,'invalidated',(SELECT auth.uid()),
     'Dados da variante alterados: a revisão anterior não é mais válida.',
     public.cc_nutrition_variant_snapshot(NEW));
  END IF;
 END IF;
 RETURN NULL;
END
$fn$;
DROP TRIGGER IF EXISTS cc_fnrc_variant_invalidate ON public.cc_food_nutrition_variants;
CREATE TRIGGER cc_fnrc_variant_invalidate AFTER UPDATE ON public.cc_food_nutrition_variants
 FOR EACH ROW EXECUTE FUNCTION public.cc_invalidate_nutrition_review_on_edit();

-- Criacao de pedido exclusivamente por RPC; campos de parecer indisponiveis para edicao direta.
CREATE OR REPLACE FUNCTION public.cc_request_food_nutrition_review(p_variant_id uuid,p_note text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v public.cc_food_nutrition_variants%ROWTYPE;
  who uuid := (SELECT auth.uid());
  snapshot jsonb;
  previous_status text;
BEGIN
 IF who IS NULL OR NOT public.cc_is_admin() THEN
   RAISE EXCEPTION 'Apenas administradores podem solicitar revisao tecnica';
 END IF;
 IF char_length(btrim(coalesce(p_note,''))) < 12 OR char_length(p_note)>2000 THEN
   RAISE EXCEPTION 'Descreva em 12 a 2000 caracteres o que deve ser revisado';
 END IF;
 SELECT * INTO v FROM public.cc_food_nutrition_variants
 WHERE id=p_variant_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Variante inexistente'; END IF;
 IF v.food_state='unspecified' OR char_length(btrim(v.source_name))<3
  OR char_length(btrim(v.source_reference))<2 OR v.energy_kcal IS NULL THEN
   RAISE EXCEPTION 'Preencha estado, fonte, codigo e energia antes de solicitar revisao';
 END IF;
 SELECT status INTO previous_status FROM public.cc_food_nutrition_review_cases
  WHERE variant_id=v.id FOR UPDATE;
 IF previous_status IN ('requested','approved') THEN
   RAISE EXCEPTION 'Solicitacao ja existe ou houve parecer valido; edite os dados para nova revisao';
 END IF;
 snapshot := public.cc_nutrition_variant_snapshot(v);
 INSERT INTO public.cc_food_nutrition_review_cases
 (variant_id,status,requested_by,requested_at,request_notes,submitted_snapshot,
  reviewer_id,reviewed_at,decision_notes,updated_at)
 VALUES(v.id,'requested',who,now(),btrim(p_note),snapshot,NULL,NULL,'',now())
 ON CONFLICT(variant_id) DO UPDATE
 SET status='requested',requested_by=excluded.requested_by,
 requested_at=excluded.requested_at,request_notes=excluded.request_notes,
 submitted_snapshot=excluded.submitted_snapshot,reviewer_id=NULL,
 reviewed_at=NULL,decision_notes='',updated_at=now();
 INSERT INTO public.cc_food_nutrition_review_events
 (variant_id,event_type,actor_id,note,source_snapshot)
 VALUES(v.id,'requested',who,btrim(p_note),snapshot);
 UPDATE public.cc_food_nutrition_variants SET review_status='awaiting_specialist'
 WHERE id=v.id AND review_status<>'awaiting_specialist';
 RETURN 'requested';
END
$fn$;

-- Preparada para um revisor formalmente credenciado. NINGUEM e provisionado por esta migracao.
-- Parecer tecnico NAO publica composicao nem concede seguranca para alergias.
CREATE OR REPLACE FUNCTION public.cc_decide_food_nutrition_review(
 p_variant_id uuid,p_decision text,p_reason text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE who uuid := (SELECT auth.uid());
 v public.cc_food_nutrition_variants%ROWTYPE;
 c public.cc_food_nutrition_review_cases%ROWTYPE;
BEGIN
 IF who IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.cc_nutrition_reviewers rr
  WHERE rr.user_id=who AND rr.active AND rr.credential_verified_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Revisor tecnico nao credenciado'; END IF;
 IF p_decision NOT IN ('approved','changes_requested')
  OR char_length(btrim(coalesce(p_reason,'')))<20
  OR char_length(p_reason)>2000 THEN
   RAISE EXCEPTION 'Parecer deve ter decisao valida e fundamentacao de 20 a 2000 caracteres';
 END IF;
 SELECT * INTO v FROM public.cc_food_nutrition_variants
 WHERE id=p_variant_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Variante inexistente'; END IF;
 SELECT * INTO c FROM public.cc_food_nutrition_review_cases
 WHERE variant_id=p_variant_id FOR UPDATE;
 IF NOT FOUND OR c.status<>'requested' THEN RAISE EXCEPTION 'Nao ha revisao pendente'; END IF;
 IF c.requested_by=who THEN RAISE EXCEPTION 'O solicitante nao pode aprovar seu proprio pedido'; END IF;
 IF c.submitted_snapshot IS DISTINCT FROM public.cc_nutrition_variant_snapshot(v)
 THEN RAISE EXCEPTION 'Fonte/ingredientes alterados: solicitar nova revisao'; END IF;
 IF p_decision='approved' AND (
   v.food_state='unspecified' OR v.source_name='' OR v.source_reference=''
   OR v.energy_kcal IS NULL OR v.protein_g IS NULL OR v.carbohydrates_g IS NULL
   OR v.fats_g IS NULL OR v.fiber_g IS NULL
   OR (v.sodium_mg IS NULL AND v.notes NOT ILIKE '%Tr%')
 ) THEN RAISE EXCEPTION 'Dados insuficientes para parecer favoravel'; END IF;
 UPDATE public.cc_food_nutrition_review_cases
 SET status=p_decision,reviewer_id=who,reviewed_at=now(),
 decision_notes=btrim(p_reason),updated_at=now() WHERE variant_id=p_variant_id;
 INSERT INTO public.cc_food_nutrition_review_events
 (variant_id,event_type,actor_id,note,source_snapshot)
 VALUES(v.id,p_decision,who,btrim(p_reason),public.cc_nutrition_variant_snapshot(v));
 RETURN p_decision;
END
$fn$;

ALTER TABLE public.cc_nutrition_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cc_food_nutrition_review_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cc_food_nutrition_review_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cc_nutrition_reviewers, public.cc_food_nutrition_review_cases,
 public.cc_food_nutrition_review_events FROM public,anon,authenticated;
-- Administradores podem LER pedidos e historico, mas nao alterar pareceres.
GRANT SELECT ON public.cc_food_nutrition_review_cases,public.cc_food_nutrition_review_events TO authenticated;
CREATE POLICY cc_fnrc_admin_read ON public.cc_food_nutrition_review_cases
 FOR SELECT TO authenticated USING ((SELECT public.cc_is_admin()) OR
   EXISTS (SELECT 1 FROM public.cc_nutrition_reviewers rr
     WHERE rr.user_id=(SELECT auth.uid()) AND rr.active));
CREATE POLICY cc_fnre_admin_read ON public.cc_food_nutrition_review_events
 FOR SELECT TO authenticated USING ((SELECT public.cc_is_admin()) OR
   EXISTS (SELECT 1 FROM public.cc_nutrition_reviewers rr
     WHERE rr.user_id=(SELECT auth.uid()) AND rr.active));
-- Nunca expor cadastro de credenciais para usuarios normais ou administradores via PostgREST.
REVOKE ALL ON FUNCTION public.cc_nutrition_variant_snapshot(public.cc_food_nutrition_variants)
 FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.cc_invalidate_nutrition_review_on_edit()
 FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.cc_request_food_nutrition_review(uuid,text)
 FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.cc_decide_food_nutrition_review(uuid,text,text)
 FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cc_request_food_nutrition_review(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cc_decide_food_nutrition_review(uuid,text,text) TO authenticated;
