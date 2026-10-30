# Costa&Costa — Fase 40: edição segura dos ingredientes oficiais (30/10/2026)

## Problema confirmado
`cc_save_official_recipe` excluía todos os ingredientes antigos ao editar receitas oficiais e criava outros com novos UUIDs. Cinco tabelas de evidência/links utilizam chaves estrangeiras `ON DELETE CASCADE` para `recipe_ingredients.id`. A Fase 3Z instalou um trigger para impedir a perda dos 1.072 registros de revisão de 119 receitas, mas o editor continuava com o fluxo antigo de exclusão total.

## Correção proposta e implantada
- O formulário administrativo lê agora `id` e `position`, ordena os ingredientes e preserva o ID no estado durante alterações.
- Ao salvar ou alternar a publicação de receita oficial, envia cada ID existente acompanhado de um snapshot original: nome, posição, quantidade, unidade, modo de medição e opcionalidade. Ingredientes novos enviam `id=null`.
- A rotina `cc_save_official_recipe` foi modificada **preservando sua assinatura e suas validações prévias**. Para receitas existentes, usa bloqueio `FOR UPDATE` na receita e nas linhas de ingrediente; confere ID e snapshot, rejeita versões alteradas, atualiza no lugar, insere apenas novidades e exclui apenas ingredientes removidos sem qualquer dos cinco tipos de evidência ligados.
- Alterações de nome, posição, quantidade, unidade, modo ou opcionalidade em ingredientes com evidência vinculada são bloqueadas, inclusive se houver mudança na ordem; essas revisões terão que passar pelo fluxo versionado específico.
- Quando o formulário não envia IDs para uma receita que já possui ingredientes, a edição falha em vez de substituí-los silenciosamente. Remover todos os ingredientes antigos em uma única operação também é bloqueado.
- Para fontes `use_stage='personal_pilot'`, a edição por essa RPC passa a ser bloqueada no servidor. O fluxo existente e restrito de fotografia continua disponível por `cc_set_personal_pilot_recipe_photo`.
- Nenhuma chamada permite publicar receitas do piloto; o trigger `cc_guard_personal_pilot_recipe_publish` existente permanece ativo.
- O SQL é transacional: falha em qualquer etapa desfaz alterações feitas anteriormente no mesmo pedido.

## Efeitos esperados e limitações
Edições normais de receitas oficiais sem evidências técnicas vinculadas podem alterar ingredientes preservando seus IDs originais. Adicionar ingredientes cria novos IDs. Remover ingrediente somente é permitido quando nenhuma das cinco tabelas relacionadas possui linha dependente.

As 119 receitas do piloto permanecem com conteúdo protegido; nenhum dado de ingrediente foi aprovado ou alterado nesta fase.

**Edição concorrente:** o snapshot por ingrediente protege contra mudanças recentes nas linhas de ingredientes. A versão completa dos metadados da receita (título, instruções etc.) ainda não recebe um token de concorrência separado; futuramente pode ser acrescentado versionamento integral do cabeçalho da receita. Portanto, não afirmar concorrência plenamente resolvida para todos os campos.

## Verificações
- Teste automatizado de payload `scripts/test-official-ingredient-writes.mjs`: IDs preservados, inclusão, reordenação, quantidade anterior, duplicidade e uso de IDs desconhecidos; verifica marcações de segurança no SQL.
- Verificação SQL do banco: código e privilégios da função, trigger protetor anterior, estado de publicação de três receitas e contagem de 1.072 revisões/119 receitas.
- Nenhum UPDATE/DELETE em ingredientes ou fontes reais como parte da homologação; o teste de integração com dados sintéticos e JWT reais ainda precisa ser realizado para exercitar transação e RLS por perfil.
- O código foi integrado somente na branch Beta; `main` preservada.

## Nota de implantação
A rotina antiga e a nova têm a mesma assinatura; clientes antigos que tentem editar receitas existentes sem enviar IDs serão recusados de forma segura. Após migrar a função, integrar a UI Beta com o payload atualizado. A alternância de publicação também foi adaptada para não recriar ingredientes. No projeto de pré-lançamento esse bloqueio temporário de edições desatualizadas é preferível à perda de histórico.

## Futuros testes de usuário real
Executar, com contas controladas e dados de teste próprios, os cenários de permissões de escritura/admin, edição simultânea, tentativa de excluir ingrediente com evidência e edição somente da fotografia do piloto. Não utilizar DELETE sobre os ingredientes de 119 receitas originais para demonstrar a proteção.

Referências: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Functions](https://supabase.com/docs/guides/database/functions).
