-- Costa&Costa: reconciliacao de dois registros oficiais com a fonte editorial (paginas impressas 12-13 e 18-19).
-- FONTE: "50 Receitas Para Emagrecer De Vez" (arquivo PDF fornecido pelo responsavel).
-- Dados exclusivamente culinarios: NAO sao informacoes nutricionais verificadas nem avaliacao de alergenicos.
-- Para o cha, o rendimento original e de 2 copos; preservar quantidade absoluta dos ingredientes.
-- A migracao altera a lista de compras de planejamentos existentes pelo rendimento correto.
DO $cc$
DECLARE
 v_yogurt uuid;
 v_tea uuid;
 v_ingredient uuid;
 v_count integer;
 v_servings integer;
BEGIN
 SELECT id INTO STRICT v_yogurt FROM public.recipes
 WHERE title='Iogurte Turbo' AND owner_user_id IS NULL AND archived_at IS NULL
   AND published=false;
 SELECT id INTO STRICT v_tea FROM public.recipes
 WHERE title='Chá Cremoso De  Cúrcuma' AND owner_user_id IS NULL AND archived_at IS NULL
   AND published=true;

 PERFORM 1 FROM public.recipes WHERE id IN (v_yogurt,v_tea) FOR UPDATE;
 SELECT COUNT(*) INTO v_count FROM public.recipe_ingredients WHERE recipe_id=v_yogurt;

 IF v_count = 1 THEN
   SELECT id INTO STRICT v_ingredient FROM public.recipe_ingredients
   WHERE recipe_id=v_yogurt AND quantity=4 AND unit='colher_cha'
     AND measure_mode='measured' AND position=0;
   UPDATE public.recipe_ingredients
     SET name='Iogurte natural integral (min. 10% de gordura; colher cheia)',
         unit='colher_sopa'
     WHERE id=v_ingredient;

   INSERT INTO public.recipe_ingredients(recipe_id,name,quantity,unit,measure_mode,is_optional,position)
   VALUES
   (v_yogurt,'Creme de leite',1,'colher_sopa','measured',false,1),
   (v_yogurt,'Estévia (adoçante)',null,'un','taste',false,2),
   (v_yogurt,'Coco ralado (colher cheia)',1,'colher_sopa','measured',false,3),
   (v_yogurt,'Linhaça',2,'colher_cha','measured',false,4),
   (v_yogurt,'Amêndoas cortadas',1,'colher_sopa','measured',false,5),
   (v_yogurt,'Sementes de girassol',1,'colher_cha','measured',false,6),
   (v_yogurt,'Chocolate com 85% de cacau (pedacinho)',null,'un','unspecified',true,7);
 ELSIF v_count = 8 THEN
   -- Reexecucao protegida: nenhuma modificacao automatica em dados ja revisados.
   IF NOT EXISTS(SELECT 1 FROM public.recipe_ingredients
     WHERE recipe_id=v_yogurt AND position=0 AND quantity=4 AND unit='colher_sopa')
     OR NOT EXISTS(SELECT 1 FROM public.recipe_ingredients
     WHERE recipe_id=v_yogurt AND position=7 AND is_optional AND quantity IS NULL) THEN
     RAISE EXCEPTION 'Iogurte Turbo ja contem oito ingredientes mas nao corresponde a revisao conhecida; revisar manualmente';
   END IF;
 ELSE
   RAISE EXCEPTION 'Iogurte Turbo contem % ingredientes; abortado para preservar edicoes concorrentes',v_count;
 END IF;

 SELECT servings INTO v_servings FROM public.recipes WHERE id=v_tea;
 IF v_servings=1 THEN
   -- A fonte diz "faz 2 copos generosos"; ingredientes cadastrados sao do preparo completo.
   UPDATE public.recipes SET servings=2 WHERE id=v_tea;
 ELSIF v_servings<>2 THEN
   RAISE EXCEPTION 'Rendimento do cha inesperado: %',v_servings;
 END IF;

 IF (SELECT COUNT(*) FROM public.recipe_ingredients WHERE recipe_id=v_yogurt)<>8 THEN
   RAISE EXCEPTION 'Iogurte Turbo: conferência de ingredientes falhou';
 END IF;
END
$cc$;
