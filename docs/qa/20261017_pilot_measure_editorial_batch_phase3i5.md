# Costa&Costa — Fase 3I.5: conferência editorial de até cinco rascunhos por lote

**Data:** 17/10/2026  
**Branch:** `feat/revisao-alergenos-fase1-12out2026`  
**PR #16:** manter aberto em draft, **sem merge**.

## Contexto já homologado — não repetir

- Catálogo pessoal do piloto: **119 receitas originais**, preservadas e não publicadas.
- Inventário de **1.073** expressões, das quais **468** foram classificadas preliminarmente como medidas simples (classificação não é confirmação). O resumo da Fase 3I.2 e a prévia de 20 rascunhos da Fase 3I.3 já foram homologados.
- O ingrediente `1 colher (chá) de azeite de dendê` foi **confirmado editorialmente** pelo responsável em `Moqueca de peixe com arroz de couve-flor`, com nota, data, autoria e um evento de auditoria. A medida confirmada não deve ser reaberta nem refeita.

## Objetivo

Permitir **decisões humanas específicas para 1 a 5 rascunhos em uma única operação**, diminuindo a repetição de cliques sem automatizar a aprovação de nenhum ingrediente.

Cada rascunho requer obrigatoriamente:

1. Texto original e proposta exibidos junto com o nome da receita.
2. Checkbox exclusivo e inicialmente **desmarcado**: `Conferi manualmente a fonte, a quantidade e a unidade desta receita`.
3. Decisão explicitamente escolhida: **Confirmar editorialmente** ou **Devolver à revisão manual**. Nenhuma ação vem pré-selecionada.
4. Justificativa própria daquele ingrediente (8 a 1.200 caracteres).
5. Prévia final `window.confirm` contendo a ação, a receita, a expressão e a justificativa **de cada item** antes da gravação.

Não há botão de **aprovar tudo**, pré-seleção de rascunhos ou sugestão de decisão. Itens sem conferência e justificativa não podem ser enviados.

## Implementação

- Nova migração `supabase/migrations/20261017210000_cc_pilot_measure_editorial_batch_phase3i5.sql`, aplicada no Supabase como `cc_pilot_measure_editorial_batch_phase3i5_cloud`. Cria a RPC `cc_decide_pilot_measure_drafts_batch(p_items jsonb)`.
- RPC `SECURITY DEFINER`, `search_path=''`, execução apenas para `authenticated` e verificação `auth.uid()` + `cc_is_admin()`. Aceita **1 a 5** objetos JSON distintos, exige identidade do ingrediente, texto, carimbo de versão, quantidade, unidade, nome estruturado, decisão e justificativa.
- **Reutiliza a função individual já homologada** `cc_decide_pilot_measure_draft` para cada objeto. Logo, para cada item verifica que a receita continua no piloto, o texto original não mudou, o registro ainda é `draft` e a versão/proposta não foi modificada após a prévia. Cada decisão recebe seu evento de histórico individual.
- As alterações são **atômicas**: erro, versão desatualizada ou falta de autorização em qualquer item cancela o lote inteiro. Itens são processados em ordem fixa para reduzir conflitos entre administradores.
- `src/lib/pilotEditorialBatch.ts`: função pura `collectEditorialBatch` para construir somente a seleção explicitamente conferida, verificar número máximo de cinco, fonte, status, versão, quantidade, decisão e nota.
- `src/PilotMeasureEditorialReview.tsx`: após a revisão individual existente, novo painel **Revisar até 5 rascunhos de uma vez**, exibindo os rascunhos carregados, checkbox, escolha de ação e nota própria para cada um. O botão final fica desabilitado sem conferência completa.
- `src/styles.css`: apresentação responsiva (duas colunas em desktop, uma no celular).
- `scripts/test-pilot-editorial-batch.mjs`, acessível com `npm run test:editorial-batch`: cobre seleção de até cinco, duas decisões distintas, notas por item, seleção vazia, ação ausente, nota curta, ingrediente repetido, rascunho não elegível e fonte/versão incompletas.

## Testes de banco executados — todos com ROLLBACK

1. Criados **dois rascunhos transitórios** (`150 g de fraldinha` e `4 colheres (sopa) de semente de girassol`) dentro da transação com a RPC da Fase 3I.3.
2. A nova RPC processou uma **confirmação** e uma **devolução** em um mesmo lote; foram verificados os novos estados e **dois eventos separados** dentro da transação.
3. Repetir a decisão foi rejeitado; IDs duplicados no lote foram rejeitados; simulação de conta autenticada não administradora foi rejeitada.
4. Em novo teste transacional, forçou-se uma **versão desatualizada no segundo ingrediente** após o primeiro válido. A RPC cancelou as duas operações, **sem mudança parcial no estado nem inclusão parcial no histórico**.
5. Um lote vazio foi rejeitado. Ambos os ensaios foram revertidos integralmente com `ROLLBACK`, portanto **nenhuma decisão simulada se tornou permanente**.

