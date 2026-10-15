# Costa&Costa — Reconciliação editorial com fonte original e alerta compacto
**15/10/2026 — PR #16 (rascunho; sem merge).**

## Fonte auditada
Livro **50 Receitas Para Emagrecer De Vez — Código EDV**, arquivo disponibilizado pelo responsável pelo projeto. Consultadas as **páginas impressas 12–13** (Iogurte Turbo) e **18–19** (Chá Cremoso de Cúrcuma). Registro prévio de direitos em `source_recipe_review` não equivale a verificação nutricional; nenhuma alegação de saúde/segurança foi aprovada.

## Alterações executadas no Supabase
Arquivo versionado: `supabase/migrations/20261015180000_cc_recipe_source_reconciliation.sql`. Aplicado no banco principal por migração controlada `cc_recipe_source_reconciliation_cloud` (**sucesso**). Nenhum `supabase db push` executado.

1. **Iogurte Turbo:** permaneceu **não publicado** e sem referência em refeições planejadas. A medida do iogurte foi corrigida de 4 `colher_cha` para 4 `colher_sopa`, mantendo a especificação *cheia* na descrição. Cadastro completo com oito itens, preservando o item original e acrescentando creme de leite, estévia a gosto sem quantidade, coco ralado, linhaça, amêndoas, semente de girassol e chocolate com 85% de cacau opcional sem quantidade numérica. Sem converter colheres ou ingredientes a gosto para gramas.
2. **Chá Cremoso de Cúrcuma:** a fonte informa rendimento de **dois copos generosos**. Alterado `recipes.servings` de **1** para **2**. Permaneceram sete ingredientes, quantidades absolutas por receita e status de publicação. Uma refeição planejada em 13/10/2026 permanece com **duas porções**, mas a razão `planned_servings / recipe.servings` muda de `2/1` para `2/2`; a lista de compras recalcula para **1 lata de leite de coco, 2 cm de gengibre, 1 colher de chá de cúrcuma e 1 pitada de cada tempero**. Volume da lata **não verificado**. Esta mudança corrige uma divergência; as quantidades antes homologadas para o planejamento não devem ser usadas como expectativa futura.
3. Não modificadas receitas pessoais, outros ingredientes, alergias cadastradas, preferências ou os registros de planejamento.

**Integridade verificada após a aplicação:** 9 receitas ativas, 37 ingredientes (antes 30), 25 refeições planejadas (sem exclusões), 34 alimentos catalogados, 0 avaliações de alergênicos registradas. `Iogurte Turbo` permanece `published=false`. Triggers existentes de invalidação da revisão de alergênicos permanecem ativos; nenhuma revisão estava registrada.

## Ajuste da interface
- `src/App.tsx`: aviso global de alergias/intolerâncias no Cardápio ficou curto. A explicação completa permanece acessível em `details/summary` (`Entenda a orientação de segurança`).
- `src/styles.css`: espaçamento responsivo e foco visível para a expansão. Sem ocultar a existência do risco nem modificar o bloqueio de sugestão automática para usuários com alergias.
- **Não implementado nesta etapa:** motor de alergênicos por receita, dados nutricionais oficiais, validação de contato cruzado, aprovação editorial e liberação de sugestão automática.
- **Pendente:** compilação local no Windows e homologação visual 390 px, incluindo expansão do alerta. Alterações TSX/CSS revisadas textualmente, não homologadas por build nesta auditoria.

## Roteiro de homologação
1. Na branch `feat/revisao-alergenos-fase1-12out2026`, executar `git pull --ff-only`, `npm run build` e recarregar o navegador com `Ctrl + Shift + R`.
2. Em **Cardápio**, simular 390 px e verificar título/resumo curto e link `Entenda a orientação de segurança`. Expandir e recolher. Confirmar que a seleção automática continua bloqueada para quem informou alergias.
3. Em **Compras**, semana 12–18/10, confirmar **1 lata de leite de coco, 2 cm de gengibre, 1 colher de chá de cúrcuma** (duas porções do chá) e ingredientes obrigatórios do almoço intactos, incluindo marcação comprada de alface. Adoçante e manteiga continuam na seção de observações.
4. No painel administrativo de **Receitas**, localizar o **Iogurte Turbo** não publicado, conferir oito ingredientes e as unidades `colher de sopa`, `colher de chá`, `a gosto` e `opcional`. **Não publicar** sem revisão técnica de alergênicos, rótulos e nutrição.
5. Documentar qualquer divergência de cálculo antes de promover as alterações.

**Proteções:** PR #16 não mesclado. O histórico remoto de migrações continua diferente do histórico local; reconciliar antes de execução de `db push`, migração automática ou deploy.
