-- Costa&Costa: compras parciais por item/semana, sem migrar nem apagar dados.
-- shopping_list_items.quantity representa QUANTIDADE EFETIVAMENTE COMPRADA.
-- shopping_list_items.completed=true significa "existe compra registrada";
-- conclusao ou pendencia sao derivadas da necessidade atual do cardapio.
-- O indice unico cc_shopping_checked_item_unique ja existe.
create or replace function public.cc_add_shopping_purchase(
  p_week_start date,
  p_name text,
  p_unit text,
  p_quantity numeric
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_list uuid;
  v_name text;
  v_unit text;
  v_add numeric;
  v_total numeric;
begin
  if v_user is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;
  if p_week_start is null or extract(isodow from p_week_start) <> 1 then
    raise exception 'Semana invalida: informe a segunda-feira.' using errcode = '22023';
  end if;
  v_name := lower(regexp_replace(btrim(coalesce(p_name, '')), '[[:space:]]+', ' ', 'g'));
  v_unit := lower(btrim(coalesce(p_unit, '')));
  if char_length(v_name) < 1 or char_length(v_name) > 140
    or v_unit not in ('g','kg','ml','l','un','lata','colher_cha','fatia','pitada') then
    raise exception 'Ingrediente ou unidade invalidos.' using errcode = '22023';
  end if;
  if p_quantity is null or p_quantity = 'NaN'::numeric
    or p_quantity <= 0 or p_quantity > 1000000 then
    raise exception 'Quantidade comprada invalida.' using errcode = '22023';
  end if;
  v_add := round(p_quantity, 2);
  if v_add <= 0 then
    raise exception 'Quantidade minima de compra: 0,01.' using errcode = '22023';
  end if;

  insert into public.shopping_lists(user_id, week_start)
  values(v_user, p_week_start)
  on conflict (user_id, week_start) do nothing;

  select sl.id into v_list
  from public.shopping_lists sl
  where sl.user_id = v_user and sl.week_start = p_week_start;

  if v_list is null then
    raise exception 'Nao foi possivel acessar a lista da semana.' using errcode='42501';
  end if;

  insert into public.shopping_list_items as item
    (user_id, shopping_list_id, name, quantity, unit, completed)
  values (v_user, v_list, v_name, v_add, v_unit, true)
  on conflict (shopping_list_id, name, unit) do update
     set quantity = item.quantity + excluded.quantity,
         completed = true
     where item.user_id = v_user
       and item.quantity + excluded.quantity <= 100000000
  returning quantity into v_total;

  if v_total is null then
    raise exception 'Limite de quantidade comprada excedido.' using errcode='22023';
  end if;
  return v_total;
end;
$$;
revoke all on function public.cc_add_shopping_purchase(date,text,text,numeric) from public;
revoke all on function public.cc_add_shopping_purchase(date,text,text,numeric) from anon;
grant execute on function public.cc_add_shopping_purchase(date,text,text,numeric) to authenticated;
comment on function public.cc_add_shopping_purchase(date,text,text,numeric) is
  'Adiciona atomicamente quantidade comprada por auth.uid(), semana e ingrediente. Mantem RLS/FK, nao altera as quantidades planejadas.';