## Proteções e limites

- Decisões continuam **editoriais e culinárias**, não constituem validação médica, nutricional ou alergênica.
- Uma medida `confirmed` não autoriza alteração em `recipes`, `recipe_ingredients`, `planned_meals`, fotos, cálculos de porções, lista de compras, nutrição ou recomendações automáticas.
- A medida de azeite de dendê já confirmada não foi acessada nem alterada pelos testes.
- Somente rascunhos já existentes e conferidos podem ser decididos em lote. A análise das 1.072 expressões pendentes ainda requer preparação em rascunho, e **nenhum desses 1.072 foi automaticamente aprovado**.
- O código da nova interface **ainda não passou por `npm run build` no Windows**. O teste SQL e a inspeção estática não substituem a compilação do React/TypeScript.
- Os resultados de testes das fases anteriores não precisam ser repetidos.
- PR #16 permanece aberto em draft e não será mesclado sem validação.

## Homologação nova e suficiente

No PowerShell da branch indicada, executar **uma vez**:

```powershell
git pull --ff-only
npm run build
npm run test:editorial-batch
```

No `localhost:5173`, entrar em **Administração → Receitas oficiais → Medidas das receitas autorais · inventário e revisão → Conferência editorial dos rascunhos → Revisar até 5 rascunhos de uma vez**.

Como o único rascunho real já foi confirmado na Fase 3I.4, o resultado esperado inicialmente é a **mensagem de fila vazia**, não cinco cartões. **Não criar rascunhos artificiais nem confirmar nada apenas para forçar a demonstração visual.** Primeiro basta validar a compilação e a mensagem de fila vazia; a revisão em lote será testada funcionalmente depois que houver novas propostas reais preparadas e conferidas.

As migrações já foram aplicadas no Supabase; não executar SQL manualmente no projeto.

## Homologação visual da fila vazia e identificação das receitas — 17/10/2026

Captura de `localhost:5173` confirma a seção **Revisar até 5 rascunhos de uma vez**, com a mensagem **Não há rascunhos aguardando decisão**, contagem `0 de 5` e botão de registro desabilitado. O histórico mostra uma decisão anterior e a fila principal apresenta 1.072 pendentes. A Fase 3I.5 está **homologada visualmente para fila vazia**; o envio efetivo de lote com vários rascunhos permanece não testado pelo usuário. Build e `test:editorial-batch` da versão `d78d895` já foram aprovados no Windows.

**Correção preventiva na prévia anterior (3I.3):** ingredientes iguais podem ocorrer em muitas receitas. Para permitir conferência da ocorrência certa, cada candidato ao lote de rascunhos agora exige vínculo com título de receita e posição do ingrediente. A prévia passa a mostrar **Receita: [título] · ingrediente [posição]**, além do texto e da medida proposta; o diálogo de confirmação relaciona explicitamente cada ocorrência selecionada. Candidatos sem identidade completa não são apresentados. Foram acrescentados testes de regressão para a presença desses dados. O inventário e as receitas não foram alterados.

**Próxima validação, sem repetir as anteriores:** sincronizar branch, executar `npm run build` e `npm run test:measure-batch` apenas para a correção nova. Depois de clicar `Analisar todos os ingredientes`, verificar uma captura da prévia agora identificada por receita. Nenhum rascunho deve ser salvo antes dessa conferência. PR #16 permanece draft, sem merge.


## Build Windows do ajuste de identificação — 17/10/2026

O responsável executou `git pull --ff-only` no PowerShell: fast-forward de `d78d895` para `2c43d3b`, sem conflitos.

- `npm run build` **APROVADO**, `tsc -b && vite build`, Vite 6.4.4, **1.650 módulos transformados**, **8,68 segundos**, nenhum erro TypeScript.
- Asset CSS: `index-Hc7obCDk.css` 62,44 kB (gzip 12,98 kB). Asset JS: `index-DYmBr8mG.js` 539,18 kB (gzip 152,72 kB). Aviso de chunk >500 kB é não bloqueante.
- `npm run test:measure-batch` **APROVADO**: `OK: prévia de até 20 propostas identificadas por receita e posição, sem aprovar nem gravar.`

