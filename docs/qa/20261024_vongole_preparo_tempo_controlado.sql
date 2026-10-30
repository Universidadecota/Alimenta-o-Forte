-- Alimentação Forte Beta: clareza editorial da receita de vôngole (Dia 22).
-- Preserva a transcrição original, a hash de fonte, ingredientes e tempo estrutural.
-- Modifica somente recipes.instructions: ortografia e quebras de etapa.
-- O rótulo de 20 + até 30 min é ajustado apenas na interface, não no dado original.

begin;

do $vongole$
declare
 v_recipe uuid := '8a19d5aa-5835-41c8-93f0-661c0e82efac';
 v_old text := 'Deixe o vôngole de molho em água com sal por 30 minutos para soltar a areia (se possível) e enxágue. Dore o alho no azeite em fogo baixo, junte a água e o vôngole, tampe e cozinhe por 5 a 6 minutos, até abrirem. Descarte os que não abrirem. Finalize com limão, coentro e pimenta. Sirva com a salada de tomate e cebola roxa temperada com azeite, vinagre e sal.';
 v_updated text;
 v_count integer;
begin
 if not exists (
  select 1 from public.recipes r
  join public.cc_official_recipe_source_records s on s.recipe_id=r.id
  where r.id=v_recipe
   and r.title='Amêijoas (vôngole) à portuguesa com salada de tomate'
   and r.owner_user_id is null and r.archived_at is null
   and r.prep_minutes=20 and r.instructions=v_old
   and s.source_day=22 and s.entry_number=3
   and s.reference_hash='9b3f616fd8f68862ccbe621662718746'
   and s.original_preparation=v_old
 ) then
  raise exception 'Versão de vôngole divergente; nenhuma atualização aplicada';
 end if;
 if exists (
  select 1 from public.cc_allergen_ingredient_evidence where recipe_id=v_recipe
 ) or exists (
  select 1 from public.cc_allergen_a4_ingredient_findings where recipe_id=v_recipe
 ) then
  raise exception 'Há evidências A3B/A4: exigir análise de invalidação antes de editar';
 end if;

 v_updated := replace(v_old,'. Dore o alho','. '||chr(10)||'Doure o alho');
 v_updated := replace(v_updated,'até abrirem. Descarte','até abrirem.'||chr(10)||'Descarte');
 v_updated := replace(v_updated,'que não abrirem. Finalize','que não abrirem.'||chr(10)||'Finalize');
 v_updated := replace(v_updated,'coentro e pimenta. Sirva','coentro e pimenta.'||chr(10)||'Sirva');
 if v_updated=v_old or v_updated not like '%Doure o alho%' then
  raise exception 'A correção textual não foi aplicada como esperado';
 end if;
 update public.recipes set instructions=v_updated where id=v_recipe and instructions=v_old;
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'Quantidade de linhas inesperada: %',v_count; end if;
end
$vongole$;

commit;
