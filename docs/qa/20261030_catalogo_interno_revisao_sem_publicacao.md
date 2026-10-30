# Costa&Costa — catálogo interno das receitas em revisão (30/10/2026)

## Motivo
A administração mostra as 119 receitas do piloto como "não publicadas". O proprietário solicitou que estejam disponíveis no aplicativo para testar com sua conta comum. No Supabase real, todas as 119 têm `commercial_rights_status='pending_review'` e `ingredient_review_status='needs_structuring'`; existem 1.120 linhas de ingredientes sem quantidades estruturadas. O trigger `cc_guard_personal_pilot_recipe_publish` impede `published=true` antes da liberação editorial e comercial.

**Decisão técnica:** disponibilizar o acervo somente a uma conta comum explicitamente autorizada durante o desenvolvimento, sem alterar `published`, sem tornar dados visíveis para visitantes, sem reabilitar o perfil Beta e sem afirmar que receitas, direitos, alergênicos ou informações nutricionais foram homologados.

## Regra de acesso
- Continuam existindo apenas os perfis **administrador** e **usuário comum**. A autorização interna de acervo é uma permissão por conta, não uma terceira função ou plano comercial.
- Os UUIDs aprovados ficam em `cc_internal_catalog.readers` (schema não exposto, sem grants para `anon`/`authenticated`, RLS ativa). Nenhuma conta é aprovada automaticamente pela migração.
- A função `cc_internal_can_view_recipe(id)` exige `auth.uid()` e entrada explícita na lista interna. Libera a leitura apenas dos registros de `personal_pilot` não publicados, sem outros rascunhos.
- A função `cc_internal_can_plan_recipe(id)` limita o planejamento às fontes `is_plannable=true` (114 no estado consultado). Preparos auxiliares como molhos não se tornam automaticamente pratos.
- A RPC somente de leitura `cc_internal_recipe_source_summary()` retorna **metadados estritamente necessários** à classificação e à exibição dos ingredientes originais. A tabela de fontes/editoriais permanece restrita ao administrador.
- Novas RLS SELECT sobre `recipes` e `recipe_ingredients` exigem sessão autenticada **e** a autorização exata da conta. Sem concessões a `anon`, sem tornar `published=true`, sem novo papel Beta.
- A proteção do `guard_planned_recipe_owner` e a RPC transacional `cc_replace_week_main_meals_v2` passam a aceitar apenas as receitas internas **planejáveis** dessa conta. Ambas preservam controles de titularidade, concorrência, fixações e triagem.
- O perfil comum autorizado recebe o mesmo modelo `pilotSource` do administrador para mostrar avisos corretos e não inventar quantidades de compras. O painel rotula `Acesso interno · revisão pendente`, não `Publicado`.

## Alergênicos, medidas, direitos e preparação
A concessão de leitura interna **não** autoriza publicação comercial, compartilhamento público, venda, afirmações de saúde, nutrição calculada ou suposições sobre segurança do preparo. As medidas originais e alergênicos não homologados permanecem claramente indicados. A triagem automática com alergias cadastradas **não foi afrouxada**: `cc_allergy_candidate_ids()` continua conservadora e pode excluir receitas internas não triadas. Essa é a consequência correta enquanto as evidências não estiverem completas.

## Infraestrutura e implantação
1. PR com migração `supabase/migrations/20261030174656_cc_internal_catalog_two_roles.sql`, ajuste do `src/lib/planner.ts`, rótulos de administração e testes.
2. Validar CI antes de mexer no banco.
3. Aplicar a migração estrutural no Supabase atual e verificar policies, funções e ausência de publicação.
4. **Em ação administrativa separada e auditada**, autorizar somente a conta comum controlada confirmada pelo proprietário. Não guardar e-mail nem identificador pessoal no código versionado.
5. Mesclar na `main` após CI aprovada; verificar Vercel READY e domínio apontando para o commit.
6. Executar teste HTTP com as sessões controladas: usuário comum autorizado visualiza receitas do piloto; visitante anônimo e conta comum não autorizada não visualizam; administrador conserva as evidências.

## Verificação no Supabase atual
Migração registrada no banco: `20261030174656 cc_internal_catalog_two_roles`. Foi liberada exatamente uma conta comum pré-existente, sem ID ou e-mail versionado no código.
Testes de papéis SQL transacionais (com claims simuladas, não logins HTTP): a conta autorizada recebeu 119 receitas e 1.120 linhas de ingredientes, com 114 fontes classificadas como planejáveis, e **zero** linhas da tabela original de fontes administrativas. Conta comum não autorizada e acesso anônimo receberam **zero** receitas oficiais privadas. A migração preservou as 1.072 revisões históricas e deixou todas as 119 receitas do piloto com `published=false`.

## Homologação e limites
- Contagens esperadas antes de qualquer concessão: 119 fontes com direitos pendentes, 1.120 ingredientes sem medidas e 114 opções elegíveis ao planejamento.
- O acesso à tabela de leitores é restrito no banco. Ela não cria um terceiro perfil nem reativa políticas de Beta.
- Testes de código garantem que nenhuma migração/publicação reclassifique as receitas como aprovadas; porém não substituem testes HTTP/JWT com contas reais.
- **Acesso interno não é publicação pública**. Para disponibilizar o catálogo a clientes externos, o fluxo de liberação editorial/comercial deverá ser concluído e o status `published` deverá ser alterado por caminho administrativo apropriado.

Se desejar encerrar o acesso interno posteriormente, revogue a entrada da conta em `cc_internal_catalog.readers` após preservar seu cardápio ou concluir a transição para receitas efetivamente aprovadas.
