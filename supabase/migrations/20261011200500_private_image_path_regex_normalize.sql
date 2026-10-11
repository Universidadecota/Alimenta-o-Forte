alter table public.recipes drop constraint if exists recipes_image_url_safe;
alter table public.recipes add constraint recipes_image_url_safe check (url is null or (char_length(url)<=2048 and (url ~ '^https://' or (owner_user_id is not null and url ~ ('^personal-recipe-images/' || owner_user_id::text || '/[0-9a-f-]{36}/[0-9a-f-]{36}[.]webp$')))));
