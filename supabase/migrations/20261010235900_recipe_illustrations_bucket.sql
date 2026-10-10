insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('recipe-illustrations','recipe-illustrations',true,2097152,array['image/webp']) on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/webp'];
-- Imagens oficiais somente via administração do Supabase; leitura pública em bucket dedicado.
-- Não conceder políticas INSERT/UPDATE/DELETE a usuários comuns para recipe-illustrations.
