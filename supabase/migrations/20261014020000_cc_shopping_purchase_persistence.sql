-- Costa&Costa: persistencia de marcacoes de compras por conta/semana.
-- Quantidades exibidas continuam derivadas do cardapio; as linhas nesta tabela
-- registram exclusivamente itens marcados como comprados.
-- Antecedente verificado: shopping_lists e shopping_list_items estao vazias.
-- Sem mudancas em receitas, cardapios, RLS ou fotografias.
alter table public.shopping_list_items
  drop constraint if exists shopping_list_items_unit_check;
alter table public.shopping_list_items
  add constraint shopping_list_items_unit_check
  check (unit in ('g','kg','ml','l','un','lata','colher_cha','fatia','pitada'));
-- Permite upsert atomico do marcador pelo usuario dono da semana.
-- O FK (user_id, shopping_list_id) garante que a lista e o item
-- pertencam ao mesmo usuario; policies RLS owner permanecem em vigor.
create unique index if not exists cc_shopping_checked_item_unique
  on public.shopping_list_items(shopping_list_id,name,unit);
comment on index public.cc_shopping_checked_item_unique is
  'Chave unica de marcacao de compras por lista semanal, nome normalizado e unidade.';
