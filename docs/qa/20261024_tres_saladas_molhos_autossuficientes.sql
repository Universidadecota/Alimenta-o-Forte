-- Costa&Costa Alimentação Forte: fichas autossuficientes de três saladas.
-- Adaptação editorial controlada: combina a ficha da salada com a receita de
-- molho do MESMO documento, preservando as fichas independentes dos molhos.
-- Os dois textos originais e seus hashes anteriores estão no próprio SQL e
-- nas versões já registradas no repositório. Nenhuma alergia é aprovada.
-- CUIDADO: os molhos rendem 2-3 porções; a lista de compras inclui o lote
-- inteiro da preparação, sem inventar um consumo por porção.

begin;

do $revision$
declare
  v_doc constant text := 'Saladas Verdes com Proteína - Desafio 30 Dias.pdf';
  v_pair record;
  v_parent public.cc_official_recipe_source_records%rowtype;
  v_sauce public.cc_official_recipe_source_records%rowtype;
  v_ingredients text;
  v_preparation text;
  v_new_hash text;
  v_rows integer;
  v_start_position integer;
begin
  for v_pair in
   select * from (values
    ('ccea2f76-a9b0-477a-a5b7-2e4594d2cac7'::uuid,
     '2cb11984-a329-48c7-bcaa-7d0b49e4a648'::uuid,
     1,12,'1e2b0c8141147782525bbc92a9b8aec6','579ddd2f4bbf4ac24835dae16dcedf7e',9,
     'Caesar sem queijo, com frango',
     'fca24840-feea-4a61-be87-83e0128a6cea'::uuid,
     'Molho Caesar (receita abaixo).',null::text),
    ('f56d235a-78da-4af5-9086-40bba1aaba33'::uuid,
     '7aed09c2-b22a-4cda-8e07-8acba68fdc14'::uuid,
     8,15,'1bde37883e6d92ed04bc6730fddbf8a1','bc6481832a83bcc9c08b94bba8fe8a3a',6,
     'Asiática de repolho, alga e frango desfiado',
     '07502fa6-d5a2-45e6-80a4-d67245229ba4'::uuid,
     '1 colher (sopa) de gergelim. Molho: vinagrete de gengibre (receita abaixo).',
     '1 colher (sopa) de gergelim'),
    ('39d71eb9-35b3-48f5-8610-6bcc4b7b110d'::uuid,
     '2b6d7bc9-458c-4aa5-ae4f-2a30d12df152'::uuid,
     10,13,'9ab4817aa66c21552dc8725a84a56d13','f7e9dd371b886f621e3d2253d2baed28',7,
     'Peito de peru com abacate, brotos e molho verde',
     'bdcec15b-d635-4d8b-8355-02f38d446856'::uuid,
     '1 colher (sopa) de semente de abóbora. Molho: molho cremoso de abacate (receita abaixo).',
     '1 colher (sopa) de semente de abóbora')
   ) as x(parent_id,sauce_id,parent_entry,sauce_entry,parent_hash,sauce_hash,
          expected_count,expected_title,placeholder_id,placeholder_name,clean_name)
  loop
   select * into v_parent from public.cc_official_recipe_source_records
   where recipe_id=v_pair.parent_id and source_document=v_doc
     and entry_number=v_pair.parent_entry and reference_hash=v_pair.parent_hash
     and original_title=v_pair.expected_title
   for update;
   if not found then
     raise exception 'Ficha da salada % divergiu: revisão cancelada',v_pair.parent_entry;
   end if;
   select * into v_sauce from public.cc_official_recipe_source_records
   where recipe_id=v_pair.sauce_id and source_document=v_doc
     and entry_number=v_pair.sauce_entry and reference_hash=v_pair.sauce_hash
   for share;
   if not found then
     raise exception 'Fonte do molho % divergiu: revisão cancelada',v_pair.sauce_entry;
   end if;
   perform 1 from public.recipes
   where id=v_pair.parent_id and title=v_pair.expected_title
     and instructions=v_parent.original_preparation and published=false
   for update;
   if not found then
     raise exception 'Preparo/publicação da salada % mudou: revisão cancelada',v_pair.parent_entry;
   end if;
   if exists(select 1 from public.cc_allergen_ingredient_evidence where recipe_id=v_pair.parent_id)
      or exists(select 1 from public.cc_allergen_a4_ingredient_findings where recipe_id=v_pair.parent_id)
      or exists(select 1 from public.cc_recipe_allergen_reviews
                where recipe_id=v_pair.parent_id and status<>'pending') then
     raise exception 'Salada % tem avaliação de alergênicos que exige revisão manual',v_pair.parent_entry;
   end if;
   select count(*) into v_rows from public.recipe_ingredients where recipe_id=v_pair.parent_id;
   if v_rows<>v_pair.expected_count then
     raise exception 'Fragmentos da salada %: esperados %, encontrados %',v_pair.parent_entry,v_pair.expected_count,v_rows;
   end if;
   select count(*) into v_rows from public.recipe_ingredients where recipe_id=v_pair.sauce_id;
   if v_rows<>7 then
     raise exception 'Molho % mudou: esperados 7 fragmentos, encontrados %',v_pair.sauce_entry,v_rows;
   end if;

   -- Texto composto é uma adaptação para a ficha individual no aplicativo.
   -- Rendimento de molho independente (2-3 porções); sem escalonar.
   v_ingredients := v_parent.original_ingredients || E'\n\n'
     || v_sauce.original_title || ' (rendimento próprio: 2 a 3 porções): '
     || v_sauce.original_ingredients;
   v_preparation := 'Prepare ' || v_sauce.original_title || ': '
     || v_sauce.original_preparation || E'\n' || v_parent.original_preparation;
   v_new_hash := md5('CC_SALADAS_MOLHOS_20261024|'
     || v_parent.reference_hash || '|' || v_sauce.reference_hash || '|'
     || v_ingredients || '|' || v_preparation);

   update public.cc_official_recipe_source_records
   set original_ingredients=v_ingredients,original_preparation=v_preparation,
       reference_hash=v_new_hash
   where recipe_id=v_pair.parent_id and reference_hash=v_pair.parent_hash;
   get diagnostics v_rows=row_count;
   if v_rows<>1 then raise exception 'Falha ao atualizar fonte da salada %',v_pair.parent_entry; end if;
   update public.recipes set instructions=v_preparation
   where id=v_pair.parent_id and instructions=v_parent.original_preparation;
   get diagnostics v_rows=row_count;
   if v_rows<>1 then raise exception 'Falha ao atualizar preparo da salada %',v_pair.parent_entry; end if;

   if v_pair.clean_name is null then
     -- Caesar: remover apenas o placeholder da lista de compras.
     delete from public.recipe_ingredients
     where id=v_pair.placeholder_id and recipe_id=v_pair.parent_id
       and name=v_pair.placeholder_name;
   else
     -- Asiática e peru: o placeholder veio junto com um ingrediente real.
     update public.recipe_ingredients set name=v_pair.clean_name
     where id=v_pair.placeholder_id and recipe_id=v_pair.parent_id
       and name=v_pair.placeholder_name;
   end if;
   get diagnostics v_rows=row_count;
   if v_rows<>1 then raise exception 'Placeholder da salada % divergente',v_pair.parent_entry; end if;

   select count(*) into v_start_position
   from public.recipe_ingredients where recipe_id=v_pair.parent_id;
   insert into public.recipe_ingredients
    (recipe_id,name,quantity,unit,position,measure_mode,is_optional)
   select v_pair.parent_id, i.name, i.quantity, i.unit,
          v_start_position+i.position, i.measure_mode, i.is_optional
   from public.recipe_ingredients i
   where i.recipe_id=v_pair.sauce_id
   order by i.position;
   get diagnostics v_rows=row_count;
   if v_rows<>7 then raise exception 'Ingredientes do molho % não foram copiados',v_pair.sauce_entry; end if;

   raise notice 'Salada %: molho % incorporado, hash %',
     v_pair.parent_entry,v_pair.sauce_entry,v_new_hash;
  end loop;
end
$revision$;

commit;
