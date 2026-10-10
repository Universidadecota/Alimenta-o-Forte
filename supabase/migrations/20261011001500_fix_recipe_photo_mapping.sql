-- Corrige associação verificada em homologação visual. Não altera arquivos existentes no Storage.
update public.recipes set image_url=case title
 when '[Exemplo] Iogurte com banana e aveia' then 'https://gclhailalyrokvmkwllm.supabase.co/storage/v1/object/public/recipe-illustrations/omelete-tomate.webp'
 when '[Exemplo] Omelete de tomate' then 'https://gclhailalyrokvmkwllm.supabase.co/storage/v1/object/public/recipe-illustrations/iogurte-banana-aveia.webp'
 when '[Exemplo] Peixe assado e legumes' then null
 else image_url end
 where owner_user_id is null and title in ('[Exemplo] Iogurte com banana e aveia','[Exemplo] Omelete de tomate','[Exemplo] Peixe assado e legumes');
