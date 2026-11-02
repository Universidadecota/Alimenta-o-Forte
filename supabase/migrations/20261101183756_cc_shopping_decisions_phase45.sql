-- Supabase migration 20261101183756, additive. Decisões privadas, não itens comprados.
create table if not exists public.cc_shopping_decisions (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 item_key text not null check (char_length(item_key) between 1 and 600),
 kind text not null check (kind in ('choice','optional')),
 choice_text text,
 included boolean,
 created_at timestamptz not null default now(),
 primary key (user_id,week_start,item_key),
 constraint cc_shopping_decisions_valid_choice check (
  (kind='choice' and choice_text is not null and char_length(btrim(choice_text)) between 1 and 180 and included is null)
  or (kind='optional' and choice_text is null and included is not null)
 )
);
alter table public.cc_shopping_decisions enable row level security;
revoke all on table public.cc_shopping_decisions from public,anon,authenticated;
grant select,insert,update,delete on public.cc_shopping_decisions to authenticated;
drop policy if exists "cc_shopping_decisions_owner_select" on public.cc_shopping_decisions;
drop policy if exists "cc_shopping_decisions_owner_insert" on public.cc_shopping_decisions;
drop policy if exists "cc_shopping_decisions_owner_update" on public.cc_shopping_decisions;
drop policy if exists "cc_shopping_decisions_owner_delete" on public.cc_shopping_decisions;
create policy "cc_shopping_decisions_owner_select" on public.cc_shopping_decisions
 for select to authenticated using ((select auth.uid())=user_id);
create policy "cc_shopping_decisions_owner_insert" on public.cc_shopping_decisions
 for insert to authenticated with check ((select auth.uid())=user_id);
create policy "cc_shopping_decisions_owner_update" on public.cc_shopping_decisions
 for update to authenticated using ((select auth.uid())=user_id)
 with check ((select auth.uid())=user_id);
create policy "cc_shopping_decisions_owner_delete" on public.cc_shopping_decisions
 for delete to authenticated using ((select auth.uid())=user_id);
comment on table public.cc_shopping_decisions is 'Decisões privadas do usuário por semana e chave de ingrediente: não altera receitas nem quantidades e não representa conferência de segurança alimentar.';
