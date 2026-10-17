# Costa&Costa — Fase 3I.4 | Conferência editorial individual e trilha de auditoria

**Data:** 17/10/2026  
**Branch:** `feat/revisao-alergenos-fase1-12out2026`  
**PR #16:** manter aberto em **draft**, sem merge.

## Motivação

A Fase 3I.3 foi homologada no navegador e no Supabase: o ingrediente **`1 colher (chá) de azeite de dendê`**, da receita **Moqueca de peixe com arroz de couve-flor**, foi salvo como o **único rascunho**. O inventário tinha **1.073** registros, **1.072** pendentes, **1** draft e **0** confirmados. As 119 receitas piloto não foram publicadas; as expressões originais permaneceram intactas.

A fase atual estabelece uma **decisão editorial humana e individual** sobre rascunhos, com justificativa, confirmação explícita, verificação de fonte, controle de concorrência e histórico privado. Essa decisão **não é parecer médico ou nutricional**, e não integra cálculos de porções, alergênicos, nutrição nem somas de compras.

## Supabase: migração aplicada

Arquivo: `supabase/migrations/20261017200000_cc_pilot_measure_editorial_decisions_phase3i4.sql`  
Migração remota: `cc_pilot_measure_editorial_decisions_phase3i4_cloud`.

- Nova tabela **`public.cc_pilot_measure_review_events`** com histórico de ação, autor, data, estado anterior/novo, texto fonte imutável, propostas antiga/nova e observações. Consulta restrita a administradores via RLS; usuários autenticados comuns **não** têm INSERT/UPDATE no histórico.
- **Edição direta `UPDATE` em `cc_pilot_ingredient_measure_reviews` retirada de `authenticated`**, sem prejuízo da leitura administrativa. A antiga policy de UPDATE foi retirada. Modificações devem ocorrer em funções com checagem de administrador.
- RPC **`cc_save_pilot_measure_draft_single`**: salva ou corrige individualmente rascunhos e encaminha casos para `needs_manual_review`. Exige admin autenticado, receita piloto privada, mesmo texto fonte/posição, valores e notas válidos. Rejeita alterar medida já `confirmed`; registra evento na trilha. `needs_manual_review` exige justificativa e limpa os campos estruturados sem sobrescrever o ingrediente original.
- RPC **`cc_decide_pilot_measure_draft`**: só aceita decisão de um rascunho completo, comparando **ingrediente, texto fonte, atualização, quantidade, unidade e ingrediente extraído** com a prévia apresentada. Rejeita versão desatualizada e confirmação duplicada; exige justificativa editorial de pelo menos oito caracteres. `confirm` marca `confirmed` com `reviewed_by` e `reviewed_at`; `return` envia a `needs_manual_review` e zera propostas, preservando detalhes anteriores na trilha.
- Ambas as RPCs são `SECURITY DEFINER`, com `search_path=''`, `EXECUTE` concedido apenas a `authenticated` e validação explícita de `public.cc_is_admin()`. A RPC em lote da Fase 3I.3 permanece disponível e restrita a rascunhos.

**Observação:** o rascunho de azeite de dendê foi gravado antes da criação do histórico nesta etapa. Sua gravação original consta da nota de revisão da Fase 3I.3; a nova tabela de eventos registra decisões **a partir da Fase 3I.4**.

## Interface atualizada (build ainda não homologado)

- Novo componente `src/PilotMeasureEditorialReview.tsx` dentro de **Administração → Medidas das receitas autorais**, mostrando os até 20 rascunhos mais recentemente atualizados e as últimas dez ações do histórico.
- Botão **Conferir proposta** mostra título da receita, texto original, quantidade, unidade, ingrediente e observações do rascunho.
- Para decidir é obrigatório preencher **justificativa** e marcar a confirmação de conferência humana; os botões ficam desabilitados sem esses controles. `window.confirm` oferece uma última confirmação da receita e do ingrediente.
- **Confirmar medida editorial** significa exclusivamente confirmação da medida culinária proposta; não há qualquer publicação ou cálculo automático após essa ação.
- **Devolver para revisão manual** preserva o conteúdo original, desativa os campos estruturados da proposta e grava a razão no histórico, sem permitir reutilização silenciosa.
- `src/PilotIngredientMeasureReview.tsx` deixou de fazer UPDATE direto; a ação individual foi conectada à nova RPC. Entradas `confirmed` aparecem **somente leitura** na fila.
- `src/styles.css` recebeu disposição responsiva para histórico e campos.
- O botão `Atualizar rascunhos` consulta novamente o banco. A tela de decisões não dispara aprovação na carga inicial.

