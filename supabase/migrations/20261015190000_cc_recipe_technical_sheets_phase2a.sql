-- Costa&Costa | Fase 2A: fichas tecnicas editoriais das receitas oficiais.
-- Sem valores nutricionais inventados, sem aprovacao automatica, sem alterar planejamento.
create table if not exists public.cc_recipe_technical_sheets (
  recipe_id uuid primary key references public.recipes(id) on delete cascade,
  source_title text,
  source_page integer,
  reference_yield_quantity numeric,
  reference_yield_unit text,
  ingredient_notes text not null default '',
  preparation_notes text not null default '',
  nutrition_reference_notes text not null default '',
  allergen_evidence_notes text not null default '',
  review_status text not null default 'pending',
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cc_rts_source_title_len check (source_title is null or char_length(source_title) between 2 and 240),
  constraint cc_rts_source_page_range check (source_page is null or source_page between 1 and 10000),
  constraint cc_rts_yield_pair check (
    (reference_yield_quantity is null and reference_yield_unit is null)
    or (reference_yield_quantity > 0 and reference_yield_quantity <= 100000
        and reference_yield_unit in ('porcoes','copos','unidades','g','ml'))
  ),
  constraint cc_rts_review_status check (review_status in ('pending','in_review','awaiting_specialist')),
  constraint cc_rts_notes_len check (
    char_length(ingredient_notes) <= 5000 and
    char_length(preparation_notes) <= 5000 and
    char_length(nutrition_reference_notes) <= 5000 and
    char_length(allergen_evidence_notes) <= 5000
  )
);
comment on table public.cc_recipe_technical_sheets is
  'Notas editoriais administrativas: pendencias, fontes e rendimento. Nao e avaliacao clinica, aprovacao nutricional ou declaracao de ausencia de alergenicos.';

create or replace function public.cc_recipe_technical_sheet_guard()
returns trigger
language plpgsql security definer
set search_path = ''
as $fn$
begin
  if tg_op = 'UPDATE' and new.recipe_id is distinct from old.recipe_id then
    raise exception 'A ficha tecnica nao pode ser transferida entre receitas';
  end if;
  if not exists (
    select 1 from public.recipes r
    where r.id=new.recipe_id and r.owner_user_id is null and r.archived_at is null
  ) then
    raise exception 'Fichas tecnicas sao restritas a receitas oficiais ativas';
  end if;
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$fn$;
drop trigger if exists cc_recipe_technical_sheet_guard_trg on public.cc_recipe_technical_sheets;
create trigger cc_recipe_technical_sheet_guard_trg
before insert or update on public.cc_recipe_technical_sheets
for each row execute function public.cc_recipe_technical_sheet_guard();

alter table public.cc_recipe_technical_sheets enable row level security;
revoke all on public.cc_recipe_technical_sheets from public, anon, authenticated;
grant select, insert, update on public.cc_recipe_technical_sheets to authenticated;

drop policy if exists cc_rts_admin_read on public.cc_recipe_technical_sheets;
create policy cc_rts_admin_read on public.cc_recipe_technical_sheets
for select to authenticated using ((select public.cc_is_admin()));
drop policy if exists cc_rts_admin_insert on public.cc_recipe_technical_sheets;
create policy cc_rts_admin_insert on public.cc_recipe_technical_sheets
for insert to authenticated with check ((select public.cc_is_admin()));
drop policy if exists cc_rts_admin_update on public.cc_recipe_technical_sheets;
create policy cc_rts_admin_update on public.cc_recipe_technical_sheets
for update to authenticated
using ((select public.cc_is_admin())) with check ((select public.cc_is_admin()));

-- Ficha sempre volta a pendente quando a formula ou o preparo mudam;
-- notas e provas permanecem para auditoria, sem manter uma aprovacao falsa.
create or replace function public.cc_mark_recipe_technical_sheet_pending()
returns trigger
language plpgsql security definer
set search_path = ''
as $fn$
declare v_recipe_id uuid;
begin
  v_recipe_id := case when tg_op='DELETE' then old.recipe_id else new.recipe_id end;
  update public.cc_recipe_technical_sheets
  set review_status='pending',updated_at=now()
  where recipe_id=v_recipe_id and review_status<>'pending';
  if tg_op='UPDATE' and old.recipe_id is distinct from new.recipe_id then
    update public.cc_recipe_technical_sheets
    set review_status='pending',updated_at=now()
    where recipe_id=old.recipe_id and review_status<>'pending';
  end if;
  return null;
end;
$fn$;
drop trigger if exists cc_recipe_ingredient_sheet_invalidate on public.recipe_ingredients;
create trigger cc_recipe_ingredient_sheet_invalidate
after insert or update or delete on public.recipe_ingredients
for each row execute function public.cc_mark_recipe_technical_sheet_pending();

create or replace function public.cc_mark_recipe_technical_sheet_pending_on_recipe()
returns trigger language plpgsql security definer set search_path=''
as $fn$
begin
  update public.cc_recipe_technical_sheets
  set review_status='pending',updated_at=now()
  where recipe_id=new.id and review_status<>'pending';
  return null;
end;
$fn$;
drop trigger if exists cc_recipe_sheet_invalidate on public.recipes;
create trigger cc_recipe_sheet_invalidate
after update of title, description, instructions, servings, prep_minutes on public.recipes
for each row
when (
  old.title is distinct from new.title or
  old.description is distinct from new.description or
  old.instructions is distinct from new.instructions or
  old.servings is distinct from new.servings or
  old.prep_minutes is distinct from new.prep_minutes
)
execute function public.cc_mark_recipe_technical_sheet_pending_on_recipe();

-- Referencias de origem comprovadas no PDF previamente fornecido.
-- Mantem ambas as fichas 'pending', sem verificar nutricao ou alergenicos.
insert into public.cc_recipe_technical_sheets
  (recipe_id,source_title,source_page,reference_yield_quantity,reference_yield_unit,
   ingredient_notes,review_status)
select r.id,
 '50 Receitas Para Emagrecer De Vez',
 case when r.title='Iogurte Turbo' then 12 else 18 end,
 case when r.title='Iogurte Turbo' then null else 2 end,
 case when r.title='Iogurte Turbo' then null else 'copos' end,
 case when r.title='Iogurte Turbo'
   then 'Ingredientes e colheres reconciliados com a fonte; falta equivalencia em gramas, rótulos e revisao nutricional.'
   else 'Fonte informa dois copos generosos; volume de lata, rotulos e risco de contato cruzado nao verificados.' end,
 'pending'
from public.recipes r
where r.owner_user_id is null and r.archived_at is null
  and r.title in ('Iogurte Turbo','Chá Cremoso De  Cúrcuma')
on conflict (recipe_id) do nothing;

-- Trigger functions are internal plumbing, not client RPC endpoints.
revoke all on function public.cc_recipe_technical_sheet_guard() from public, anon, authenticated;
revoke all on function public.cc_mark_recipe_technical_sheet_pending() from public, anon, authenticated;
revoke all on function public.cc_mark_recipe_technical_sheet_pending_on_recipe() from public, anon, authenticated;
