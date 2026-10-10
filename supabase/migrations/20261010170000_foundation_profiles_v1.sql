-- Applied to Supabase as foundation_profiles_v1.
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now());
alter table public.profiles enable row level security;
create policy profiles_own_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_own_insert on public.profiles for insert to authenticated with check (id = (select auth.uid()));
