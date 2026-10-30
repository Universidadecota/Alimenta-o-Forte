-- Costa&Costa | Fase 2B: origem nutricional em revisao e vinculo explicito dos ingredientes.
-- Nao publica nutrientes, nao gera valores e nao altera receitas, planejamento ou compras.

create table if not exists public.cc_food_nutrition_drafts (
 food_item_id uuid primary key references public.food_items(id) on delete cascade,
 food_state text not null default 'unspecified'
   check (food_state in ('unspecified','raw','cooked','drained','prepared','packaged')),
 source_name text not null default '',
 source_reference text not null default '',
 source_url text not null default '',
 energy_kcal numeric,
 protein_g numeric,
 carbohydrates_g numeric,
 fats_g numeric,
 fiber_g numeric,
 sodium_mg numeric,
 review_status text not null default 'pending'
   check (review_status in ('pending','in_review','needs_source','awaiting_specialist')),
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id),
 constraint cc_fnd_lengths check (
  char_length(source_name) <= 240 and
  char_length(source_reference) <= 500 and
  char_length(source_url) <= 1000 and char_length(notes) <= 4000
 ),
 constraint cc_fnd_positive_values check (
  (energy_kcal is null or energy_kcal between 0 and 1000) and
  (protein_g is null or protein_g between 0 and 100) and
  (carbohydrates_g is null or carbohydrates_g between 0 and 100) and
  (fats_g is null or fats_g between 0 and 100) and
  (fiber_g is null or fiber_g between 0 and 100) and
  (sodium_mg is null or sodium_mg between 0 and 50000)
 ),
 constraint cc_fnd_values_require_source check (
  (energy_kcal is null and protein_g is null and carbohydrates_g is null and
   fats_g is null and fiber_g is null and sodium_mg is null)
  or (length(btrim(source_name)) >= 3 and length(btrim(source_reference)) >= 2
      and food_state <> 'unspecified')
 )
);
comment on table public.cc_food_nutrition_drafts is
 'Dados nutricionais editoriais nao aprovados; valores por 100 g quando presentes. Nao expor ao consumidor nem usar em calculos publicados.';

create table if not exists public.cc_recipe_ingredient_food_links (
 ingredient_id uuid primary key references public.recipe_ingredients(id) on delete cascade,
 food_item_id uuid not null references public.food_items(id) on delete restrict,
 match_status text not null default 'candidate'
   check (match_status in ('candidate','confirmed')),
 match_notes text not null default '',
 -- Massa TOTAL do ingrediente na formula original; nao gramas por colher.
 total_mass_g numeric,
 mass_evidence text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id),
 constraint cc_rifl_mass check (total_mass_g is null or total_mass_g between 0.001 and 1000000),
 constraint cc_rifl_evidence check (
  (total_mass_g is null or length(btrim(mass_evidence)) >= 3)
  and char_length(mass_evidence) <= 1000 and char_length(match_notes) <= 2000
 ),
 constraint cc_rifl_confirm_requires_evidence check (
  match_status <> 'confirmed' or length(btrim(match_notes)) >= 3
 )
);
create index if not exists cc_rifl_food_item_idx on public.cc_recipe_ingredient_food_links(food_item_id);
comment on table public.cc_recipe_ingredient_food_links is
 'Correspondencia editorial confirmavel de ingredientes oficiais a alimentos; sem inferir composicao de nomes parecidos.';

create or replace function public.cc_food_nutrition_draft_guard()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='UPDATE' and new.food_item_id is distinct from old.food_item_id then
  raise exception 'Nao transfira revisao nutricional entre alimentos';
 end if;
 new.updated_at=now();
 new.updated_by=(select auth.uid());
 return new;
end;
$$;
drop trigger if exists cc_fnd_guard_trg on public.cc_food_nutrition_drafts;
create trigger cc_fnd_guard_trg before insert or update on public.cc_food_nutrition_drafts
 for each row execute function public.cc_food_nutrition_draft_guard();

create or replace function public.cc_recipe_ingredient_food_link_guard()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='UPDATE' and new.ingredient_id is distinct from old.ingredient_id then
  raise exception 'Nao transfira vinculo entre ingredientes';
 end if;
 if not exists (
  select 1 from public.recipe_ingredients i
  join public.recipes r on r.id=i.recipe_id
  where i.id=new.ingredient_id and r.owner_user_id is null and r.archived_at is null
 ) then
  raise exception 'Vinculo permitido apenas para ingrediente de receita oficial ativa';
 end if;
 if not exists (select 1 from public.food_items f where f.id=new.food_item_id) then
  raise exception 'Alimento nao encontrado';
 end if;
 new.updated_at=now();
 new.updated_by=(select auth.uid());
 return new;
