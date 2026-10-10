alter table public.user_preferences add column if not exists goal text;
alter table public.user_preferences add column if not exists liked_foods text[] not null default '{}';
alter table public.user_preferences add column if not exists onboarding_completed_at timestamptz;
alter table public.user_preferences add constraint user_preferences_goal_valid check (goal is null or goal in ('eat_better','plan_meals','balanced_weight','build_habits','maintain_balance'));
create index if not exists user_preferences_onboarding_idx on public.user_preferences(onboarding_completed_at);
