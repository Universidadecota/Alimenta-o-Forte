# Costa&Costa — Fase 3S: modelo isolado de consumo de preparo auxiliar (30/10/2026)

## Propósito
Definir a relação **receita principal → preparo auxiliar → rendimento produzido → quantidade empregada → quantidade física remanescente** antes de introduzir entidades persistentes ou atualizar o planejador e a lista de compras.

A modelagem é **somente de leitura e experimental**. Não atualiza `recipes`, `recipe_ingredients`, `cc_official_recipe_source_records`, RLS, migrações ou relatórios nutricionais. Nunca converte "½ xícara" em colher ou "2 a 3 porções" em quantidade consumida sem evidência editorial validada.

## Fotografia das três receitas
| Receita | Vínculo principal → molho | Fonte do rendimento do molho | Uso na refeição | Situação real |
|---|---|---|---|---|
| Bolinhos de salmão | Bolinhos → maionese auxiliar | Não determinado | Não determinado | Quantificação pendente |
| Caesar sem queijo | Salada → molho Caesar | **2 a 3 porções** conforme fonte, sem unidade validada | Não determinado | Quantificação pendente |
| Salada de ovos em canoas de endívia | Salada → maionese auxiliar | **Cerca de ½ xícara** | **1 colher (sopa) de maionese caseira** | Conversão e rendimento efetivo não homologados |

Todos os ingredientes atuais do lote (45 registros) permanecem com medidas estruturadas pendentes; os textos e IDs são preservados. Nenhuma receita desse lote foi publicada.

## Novo contrato de dados, apenas em código
`src/lib/pilotAuxiliaryConsumptionModel.ts` expõe:
- `buildProposedAuxiliaryLink(recipeId, verifiedPartition)`: monta vínculo sem persistência, reaproveitando **exclusivamente** a partição já auditada na Fase 3R. Em cada vínculo, `batchYield`, `usedAmount` e `leftover` são **nulos**. Campo `duplicatePurchaseRisk` destaca a referência à maionese pronta na salada de ovos, sem somá-la aos ingredientes do próprio molho.
- `simulateAuxiliaryConsumption(link, scenario)`: calcula **somente** um saldo físico hipotético quando duas quantidades numéricas explícitas usam a **mesma unidade** (`g`, `ml`, `unidade`, `porcao`). Não aceita quantidade zero/negativa, não finita, uso acima da produção ou unidade incompatível; não infere medida de texto.
- Independentemente do resultado matemático, `shoppingStatus="blocked"`, `nutritionStatus="blocked"` e `hypotheticalOnly=true`; o retorno nunca significa alimento seguro para consumo posterior ou sobras próprias para armazenar.

## Cenários artificiais do teste
- Lote hipotético com **200 ml** produzidos e **30 ml** usados → diferença física aritmética de **170 ml**. Isto **não** é rendimento de nenhuma das três receitas reais.
- Lote de **200 ml** e uso de **200 ml** → diferença **0 ml**.
- Lote de **200 ml** e uso de **210 ml** → rejeitado.
- Lote de **200 ml** e uso de **2 porções** → rejeitado, sem conversão.
- Quantidades ausentes, zero, negativas, `NaN`, infinito e unidades inteiras fracionárias → rejeitadas ou mantidas pendentes.
- Referência na salada de ovos ao molho pronto é mantida como **vínculo**, e não contabilizada como compra adicional de ingredientes já presentes no molho.

## Exibição na Beta
Na página administrativa **Examinar fonte → Proposta editorial → Mapa do prato e preparos auxiliares**, uma seção "Modelo de relação" identifica os blocos e a indicação textual de rendimento/uso. Informa que não existem quantidades numéricas homologadas e que os testes com números são **fictícios**. Não há formulário de aprovação ou entrada de valores nesta fase.

## Aprovações pendentes
Antes de qualquer migração ou cálculo verdadeiro:
1. Revisar o rendimento real de cada molho e a unidade apropriada;
2. Registrar o consumo efetivo por refeição e o tratamento de possíveis sobras;
3. Definir origem do ingrediente "maionese pronta" versus preparo caseiro, para evitar dupla contagem;
4. Revisar segurança alimentar, conservação, alergênicos, quantidade e direitos comerciais;
5. Projetar entidade versionada de preparo auxiliar, relacionamento por IDs e política de autorização, com critérios de migração explícitos.

**Não realizar migração ou cálculos reais até decisão editorial e validação específicas.**
