-- Costa&Costa: arquivamento seguro de receita pessoal (RLS permanece habilitada).
-- Aplicar primeiro SOMENTE no Supabase local de homologacao.
create or replace function public.cc_archive_personal_recipe(p_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Faça login novamente.';
  end if;
  if p_recipe_id is null then
    raise exception 'Receita pessoal indisponível.';
  end if;

  -- A linha fica bloqueada durante o arquivamento para evitar atualizações concorrentes.
  perform 1 from public.recipes r
   where r.id = p_recipe_id and r.owner_user_id = v_uid and r.archived_at is null
   for update;
  if not found then
    raise exception 'Receita pessoal indisponível.';
  end if;

  if exists (select 1 from public.planned_meals pm where pm.recipe_id = p_recipe_id) then
    raise exception 'Esta receita já está em um cardápio. Remova-a dos dias planejados antes de arquivar.';
  end if;

  update public.recipes
     set archived_at = now()
   where id = p_recipe_id and owner_user_id = v_uid and archived_at is null;
  if not found then
    raise exception 'Não foi possível arquivar a receita.';
  end if;
end;
$$;

revoke all on function public.cc_archive_personal_recipe(uuid) from public, anon;
grant execute on function public.cc_archive_personal_recipe(uuid) to authenticated;
comment on function public.cc_archive_personal_recipe(uuid) is
'Arquiva apenas receita pessoal do usuário autenticado, sem afrouxar as policies de leitura ou permitir arquivar receitas planejadas.';
