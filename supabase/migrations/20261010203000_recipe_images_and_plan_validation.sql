alter table public.recipes add column if not exists image_url text;
alter table public.recipes add constraint recipes_image_url_safe check (image_url is null or (char_length(image_url) <= 2048 and image_url ~ '^https://'));
create or replace function public.validate_planned_meal_week() returns trigger language plpgsql set search_path = '' as $$
declare start_date date;
begin
 select p.week_start into start_date from public.meal_plans p where p.id=new.meal_plan_id and p.user_id=new.user_id;
 if start_date is null or new.meal_date < start_date or new.meal_date >= start_date + 7 then
 raise exception 'Data fora da semana do planejamento';
 end if;
 return new;
end $$;
create trigger validate_planned_meal_week_trigger before insert or update on public.planned_meals for each row execute function public.validate_planned_meal_week();
