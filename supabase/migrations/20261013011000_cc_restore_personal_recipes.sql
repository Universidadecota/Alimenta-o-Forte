-- Costa&Costa — consulta e restauracao de receitas pessoais arquivadas.
-- Aplicar somente no Supabase LOCAL ate homologacao, nunca direto em producao.
create or replace function public.cc_list_archived_personal_recipes()
returns table(recipe_id uuid, recipe_title text, archived_on timestamptz)
language sql stable security definer set search_path=''
as $$
 select r.id, r.title, r.archived_at
 from public.recipes r
 where r.owner_user_id = (select auth.uid()) and r.archived_at is not null
 order by r.archived_at desc, r.id;
$$;
revoke all on function public.cc_list_archived_personal_recipes() from public, anon;
grant execute on function public.cc_list_archived_personal_recipes() to authenticated;

create or replace function public.cc_restore_personal_recipe(p_recipe_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if (select auth.uid()) is null then
   raise exception 'Faça login novamente.';
 end if;
 update public.recipes r
 set archived_at = null
 where r.id = p_recipe_id
   and r.owner_user_id = (select auth.uid())
   and r.archived_at is not null
   and r.published = false;
 if not found then
   raise exception 'Receita arquivada não encontrada nesta conta.';
 end if;
end;
$$;
revoke all on function public.cc_restore_personal_recipe(uuid) from public, anon;
grant execute on function public.cc_restore_personal_recipe(uuid) to authenticated;
