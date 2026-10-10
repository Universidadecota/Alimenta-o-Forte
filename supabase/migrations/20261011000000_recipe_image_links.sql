-- Fotos oficiais: links passam a carregar quando os arquivos forem enviados ao bucket.
update public.recipes set image_url='https://gclhailalyrokvmkwllm.supabase.co/storage/v1/object/public/recipe-illustrations/' || case title
 when '[Exemplo] Frango com arroz, feijão e salada' then 'frango-arroz-feijao-salada.webp'
 when '[Exemplo] Iogurte com banana e aveia' then 'iogurte-banana-aveia.webp'
 when '[Exemplo] Omelete de tomate' then 'omelete-tomate.webp'
 when '[Exemplo] Peixe assado e legumes' then 'peixe-assado-legumes.webp'
 when '[Exemplo] Salada de grão-de-bico e ovos' then 'salada-grao-de-bico-ovos.webp'
 end
 where owner_user_id is null and title in ('[Exemplo] Frango com arroz, feijão e salada','[Exemplo] Iogurte com banana e aveia','[Exemplo] Omelete de tomate','[Exemplo] Peixe assado e legumes','[Exemplo] Salada de grão-de-bico e ovos');
-- Imagem ovos/bacon permanece disponível no bucket, sem alterar receitas pessoais.
