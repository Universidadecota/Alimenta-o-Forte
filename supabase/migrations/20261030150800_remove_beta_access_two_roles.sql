-- Costa&Costa: transição do catálogo Beta para dois perfis.
-- Administrador: cc_admin_members. Comum: auth.users sem cc_admin_members.
-- Conserva contas, receitas, fotos, revisões e registros históricos.

-- Política exclusiva do acesso Beta: substituída pela leitura administrativa
-- e pelas políticas de receitas publicadas e pessoais.
DROP POLICY IF EXISTS cc_beta_select_approved_ingredients ON public.recipe_ingredients;
DROP POLICY IF EXISTS cc_beta_select_approved_recipes ON public.recipes;

-- Neutralizar definitivamente o caminho de autorização legado,
-- inclusive para funções antigas que o consultam.
CREATE OR REPLACE FUNCTION public.cc_beta_can_view_recipe(p_recipe_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
 SELECT false;
$$;

-- Desabilitar concessões antigas sem excluir contas ou perder trilhas.
UPDATE public.cc_beta_members SET enabled = false WHERE enabled IS TRUE;

-- Impedir que RPCs legadas reativem o perfil Beta.
REVOKE ALL ON FUNCTION public.cc_admin_set_beta_member(text,boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cc_admin_set_beta_recipe(uuid,boolean)
  FROM PUBLIC, anon, authenticated;

-- Não tocar cc_beta_recipe_access para preservar histórico das 114 receitas;
-- a RPC de autorização permanece falsa e as políticas RLS Beta não existem.
-- Não alterar recipes.published, ingredientes, usuários ou documentação.
