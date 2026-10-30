-- Alimentação Forte Beta · Semana 4 (24/10/2026)
-- Separar ingredientes que foram indevidamente concatenados com títulos de seção
-- em quatro receitas, preservando a fonte, quantidades e histórico.
-- Complementar o preparo da Cobb e do rolê com ações já implicadas na fonte,
-- sem introduzir ingredientes ou tempos novos. Não produz revisão alergênica.

begin;

do $editorial$
declare
 v_row record;
 v_count integer;
 v_cobb_old text := 'Grelhe o frango temperado com sal e pimenta por 5 a 6 minutos de cada lado, descanse e corte em tiras. Cozinhe os ovos por 9 minutos. Monte a alface em um prato fundo e disponha em fileiras o frango, os ovos, o bacon, o abacate, o tomate e as azeitonas. Misture o molho e regue por cima.';
 v_rolle_old text := 'Tempere o bife com alho, sal, pimenta e páprica. Cubra com o bacon, o espinafre e o tomate. Enrole e prenda com palitos. Doure em frigideira com azeite por 5 minutos, virando, e leve ao forno a 200 °C por 20 minutos. Deixe descansar 5 minutos, retire os palitos e fatie.';
begin
 for v_row in
  select * from (values
   ('8a19d5aa-5835-41c8-93f0-661c0e82efac'::uuid, '9b3f616fd8f68862ccbe621662718746', 11,22,3),
   ('bc72828c-22ad-4201-9672-86e754eabe9c'::uuid, 'e18d1b485ac6c29971c98ca02f1f53d4', 14,24,9),
   ('57aff0d0-2ce4-4600-b9b2-95774993f726'::uuid, '1adf6bda779bdd941a77d5fe17a7417a', 10,25,11),
   ('f3d9832d-cc69-4f3e-94f8-063db69fc43c'::uuid, 'c1d34cd9a629952d27180bffc5eaa51d', 13,28,21)
  ) t(recipe_id,ref_hash,expected_count,day_number,entry_number)
 loop
  if not exists (
   select 1 from public.recipes r
   join public.cc_official_recipe_source_records s on s.recipe_id=r.id
   where r.id=v_row.recipe_id and r.owner_user_id is null and r.archived_at is null
    and s.reference_hash=v_row.ref_hash and s.source_day=v_row.day_number
    and s.entry_number=v_row.entry_number
  ) then
   raise exception 'Fonte original da receita % mudou: cancelado',v_row.recipe_id;
  end if;
  select count(*) into v_count from public.recipe_ingredients where recipe_id=v_row.recipe_id;
  if v_count<>v_row.expected_count then
   raise exception 'Fragmentos alterados na receita %: esperado %, atual %',
    v_row.recipe_id,v_row.expected_count,v_count;
  end if;
  if exists (select 1 from public.cc_allergen_ingredient_evidence where recipe_id=v_row.recipe_id)
   or exists (select 1 from public.cc_allergen_a4_ingredient_findings where recipe_id=v_row.recipe_id) then
   raise exception 'A3B/A4 registrada para %: exigir invalidação e reavaliação',v_row.recipe_id;
  end if;
 end loop;

 if not exists (select 1 from public.recipe_ingredients where id='3caf354d-bdfa-4dab-9208-58c993ab6054' and recipe_id='8a19d5aa-5835-41c8-93f0-661c0e82efac' and position=6 and name='pimenta chili a gosto. Salada: 2 tomates')
  or not exists (select 1 from public.recipe_ingredients where id='2d7055f7-8bf1-467e-b246-0e64398d4432' and recipe_id='bc72828c-22ad-4201-9672-86e754eabe9c' and position=7 and name='1 colher (sopa) de azeite. Maionese: 1 gema')
  or not exists (select 1 from public.recipe_ingredients where id='68e92fef-364b-41db-a5f8-a178490d8cdc' and recipe_id='bc72828c-22ad-4201-9672-86e754eabe9c' and position=10 and name='1 pitada de sal. Salada: ½ pepino fatiado')
  or not exists (select 1 from public.recipe_ingredients where id='2fc6c31d-3aa0-4145-b037-54b4ee45dc7d' and recipe_id='57aff0d0-2ce4-4600-b9b2-95774993f726' and position=9 and name='palitos de dente. Acompanhamento: 1 tomate assado e folhas verdes.')
  or not exists (select 1 from public.recipe_ingredients where id='ded6520d-3877-41ec-bc29-771694454621' and recipe_id='f3d9832d-cc69-4f3e-94f8-063db69fc43c' and position=7 and name='1 cebolinha. Molho: 2 colheres (sopa) de azeite')
 then raise exception 'Uma ou mais linhas-fonte de ingredientes mudaram; cancelado'; end if;

 if not exists (select 1 from public.recipes where id='57aff0d0-2ce4-4600-b9b2-95774993f726' and instructions=v_rolle_old)
  or not exists (select 1 from public.recipes where id='f3d9832d-cc69-4f3e-94f8-063db69fc43c' and instructions=v_cobb_old) then
  raise exception 'Preparo exibido da Cobb ou do rolê mudou; cancelado';
 end if;

 -- Vôngole: separar pimenta do tomate da salada.
 update public.recipe_ingredients set position=position+1
  where recipe_id='8a19d5aa-5835-41c8-93f0-661c0e82efac' and position>=7;
 update public.recipe_ingredients set name='pimenta chili a gosto'
  where id='3caf354d-bdfa-4dab-9208-58c993ab6054';
 insert into public.recipe_ingredients(recipe_id,position,name,measure_mode,quantity,unit)
  values ('8a19d5aa-5835-41c8-93f0-661c0e82efac',7,'2 tomates (salada)','unspecified',null,'un');

 -- Bolinhos: tornar gema da maionese e pepino da salada itens próprios.
 update public.recipe_ingredients set position=position+case when position>=11 then 2 else 1 end
  where recipe_id='bc72828c-22ad-4201-9672-86e754eabe9c' and position>=8;
 update public.recipe_ingredients set name='1 colher (sopa) de azeite'
  where id='2d7055f7-8bf1-467e-b246-0e64398d4432';
 update public.recipe_ingredients set name='1 pitada de sal'
  where id='68e92fef-364b-41db-a5f8-a178490d8cdc';
 insert into public.recipe_ingredients(recipe_id,position,name,measure_mode,quantity,unit)
  values
   ('bc72828c-22ad-4201-9672-86e754eabe9c',8,'1 gema (maionese)','unspecified',null,'un'),
   ('bc72828c-22ad-4201-9672-86e754eabe9c',12,'½ pepino fatiado (salada)','unspecified',null,'un');

 -- Rolê: não esconder tomate assado/folhas no registro de palitos de dente.
 update public.recipe_ingredients set name='palitos de dente'
  where id='2fc6c31d-3aa0-4145-b037-54b4ee45dc7d';
 insert into public.recipe_ingredients(recipe_id,position,name,measure_mode,quantity,unit)
  values
   ('57aff0d0-2ce4-4600-b9b2-95774993f726',10,'1 tomate (para assar no acompanhamento)','unspecified',null,'un'),
   ('57aff0d0-2ce4-4600-b9b2-95774993f726',11,'folhas verdes (acompanhamento)','unspecified',null,'un');

 -- Cobb: separar cebolinha de azeite do molho.
 update public.recipe_ingredients set position=position+1
  where recipe_id='f3d9832d-cc69-4f3e-94f8-063db69fc43c' and position>=8;
 update public.recipe_ingredients set name='1 cebolinha'
  where id='ded6520d-3877-41ec-bc29-771694454621';
 insert into public.recipe_ingredients(recipe_id,position,name,measure_mode,quantity,unit)
  values ('f3d9832d-cc69-4f3e-94f8-063db69fc43c',8,'2 colheres (sopa) de azeite (molho)','unspecified',null,'un');

 -- Complementos editoriais exibidos, sem tocar nas transcrições originais.
 update public.recipes set instructions=
  'Tempere o bife com alho, sal, pimenta e páprica.'||chr(10)||
  'Cubra com o bacon, o espinafre e o tomate em fatias finas. Enrole e prenda com palitos.'||chr(10)||
  'Doure em frigideira com azeite por 5 minutos, virando, e leve ao forno a 200 °C por 20 minutos.'||chr(10)||
  'Enquanto o frango assa, coloque o tomate do acompanhamento em uma assadeira no mesmo forno; retire quando estiver assado e macio. Higienize e reserve as folhas verdes.'||chr(10)||
  'Confira se o centro do frango está completamente cozido. Deixe descansar 5 minutos, retire os palitos e fatie.'||chr(10)||
  'Sirva com o tomate assado e as folhas verdes.'
  where id='57aff0d0-2ce4-4600-b9b2-95774993f726' and instructions=v_rolle_old;
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'Rolê: atualização inesperada'; end if;

 update public.recipes set instructions=
  'Grelhe o frango temperado com sal e pimenta por 5 a 6 minutos de cada lado, até ficar completamente cozido. Deixe descansar e corte em tiras.'||chr(10)||
  'Cozinhe os ovos por 9 minutos.'||chr(10)||
  'Em uma frigideira, aqueça as fatias de bacon, virando até ficarem crocantes. Escorra o excesso de gordura.'||chr(10)||
  'Monte a alface em um prato fundo e disponha em fileiras o frango, os ovos, o bacon, o abacate, o tomate e as azeitonas.'||chr(10)||
  'Misture o molho e regue por cima.'
  where id='f3d9832d-cc69-4f3e-94f8-063db69fc43c' and instructions=v_cobb_old;
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'Cobb: atualização inesperada'; end if;

 for v_row in
  select * from (values
   ('8a19d5aa-5835-41c8-93f0-661c0e82efac'::uuid,12),
   ('bc72828c-22ad-4201-9672-86e754eabe9c'::uuid,16),
   ('57aff0d0-2ce4-4600-b9b2-95774993f726'::uuid,12),
   ('f3d9832d-cc69-4f3e-94f8-063db69fc43c'::uuid,14)
  ) t(recipe_id,expected_count)
 loop
  select count(*) into v_count from public.recipe_ingredients where recipe_id=v_row.recipe_id;
  if v_count<>v_row.expected_count then
   raise exception 'Resultado inesperado para %: %',v_row.recipe_id,v_count;
  end if;
 end loop;
end
$editorial$;

commit;
