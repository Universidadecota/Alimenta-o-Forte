-- Pesquisa tolerante a acentos para termos em português, sem extensão externa.
-- Campo gerado apenas a partir do nome; nenhuma receita ou alimento é alterado.
alter table public.food_items
  add column search_name text generated always as (
    lower(translate(name,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'))
  ) stored;
create index if not exists cc_food_items_search_name_idx
  on public.food_items(search_name) where published=true;
