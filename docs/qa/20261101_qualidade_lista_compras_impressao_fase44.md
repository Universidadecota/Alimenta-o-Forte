# Costa&Costa — Fase 44: precisão editorial e legibilidade da lista de compras
**01/11/2026 · Uso interno, sem liberação comercial**

## Base para a melhoria
O usuário homologou visualmente a lista de compras para 02 a 08/11/2026 e enviou um PDF de cinco páginas. A tela exibia 18 medidas consolidadas, 95 entradas de conferência e 12 alternativas/opcionais. A marcação de **1¼ xícaras de leite de coco** permanecia salva após atualizar a página e aparecia no PDF.

Foram identificados:
- Textos quase colados nas referências incompletas e nas alternativas/opcionais (ingrediente, número de usos, decisão, receita).
- `2 xícaras de chá` tratadas como quantidade consolidada, embora `1 xícara de chá.` não defina de modo inequívoco um produto de supermercado.
- `16 ovos` exibidos como soma sem a distinção de outras entradas de ovos cozidos e gemas. Isto NÃO autoriza concluir que 16 são os ovos totais para a semana.
- Pitadas e punhados são contáveis na expressão original, mas não definem unidades de compra padronizadas.
- O PDF era funcional, porém poderia ser mais compacto e legível.

## O que mudou
**Sem migração SQL e sem gravação.** `src/lib/shoppingReviewGroups.ts` passou a classificar conservadoramente:
- Chá genérico sem produto definido para **Referências incompletas** (não há checkbox).
- Soma de ovos simples, quando existem entradas separadas para gema/ovo cozido/frito/mexido, para **Conferir antes de comprar**, mantendo seu subtotal original como referência, sem dobrar nem descontar nada.
- `pitada(s)` e `punhado(s)` para **Conferir antes de comprar**, sem converter em peso/volume.
- `1¼ xícaras de leite de coco` permanece em **Medidas consolidadas**, com a chave original do item comprado.
- Todas as entradas preservam sua identidade e os textos da fonte: a mudança atua somente na classificação visual.

**`src/ShoppingListSections.tsx` + `src/styles.css`:** título, observações, referências às receitas e status de cada alternativa/opcional passam a linhas independentes, com quebra automática e acessibilidade em telas pequenas. As referências incompletas também recebem status e receita de origem separados.

**`src/lib/weeklyPrint.ts`:** grupos impressos exibem aviso específico quando uma soma é apenas parcial; alternativas e referências incompletas ganham cartões de conteúdo com quebras apropriadas, legíveis em duas colunas; CSS da página de compras reduz espaçamento em impressão, sem alterar o formato de cardápios e fichas.

## Garantias
- Não alterar as 21 refeições de 02–08/11/2026, as fontes do acervo, quantidades, rendimentos, alergênicos, aprovação editorial ou contas.
- Não alterar a função `purchaseKey`, a persistência `shopping_list_items`, as chaves ou a marcação do leite de coco; manter `completed=true`.
- O total de itens deve ser preservado entre os grupos; alterar somente a categoria de exibição.
- **Não** reconciliar ovos cozidos, gema, ovos simples ou chá genérico automaticamente. Os totais continuam sem redimensionamento para dois moradores.
- Continuar identificando o risco de receitas com ovo cru e prazos de conservação sujeitos a revisão.
- O agrupamento da tela, da cópia para área de transferência e do PDF compartilha `groupShoppingForReview`.

## Verificações
- `scripts/test-shopping-precision-print.mjs`: teste com leite de coco, 16 ovos + gema/ovo cozido, chá genérico, pitadas, punhados, opcionais e referência incompleta; preservação integral das fontes e número de itens; HTML da impressão gerado sem valores inválidos.
- O novo teste faz parte de `npm run build`, além dos testes já existentes.
- **Homologação visual necessária após deploy:** tela Compras deve separar título, orientação e receita nos opcionais; o leite de coco continua marcado. Salvar o PDF e revisar a quebra das alternativas. O usuário pode desativar cabeçalhos e rodapés do navegador para ocultar `about:blank`.
- Nenhum PDF anteriormente salvo é atualizado automaticamente; é necessário imprimir novamente após o deploy.

## Limites
Um subtotal literal não equivale necessariamente ao total de itens para comprar. A soma definitiva de ovos, bebidas, ingredientes alternativos e porções exige revisão humana dos textos originais. Não há alegação de que as receitas estejam nutricional ou comercialmente homologadas.
