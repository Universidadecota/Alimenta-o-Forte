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
