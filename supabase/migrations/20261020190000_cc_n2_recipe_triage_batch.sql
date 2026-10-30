-- Costa&Costa N2: grava em uma transação apenas as triagens justificadas
-- de UMA receita piloto P1. Não cria vínculos, quantidades ou aprovações.
create or replace function public.cc_n2_save_recipe_triage_batch(
 p_recipe_id uuid,
 p_entries jsonb
) returns integer
language plpgsql security definer set search_path='' as $$
declare
 v_count integer;
 v_distinct integer;
 v_saved integer;
 v_recipe_count integer;
begin
 if (select auth.uid()) is null or not (select public.cc_is_admin()) then
  raise exception 'Operação N2 restrita ao administrador' using errcode='42501';
 end if;
 if p_recipe_id is null or p_entries is null or jsonb_typeof(p_entries)<>'array'
   or jsonb_array_length(p_entries) not between 1 and 5 then
  raise exception 'Lote N2 inválido: selecione entre 1 e 5 ingredientes de uma receita';
 end if;

 select count(*) into v_recipe_count
 from public.recipe_ingredients ri
 join public.recipes r on r.id=ri.recipe_id
 join public.cc_beta_recipe_access b on b.recipe_id=r.id and b.enabled=true
 where r.id=p_recipe_id and r.owner_user_id is null and r.archived_at is null;
 if v_recipe_count<1 or v_recipe_count>5 then
  raise exception 'Receita fora da fila N2 P1';
 end if;

 with input as (
   select j.ingredient_id,j.triage_status,btrim(j.review_note) as review_note
   from jsonb_to_recordset(p_entries)
    as j(ingredient_id uuid,triage_status text,review_note text)
 )
 select count(*),count(distinct ingredient_id)
 into v_count,v_distinct from input;
 if v_count<>v_distinct then
  raise exception 'Não é permitido repetir o mesmo ingrediente no lote N2';
 end if;

 if exists (
  with input as (
   select j.ingredient_id,j.triage_status,btrim(j.review_note) as review_note
   from jsonb_to_recordset(p_entries)
    as j(ingredient_id uuid,triage_status text,review_note text)
  )
  select 1 from input i
  left join public.recipe_ingredients ri
    on ri.id=i.ingredient_id and ri.recipe_id=p_recipe_id
  where ri.id is null
    or i.triage_status is null
    or i.triage_status not in
      ('need_mass','need_food','ambiguous_or_optional','candidate_documented')
    or i.review_note is null or length(i.review_note)<12
    or length(i.review_note)>2000
 ) then
  raise exception 'Lote N2 contém ingrediente de outra receita ou triagem sem justificativa';
 end if;

 insert into public.cc_n2_ingredient_review_notes
   (ingredient_id,triage_status,review_note)
 select j.ingredient_id,j.triage_status,btrim(j.review_note)
 from jsonb_to_recordset(p_entries)
   as j(ingredient_id uuid,triage_status text,review_note text)
 on conflict (ingredient_id) do update set
   triage_status=excluded.triage_status,
   review_note=excluded.review_note
 where (cc_n2_ingredient_review_notes.triage_status,
        cc_n2_ingredient_review_notes.review_note)
   is distinct from (excluded.triage_status,excluded.review_note);
 get diagnostics v_saved=row_count;
 return v_saved;
end $$;
revoke all on function public.cc_n2_save_recipe_triage_batch(uuid,jsonb)
 from public,anon;
grant execute on function public.cc_n2_save_recipe_triage_batch(uuid,jsonb)
 to authenticated;
