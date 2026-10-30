-- Acesso de escrita reservado a administradores; leituras continuam públicas.
create policy "cc_official_images_admin_insert" on storage.objects for insert to authenticated with check (bucket_id='recipe-illustrations' and public.cc_is_admin() and name ~ '^official/[0-9a-f-]{36}[.]webp$');
create policy "cc_official_images_admin_delete" on storage.objects for delete to authenticated using (bucket_id='recipe-illustrations' and public.cc_is_admin() and name ~ '^official/[0-9a-f-]{36}[.]webp$');
-- RPC: preserva fotos históricas com nomes percent-encoded e aceita a subpasta oficial.
do $$
declare def text; old_pattern text := '[a-zA-Z0-9_-]+[.]webp$'; new_pattern text := '[a-zA-Z0-9_%.-]+([.]webp|/([0-9a-f-]{36})[.]webp)$';
begin
 select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='cc_save_official_recipe';
 if def is null or position(old_pattern in def)=0 then raise exception 'RPC expected image pattern absent'; end if;
 def := replace(def,old_pattern,new_pattern);
 execute def;
end $$;