**Status:** correção preventiva de identificação por receita e posição passou no build local e no teste automatizado. **Ainda falta exclusivamente a validação visual no localhost**, clicando em `Analisar todos os ingredientes` e capturando a prévia onde cada ocorrência apresenta o nome da receita e o número do ingrediente. **Não salvar nenhum rascunho nesta conferência.**

Registro apenas documental; não há motivo para repetir Git, build ou testes já aprovados.

## Identificação visual por receita e posição homologada — 17/10/2026

O responsável enviou uma captura de `localhost:5173`, **Administração → Medidas das receitas autorais → Preparar até 20 rascunhos de medidas simples**, já atualizada para o commit `2c43d3b` (build e `test:measure-batch` aprovados e registrados anteriormente).

**Validação visual confirmada:** cada cartão identifica o **nome da receita**, **número do ingrediente na receita**, texto fonte e proposta estruturada. Exemplos das primeiras ocorrências de `1 cebola`: **Bife à rolê com bacon, cenoura e couve refogada · ingrediente 8**, **Caldo verde sem batata · ingrediente 2**, **Caneca de caldo de ossos (brodo) com gengibre e cebolinha · ingrediente 2**. Todos os checkboxes exibidos estão desmarcados, e o botão `Revisar e salvar 0 como rascunhos` está desabilitado. Nenhuma gravação decorre da simples prévia.

**Consulta ao Supabase somente leitura:** as três ocorrências `1 cebola` citadas estão `pending`, sem quantidade estruturada gravada. Os índices internos de origem são 7, 1 e 1, exibidos na interface como ingredientes 8, 2 e 2. As três são candidatas a **rascunho, não aprovação**; a confirmação posterior dependerá de revisão explícita por receita.

**Status:** identidade receita/posição, apresentação de proposta e trava de seleção vazia **homologadas visualmente**. Nenhum rebuild adicional precisa ser solicitado. Próximo teste elegível: selecionar apenas essas três ocorrências distintas de `1 cebola`, conferir a identificação completa no diálogo e gravar **somente rascunhos** mediante confirmação do responsável; depois auditar que exatos três registros passaram de `pending` a `draft`, com as 1.069 outras pendentes e um `confirmed` anterior preservado. Não acionar aprovação editorial nesse primeiro momento e não selecionar 20 opções de uma vez. **PR #16 segue draft, sem merge.**


## Primeiro lote real de três rascunhos — 17/10/2026

O responsável selecionou três ocorrências distintas do ingrediente **`1 cebola`** na interface de prévia 3I.3, confirmou o diálogo nativo **`Salvar 3 medidas como RASCUNHO editorial?`** e informou que realizou o salvamento.

A captura do diálogo lista precisamente as três origens:

| Receita | Posição apresentada | Fonte original | Proposta |
|---|---:|---|---|
| Bife à rolê com bacon, cenoura e couve refogada | 8 | `1 cebola` | quantidade 1, unidade `cebola`, ingrediente `cebola` |
| Caldo verde sem batata | 2 | `1 cebola` | quantidade 1, unidade `cebola`, ingrediente `cebola` |
| Caneca de caldo de ossos (brodo) com gengibre e cebolinha | 2 | `1 cebola` | quantidade 1, unidade `cebola`, ingrediente `cebola` |

**Auditoria SQL somente leitura após o clique, independente da captura:**

- As três ocorrências exatas passaram a `review_status='draft'`, cada uma com `proposed_quantity=1.0000`, `proposed_unit='cebola'` e `proposed_ingredient='cebola'`. `reviewed_at` está `NULL` nos três rascunhos, como esperado.
- Nos três `recipe_ingredients` originais, `name='1 cebola'`, `quantity IS NULL` e `measure_mode='unspecified'`. A ação não estruturou nem sobrescreveu o ingrediente original.
- Inventário global: **1.073** registros = **1.069 pendentes**, **3 rascunhos**, **1 confirmado** anteriormente e **0** em revisão manual.
- A única medida `confirmed` permanece `1 colher (chá) de azeite de dendê`, em `Moqueca de peixe com arroz de couve-flor`, com responsável e data preservados; receita continua não publicada.
- `cc_pilot_measure_review_events` possui **1** evento, da confirmação anterior. Salvar propostas como rascunho no fluxo 3I.3 não cria eventos de **decisão de aprovação**.
- **0** divergências entre `source_text` do inventário e `recipe_ingredients.name` do catálogo.

**Resultado:** o salvamento real de **três** rascunhos identificados por **receita/posição** está **HOMOLOGADO**, sem necessidade de repetir o teste.

