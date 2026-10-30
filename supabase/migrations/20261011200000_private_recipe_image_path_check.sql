-- Normaliza o nome da coluna em instalações locais novas sem perder fotos existentes.
-- Migrações anteriores criaram image_url; os fluxos atuais utilizam url.
do $$
begin
 if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='recipes' and column_name='url')
    and exists (select 1 from information_schema.columns where table_schema='public' and table_name='recipes' and column_name='image_url') then
  alter table public.recipes rename column image_url to url;
 end if;
end $$;
-- Mantém HTTPS para fotografias públicas e permite caminhos internos de fotos privadas.
-- Nunca armazena signed URLs com expiração no registro permanente.
alter table public.recipes drop constraint if exists recipes_image_url_safe;
alter table public.recipes add constraint recipes_image_url_safe check (
 url is null or (
 char_length(url)<=2048 and (
 url ~ '^https://' or
 (owner_user_id is not null and url ~ ('^personal-recipe-images/' || owner_user_id::text || '/[0-9a-f-]{36}/[0-9a-f-]{36}\\.webp$'))
 ))
);
