# Costa&Costa — Fase 3I.3 | Rascunhos editoriais em lotes controlados

**Data:** 17/10/2026  
**Branch:** `feat/revisao-alergenos-fase1-12out2026`  
**PR #16:** manter aberto em **draft**, sem merge.

## Contexto homologado, não repetir

A pré-análise anterior (3I.2) foi validada visualmente no `localhost:5173`: **1.073** fragmentos preservados, distribuídos em **468** medidas identificadas, **9** faixas, **57** alternativas, **40** preparos compostos, **5** opcionais e **494** expressões para revisão manual. Build TypeScript da 3I.2 já aprovado; testes do classificador puro já passaram. Não solicitar novas provas desses mesmos resultados.

## Objetivo da Fase 3I.3

Evitar a edição individual de centenas de entradas simples **somente para criar rascunhos**. As propostas continuam exigindo conferência editorial futura. Nem as 468 medidas classificadas como simples são consideradas verificadas; a prévia elegível pode excluir entradas que não cabem com exatidão em `numeric(12,4)` ou ultrapassam limites do banco.

## Mudanças implementadas

### Supabase

Migration `supabase/migrations/20261017190000_cc_pilot_measure_batch_drafts_phase3i3.sql`, aplicada remotamente como `cc_pilot_measure_batch_drafts_phase3i3_cloud`.

Função `public.cc_save_pilot_measure_drafts_batch(p_items jsonb)` com `SECURITY DEFINER`, `search_path=''`:

- exige sessão autenticada e `cc_is_admin()`; `EXECUTE` é concedido somente a `authenticated` e há checagem de administrador dentro da função;
- aceita **de 1 a 20** entradas diferentes, com JSON tipado, UUID, texto fonte, número positivo, unidade permitida e nome de ingrediente;
- rejeita intervalos, presença de `ou` como palavra inteira, instruções opcionais e descrições com subtítulos explícitos; demais ambiguidades continuam sujeitas à revisão humana;
- compara `source_text` literalmente com a fonte imutável, verifica `recipe_ingredients.name`, vínculo à receita, ordem do ingrediente e `use_stage='personal_pilot'`; não aceita receita piloto publicada;
- exige `review_status='pending'`, sem quantidade/unidade/ingrediente previamente propostos;
- bloqueia as linhas da revisão para impedir dois lotes concorrentes de sobrescreverem o mesmo registro;
- grava apenas `proposed_quantity`, `proposed_unit`, `proposed_ingredient`, `review_status='draft'` e nota editorial explicando que o rascunho está pendente; **nunca grava `confirmed`**;
- executa como uma transação do PostgreSQL: se qualquer item falhar, **o lote inteiro é cancelado**; não regrava `recipes`, `recipe_ingredients`, `planned_meals`, nutrição ou Storage.

**Teste SQL transacional (com ROLLBACK):** administrador simulado conseguiu salvar uma proposta de `150 g de fraldinha` como draft; foi verificada a alteração apenas no inventário dentro da transação. Rejeitadas tentativas de gravar o mesmo registro novamente, repetir um item no lote, usar origem adulterada e executar sem permissão de administrador. A transação foi revertida. Consulta posterior independente confirmou **1.073 `pending`**, **0 `draft`** e **0 `confirmed`**; portanto nenhum rascunho real foi antecipado pela homologação técnica.

### Interface de administração

- `src/lib/pilotMeasureBatch.ts`: helper puro `prepareDraftCandidates` filtra apenas propostas simples pendentes, verifica número representável sem arredondamento em quatro casas decimais, nome do ingrediente e limite máximo de 20; ordena o resultado para revisão e não grava dados.
- `src/PilotIngredientMeasureReview.tsx`: depois do clique em **Analisar todos os ingredientes**, a mesma tela abre a prévia dos **próximos até 20 candidatos**, cada um com **checkbox desmarcado por padrão**.
- Ações separadas: **Marcar as visíveis**, **Desmarcar todas**, **Revisar e salvar X como rascunhos**. Sem seleção, o botão de salvar permanece desabilitado.
- Uma mensagem `window.confirm` solicita concordância explícita com o número do lote e reforça que **nenhuma medida será aprovada**. Só depois é feita a chamada à RPC.
- Em caso de sucesso, a tela limpa a análise anterior e recomenda executá-la novamente para o próximo conjunto. Em caso de conflito ou fonte alterada, a RPC cancela a operação e apresenta erro, sem alterações parciais.
- `src/styles.css`: nova prévia responsiva de até duas colunas em desktop e uma coluna no celular.
- `scripts/test-pilot-measure-batch.mjs`: casos de regressão acrescentados para prévia de no máximo 20, exclusão de textos ambíguos ou já revisados e limite de seleção. O teste **não chama Supabase nem salva rascunhos**.

## Limites explícitos

- A prévia não identifica com certeza clínica, nutricional ou alergênica os alimentos, e não transforma rascunho em medida aprovada.
- Expressões com intervalos, escolhas, compostos, opcionais e casos manuais continuam separadas para conferência.
- Mesmo após salvar 20 rascunhos, o aplicativo **não** recalcula receitas, quantidades por porção, listas de compras ou nutrição com base neles.
- O texto original das 119 receitas, suas imagens e o planejamento existente permanecem imutáveis.
- O formato de número aceito segue precisão `NUMERIC(12,4)`. Frações que precisariam de arredondamento não são oferecidas automaticamente.
- A implantação da RPC no banco já foi realizada; não executar a migração manualmente no SQL Editor.
- **Nenhum lote real foi gravado nesta fase**: a funcionalidade foi disponibilizada apenas para testes controlados.

## Homologação ainda pendente no Windows

1. Executar **uma vez**:
   ```powershell
   git pull --ff-only
   npm run build
   npm run test:measure-batch
   ```
2. Em **Administração → Receitas oficiais → Medidas das receitas autorais · inventário e revisão**, clicar **Analisar todos os ingredientes**. Conferir a nova seção **Preparar até 20 rascunhos de medidas simples** e os checkboxes inicialmente desmarcados.
3. **Nesta primeira validação não salvar rascunhos.** Basta conferir visualmente uma prévia de itens. Se desejar testar a gravação real depois, escolher apenas **um ingrediente** explicitamente e confirmar; consultar banco antes/depois e manter o status `draft`.
4. Manter PR #16 aberto em draft até as validações adicionais. Não repetir os testes de fotos, ceias, cardápio, compras e triagem 3I.2 já aprovados.
