-- Alimentação Forte Beta (24/10/2026).
-- Segundo lote: separa 16 fragmentos de ingrediente que contêm cabeçalhos
-- acoplados ('Salada:', 'Molho:', 'Vinagrete:', 'Acompanhamento:', 'Por porção:').
-- Preserva ingredientes originais, quantidades textuais, fontes, receitas,
-- preferências, avaliações e estrutura de permissões. NÃO homologa alergênicos.
-- Aplicar apenas se os 16 alvos e suas condições ainda coincidirem.

begin;

do $split$
declare
 v_ids uuid[] := array[
  '176f31f6-5e53-460b-a886-9a765584b540'::uuid,
  '35251fa5-0ef0-4b86-ad3b-cb30ca1f1cc8'::uuid,
  '5183e4f8-4472-436c-8c75-4dd819519919'::uuid,
  '156f8349-e325-48c2-ab2d-764cf24047d8'::uuid,
  'ab808877-a373-443c-8c35-3937a92b76a9'::uuid,
  'e447b43a-01bd-41fd-bb3b-f4a50f212c35'::uuid,
  '20af817c-637b-47cf-b1e4-2b9225f4c130'::uuid,
  '13ce3a39-4783-4cd3-9d8a-ac7bd902f15b'::uuid,
  'd4c1645b-5bec-461b-a85b-d0cf158efbd3'::uuid,
  '02b32e26-259e-4e1b-8f33-d42eff947a30'::uuid,
  'da515417-4476-4844-b1e7-bca2ab75c936'::uuid,
  '6e007e03-cc56-416c-b87e-658f3a5ac2eb'::uuid,
  'e7f63618-836d-49e2-903d-6b72262479c6'::uuid,
  'd6f8f160-62b0-4bfa-9a6f-f414ccc021cd'::uuid,
  '8aa23e54-d89b-4f7f-b1ba-bbfa16f17539'::uuid,
  '941a91f6-1d03-462a-bddc-630df8534592'::uuid
 ];
 v_pattern text := '[.][[:space:]]*(?:Molho|Maionese|Salada|Acompanhamento|Vinagrete|Por porção):[[:space:]]*';
 v_item record;
 v_parts text[];
 v_n integer;
 v_done integer := 0;
 v_index integer;
 v_part text;
begin
 if (select count(*) from public.recipe_ingredients i
  join public.recipes r on r.id=i.recipe_id
  join public.cc_official_recipe_source_records s on s.recipe_id=r.id
  where i.id=any(v_ids) and r.owner_user_id is null and r.archived_at is null
   and s.use_stage='personal_pilot' and length(s.reference_hash)=32
   and i.name ~ v_pattern and i.measure_mode='unspecified'
   and i.quantity is null and i.unit='un')<>16 then
  raise exception 'Os 16 fragmentos não estão mais na versão esperada';
 end if;

 for v_item in
  select i.id,i.recipe_id,i.position,i.name,i.is_optional
  from public.recipe_ingredients i
  where i.id=any(v_ids)
  order by i.recipe_id,i.position desc for update of i
 loop
  if exists(select 1 from public.cc_allergen_ingredient_evidence e where e.recipe_id=v_item.recipe_id)
   or exists(select 1 from public.cc_allergen_a4_ingredient_findings f where f.recipe_id=v_item.recipe_id) then
   raise exception 'Há evidência A3B/A4 para a receita %: não dividir',v_item.recipe_id;
  end if;

  v_parts:=regexp_split_to_array(v_item.name,v_pattern);
  v_n:=array_length(v_parts,1);
  if v_n is null or v_n<2 or v_n>3 then
   raise exception 'Separação fora do esperado: ingrediente %',v_item.id;
  end if;
  for v_index in 1..v_n loop
   v_part:=btrim(v_parts[v_index],' .');
   if v_part is null or length(v_part)<2 or length(v_part)>140 then
    raise exception 'Componente de ingrediente inválido: %',v_item.id;
   end if;
  end loop;

  update public.recipe_ingredients set position=position+(v_n-1)
   where recipe_id=v_item.recipe_id and position>v_item.position;
  update public.recipe_ingredients set name=btrim(v_parts[1],' .') where id=v_item.id;
  for v_index in 2..v_n loop
   insert into public.recipe_ingredients
    (recipe_id,position,name,measure_mode,quantity,unit,is_optional)
   values
    (v_item.recipe_id,v_item.position+v_index-1,btrim(v_parts[v_index],' .'),
     'unspecified',null,'un',v_item.is_optional);
  end loop;
  v_done:=v_done+1;
 end loop;

 if v_done<>16 then raise exception 'Quantidade de fragmentos alterados incorreta: %',v_done; end if;
 if exists (
  select 1 from public.recipe_ingredients i
  join public.recipes r on r.id=i.recipe_id
  join public.cc_official_recipe_source_records s on s.recipe_id=r.id
  where s.use_stage='personal_pilot' and r.owner_user_id is null
   and i.name ~ v_pattern
 ) then raise exception 'Ainda há fragmentos com cabeçalhos embutidos'; end if;
end
$split$;

commit;
