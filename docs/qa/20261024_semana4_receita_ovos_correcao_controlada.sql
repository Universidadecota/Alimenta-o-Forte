-- Costa&Costa · Semana 4, Dia 26: corrigir transcricao a partir do PDF
-- revisado enviado pelo usuario em 24/10/2026. Alvo exato e versionado.
-- Nao e uma aprovacao de alergênicos, nem altera cardapios.
-- Fonte anterior: hash 3d1945304c99a2509a54e35bbaf62bdf.
-- Antes da revisao, os ingredientes citavam "ver receita do Dia 24" e
-- o preparo comecava em "Cozinhe os ovos por 9 minutos...".
-- A fonte nova adiciona receita completa de maionese com gema crua;
-- a UI contem advertencia de uso de gema pasteurizada.

begin;

do $edition$
declare
 v_id uuid := 'fd9d66ab-d656-4bac-8ac6-2607ffad8cc4';
 v_document text := 'Cardápio da Semana 4 (Dias 22 a 28) - Desafio 30 Dias.pdf';
 v_ingredients text :=
  '3 ovos cozidos, 1 colher (sopa) de maionese caseira (receita abaixo), 1 talo de aipo picado fino, 1 colher (sopa) de endro ou cebolinha, suco de ½ limão, sal, pimenta, páprica, 4 folhas de endivia (ou alface romana), chá gelado sem açúcar.' || E'\n' ||
  'Maionese caseira (rende cerca de ½ xícara; a sobra dura 2 dias na geladeira): 1 gema em temperatura ambiente, suco de ½ limão, ¼ de xícara de óleo de abacate (ou azeite suave), 1 pitada de sal.';
 v_preparation text :=
  'Faça a maionese: em um copo alto, bata a gema com o suco de limão e o sal usando um mixer ou um fouet. Sem parar de bater, acrescente o óleo em fio bem fino, por 1 a 2 minutos, até a mistura ficar firme e cremosa. Se desandar, comece de novo com outra gema e vá juntando a mistura talhada aos poucos. Guarde na geladeira, pois leva ovo cru.' || E'\n' ||
  'Cozinhe os ovos por 9 minutos e esfrie em água gelada. Amasse com um garfo e misture com a maionese, o aipo, o endro, o limão, o sal e a pimenta. Recheie as folhas de endivia e polvilhe páprica.';
 v_old_hash text := '3d1945304c99a2509a54e35bbaf62bdf';
 v_new_hash text;
 v_count integer;
begin
 -- A atualização jamais escolhe receitas pelo título isolado.
 perform 1 from public.cc_official_recipe_source_records
 where recipe_id=v_id and source_document=v_document
   and entry_number=13 and source_day=26 and source_page=5
   and reference_hash=v_old_hash
   and original_ingredients like '%(ver receita do Dia 24)%'
 for update;
 if not found then
  raise exception 'Fonte original da receita de ovos mudou; revisao cancelada';
 end if;
 perform 1 from public.recipes
 where id=v_id and title='Salada de ovos em canoas de endivia'
   and instructions like 'Cozinhe os ovos por 9 minutos%'
 for update;
 if not found then
  raise exception 'Preparo original divergente; revisao cancelada';
 end if;
 if exists(select 1 from public.cc_allergen_ingredient_evidence where recipe_id=v_id)
    or exists(select 1 from public.cc_allergen_a4_ingredient_findings where recipe_id=v_id) then
  raise exception 'Existem evidencias de alergênicos: revisar a invalidação antes de editar';
 end if;
 select count(*) into v_count from public.recipe_ingredients where recipe_id=v_id;
 if v_count<>10 then
  raise exception 'Número de fragmentos de ingredientes mudou: %',v_count;
 end if;
 v_new_hash := md5('CC_W4_D26_REV_20261024|' || v_ingredients || '|' || v_preparation);
 update public.cc_official_recipe_source_records
 set original_ingredients=v_ingredients,
     original_preparation=v_preparation,
     reference_hash=v_new_hash
 where recipe_id=v_id and reference_hash=v_old_hash;
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'A transcricao nao foi atualizada'; end if;

 update public.recipes set instructions=v_preparation where id=v_id;
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'O preparo do aplicativo nao foi atualizado'; end if;

 update public.recipe_ingredients
 set name='1 colher (sopa) de maionese caseira (receita abaixo)'
 where id='443da73d-ea48-434e-a3f8-6861d76a30e2'
   and recipe_id=v_id
   and name='1 colher (sopa) de maionese caseira (ver receita do Dia 24)';
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'Fragmento antigo da maionese nao foi encontrado'; end if;

 insert into public.recipe_ingredients(recipe_id,name,position,quantity,unit,measure_mode,is_optional)
 values
  (v_id,'Maionese caseira (rende cerca de ½ xícara; a sobra dura 2 dias na geladeira): 1 gema em temperatura ambiente',10,null,'un','unspecified',false),
  (v_id,'suco de ½ limão',11,null,'un','unspecified',false),
  (v_id,'¼ de xícara de óleo de abacate (ou azeite suave)',12,null,'un','unspecified',false),
  (v_id,'1 pitada de sal',13,null,'un','unspecified',false);

 -- Duas fichas contiguas da mesma pagina foram etiquetadas com Dia 24;
 -- o PDF situa ambas no Dia 26. Nenhum ingrediente/preparo delas muda.
 update public.cc_official_recipe_source_records
 set source_day=26
 where source_document=v_document and entry_number in (14,15)
   and source_day=24;
 get diagnostics v_count=row_count;
 if v_count<>2 then raise exception 'Metadados dos dois registros do Dia 26 divergentes'; end if;

 raise notice 'Fonte e preparo corrigidos; novo reference_hash = %',v_new_hash;
end
$edition$;

commit;
