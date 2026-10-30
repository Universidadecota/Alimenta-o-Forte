# Costa&Costa — lote editorial de seis receitas: preparo e segurança (27/10/2026)

## Situação

**Aplicado e conferido no banco Supabase do Beta** (projeto Alimentação Forte). O script exato, já executado, foi arquivado em [20261027_lote06_preparos_seguranca_beta_aplicado.sql](./20261027_lote06_preparos_seguranca_beta_aplicado.sql). **Não repetir o script:** ele exige que o preparo exibido ainda seja idêntico à transcrição-fonte, e corretamente falhará depois da primeira aplicação.

## Escopo de conteúdo

| Receita | Ajuste editorial principal |
|---|---|
| Atum selado com salada de rúcula | A instrução original mantinha centro rosado; versão de exibição enfatiza cozimento completo e 63 °C, alerta para peixe e gergelim e conserva a transcrição-fonte intacta. |
| Camarão ao alho com espaguete de abobrinha | Cozimento até textura opaca e firme, separação de utensílios e aviso sobre crustáceos e ghee derivado de leite. |
| Lula refogada com alho e pimenta | Procedimento em etapas e aviso de que a alternativa genérica “mariscos” exige cuidado específico, não o mesmo tempo de lula. |
| Ovos mexidos com bacon e tomate + café com manteiga | Ovos completamente cozidos, cuidado com mistura de café quente em liquidificador e alergênicos ovo e leite. |
| Peixe assado com brócolis e beterraba | As duas colheres de azeite são quantidade total, e não quantidade a repetir; cozimento do peixe verificado a 63 °C. |
| Sardinha grelhada com vinagrete | Diferencia 1 colher (sopa) de azeite do peixe e 2 colheres (sopa) do vinagrete; higiene e 63 °C no peixe. |

As seis fichas agora têm passos individualizados, seção **DICAS PARA DAR CERTO** e seção **INFORMAÇÕES DE SEGURANÇA**. Cuidados apresentados são orientativos e **não** tornam a receita certificada para restrições alimentares nem substituem conferência de embalagens e ingredientes.

## Controles e resultados

Consulta preliminar confirmou **seis de seis** receitas com preparos iguais à transcrição original, no piloto pessoal, elegíveis a cardápio, oficiais (sem proprietário) e não publicadas. SQL atômico limita alterações a `public.recipes.instructions` somente quando todos esses critérios continuam verdadeiros; se a contagem não for 6, a transação inteira é revertida.

Consulta posterior em **27/10/2026**:

- Acervo piloto: **119** receitas; **114** elegíveis ao cardápio — inalterados.
- **28** fichas com dicas e segurança estruturadas — antes eram **22**.
- **6/6** fichas deste lote exibem seções e têm o preparo de exibição diferente do original, que continua preservado no registro-fonte.
- **6/6** mantêm `ingredient_review_status = 'needs_structuring'`; não houve homologação automática de alergias.
- Não houve atualização de medidas, ingredientes, tempos, rendimento, composição nutricional, receitas pessoais, favoritos, contas, RLS ou cardápios salvos.

**Pendente:** homologação visual de todas as seis fichas na interface, revisão editorial das outras **91** ainda sem ambos os blocos estruturados, conferência especializada de alergênicos e composição nutricional. Revisão de conteúdo não equivale à liberação comercial do Beta.

## Referências de segurança usadas

- [FoodSafety.gov — temperaturas mínimas seguras](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures): pescado 63 °C; ovos cozidos até firmar.
- [FDA — seleção e preparo seguro de pescados e frutos do mar](https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-fresh-and-frozen-seafood-safely): camarão cozido opaco e firme; cautela com peixe cru ou malpassado.
- [Anvisa — orientações sobre rotulagem de alergênicos](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/rotulagem-de-alergenicos.pdf/%40%40download/file): derivados de leite, crustáceos e outros componentes exigem checagem de rótulos.
