# Costa&Costa — Fase 47: triagem das pendências de precisão

## Situação
Implementação em branch isolada; homologação de prévia pendente. O domínio oficial permanece na Fase 46.

## Meta
Transformar o grande grupo "Conferir antes de comprar" em uma **fila editorial de conferência**. Não se trata de resolver automaticamente ingredientes, unidades, rendimentos, porções ou alergênicos, pois a fonte não permite essas conclusões.

## Mudanças
- Novo painel antes das listas de compra: "Pendências para conferir antes de comprar".
- Classificação conservadora e sem falsas pendências das referências piloto. A Fase 46 permanece responsável por apresentar medidas literais explícitas (por exemplo, 1 cebola e ½ abacate), que **não** são tratadas como quantidade ausente na Fase 47. Prioridades:
  1. **Texto ou referência incompleta**: separar trechos sem produto identificado (ex.: xícaras de chá), preparos caseiros complementares que exigem consulta à receita (ex.: maionese caseira) e trechos ambíguos.
  2. **Escolha ou opcional pendente**: só se ainda não houver decisão explícita da Fase 45 para a semana e chave atuais.
  3. **Medida ou rendimento a conferir**: subtotal de ovos, medidas subjetivas e ingredientes sem medida literal. A expressão '1 abacate maduro' não é ausência de quantidade; a consolidação de variações permanece no painel da Fase 46.
- Cada pendência informa fonte (nome da receita), motivo e próxima ação, além do fragmento original completo quando disponível.
- Filtros Todos/Texto de origem/Decisões/Quantidades, com 12 referências visíveis por padrão e expansão controlada para listas longas.
- Não retira, reorganiza nem altera a classificação existente da Fase 46, as duas marcações restauradas ou as decisões da Fase 45.
- O PDF da Fase 46 continua com o mesmo conteúdo e layout, sem acrescentar páginas; todas as referências permanecem nas seções existentes.

## Não faz
- Não grava em Supabase; não requer migração e não modifica policies, receitas ou lista persistida.
- Não representa "verificado" ou "autorizado" um item comprado; o status de compra é independente da revisão editorial.
- Não soma medidas incompatíveis, inferências de rendimento familiar, porção, ingrediente ou conversão.
- Não altera aprovação de alergênicos ou segurança nutricional.
- Não cria estimativas para as receitas de origem incompleta.

## Testes
- `npm run test:shopping-phase47` está incluído no build e cobre: priorização, origem e fragmentos, conta das decisões registradas/recusadas, a manutenção de ovos e valores subjetivos, imutabilidade, marcas compradas e HTML de impressão.
- A verificação no banco antes/depois é somente leitura: 21 refeições, leite de coco comprado, azeite comprado e duas decisões registradas para a semana 02–08/11/2026.

## Homologação visual proposta
1. Abrir a prévia, entrar em Compras e localizar "Pendências para conferir antes de comprar".
2. Verificar filtros e contagens; alternar entre categorias e "Mostrar todas"; a ordem começa pelos textos de origem não confiáveis.
3. Confirmar que o trecho "1 xícara de chá." permanece em revisão, não é compra quantitativa e indica sua origem.
4. Verificar o item "16 ovos" e a distinção de preparos de gema e ovos cozidos.
5. Confirmar que "banha de porco ou azeite", já decidido como azeite, e o opcional "água" incluído não são classificados como decisões pendentes. Conferir que "1 abacate", "1 alface" e "1 cebola" não aparecem falsamente como medidas ausentes.
6. Verificar a lista original, mantendo as duas compras marcadas e as 21 refeições.
7. Gerar PDF da semana: deve preservar a impressão da Fase 46 (quatro páginas no teste anterior, sem garantia de paginação idêntica entre navegadores).

**Sem merge/produção antes de aprovação da nova interface.**
