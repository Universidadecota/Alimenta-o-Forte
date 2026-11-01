# Costa&Costa — lista de supermercado organizada por grau de revisão
**01/11/2026 · Produção técnica em desenvolvimento · alteração de apresentação, sem migração SQL**

## Contexto e comprovações anteriores
A conta comum interna gerou **21 refeições distintas** para a semana de **02 a 08 de novembro**, usando o acervo autorizado. A lista resultante exibiu **125 entradas originais do piloto**. O usuário confirmou nas capturas que **1¼ xícaras de leite de coco** (duas ocorrências, sem escalonamento para os ocupantes da residência) permanecia marcado como comprado após recarregar. O Supabase confirmou **uma lista persistida, um único item registrado e um item `completed=true`**, conservando a chave original `piloto · xicara|leite de coco · 2 usos · total 1.25` e a quantidade `2`, que representa usos e não 2 xícaras.

## Objetivo
Distinguir com clareza:
1. **Medidas consolidadas**: ingredientes estruturados + soma de expressões literais equivalentes do piloto. A expressão consolidada é **referência original**, não quantidade homologada para comprar nem rendimento ajustado. O checkbox e a identidade persistida continuam iguais.
2. **Conferir antes de comprar**: ingredientes sem quantidade confiável, expressões compostas ou incompletas. As referências que não correspondem a produtos claros são mostradas separadamente dentro deste grupo, sem caixa para marcar como comprado.
3. **Alternativas e opcionais**: expressões contendo escolha explícita, ingredientes opcionais e anotações a gosto. São listados como decisões; não recebem quantidades inventadas nem novas caixas de compra.

## Código
- `src/lib/shoppingReviewGroups.ts`: agrupamento puramente funcional de `shopping`, `pilotShopping` e `shoppingNotes`, sem alterar objetos de entrada ou a função de agregação.
- `src/ShoppingListSections.tsx`: três seções acessíveis com títulos e avisos, preservando texto original, fragmentos, número de utilizações e nomes das receitas de origem. Apenas entradas que fazem sentido como item de lista continuam com checkbox de compra.
- `src/App.tsx`: utiliza o componente e copia a lista para a área de transferência com a mesma ordem dos três grupos. **Não altera** `togglePurchased`, `savePurchasedItem`, `loadPurchasedKeys` ou as chaves `purchaseKey`.
- `src/lib/weeklyPrint.ts`: mesmo agrupamento para impressão e PDF, preservando as marcações nos itens efetivamente compráveis e os agrupamentos conservadores já existentes de tomate, pepino, cebola etc. Não converte unidades.
- `scripts/test-shopping-review-groups.mjs`: verificação de classificação exclusiva e completa, imutabilidade, preservação do objeto/leite de coco, procedência, três seções na UI/PDF e ausência de operações de gravação. Adicionado à compilação obrigatória.

## Invariantes importantes
- Nenhum `UPDATE`/`INSERT`/`DELETE` foi executado no Supabase.
- Nenhuma receita, ingrediente, quantidade, rendimento, usuário, alergênico, direito comercial, cardápio ou compra é modificado por esta entrega.
- A fonte original continua identificada; a UI não escolhe entre `ou` nem confunde número de usos com quantidade nutricional ou de mercado.
- O registro do leite de coco comprado permanece associado à **mesma chave**; só mudou a seção de apresentação.
- A lista não constitui prescrição de dieta nem certificação de segurança alimentar. Preparos de ovo cru e outros casos sensíveis permanecem sujeitos à revisão.

## Homologação após deploy
1. Abrir Compras com a conta comum, na semana de 02–08/11/2026. Verificar os três grupos e a contagem completa das entradas.
2. Verificar que o **leite de coco** permanece marcado, com 1¼ xícaras e 2 utilizações; pressionar Ctrl+F5 e confirmar.
3. Abrir **Imprimir lista / Salvar PDF**. As três seções e suas referências deverão corresponder ao que aparece na tela.
4. Confirmar que alternativas, trechos incompletos e opcionais são identificados e não têm quantidades inventadas.
5. Checar o Supabase somente leitura: lista da semana e marcação original permanecem com `completed=true`.

**Limite da homologação:** os testes CI e a análise estrutural não substituem o teste visual em navegador com a sessão do usuário. Não fazer redimensionamento automático das receitas pendentes nesta etapa.
