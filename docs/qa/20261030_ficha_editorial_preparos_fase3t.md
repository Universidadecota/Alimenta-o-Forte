# Costa&Costa — Fase 3T: ficha editorial dos preparos auxiliares (30/10/2026)

## Objetivo
Dar ao administrador uma forma de preparar **um rascunho local de conferência** dos molhos usados em três receitas privadas, com fonte, medida produzida, quantidade efetivamente aplicada, evidência de aferição e observações. A ficha **não é uma aprovação**, não possui botão de homologar e não grava dados no Supabase.

## Situação inicial verificada no Supabase (30/10/2026)

| Receita do piloto | Ingredientes | Medidas estruturadas aprovadas | Publicada? | Direitos comerciais | Revisão de ingredientes |
|---|---:|---:|---|---|---|
| Bolinhos de salmão com maionese caseira e salada de pepino | 16 | 0 | Não | pending_review | needs_structuring |
| Caesar sem queijo, com frango | 15 | 0 | Não | pending_review | needs_structuring |
| Salada de ovos em canoas de endívia | 14 | 0 | Não | pending_review | needs_structuring |
| **Total** | **45** | **0** | **Nenhuma** | **Pendente** | **Pendente** |

O rendimento textual do molho Caesar é **2 a 3 porções**, mas o uso individual não foi quantificado. Na salada de ovos, a receita menciona **cerca de ½ xícara** de rendimento da maionese e **1 colher (sopa)** no prato; o sistema não converte essas expressões de modo automático. No salmão, rendimento e uso de maionese não estão definidos.

## Funcionalidade entregue
Na administração, em **Conciliação editorial → Examinar fonte → Proposta de preparo → Modelo de relação**, aparece o formulário recolhido **“Preparar ficha editorial do molho · somente nesta sessão”**, condicionado à leitura já auditada da fonte, às instruções atuais da receita e à divisão de 45 ingredientes.

O administrador pode digitar:
- Quantidade total produzida, com unidade (g, ml, unidade ou porção);
- Quantidade efetivamente aplicada ao prato, com unidade separada;
- Evidência textual da medição (método, utensílio, lote);
- Observações editoriais.

Ao clicar **“Gerar rascunho não homologado”**, o navegador monta uma prévia JSON com status fixo `rascunho_nao_homologado`, ID da receita, hash da fonte registrada, estado atual de direitos, estado atual da estruturação, vínculo com o molho, risco de dupla contagem e as seis pendências para avaliação por pessoa responsável.

**O estado “apto_para_analise_humana” significa apenas que existem números coerentes entre si e texto mínimo de medição. NÃO libera revisão, aprovação, publicação, compras, nutrição nem reaproveitamento seguro de sobras.** O campo `canApprove`, assim como `canPublish`, `canCalculateShopping`, `canCalculateNutrition`, `canAssumeSafeLeftovers` e `storedRemotely`, é sempre `false` na ficha.

A prévia pode ser copiada pelo próprio administrador para encaminhar a uma futura rotina versionada. Os valores desaparecem ao sair da tela; nenhuma chamada de escrita, RPC, armazenamento local persistente ou endpoint externo é utilizado.

## Critérios técnicos
- `src/lib/pilotAuxiliaryReviewDraft.ts`: funções puras que validam números finitos, positivos, até um milhão, sem notação científica ou frações escritas; aceita vírgula ou ponto decimal e **não** converte unidades.
- `src/PilotAuxiliaryReviewWorksheet.tsx`: interface isolada com estado React apenas em memória e copia texto JSON pelo navegador mediante clique.
- A função `simulateAuxiliaryConsumption` da Fase 3S recebe apenas as medidas explicitamente digitadas. A diferença matemática jamais é considerada sobra apta para armazenamento.
- O componente pai mantém as verificações já existentes de snapshot, RLS administrativa e status não publicado; a ficha não aparece sem vínculo de preparo auxiliar verificado.
- `npm run build` inclui `test:auxiliary-review-draft`, além dos testes das fases anteriores.

## Segurança e decisões futuras
Permanece necessário aprovar separadamente: segurança do uso de gema pasteurizada e conservação dos molhos; alergênicos; rendimento efetivo; quantidade utilizada; tratamento de referência ao molho pronto para não duplicar compras; direitos comerciais das receitas; estruturação das medidas e impacto nutricional.

**Nenhuma alteração na branch main, no banco, nos dados, na lista de compras, nas regras de alergênicos nem na publicação das receitas faz parte desta fase.**

Próxima fase: somente após definição explícita dos responsáveis e dos critérios editoriais, desenhar um fluxo versionado de decisão persistida com aprovação humana e regras de autorização e rollback, sem migrar esses rascunhos automaticamente.