**Próxima etapa:** utilizar `Conferência editorial dos rascunhos → Revisar até 5 rascunhos de uma vez`. O responsável deve conferir as três propostas separadamente, marcar a revisão de cada uma, escolher conscientemente **confirmar** ou **devolver** e registrar uma justificativa individual; o envio final exige confirmação com a relação completa. Nenhuma medida será confirmada automaticamente.

**Atenção de UX não bloqueante:** o diálogo da prévia mostra a construção redundante `1 cebola de cebola` porque concatena unidade e ingrediente em linguagem natural. Os campos do banco estão corretos; eventual ajuste de texto deve ocorrer separadamente, sem modificar fonte, quantidade ou a unidade estruturada. Não exigir mais builds nesta homologação documental.

PR #16 permanece **aberto, draft, sem merge**. Não houve publicação comercial, revisão clínica ou liberação de nutrição, alergênicos, compras ou redimensionamento.


## Correção de atualização entre seções após salvar rascunhos — 18/10/2026

O responsável salvou **três** ocorrências de `1 cebola` em receitas distintas (Bife à rolê com bacon, Caldo verde sem batata, Caneca de caldo de ossos) e enviou captura da tela pós-salvamento. A mensagem da seção anterior informava `3 rascunhos salvos` e a fila pendente contava **1.069**, porém a seção separada `Conferência editorial dos rascunhos` ainda apresentava **`Nenhum rascunho disponível`** e `0 de 5`.

**Diagnóstico:** não era falha de persistência. Consultas de Supabase confirmaram **1.073** registros = **1.069 `pending` + 3 `draft` + 1 `confirmed`**, com um evento histórico e zero divergências nos textos originais. A tela `PilotIngredientMeasureReview` recarregava somente sua própria fila após gravar; `PilotMeasureEditorialReview` usava `useEffect(...,[])` e não recarregava no mesmo ciclo do componente. O botão `Atualizar rascunhos` recarrega manualmente sem necessidade de novo salvamento.

**Correção preventiva implementada:**

- `src/PilotIngredientMeasureReview.tsx`: novo contador `editorialRefreshKey` atualizado **apenas após RPC bem-sucedida** de gravação em lote ou edição individual. A instância de `PilotMeasureEditorialReview` passa a receber `refreshKey`; decisões editoriais concluídas acionam atualização da fila principal e invalidam a prévia potencialmente obsoleta.
- `src/PilotMeasureEditorialReview.tsx`: o efeito de carregamento passa a observar `refreshKey`; operações individuais ou em lote concluídas avisam o componente pai por `onDecisionSaved`. O botão `Atualizar rascunhos` continua disponível como recurso manual.
- Não foi necessário modificar migração ou SQL. **Nenhuma decisão editorial automática** é executada pelos callbacks.
- Conferência estática remota confirma ligação entre estados, callback e invalidadores; **ainda faltam build e homologação no Windows**.
- O cadastro dos três rascunhos já está homologado. **Não refazer a gravação desses ingredientes.** Não aprovar nenhuma medida apenas para testar sincronização.

**Próximo passo suficiente:** `git pull --ff-only`, `npm run build` uma vez. Na aplicação aberta, a seção de conferência deverá carregar automaticamente os três rascunhos ao montar, com controles inicialmente desmarcados. Enviar uma captura dessa seção (sem selecionar, aprovar nem devolver por enquanto). Em lote futuro, a sincronização automática após gravação poderá ser testada sem trabalho duplicado. Não repetir testes anteriores de fotos, cardápio, compras, categorização ou confirmação de azeite de dendê.

PR #16 continua aberto em draft, sem merge. A mudança é exclusivamente no fluxo do frontend e nesta documentação.

## Build Windows da sincronização — 18/10/2026

O responsável atualizou a branch `feat/revisao-alergenos-fase1-12out2026` por `git pull --ff-only`, fast-forward de `2c43d3b` para `f47b3db`, sem conflitos. O `npm run build` **passou**, com `tsc -b && vite build`, Vite **6.4.4**, **1.650 módulos** transformados e **17,18 segundos**. Saídas: `index-Hc7obCDk.css` (62,44 kB; gzip 12,98 kB), `index-DeKnmeRX.js` (539,44 kB; gzip 152,82 kB). Aviso de chunk acima de 500 kB não é erro de compilação.

**Resultado:** sincronização de código e build local **homologados**. A correção funcional de recarregamento automático entre o salvamento e o painel editorial **ainda exige captura visual** da seção com os três rascunhos reais já persistidos. Não pedir nova gravação ou novo build e não confirmar os ingredientes apenas para testar o carregamento. PR #16 segue aberto em draft, sem merge.
