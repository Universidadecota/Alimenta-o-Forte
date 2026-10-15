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

## Homologação recebida no Windows — 15/10/2026

**Evidências fornecidas pelo responsável:** saída de `git pull --ff-only` até `d5c3483`, seguida de `npm run build` com `tsc -b && vite build` concluído, Vite 6.4.4, 1.641 módulos e 32,74 segundos, sem erro informado. Duas capturas da interface local (`localhost:5173`) em desktop.

- **Cardápio:** aviso resumido “Alergias/intolerâncias cadastradas: Soja”, com informação essencial visível e controle “Entenda a orientação de segurança”. O estado fechado foi observado; abrir/recolher não foi demonstrado nesta entrega. Layout sem cortes evidentes no desktop. Semana 12–18/10 preservada.
- **Compras:** Alface 450 g continua marcada; Arroz 720 g, Feijão 900 g, Peito de frango 1.350 g preservados. Chá recalculado para 1 lata de leite de coco, 2 cm de gengibre, 1 colher de chá de cúrcuma, 1 pitada de canela e 1 pitada de pimenta-caiena. Adoçante permanece “a gosto” e manteiga “quantidade não informada · opcional”. Botão “Copiar lista” visível, sem repetição do teste de cópia.
- **Resultado:** compilação e regressão visual das duas telas demonstradas **aprovadas**. Os testes anteriores de Biblioteca de Alimentos e da navegação não precisam ser repetidos por causa desta alteração.

**Pendências mantidas:** expandir/recolher o aviso no celular a 390 px, conferir no painel administrativo os oito ingredientes do Iogurte Turbo (mantido em rascunho), revisão profissional de nutrição e alergênicos, segurança de sugestões para perfis com alergias, e reconciliação dos históricos local/remoto antes de merge/deploy. **PR #16 continua sem merge.**

## Complemento — Verificação mobile em 390 px

Capturas no Chrome DevTools, vista responsiva 390 × 545 a 100%:
- **Cardápio:** alerta de alergias recolhido e expandido visualizados; título, mensagem essencial e texto completo permanecem legíveis, sem corte lateral evidente. A expansão atende ao comportamento esperado.
- **Receitas:** ficha Chá Cremoso de Cúrcuma exibindo duas porções, 1 lata de leite de coco, 1 colher de chá de cúrcuma, 2 cm de gengibre, 1 pitada de pimenta-caiena e 1 pitada de canela; adoçante a gosto e manteiga opcional sem quantidade. Valores visualmente coincidentes com a reconciliação do banco.
- **Ressalva:** na última linha da ficha, a medida longa de manteiga fica espremida, com risco de sobreposição da coluna do ingrediente em 390 px. CSS ajustado no commit `672a745` para permitir quebra de linha das medidas; **build e revalidação visual desse commit ainda pendentes**.
- O Console exibe `GET /favicon.ico 404`. Esse aviso não indica falha das consultas ou da receita, mas merece correção de ativo estático em uma etapa separada.

Nenhuma nova migração ou alteração de ingredientes é requerida por essas capturas. Permanece o estado conservador de segurança alimentar e o PR #16 não deve ser mesclado ainda.
