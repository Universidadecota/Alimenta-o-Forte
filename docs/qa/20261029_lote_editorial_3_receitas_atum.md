# Costa&Costa — Lote editorial piloto: três receitas com atum

**Data:** 29/10/2026  
**Projeto Supabase:** `gclhailalyrokvmkwllm` (Alimentação Forte)  
**Branch-base do Beta:** `feat/revisao-alergenos-fase1-12out2026`  
**Escopo:** somente título e texto de preparo; sem publicação ou ativação de cálculos.

## Por que este lote foi escolhido

A imagem de **Atum selado com salada de rúcula** foi substituída e homologada visualmente no domínio Beta em 29/10/2026. A fotografia mostra atum completamente cozido e contém o aviso de imagem gerada por IA. O texto já exigia 63 °C no centro, mas o título continuava sugerindo apenas a selagem.

Uma auditoria de três receitas com atum detectou dois problemas adicionais: o `Carpaccio de abobrinha com atum` não orientava a higienização da hortaliça consumida crua; os `Talos de aipo recheados com patê de atum` ensinavam maionese com gema crua. Este lote corrige somente a apresentação editorial das receitas no banco, mantendo o material transcrito como referência original.

## Alterações aplicadas ao conteúdo exibido

| ID da receita | Nome atual no app | Alteração | MD5 de `instructions` antes → depois |
| --- | --- | --- | --- |
| `233276a4-ecdd-46cf-aea4-6cf09fc6a043` | **Atum com crosta de gergelim e salada de rúcula** | Título editorial; o preparo seguro já havia sido revisado e não foi regravado | `58f92de9566f955474c78f536f9ec831` → igual |
| `16b2ea89-5bc5-4399-b625-94039aa4e4c2` | **Carpaccio de abobrinha com atum** | Orientação de higienização, abertura da lata, utensílios e alerta de peixe/gergelim | `953e7c0e0cda81aa4d766065072837ca` → `edafe8e4788f685b60e38d2e154027fb` |
| `bd4de4cc-ea01-401f-9834-94aa1a44c887` | **Talos de aipo recheados com patê de atum** | Substituição da instrução com gema crua por maionese de ovos pasteurizados, higiene e refrigeração | `e557c5f98daf0d2b5f5c360d3ae520f7` → `8fc67599a0e81f5b9a44992ab2616999` |

### Texto editorial aplicado ao carpaccio

1. Lave e higienize a abobrinha e a cebolinha conforme as orientações do produto próprio para sanitização de hortaliças consumidas cruas. Use utensílios limpos e seque a abobrinha antes de fatiar.
2. Com um descascador limpo, corte a abobrinha em lâminas finas e disponha em um prato. Tempere com o suco de ½ limão, sal e pimenta.
3. Verifique a integridade e a validade da lata de atum, abra-a e escorra o líquido. Distribua o atum sobre a abobrinha.
4. Finalize com 1 colher (sopa) de azeite, 1 colher (chá) de gergelim e a cebolinha. Sirva logo após o preparo.

**Dicas:** Corte lâminas finas e uniformes. O limão dá sabor, mas não substitui a higienização das hortaliças.

**Segurança:** Alérgenos indicados no texto: peixe (atum) e gergelim. Conferir rótulos e risco de contato cruzado. Manter o atum e o prato prontos protegidos de contaminação e refrigerar se não forem consumidos imediatamente.

### Texto editorial aplicado ao patê de atum

1. Lave e higienize os talos de aipo e a cebolinha conforme as orientações do produto próprio para hortaliças consumidas cruas. Seque e corte os talos de aipo em pedaços de cerca de 8 cm.
2. Verifique a integridade e a validade da lata de atum, abra-a e escorra o líquido. Em uma tigela limpa, misture o atum com 1 colher (sopa) de maionese, o suco de ½ limão, 1 colher (sopa) de cebolinha e pimenta.
3. Para esta receita, utilize maionese pronta elaborada com ovos pasteurizados ou maionese caseira preparada exclusivamente com ovos pasteurizados. **Não prepare a maionese com gema crua comum**, como indicado na fonte original.
4. Recheie os talos de aipo com o patê. Sirva logo após preparar ou mantenha refrigerado até servir, evitando exposição prolongada à temperatura ambiente.

