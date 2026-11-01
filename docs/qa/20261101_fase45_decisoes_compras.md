# Costa&Costa — Fase 45: escolhas e opcionais na lista de compras
01/11/2026 · piloto interno · homologação visual pendente

## Comportamento
- Escolher opção virou editor explícito: a pessoa informa qual alternativa da receita decidiu comprar. Não se separa automaticamente termos como "em água ou azeite" nem se estima quantidade.
- Opcional permite Incluir, Não incluir e Limpar decisão, com estado pendente quando nenhuma escolha foi feita.
- Decisões se associam a usuário, semana e identidade da entrada original. Não são compras e não alteram a chave do checkbox de leite de coco.
- A classificação, as 21 refeições, os dados das receitas, alergênicos, tamanho da família e porções permanecem intocados.
- Decisão aparece na tela, no texto copiado e no novo PDF; PDFs salvos anteriormente não são alterados.
- Entradas obsoletas deixam de aparecer se sua identidade deixa de existir no cardápio; não são excluídas automaticamente do histórico.
- A decisão é informativa; ainda é preciso conferir rótulo, rendimento e segurança alimentar.

## Persistência e segurança
- Supabase Costa&Costa Alimentação Forte: migração 20261101183756_cc_shopping_decisions_phase45.sql já aplicada.
- Tabela public.cc_shopping_decisions, chave (user_id,week_start,item_key), kind (choice/optional), choice_text e included.
- RLS ativa com quatro políticas por operação usando (select auth.uid())=user_id; acesso anon bloqueado.
- A aplicação usa sessão autenticada; não reutiliza seleções entre contas ou semanas; impressão/cópia ficam bloqueadas durante a consulta.
- Não altera recipes, planned_meals, shopping_lists ou shopping_list_items.

## Testes e garantia
- npm run test:shopping-decisions integra npm run build.
- Testes de chave, classificação, texto vazio, estados de opcional, impressão segura e preservação da fonte.
- SQL pós-migração: RLS=true, quatro políticas, anon sem SELECT/INSERT, 21 refeições e marcação de leite de coco preservadas.
- Exige aprovação no GitHub CI e Vercel preview READY antes da incorporação à main.

## Homologação visual
1. Acessar o preview com a conta do piloto; Compras, semana 02–08/11/2026.
2. Escolher azeite na alternativa banha ou azeite; atualizar a página e conferir persistência.
3. Definir um opcional Não incluir e outro Incluir; recarregar.
4. Gerar novo PDF e conferir decisões e receitas de origem.
5. Confirmar que leite de coco ainda está comprado, 16 ovos seguem em conferência e nenhuma quantidade foi somada automaticamente.
6. Conferir conta distinta, sem acesso às decisões do primeiro usuário.
7. Navegar entre semanas para verificar isolamento.
8. Limpar decisão e verificar retorno ao estado pendente.

Sem lançamento comercial e sem homologação nutricional nem de alergênicos.
