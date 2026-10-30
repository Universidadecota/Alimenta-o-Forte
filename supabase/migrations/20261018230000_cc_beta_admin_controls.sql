-- Administração beta: concessões explícitas, sem publicação global.
create or replace function public.cc_admin_set_beta_member(p_email text,p_enabled boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.cc_is_admin() then raise exception 'Acesso negado'; end if;
 if p_email is null or length(trim(p_email))>254 or position('@' in p_email)=0
 then raise exception 'E-mail inválido'; end if;
 select id into v_id from auth.users where lower(email)=lower(trim(p_email)) limit 1;
 if v_id is null then raise exception 'Usuário ainda não cadastrado'; end if;
 insert into public.cc_beta_members(user_id,enabled) values(v_id,p_enabled)
 on conflict(user_id) do update set enabled=excluded.enabled;
end $$;
revoke all on function public.cc_admin_set_beta_member(text,boolean) from public,anon;
grant execute on function public.cc_admin_set_beta_member(text,boolean) to authenticated;

create or replace function public.cc_admin_set_beta_recipe(p_recipe_id uuid,p_enabled boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.cc_is_admin() then raise exception 'Acesso negado'; end if;
 if not exists(select 1 from public.cc_official_recipe_source_records s
 join public.recipes r on r.id=s.recipe_id
 where s.recipe_id=p_recipe_id and s.use_stage='personal_pilot'
 and s.is_plannable=true and r.owner_user_id is null and r.published=false)
 then raise exception 'Receita não elegível'; end if;
 insert into public.cc_beta_recipe_access(recipe_id,enabled) values(p_recipe_id,p_enabled)
 on conflict(recipe_id) do update set enabled=excluded.enabled;
end $$;
revoke all on function public.cc_admin_set_beta_recipe(uuid,boolean) from public,anon;
grant execute on function public.cc_admin_set_beta_recipe(uuid,boolean) to authenticated;

create or replace function public.cc_admin_beta_catalog_overview()
returns table(recipe_id uuid,title text,enabled boolean)
language sql stable security definer set search_path='' as $$
 select s.recipe_id,r.title,coalesce(a.enabled,false)
 from public.cc_official_recipe_source_records s join public.recipes r on r.id=s.recipe_id
 left join public.cc_beta_recipe_access a on a.recipe_id=r.id
 where public.cc_is_admin() and s.use_stage='personal_pilot' and s.is_plannable=true
 and r.owner_user_id is null and r.published=false order by r.title;
$$;
revoke all on function public.cc_admin_beta_catalog_overview() from public,anon;
grant execute on function public.cc_admin_beta_catalog_overview() to authenticated;
