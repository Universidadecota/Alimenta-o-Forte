# Fase 3Q — auditoria de consistência das três receitas com molho (30/10/2026)

**Escopo:** revisão auditável, somente leitura, no piloto privado. Não modifica ingredientes, medidas, preparo, fonte, lista de compras, nutrição, alergênicos, RLS ou publicação. Todas as três receitas permanecem publicadas=false; direitos comerciais das fontes ainda estão em pending_review.

## Fotografia confirmada no Supabase

| Receita | Porções da refeição | Ingredientes | Quantidades estruturadas | Ponto de atenção |
|---|---:|---:|---:|---|
| Bolinhos de salmão com maionese caseira e salada de pepino | 1 | 16 | 0 | Maionese preparada separadamente; rendimento e quantidade consumida não especificados |
| Caesar sem queijo, com frango | 1 | 15 | 0 | Molho Caesar tem rendimento próprio de 2 a 3 porções conforme a fonte |
| Salada de ovos em canoas de endívia | 1 | 14 | 0 | Salada usa uma colher de sopa de maionese, cuja receita auxiliar rende cerca de meia xícara |
| **Total** | — | **45** | **0** | Não converter ingredientes textuais em cálculo homologado |

A coluna de quantidade estruturada refere-se a `recipe_ingredients.quantity`, não à presença de números no texto em `name`. Os 45 registros estão `quantity=NULL`, `unit='un'`, `measure_mode='unspecified'` no retrato auditado; textos como `150 g`, `¼ de xícara` e `½ limão` continuam preservados. Nenhuma quantidade automática foi aprovada.

## Verificações por preparo
**Bolinhos de salmão:** a fonte prevê salmão cozido ou enlatado, endro ou cebolinha e duas ocorrências de suco de meio limão (massa e maionese). A quantidade do molho consumida versus produzida ainda não está definida. A preparação de gema sem cocção continua bloqueada para aprovação, com alternativa pasteurizada proposta na fase 3P.

**Caesar:** a refeição é de 1 porção, enquanto o molho auxiliar declara rendimento de 2 a 3 porções. Gema, anchovas, óleo de abacate ou azeite suave e água condicional compõem o molho. Pimenta aparece tanto no tempero da proteína quanto no molho. Não contabilizar o rendimento inteiro como consumido por uma pessoa sem revisão.

**Canoas de endívia:** a salada emprega 1 colher de sopa de maionese caseira, enquanto a receita do molho rende cerca de ½ xícara. O cadastro inclui tanto a maionese pronta quanto ingredientes da receita auxiliar; é necessário evitar dupla contagem no orçamento e na lista de compras. Manter separados dois usos de suco de meio limão. A fonte cita conservação de 2 dias de uma maionese com gema sem cocção: essa orientação não está homologada.

## Ingredientes para revisão dos alertas de alergia
- Bolinhos: ovo e salmão (peixe); conferir substituições, origem de produtos e contato cruzado.
- Caesar: ovo, anchovas (peixe) e gergelim; conferir bacon e contato cruzado.
- Canoas: ovos em duas partes da preparação e aipo; conferir restrições individuais e opções de ingredientes.

**Atenção:** esta identificação de ingredientes não é uma classificação regulamentar completa de alergênicos, não conclui ausência de risco e não substitui revisão especializada. As regras atuais de preferências e alertas de alergia não foram modificadas.

## Proteções de implementação
A nova seção fica dentro da prévia administrativa **Examinar fonte → Proposta editorial de preparo mais seguro**. Apresenta contagem real de ingredientes, total de medidas estruturadas pendentes, porção cadastrada, contradições de rendimento e ingredientes a conferir para alertas de alergia. Não dá permissão de publicação nem de alteração.

A auditoria só é exibida quando correspondem **todos** os dados auditados: receita e não publicação, ID e hash de origem, texto completo da fonte, indicação de rendimento, contagem, nome/posição de cada ingrediente, valores nulos de quantidade, unidade e medida. Se a fotografia divergir, as conclusões sobre quantidades e rendimento são ocultadas. A prévia das instruções da fase 3P tem uma verificação separada e permanece não homologada.

`npm run build` deve executar os dois scripts `test:sauce-safety` e `test:sauce-audit` antes de TypeScript/Vite. Testes incluem textos alterados, posição duplicada, quantidade alterada, fonte alterada, receita publicada e total de ingredientes incorreto.

## Próxima decisão editorial
Definir como representar ingredientes de molhos auxiliares e quanto deles é consumido: separar rendimento da receita principal e do subpreparo, bloquear somas automáticas potencialmente duplicadas e avaliar regras seguras de compra e nutrição. Nenhuma migração de dados ou autorização para publicação integra esta fase.
