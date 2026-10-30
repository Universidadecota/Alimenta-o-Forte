> **DECISÃO REVOGADA EM 14/10/2026 — NÃO IMPLEMENTAR COMPRAS PARCIAIS.** O proprietário determinou voltar à lista de compras simples. Costa&Costa deve apenas calcular ingredientes e quantidades pelas porções escolhidas, deixando o planejamento efetivo das aquisições ao usuário. O frontend `src/App.tsx`, `src/lib/shoppingProgress.ts` e `src/styles.css` foi restaurado ao estado anterior à funcionalidade. A RPC `cc_add_shopping_purchase` foi retirada do Supabase Cloud pela migração compensatória `20261014040000_cc_undo_partial_shopping_rpc.sql`. O histórico das migrações permanece para rastreabilidade, mas a funcionalidade descrita abaixo foi descontinuada. Nenhum registro de compra, receita ou cardápio foi excluído. A checklist simples por semana e usuário continua em uso.

---

# Costa&Costa — Compras parciais e saldo pendente
**Data:** 14/10/2026 · **Ambiente:** Supabase Cloud principal `gclhailalyrokvmkwllm` · **Branch:** `feat/revisao-alergenos-fase1-12out2026`

## Regra comercial autorizada
Em vez de desmarcar automaticamente um ingrediente quando a quantidade necessária cresce, manter o total **realmente comprado** e calcular o **saldo faltante**. Ex.: foram comprados 100 g de Alface e o cardápio agora exige 150 g; a interface deve mostrar **Parcialmente comprado — faltam 50 g**. Ações: registrar o restante, registrar qualquer quantidade adicional válida e zerar o registro com confirmação quando necessário.

Estado derivado da comparação da quantidade comprada com a necessidade dinâmica da semana:
- **Não comprado:** comprado = 0.
- **Parcialmente comprado:** 0 < comprado < necessário.
- **Concluído:** comprado >= necessário.
- Quantidade comprada maior que a necessidade é preservada, e a interface indica excedente. Nunca apagar compras porque o planejamento mudou.
- Item individualizado pela combinação do nome normalizado e unidade. `kg` e `g` são consolidados como `g` pelo planejador, e ingredientes de unidades incompatíveis não são fundidos.

## Compatibilidade e dados antigos
A tabela `shopping_list_items` já tem `quantity numeric NOT NULL CHECK (quantity>0)`, `completed boolean`, FK composta com a lista semanal e índice único `cc_shopping_checked_item_unique(shopping_list_id,name,unit)`. A migração **não cria tabela nem altera registros**; passa-se a interpretar `quantity` como o montante efetivamente comprado, inclusive para itens legados. O campo `completed=true` indica presença de uma compra registrada e **não significa sozinho que a demanda atual está totalmente atendida**. O estado exibido deve ser derivado da diferença entre quantidade necessária e comprada.

A compra real previamente existente de **Alface 100 g**, semana de 12 a 18 de outubro, foi preservada (contagem mantida: 1 lista e 1 item). Quantidade exigida na interface após o último aumento: 150 g.

## Implementação
- `src/lib/shoppingProgress.ts`: carrega um mapa de quantidades compradas por usuário/semana, calcula saldos com arredondamento de duas casas, registra compras adicionais e permite zerar explicitamente.
- `src/App.tsx`: apresenta os três estados, comprador/necessário/saldo, botões para registrar o restante ou quantidade adicional e zerar mediante confirmação.
- `src/styles.css`: estilização responsiva.
- `supabase/migrations/20261014030000_cc_shopping_partial_purchases.sql`: função `public.cc_add_shopping_purchase(date,text,text,numeric)` para **soma atômica** na tabela existente sob o usuário de `auth.uid()`, `SECURITY INVOKER` e `search_path` fechado; concede `EXECUTE` apenas a `authenticated`.

**Migração aplicada no Supabase Cloud:** `20261014181643` (`cc_shopping_partial_purchase_atomic_cloud`), levando o histórico remoto a 28 migrações.

## Testes realizados
- Inspeção prévia: RLS habilitado nas tabelas, políticas por `auth.uid()`, índice único e 1 item existente preservado.
- `cc_add_shopping_purchase` executada como `authenticated` com identidade simulada em transação revertida: duas chamadas de 100 g + 50 g resultaram em **um único registro de 150 g**, confirmado por assert SQL `atomic_sum_confirmed=true`.
- Identidade simulada diferente recebeu isolamento RLS na leitura da lista temporária. Também foi verificado que duas identidades podem gravar quantidades distintas na mesma semana sem misturar as listas. Todos os dados de testes foram revertidos com `ROLLBACK`.
- Pós-teste: 9 receitas, 22 refeições planejadas, 1 lista e 1 item, 0 listas QA remanescentes; Alface real segue com 100 g comprados.
- Permissões: função `SECURITY INVOKER`, `authenticated_can_exec=true`, `anonymous_can_exec=false`.
- GitHub: status **Vercel success** para o commit de interface/CSS `5c42979`. Não há workflow GitHub Actions para o commit, e ainda não houve confirmação de `npm run build` no PC.

## Pendências antes de homologar a interface
1. No Windows: `git pull --ff-only` e `npm run build`. Não usar Docker, não executar `db push`.
2. Em Compras, semana 12–18/10, com 3 porções, confirmar **Alface parcialmente comprada: 100 g / 150 g; falta 50 g**, mantendo arroz 240 g, feijão 300 g e peito de frango 450 g.
3. Registrar 20 g adicionais, recarregar e confirmar **120/150 g — falta 30 g**.
4. Registrar o restante e confirmar **150/150 g — concluído**, inclusive após `Ctrl+Shift+R`; testar uma diminuição/aumento de porções sem apagar as compras.
5. Confirmar isolamento entre as contas, a capacidade de zerar com confirmação e a opção Copiar lista.
6. Não mesclar o PR #16 nem publicar o frontend como produção até a revisão/regressão e compatibilização do histórico de migrações.

**Segurança:** não há garantia de segurança alimentar para receitas com alergênicos; os bloqueios da sugestão automática continuam ativos. Não expor credenciais secretas.
