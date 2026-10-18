create or replace function public.cc_admin_beta_members_overview()
returns table(email text, enabled boolean, created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select u.email::text,m.enabled,m.created_at
 from public.cc_beta_members m join auth.users u on u.id=m.user_id
 where public.cc_is_admin()
 order by m.enabled desc,m.created_at desc limit 200;
$$;
revoke all on function public.cc_admin_beta_members_overview() from public,anon;
grant execute on function public.cc_admin_beta_members_overview() to authenticated;