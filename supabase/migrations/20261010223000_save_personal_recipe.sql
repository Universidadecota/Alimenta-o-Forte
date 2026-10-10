create or replace function public.save_personal_recipe(p_id uuid,p_title text,p_category text,p_description text,p_instructions text,p_minutes integer,p_servings integer,p_ingredients jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_item jsonb; v_count integer; v_pos integer := 0;
begin
 if (select auth.uid()) is null then raise exception 'Autenticação obrigatória'; end if;
 if length(trim(coalesce(p_title,''))) not between 2 and 180 or p_category not in ('breakfast','lunch','dinner','snack') or p_minutes not between 0 and 1440 or p_servings not between 1 and 20 then raise exception 'Campos inválidos'; end if;
 if length(coalesce(p_description,''))>2000 or length(coalesce(p_instructions,''))>10000 then raise exception 'Texto demasiado longo'; end if;
 if jsonb_typeof(p_ingredients) <> 'array' then raise exception 'Ingredientes inválidos'; end if;
 v_count=jsonb_array_length(p_ingredients);
 if v_count < 1 or v_count > 40 then raise exception 'Informe de 1 a 40 ingredientes'; end if;
 if p_id is null then
  insert into public.recipes(title,category,description,instructions,prep_minutes,servings,published,owner_user_id)
  values(trim(p_title),p_category,p_description,p_instructions,p_minutes,p_servings,false,(select auth.uid())) returning id into v_id;
 else
  update public.recipes set title=trim(p_title),category=p_category,description=p_description,instructions=p_instructions,prep_minutes=p_minutes,servings=p_servings
  where id=p_id and owner_user_id=(select auth.uid()) and archived_at is null returning id into v_id;
  if v_id is null then raise exception 'Receita não encontrada ou sem permissão'; end if;
  delete from public.recipe_ingredients where recipe_id=v_id;
 end if;
 for v_item in select value from jsonb_array_elements(p_ingredients) loop
  if length(trim(coalesce(v_item->>'name',''))) not between 1 and 140 or (v_item->>'unit') not in ('g','kg','ml','l','un') or (v_item->>'quantity')::numeric <= 0 or (v_item->>'quantity')::numeric > 100000 then raise exception 'Ingrediente inválido'; end if;
  insert into public.recipe_ingredients(recipe_id,name,quantity,unit,position) values(v_id,trim(v_item->>'name'),(v_item->>'quantity')::numeric,v_item->>'unit',v_pos);
  v_pos=v_pos+1;
 end loop;
 return v_id;
end $$;
revoke all on function public.save_personal_recipe(uuid,text,text,text,text,integer,integer,jsonb) from public,anon;
grant execute on function public.save_personal_recipe(uuid,text,text,text,text,integer,integer,jsonb) to authenticated;
