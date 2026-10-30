-- Autorização de uso confirmada pelo responsável pelo aplicativo em 10/10/2026.
-- O inventário não é automaticamente uma receita pronta: ingredientes, preparo, fotos e revisão são fases distintas.
alter table public.source_recipe_review
  add column if not exists attribution text not null default 'Código Emagrecer de Vez — Rodrigo Polesso',
  add column if not exists authorization_basis text,
  add column if not exists import_status text not null default 'metadata_only'
  check (import_status in ('metadata_only','content_entered','reviewed','published'));
update public.source_recipe_review
set rights_status='licensed',
    authorization_basis='Declaração de autorização informada pelo responsável pelo aplicativo em 2026-10-10'
where source_name='50 Receitas Para Emagrecer De Vez';
create policy "read_licensed_catalog" on public.source_recipe_review
 for select to authenticated
 using (rights_status='licensed');
grant select on public.source_recipe_review to authenticated;
