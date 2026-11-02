-- Costa&Costa | Fase 51: registros opcionais e privados de evolução.
-- Aditiva, não altera perfil, receitas, compras, nem dados existentes.
-- Energias e percepções são autorrelatadas, não diagnósticos.
create table if not exists public.cc_evolution_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recorded_on date not null,
  energy_level smallint check (energy_level between 1 and 5),
  wellbeing_level smallint check (wellbeing_level between 1 and 5),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  planned_meals boolean,
  took_pause boolean,
  moved_comfortably boolean,
  personal_note text check (personal_note is null or char_length(personal_note) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cc_evolution_checkins_user_day_unique unique (user_id,recorded_on),
  constraint cc_evolution_checkins_nonempty check (
    energy_level is not null or wellbeing_level is not null or sleep_quality is not null
    or planned_meals is not null or took_pause is not null or moved_comfortably is not null
    or nullif(btrim(personal_note),'') is not null
  )
);
create index if not exists cc_evolution_checkins_owner_history_idx
  on public.cc_evolution_checkins (user_id,recorded_on desc);

alter table public.cc_evolution_checkins enable row level security;
-- A tabela privada não herda privilégios públicos, mesmo onde default ACLs são permissivas.
revoke all on public.cc_evolution_checkins from public,anon,authenticated;
grant select,insert,update,delete on public.cc_evolution_checkins to authenticated;

drop policy if exists cc_evolution_checkins_owner_select on public.cc_evolution_checkins;
drop policy if exists cc_evolution_checkins_owner_insert on public.cc_evolution_checkins;
drop policy if exists cc_evolution_checkins_owner_update on public.cc_evolution_checkins;
drop policy if exists cc_evolution_checkins_owner_delete on public.cc_evolution_checkins;

create policy cc_evolution_checkins_owner_select on public.cc_evolution_checkins
  for select to authenticated using ((select auth.uid())=user_id);
create policy cc_evolution_checkins_owner_insert on public.cc_evolution_checkins
  for insert to authenticated with check (
    (select auth.uid())=user_id and recorded_on<=current_date
  );
create policy cc_evolution_checkins_owner_update on public.cc_evolution_checkins
  for update to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id and recorded_on<=current_date);
create policy cc_evolution_checkins_owner_delete on public.cc_evolution_checkins
  for delete to authenticated using ((select auth.uid())=user_id);

comment on table public.cc_evolution_checkins is
  'Diário privado e voluntário de percepções e hábitos. Não é diagnóstico, prescrição nem acompanhamento clínico. Acesso exclusivo do titular via RLS.';