**Dicas:** Seque bem os talos de aipo. Confira composição e prazo de validade da maionese escolhida. Ingredientes e proporções de uma maionese preparada à parte **não integram** as quantidades desta ficha.

**Segurança:** Peixe (atum); ovo quando presente na maionese. Outros alérgenos dependem do rótulo e da preparação utilizada. Verificar contato cruzado.

### Atum com crosta de gergelim

A instrução previamente corrigida foi preservada, inclusive o preparo até **63 °C na parte mais grossa do peixe**, medido com termômetro culinário. Alterou-se somente o título do campo `public.recipes.title`. O título original em `cc_official_recipe_source_records.original_title` continua **Atum selado com salada de rúcula**.

## Integridade e não regressão

Atualização SQL administrativa guardada por **ID, título anterior, MD5 do preparo, `published=false`, ausência de proprietário, ausência de arquivamento e vínculo com fonte `personal_pilot`**. A operação só poderia concluir se exatamente três linhas fossem alteradas; caso contrário, seria revertida por exceção.

Verificação independente depois da escrita confirmou:

- Três receitas continuam `published=false`, `use_stage=personal_pilot`.
- Rendimento original intacto: **1 porção cada**; tempos 15, 10 e 10 minutos.
- Imagens não modificadas; foto aprovada do atum mantém `image_is_ai=true`.
- **22 itens** em `recipe_ingredients` preservados (8 + 8 + 6); suas fontes em `cc_pilot_ingredient_measure_reviews.source_text` continuam idênticas (`review_sources_intact=true`).
- Nenhum ingrediente deixou o estado `pending` por este lote; nenhuma quantidade, unidade, preço, nutrição, alergia, cardápio, compras ou informação de usuário foi regravada.
- Os textos `original_ingredients`, `original_preparation` e `original_title` da tabela de proveniência **não foram alterados**.
- **Não** houve merge em `main`, liberação comercial ou publicação de receitas.

## Próxima etapa: medidas — não executar automaticamente

Estas três receitas têm **22 ingredientes sem medida numérica estruturada**. O texto da fonte tem números explícitos em alguns itens, mas existem alternativas e expressões abertas (por exemplo, azeite sem dose, atum em água **ou** azeite, maionese caseira versus pronta). Não inferir nem converter quantidades sem a decisão do responsável.

Respeitar o fluxo já homologado nas Fases **3I.3–3I.5**:

1. Preparar propostas somente para casos inequívocos, mediante prévia de receita + posição + texto original.
2. Manter escolhas desmarcadas por padrão; não selecionar ou aprovar as 22 entradas em bloco.
3. Confirmar editorialmente cada item após conferência humana, justificativa própria e registro de evento.
4. `confirmed` na tabela editorial **não modifica** `recipe_ingredients` nem autoriza cálculos de porções, nutrientes, alergênicos ou lista de compras.
5. Tratar separadamente eventual camada de exibição de ingredientes já revisados, **sem sobrescrever a transcrição**.

A UI administrativa de receitas do piloto protege título, preparo e ingredientes contra edição comum. As correções específicas acima foram executadas administrativamente por identificação exata e ficam documentadas aqui; **não** abrir esse fluxo para edição genérica de receitas piloto.

## Fontes públicas de segurança alimentar usadas

- [Anvisa: evitar preparações com ovos crus, incluindo maionese caseira](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2020/anvisa-participa-de-evento-sobre-seguranca-de-alimentos/).
- [FDA: utilizar ovos ou derivados pasteurizados em preparações como maionese sem cocção adequada](https://www.fda.gov/food/retail-food-industryregulatory-assistance-training/assuring-safety-eggs-and-menu-and-deli-items-made-raw-shell-eggs).
- [FoodSafety.gov: temperatura mínima de 63 °C para peixes, incluindo atum](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures).

**Limite:** orientações editoriais de segurança alimentar não equivalem a parecer médico, nutricional ou homologação completa de alérgenos. Para ampliação pública e comercial, revisão técnica independente continua necessária.
