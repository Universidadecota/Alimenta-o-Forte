# Beta gratuito — homologação no banco real (18/10/2026)

## Evidências
- Migração beta instalada; políticas SELECT em recipes e recipe_ingredients exigem cc_beta_can_view_recipe.
- Consulta ao Supabase: 119 registros de origem do acervo pessoal com commercial_rights_status=pending_review e ingredient_review_status=needs_structuring.
- Não foi concedida autorização de participante nem de receita. Testes positivos com duas contas ainda pendentes.

## Conduta
- Não liberar receitas do acervo original para terceiros enquanto direitos e medidas estiverem pendentes. Não alterar published nem os estados editoriais automaticamente.
- Prosseguir com beta funcional utilizando receitas pessoais fictícias criadas voluntariamente pelas contas de teste.
- Homologar duas contas distintas: proprietário vê sua receita, cardápio, compras e imagem; a outra conta não vê; testar também recarga e revogação.
- Catálogo oficial: comprovar bloqueio sem autorização; ensaio de liberação positiva somente com uma receita editorialmente autorizada ou fixture fictícia isolada aprovada para esse fim.
- Nunca confundir inspeção de políticas com execução de testes autenticados ponta a ponta.
