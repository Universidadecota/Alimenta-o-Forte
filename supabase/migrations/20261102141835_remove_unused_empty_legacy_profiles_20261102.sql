-- Costa&Costa — remocao controlada de tabela legada vazia.
-- Executado diretamente no Supabase em 2026-11-02; versao remota 20261102141835.
-- Exige ausencia de linhas, triggers, FKs de entrada e referencias SQL.
-- RESTRICT, nunca CASCADE. Nao altera auth.users nem user_preferences.
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles nao existe; revisar estado atual';
  end if;
  if exists(select 1 from public.profiles limit 1) then
    raise exception 'public.profiles contem dados; exclusao cancelada';
  end if;
  if exists (
    select 1 from pg_constraint
    where contype='f' and confrelid='public.profiles'::regclass
  ) then
    raise exception 'public.profiles possui FK de entrada; exclusao cancelada';
  end if;
  if exists (
    select 1 from pg_trigger
    where tgrelid='public.profiles'::regclass and not tgisinternal
  ) then
    raise exception 'public.profiles possui trigger nao-interno; exclusao cancelada';
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname not in ('pg_catalog','information_schema') and p.prokind='f'
      and pg_get_functiondef(p.oid) ~* '((public[.])?profiles([^a-zA-Z_]|$))'
  ) then
    raise exception 'public.profiles citado por funcao SQL; exclusao cancelada';
  end if;
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where c.relkind in ('v','m') and n.nspname not in ('pg_catalog','information_schema')
      and pg_get_viewdef(c.oid,true) ~* '((public[.])?profiles([^a-zA-Z_]|$))'
  ) then
    raise exception 'public.profiles citado por view; exclusao cancelada';
  end if;
  drop table public.profiles restrict;
end $$;
