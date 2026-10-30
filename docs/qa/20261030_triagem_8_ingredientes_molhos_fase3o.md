# Fase 3O — Conferência focada de 8 ingredientes e segurança dos molhos (30/10/2026)

## Escopo e fonte de evidência
Auditoria somente de leitura das 48 ocorrências em `public.recipe_ingredients` que não têm linha própria por ID em `public.cc_pilot_ingredient_measure_reviews`. As expressões oficiais foram lidas de `public.cc_official_recipe_source_records.original_ingredients`, e as instruções atuais de `public.recipes.instructions` quando relevante. Todas as receitas deste lote estão com `published=false`. Não foi executado UPDATE/INSERT/DELETE, nem alterações em políticas de acesso.

Resultado da triagem conservadora: **40 textos literais únicos, 6 textos com anotação contextual e 2 ocorrências textuais repetidas**. Nenhuma dessas classificações prova vínculo 1:N, quantidade confirmada, rendimento, nutrição ou segurança alimentar.

## Oito registros que exigem conferência editorial

| Receita | ID do ingrediente atual | Texto atual | Evidência na fonte | Próxima conferência |
|---|---|---|---|---|
| Amêijoas (vôngole) à portuguesa com salada de tomate | `c7f5b448-f016-48f3-afe3-fd0d18d0b16e` | 2 tomates (salada) | `Salada: 2 tomates` | A anotação de preparo parece contextual; não presumir vínculo com histórico |
| Bolinhos de salmão com maionese caseira e salada de pepino | `6781c340-f1cd-4a3b-8fcb-ed9177a7c5d0` | 1 gema (maionese) | `Maionese: 1 gema` | Revisar segurança da maionese antes da publicação; conferir a necessidade de substituir a preparação com gema sem cozimento |
| Bolinhos de salmão com maionese caseira e salada de pepino | `c685fe95-ce09-45a5-a123-68f5fdc0c94c` | ½ pepino fatiado (salada) | `Salada: ½ pepino fatiado` | Conferir apenas o rótulo contextual |
| Caesar sem queijo, com frango | `6463282e-8524-47b9-87fd-af5743dc34bd` | pimenta | A fonte menciona pimenta no tempero da salada e no molho Caesar | Manter as duas ocorrências distintas; conferir preparo com gema do molho |
| Rolê de frango com bacon, espinafre e tomate | `f59a6f08-79d5-46b8-9df3-9354370d4191` | 1 tomate (para assar no acompanhamento) | `Acompanhamento: 1 tomate assado` | Conferir diferença entre modo de preparo atual e estado do ingrediente descrito na fonte |
| Rolê de frango com bacon, espinafre e tomate | `f38ea44a-dc3d-4d17-bd98-01ca87876091` | folhas verdes (acompanhamento) | `... e folhas verdes` | Conferir anotação de acompanhamento |
| Salada Cobb completa | `12ba03b2-a42e-4036-98db-e36ce5a556a3` | 2 colheres (sopa) de azeite (molho) | `Molho: 2 colheres (sopa) de azeite` | Conferir rótulo do molho; preservar quantidade e destino |
| Salada de ovos em canoas de endívia | `80c01de3-cbf3-427c-a829-f78d796305f0` | suco de ½ limão | A fonte repete `suco de ½ limão` no prato e na maionese | Manter as duas aplicações distintas; conferir segurança da maionese |

## Pendência de segurança alimentar antes de qualquer publicação
A leitura das **instruções atuais** de três receitas identificou emulsões feitas com gema sem etapa de aquecimento no preparo descrito:

1. **Bolinhos de salmão com maionese caseira e salada de pepino** (`bc72828c-22ad-4201-9672-86e754eabe9c`): a instrução manda bater gema com limão e óleo para emulsionar e guardar até dois dias. Não informa gema pasteurizada.
2. **Caesar sem queijo, com frango** (`ccea2f76-a9b0-477a-a5b7-2e4594d2cac7`): o molho é preparado misturando gema, limão e óleo sem cozimento descrito. Não informa gema pasteurizada.
3. **Salada de ovos em canoas de endívia** (`fd9d66ab-d656-4bac-8ac6-2607ffad8cc4`): a instrução declara expressamente que a maionese leva ovo cru e recomenda refrigeração, mas não informa uso de ovo pasteurizado.

**Ação editorial necessária:** rever os preparos para uma versão segura, com decisão explícita sobre ingrediente pasteurizado, condições de preparação/conservação, informações de alergênicos e eventuais rendimentos/porções. Refrigerar não equivale a eliminar o perigo microbiológico do ovo cru. Não alterar automaticamente a fonte oficial nem aprovar as receitas; todas permanecem no piloto não publicado.

## Implementação de interface
O painel administrativo **Examinar fonte** agora mostra, acima do mapa histórico, uma seção **Conferência prioritária** que separa somente os casos com texto repetido, anotação contextual ou ausência de correspondência. Se a fonte contém gema em preparação de maionese/molho, exibe alerta para revisão das instruções antes de publicação.

A classificação usa apenas os dados já lidos pelo administrador (sem consulta adicional, sem nova RPC e sem mudanças no banco). Não presume que mencionar gema prove, isoladamente, uso de ovo cru; essa confirmação veio da auditoria separada das instruções.

## Critérios de aceite desta fase
- Testes locais para classificação, priorização, ausência de aprovação, alertas de gema e exclusão dos casos literais únicos.
- Build TypeScript/Vite da Vercel em READY no commit final e no merge Beta.
- Nenhuma mudança no branch `main`, tabela de ingredientes, instruções das receitas, metadados históricos, medidas ou RLS.
- **Revisão culinária e de segurança pendente**: esta fase fecha a investigação e organiza o trabalho, não homologa os três preparos.