## Testes de Supabase já executados — **ROLLBACK**

Dois testes SQL transacionais com identidade de admin simulada foram realizados e revertidos:
1. `draft → confirmed`: grava editor, data e um evento de histórico; não altera `recipe_ingredients`; confirmação repetida foi rejeitada; UPDATE direto foi negado; conta comum não executa a RPC.
2. `draft → draft` (correção individual) e `draft → needs_manual_review`: eventos de edição/devolução foram registrados transitoriamente; prévia antiga foi rejeitada por controle de concorrência; proposta da medida devolvida foi esvaziada. **Nenhuma dessas mudanças persistiu**, graças a ROLLBACK.

Após os testes, consulta SQL somente leitura confirmou:

| Indicador | Resultado |
|---|---:|
| Total de medidas | 1.073 |
| Pendentes | 1.072 |
| Rascunhos | 1 |
| Confirmadas | 0 |
| Eventos efetivamente gravados | 0 |
| Divergências de texto fonte | 0 |
| Privilégio UPDATE direto de `authenticated` | Não |
| Privilégio INSERT no histórico para `authenticated` | Não |

## Limites e próximos testes

**Não aprovar efetivamente o azeite de dendê nesta etapa sem o responsável revisar a interface e autorizar a decisão específica.** A programação já disponibiliza os controles, mas ainda requer build Windows e homologação visual antes de ações reais.

1. Executar uma vez, na branch `feat/revisao-alergenos-fase1-12out2026`, `git pull --ff-only` e `npm run build`.
2. No `localhost:5173`, abrir Administração → Receitas oficiais → **Medidas das receitas autorais · inventário e revisão** → **Conferência editorial dos rascunhos**.
3. Confirmar visualmente **Moqueca de peixe com arroz de couve-flor → 1 colher (chá) de azeite de dendê → proposta 1 / colher (chá) / azeite de dendê**. Abrir `Conferir proposta` sem digitar justificativa, marcar a caixa ou decidir ainda; enviar captura da tela.
4. Depois de verificar a interface, decidir se a medida pode ser confirmada editorialmente ou precisa ser devolvida. A decisão real depende de nova confirmação do responsável e não deve ser inferida do teste do fluxo.
5. **Não repetir** builds das fases anteriores, fotos, compras, cardápios, análise em lote ou a gravação inicial do único rascunho.

**PR #16:** permanece aberto em rascunho e sem merge. Nenhuma alteração foi feita nos textos das 119 receitas.


## Regressão do lote e verificação final

Após restringir o UPDATE direto de `authenticated`, foi executado um **teste SQL transacional adicional**, usando um ingrediente simples e ainda pendente: `150 g de fraldinha`. A RPC anterior `cc_save_pilot_measure_drafts_batch` continuou salvando corretamente **um** draft na transação, mesmo com o novo bloqueio de atualização direta. O teste foi finalizado com `ROLLBACK`, preservando o inventário real.

Verificação estática no GitHub confirma:
- componente novo conectado à Administração, sem chamadas frontend de UPDATE direto;
- RPC individual para edição de rascunho e RPC de decisão com fonte e versão conferidas;
- obrigação de confirmação humana antes da ação e histórico administrativo;
- entradas `confirmed` sem opção de reedição via interface;
- documentação e estilos presentes, PR #16 mantido aberto em draft.

**Situação real após os testes:** **1.073** registros, **1** draft, **1.072** pendentes, **0** confirmados, **0** eventos permanentes na nova trilha, pois nenhuma decisão real ocorreu ainda. O build novo **ainda não foi executado no Windows**; a homologação técnica de SQL não substitui a inspeção visual do frontend.

**Atenção:** dados confirmados editorialmente não podem ser reeditados pelo administrador nessa primeira versão. Uma futura correção de parecer precisará de uma ação específica auditada, não da atualização direta da tabela. Não utilizar esta fase para validar alimentos em relação a alergias ou calcular valores nutricionais.
