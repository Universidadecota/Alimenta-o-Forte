-- Costa&Costa — PR #63 — assinatura do banco para ensaio de restauracao.
-- SOMENTE SELECT; NUNCA altera dados ou permissões.
-- Executar no original e no AMBIENTE ISOLADO restaurado; comparar resultados.
-- Nao exporta nomes/enderecos de usuarios, textos de notas nem nomes de arquivos privados.

SELECT
  CURRENT_TIMESTAMP AS measured_at,
  CURRENT_DATABASE() AS database_name,
  (SELECT COUNT(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind='r') AS public_tables,
  (SELECT COUNT(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity) AS public_tables_without_rls,
  (SELECT COUNT(*)::int FROM auth.users) AS auth_users,
  (SELECT COUNT(*)::int FROM public.recipes) AS recipes,
  (SELECT COUNT(*)::int FROM public.recipe_ingredients) AS recipe_ingredients,
  (SELECT COUNT(*)::int FROM public.meal_plans) AS meal_plans,
  (SELECT COUNT(*)::int FROM public.planned_meals) AS planned_meals,
  (SELECT COUNT(*)::int FROM public.shopping_lists) AS shopping_lists,
  (SELECT COUNT(*)::int FROM public.shopping_list_items) AS shopping_list_items,
  (SELECT COUNT(*)::int FROM public.cc_shopping_decisions) AS shopping_decisions,
  (SELECT COUNT(*)::int FROM public.cc_evolution_checkins) AS evolution_checkins,
  (SELECT COUNT(*)::int FROM public.cc_pilot_food_registry) AS pilot_food_registry,
  (SELECT COUNT(*)::int FROM public.cc_pilot_ingredient_measure_reviews) AS pilot_measure_reviews,
  (SELECT COUNT(*)::int FROM public.cc_beta_members) AS beta_members,
  (SELECT COUNT(*)::int FROM public.cc_beta_recipe_access) AS beta_recipe_access,
  (SELECT COUNT(*)::int FROM public.subscription_plans) AS subscription_plans,
  (SELECT COUNT(*)::int FROM public.user_entitlements) AS user_entitlements,
  (SELECT COUNT(*)::int FROM public.cc_food_nutrition_review_cases) AS nutrition_review_cases,
  (SELECT COUNT(*)::int FROM public.cc_medical_reviewer_onboarding) AS medical_reviewer_onboarding,
  (SELECT COUNT(*)::int FROM supabase_migrations.schema_migrations) AS migration_history,
  (SELECT COALESCE(json_agg(x ORDER BY x.name),'[]'::json)
   FROM (
    SELECT b.name, b.public, COUNT(o.id)::int AS object_metadata_count
    FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id=b.id
    GROUP BY b.id,b.name,b.public
   ) x) AS storage_metadata,
  (SELECT COALESCE(json_agg(e.extname ORDER BY e.extname),'[]'::json) FROM pg_extension e) AS extensions;
