-- Anotações N2 são apenas triagem editorial, não aprovação nutricional.
create table if not exists public.cc_n2_ingredient_review_notes (
 ingredient_id uuid primary key references public.recipe_ingredients(id) on delete cascade,
 triage_status text not null default 'pending' check (
  triage_status in ('pending','need_mass','need_food','ambiguous_or_optional','candidate_documented')
 ),
 review_note text not null default '' check (char_length(review_note)<=2000),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
alter table public.cc_n2_ingredient_review_notes enable row level security;
drop policy if exists cc_n2_note_admin_read on public.cc_n2_ingredient_review_notes;
create policy cc_n2_note_admin_read on public.cc_n2_ingredient_review_notes
 for select to authenticated using ((select public.cc_is_admin()));
drop policy if exists cc_n2_note_admin_insert on public.cc_n2_ingredient_review_notes;
create policy cc_n2_note_admin_insert on public.cc_n2_ingredient_review_notes
 for insert to authenticated with check ((select public.cc_is_admin()));
drop policy if exists cc_n2_note_admin_update on public.cc_n2_ingredient_review_notes;
create policy cc_n2_note_admin_update on public.cc_n2_ingredient_review_notes
 for update to authenticated using ((select public.cc_is_admin()))
 with check ((select public.cc_is_admin()));
revoke all on public.cc_n2_ingredient_review_notes from public,anon;
grant select,insert,update on public.cc_n2_ingredient_review_notes to authenticated;

create or replace function public.cc_n2_note_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.ingredient_id is distinct from old.ingredient_id then
  raise exception 'Não transferir triagem entre ingredientes';
 end if;
 if not exists(
  select 1 from public.recipe_ingredients ri
  join public.recipes r on r.id=ri.recipe_id
  where ri.id=new.ingredient_id and r.owner_user_id is null and r.archived_at is null
 ) then
  raise exception 'Triagem permitida apenas para receita oficial ativa';
 end if;
 new.updated_at=now();
 new.updated_by=(select auth.uid());
 return new;
end $$;
drop trigger if exists cc_n2_note_guard_trg on public.cc_n2_ingredient_review_notes;
create trigger cc_n2_note_guard_trg before insert or update on public.cc_n2_ingredient_review_notes
 for each row execute function public.cc_n2_note_guard();
revoke all on function public.cc_n2_note_guard() from public,anon,authenticated;
