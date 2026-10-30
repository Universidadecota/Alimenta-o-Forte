-- Reverte somente a RPC de soma de compras parciais nao utilizada.
-- Mantem a lista semanal simples, seus registros e politicas RLS existentes.
-- Supabase nao remove historico de migrations ja aplicadas.
drop function if exists public.cc_add_shopping_purchase(date,text,text,numeric) restrict;
