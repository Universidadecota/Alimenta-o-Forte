-- Complements foundation_profiles_v1. Apply with Supabase migration name fundacao_comercial_rest.
-- Fundação Costa&Costa. Receitas são publicadas apenas pelo backend administrativo.

create extension if not exists pgcrypto;
create table public.user_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 disliked_foods text[] not null default '{}',
 allergies text[] not null default '{}',
 household_size integer not null default 1 check (household_size between 1 and 20),
 cooking_minutes integer check (cooking_minutes between 5 and 360),
 created_at timestamptz not null default now()
);
create table public.recipes (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 2 and 180),
 category text not null check(category in ('breakfast','lunch','dinner','snack')),
 description text,
 instructions text,
 prep_minutes integer not null default 15 check(prep_minutes between 0 and 1440),
 servings integer not null default 1 check(servings between 1 and 100),
 published boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.recipe_ingredients (
 id uuid primary key default gen_random_uuid(),
 recipe_id uuid not null references public.recipes(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 140),
 quantity numeric(12,3) not null check(quantity>0),
 unit text not null check(unit in ('g','kg','ml','l','un')),
 position integer not null default 0
);
create table public.meal_plans (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 created_at timestamptz not null default now(),
 constraint meal_plans_monday check(extract(isodow from week_start)=1),
 unique(user_id,week_start),
 unique(user_id,id)
);
create table public.planned_meals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 meal_plan_id uuid not null,
 meal_date date not null,
 slot text not null check(slot in ('breakfast','lunch','dinner')),
 recipe_id uuid not null references public.recipes(id) on delete restrict,
 servings integer not null default 1 check(servings between 1 and 20),
 created_at timestamptz not null default now(),
 foreign key (user_id,meal_plan_id) references public.meal_plans(user_id,id) on delete cascade,
 unique(meal_plan_id,meal_date,slot)
);
create table public.shopping_lists (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 created_at timestamptz not null default now(),
 unique(user_id,week_start),
 unique(user_id,id)
);
create table public.shopping_list_items (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 shopping_list_id uuid not null,
 name text not null check(char_length(name) between 1 and 140),
 quantity numeric(12,3) not null check(quantity>0),
 unit text not null check(unit in ('g','kg','ml','l','un')),
 completed boolean not null default false,
 created_at timestamptz not null default now(),
 foreign key (user_id,shopping_list_id) references public.shopping_lists(user_id,id) on delete cascade
);
create table public.subscription_plans (
 id text primary key,
 name text not null,
 active boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.user_entitlements (
 user_id uuid not null references auth.users(id) on delete cascade,
 entitlement text not null,
 valid_until timestamptz,
 primary key (user_id,entitlement)
);
create index planned_meals_user_date_idx on public.planned_meals(user_id,meal_date);
create index meal_plans_user_week_idx on public.meal_plans(user_id,week_start);
create index shopping_items_user_idx on public.shopping_list_items(user_id,shopping_list_id);
create index recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id,position);

alter table public.user_preferences enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_plans enable row level security;
alter table public.planned_meals enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_entitlements enable row level security;


create policy "preferences_select_own" on public.user_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy "preferences_insert_own" on public.user_preferences for insert to authenticated with check(user_id=(select auth.uid()));
create policy "preferences_update_own" on public.user_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "preferences_delete_own" on public.user_preferences for delete to authenticated using(user_id=(select auth.uid()));

create policy "recipes_read_published" on public.recipes for select to anon,authenticated using(published=true);
create policy "ingredients_read_published" on public.recipe_ingredients for select to anon,authenticated using(exists(select 1 from public.recipes r where r.id=recipe_id and r.published=true));

create policy "meal_plans_owner" on public.meal_plans for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "planned_meals_owner" on public.planned_meals for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "shopping_lists_owner" on public.shopping_lists for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "shopping_items_owner" on public.shopping_list_items for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create policy "plans_public_active" on public.subscription_plans for select to anon,authenticated using(active=true);
create policy "entitlements_select_own" on public.user_entitlements for select to authenticated using(user_id=(select auth.uid()));

revoke all on public.user_entitlements from anon,authenticated;
grant select on public.user_entitlements to authenticated;
revoke all on public.subscription_plans from anon,authenticated;
grant select on public.subscription_plans to anon,authenticated;