end;
$$;
drop trigger if exists cc_rifl_guard_trg on public.cc_recipe_ingredient_food_links;
create trigger cc_rifl_guard_trg before insert or update on public.cc_recipe_ingredient_food_links
 for each row execute function public.cc_recipe_ingredient_food_link_guard();

create or replace function public.cc_invalidate_food_link_on_ingredient_edit()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if old.name is distinct from new.name or old.quantity is distinct from new.quantity
  or old.unit is distinct from new.unit or old.measure_mode is distinct from new.measure_mode
  or old.is_optional is distinct from new.is_optional then
  update public.cc_recipe_ingredient_food_links
  set match_status='candidate',total_mass_g=null,mass_evidence='',updated_at=now()
  where ingredient_id=new.id;
 end if;
 return null;
end;
$$;
drop trigger if exists cc_rifl_invalidate_ingredient on public.recipe_ingredients;
create trigger cc_rifl_invalidate_ingredient after update of
 name,quantity,unit,measure_mode,is_optional on public.recipe_ingredients
 for each row execute function public.cc_invalidate_food_link_on_ingredient_edit();

alter table public.cc_food_nutrition_drafts enable row level security;
alter table public.cc_recipe_ingredient_food_links enable row level security;
revoke all on table public.cc_food_nutrition_drafts,public.cc_recipe_ingredient_food_links from public,anon,authenticated;
grant select,insert,update on public.cc_food_nutrition_drafts,public.cc_recipe_ingredient_food_links to authenticated;

drop policy if exists cc_fnd_admin_read on public.cc_food_nutrition_drafts;
create policy cc_fnd_admin_read on public.cc_food_nutrition_drafts for select
 to authenticated using ((select public.cc_is_admin()));
drop policy if exists cc_fnd_admin_insert on public.cc_food_nutrition_drafts;
create policy cc_fnd_admin_insert on public.cc_food_nutrition_drafts for insert
 to authenticated with check ((select public.cc_is_admin()));
drop policy if exists cc_fnd_admin_update on public.cc_food_nutrition_drafts;
create policy cc_fnd_admin_update on public.cc_food_nutrition_drafts for update
 to authenticated using ((select public.cc_is_admin())) with check ((select public.cc_is_admin()));

drop policy if exists cc_rifl_admin_read on public.cc_recipe_ingredient_food_links;
create policy cc_rifl_admin_read on public.cc_recipe_ingredient_food_links for select
 to authenticated using ((select public.cc_is_admin()));
drop policy if exists cc_rifl_admin_insert on public.cc_recipe_ingredient_food_links;
create policy cc_rifl_admin_insert on public.cc_recipe_ingredient_food_links for insert
 to authenticated with check ((select public.cc_is_admin()));
drop policy if exists cc_rifl_admin_update on public.cc_recipe_ingredient_food_links;
create policy cc_rifl_admin_update on public.cc_recipe_ingredient_food_links for update
 to authenticated using ((select public.cc_is_admin())) with check ((select public.cc_is_admin()));

revoke all on function public.cc_food_nutrition_draft_guard() from public,anon,authenticated;
revoke all on function public.cc_recipe_ingredient_food_link_guard() from public,anon,authenticated;
revoke all on function public.cc_invalidate_food_link_on_ingredient_edit() from public,anon,authenticated;

-- Ingredientes comuns das receitas oficiais que ainda nao existiam na Biblioteca.
-- SEM nutrientes inventados, SEM equivalencias em gramas, SEM publicacao ao usuario final.
insert into public.food_items(name,category,editorial_status,published) values
('Amêndoas','oleaginosas','preliminary',false),
('Batata inglesa','cereais_tuberculos','preliminary',false),
('Canela em pó','outros','preliminary',false),
('Chocolate 85% cacau','outros','preliminary',false),
('Coco ralado','outros','preliminary',false),
('Creme de leite','laticinios','preliminary',false),
('Cúrcuma em pó','outros','preliminary',false),
('Estévia (adoçante)','outros','preliminary',false),
('Gengibre fresco','outros','preliminary',false),
('Iogurte natural integral 10% gordura','laticinios','preliminary',false),
('Leite de coco integral','outros','preliminary',false),
('Linhaça','oleaginosas','preliminary',false),
('Manteiga','oleos_gorduras','preliminary',false),
('Pimenta-caiena em pó','outros','preliminary',false),
('Sementes de girassol','oleaginosas','preliminary',false)
on conflict (name) do nothing;
