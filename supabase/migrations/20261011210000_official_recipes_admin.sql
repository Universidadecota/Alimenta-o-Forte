create table if not exists public.cc_admin_members (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table public.cc_admin_members enable row level security;
revoke all on public.cc_admin_members from anon,authenticated;
grant select on public.cc_admin_members to authenticated;
create policy "cc_admin_self_read" on public.cc_admin_members for select to authenticated using (user_id=(select auth.uid()));
create or replace function public.cc_is_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.cc_admin_members where user_id=(select auth.uid())) $$;
revoke all on function public.cc_is_admin() from public,anon;
grant execute on function public.cc_is_admin() to authenticated;
create or replace function public.cc_save_official_recipe(p_id uuid,p_title text,p_category text,p_description text,p_instructions text,p_minutes integer,p_servings integer,p_ingredients jsonb,p_published boolean,p_url text,p_image_is_ai boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_item jsonb; v_position int:=0;
begin
 if not public.cc_is_admin() then raise exception 'Sem permissão administrativa'; end if;
 if length(trim(coalesce(p_title,''))) not between 2 and 180 or p_category not in ('breakfast','lunch','dinner','snack') or p_minutes not between 0 and 1440 or p_servings not between 1 and 20 then raise exception 'Campos inválidos'; end if;
 if jsonb_typeof(p_ingredients)<>'array' or jsonb_array_length(p_ingredients) not between 1 and 40 then raise exception 'Ingredientes inválidos'; end if;
 if length(coalesce(p_description,''))>2000 or length(coalesce(p_instructions,''))>10000 then raise exception 'Descrição longa demais'; end if;
 if p_url is not null and (length(p_url)>2048 or p_url !~ '^https://gclhailalyrokvmkwllm[.]supabase[.]co/storage/v1/object/public/recipe-illustrations/[a-zA-Z0-9_-]+[.]webp$') then raise exception 'Imagem oficial inválida'; end if;
 if p_id is null then
  insert into public.recipes(title,category,description,instructions,prep_minutes,servings,published,owner_user_id,url,image_is_ai)
  values(trim(p_title),p_category,p_description,p_instructions,p_minutes,p_servings,p_published,null,p_url,coalesce(p_image_is_ai,false)) returning id into v_id;
 else
  update public.recipes set title=trim(p_title),category=p_category,description=p_description,instructions=p_instructions,prep_minutes=p_minutes,servings=p_servings,published=p_published,url=p_url,image_is_ai=coalesce(p_image_is_ai,false)
   where id=p_id and owner_user_id is null and archived_at is null returning id into v_id;
  if v_id is null then raise exception 'Receita oficial indisponível'; end if;
  delete from public.recipe_ingredients where recipe_id=v_id;
 end if;
 for v_item in select value from jsonb_array_elements(p_ingredients) loop
  if length(trim(coalesce(v_item->>'name',''))) not between 1 and 140 or (v_item->>'unit') not in ('g','kg','ml','l','un') or (v_item->>'quantity')::numeric <= 0 or (v_item->>'quantity')::numeric>100000 then raise exception 'Ingrediente inválido'; end if;
  insert into public.recipe_ingredients(recipe_id,name,quantity,unit,position) values(v_id,trim(v_item->>'name'),(v_item->>'quantity')::numeric,v_item->>'unit',v_position);
  v_position:=v_position+1;
 end loop;
 return v_id;
end $$;
revoke all on function public.cc_save_official_recipe(uuid,text,text,text,text,integer,integer,jsonb,boolean,text,boolean) from public,anon;
grant execute on function public.cc_save_official_recipe(uuid,text,text,text,text,integer,integer,jsonb,boolean,text,boolean) to authenticated;
-- Memberships are deliberately not seeded or self-service. Provision via trusted administrator.
