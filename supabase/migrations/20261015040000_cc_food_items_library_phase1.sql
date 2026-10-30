-- Costa&Costa — biblioteca inicial de alimentos brasileiros (Fase 1).
-- Conteúdo editorial preliminar: nomes e agrupamentos apenas, sem nutrientes inventados.
-- Nenhuma alteração em recipes, recipe_ingredients, planejamentos ou compras.
create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  description text,
  reference_portion_quantity numeric,
  reference_portion_unit text,
  nutrition_per_100g jsonb,
  nutrition_source text,
  nutrition_reviewed_at timestamptz,
  editorial_status text not null default 'preliminary',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cc_food_items_name_valid check (
    length(btrim(name)) between 2 and 120 and name = btrim(name)
  ),
  constraint cc_food_items_category_valid check (category in (
    'verduras','legumes','frutas','cereais_tuberculos','leguminosas',
    'ovos','carnes_aves','peixes','laticinios','oleaginosas',
    'oleos_gorduras','bebidas','outros'
  )),
  constraint cc_food_items_editorial_status_valid check (
    editorial_status in ('preliminary','verified')
  ),
  constraint cc_food_items_reference_portion_valid check (
    (reference_portion_quantity is null and reference_portion_unit is null)
    or (reference_portion_quantity > 0 and reference_portion_unit in
     ('g','kg','ml','l','un','colher_cha','colher_sopa','fatia','pitada','lata','cm'))
  ),
  constraint cc_food_items_nutrition_integrity check (
    nutrition_per_100g is null
    or (
      jsonb_typeof(nutrition_per_100g) = 'object'
      and nullif(btrim(nutrition_source),'') is not null
      and nutrition_reviewed_at is not null
      and editorial_status='verified'
    )
  )
);
create index if not exists cc_food_items_published_category_name_idx
  on public.food_items(category,name) where published=true;
create unique index if not exists cc_food_items_name_casefold_uq
  on public.food_items(lower(name));
alter table public.food_items enable row level security;
drop policy if exists cc_food_items_read_published on public.food_items;
create policy cc_food_items_read_published on public.food_items
  for select to authenticated using (published=true);
drop policy if exists cc_food_items_admin_select on public.food_items;
create policy cc_food_items_admin_select on public.food_items
  for select to authenticated using ((select public.cc_is_admin()));
drop policy if exists cc_food_items_admin_insert on public.food_items;
create policy cc_food_items_admin_insert on public.food_items
  for insert to authenticated with check ((select public.cc_is_admin()));
drop policy if exists cc_food_items_admin_update on public.food_items;
create policy cc_food_items_admin_update on public.food_items
  for update to authenticated
  using ((select public.cc_is_admin()))
  with check ((select public.cc_is_admin()));
drop policy if exists cc_food_items_admin_delete on public.food_items;
create policy cc_food_items_admin_delete on public.food_items
  for delete to authenticated using ((select public.cc_is_admin()));
revoke all on table public.food_items from public, anon;
grant select, insert, update, delete on table public.food_items to authenticated;
grant all on table public.food_items to service_role;

comment on table public.food_items is
 'Biblioteca editorial; itens preliminares contêm apenas nome e categoria, sem validação nutricional ou de alérgenos.';
comment on column public.food_items.nutrition_per_100g is
 'Preencher apenas após revisão de fonte verificável e atribuição de nutrition_source/nutrition_reviewed_at.';

-- Catálogo inicial de referências de nomes de alimentos, NÃO base nutricional validada.
-- Nomes e categorias não equivalem a alegações de segurança para alergias.
insert into public.food_items(name,category,editorial_status,published)
values
 ('Alface','verduras','preliminary',true),
 ('Couve-manteiga','verduras','preliminary',true),
 ('Espinafre','verduras','preliminary',true),
 ('Cenoura','legumes','preliminary',true),
 ('Tomate','legumes','preliminary',true),
 ('Abobrinha','legumes','preliminary',true),
 ('Brócolis','legumes','preliminary',true),
 ('Banana','frutas','preliminary',true),
 ('Maçã','frutas','preliminary',true),
 ('Mamão','frutas','preliminary',true),
 ('Laranja','frutas','preliminary',true),
 ('Arroz branco','cereais_tuberculos','preliminary',true),
 ('Aveia em flocos','cereais_tuberculos','preliminary',true),
 ('Batata-doce','cereais_tuberculos','preliminary',true),
 ('Mandioca','cereais_tuberculos','preliminary',true),
 ('Feijão carioca','leguminosas','preliminary',true),
 ('Feijão preto','leguminosas','preliminary',true),
 ('Lentilha','leguminosas','preliminary',true),
 ('Grão-de-bico','leguminosas','preliminary',true),
 ('Ovo de galinha','ovos','preliminary',true),
 ('Peito de frango','carnes_aves','preliminary',true),
 ('Carne bovina','carnes_aves','preliminary',true),
 ('Tilápia','peixes','preliminary',true),
 ('Sardinha','peixes','preliminary',true),
 ('Leite de vaca integral','laticinios','preliminary',true),
 ('Iogurte natural','laticinios','preliminary',true),
 ('Castanha-de-caju','oleaginosas','preliminary',true),
 ('Amendoim','oleaginosas','preliminary',true),
 ('Azeite de oliva','oleos_gorduras','preliminary',true),
 ('Óleo de soja','oleos_gorduras','preliminary',true),
 ('Água potável','bebidas','preliminary',true),
 ('Café','bebidas','preliminary',true),
 ('Cogumelo paris','outros','preliminary',true),
 ('Tofu','outros','preliminary',true)
on conflict do nothing;
