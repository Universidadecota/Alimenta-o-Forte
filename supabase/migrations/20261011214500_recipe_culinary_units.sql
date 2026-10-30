alter table public.recipe_ingredients drop constraint if exists recipe_ingredients_unit_check;
alter table public.recipe_ingredients add constraint recipe_ingredients_unit_check
 check(unit = any(array['g','kg','ml','l','un','lata','colher_cha','fatia','pitada']));
do $$
declare def text;
begin
 select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='cc_save_official_recipe';
 if def is null or position('(''g'',''kg'',''ml'',''l'',''un'')' in def)=0 then
  raise exception 'Expected administrative recipe validation not found';
 end if;
 def:=replace(def,'(''g'',''kg'',''ml'',''l'',''un'')','(''g'',''kg'',''ml'',''l'',''un'',''lata'',''colher_cha'',''fatia'',''pitada'')');
 execute def;
end $$;