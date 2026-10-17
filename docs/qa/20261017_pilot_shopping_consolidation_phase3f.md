# Costa&Costa — Fase 3F | Consolidação conservadora de compras do acervo autoral

**Data:** 17/10/2026 · **Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** rascunho, sem merge.

## Pré-condições e homologação anterior

As capturas fornecidas mostram `Receitas → Todos` com **115 receitas**, `Receitas → Legado` com **7 receitas** e a paginação com **7 páginas** para o catálogo principal. Consulta independente ao Supabase confirmou: **114 receitas autorais planejáveis + 1 receita particular** = 115; outros **5 molhos complementares** não são refeições e ficam fora desse total; **7 receitas legadas** continuam no banco. **26 planejamentos** persistidos.

**Resultado 3E:** visualização e separação do catálogo principal, filtro Legado e paginação desktop homologadas. Não repetir. Ainda é necessário despublicar com segurança o conteúdo legado antes de vender; esconder no filtro público não altera o atributo `published` no banco.

## Objetivo da Fase 3F

Aprimorar compras de receitas do piloto de três meses, **sem alterar os PDFs, ingredientes, quantidades ou modo de preparo** e sem publicar os dados. A lista atual já permite marcar ingredientes separadamente. Agora somar apenas quantidades numericamente inequívocas de um mesmo ingrediente descrito de maneira idêntica e com a mesma unidade.

### Código versionado

- `src/lib/pilotMeasure.ts`: parser conservador e formatador de quantidades. Interpreta inteiros, decimais com vírgula, frações comuns e caracteres fracionários. Reconhece unidades explícitas iguais (`xícara`, `colher (chá)`, `colher (sopa)`, `g`, `kg`, `ml`, `L` e algumas unidades contáveis) **sem converter entre unidades diferentes**.
- `src/lib/shopping.ts`: itens do piloto recebem, quando possível, um `totalLabel` calculado por ingrediente e unidade. Preserva `sourceText`, `sourceExpressions` e `sourceRecipes`. Caso o texto não seja interpretável com segurança, mantém-se como item literal.
- `src/App.tsx`: lista marcável apresenta o total seguro quando disponível, mostra as expressões originais abaixo e inclui esses detalhes em `Copiar lista`. Os checkboxes continuam persistidos pelo fluxo existente.
- **Proteção de compra:** ao aumentar o número de ocorrências ou agrupar expressões, muda a chave de compra do item para não herdar incorretamente o status `comprado` de uma quantidade menor. Um item único, sem consolidação, conserva a chave legada — inclusive `1 xícara de leite de coco` anteriormente marcado.

### Exemplos funcionais previstos pela regra

| Expressões originais em receitas planejadas | Apresentação segura |
|---|---|
| `1 xícara de leite de coco` + `½ xícara de leite de coco` | `1 ½ xícaras de leite de coco` |
| `¼ de xícara de leite de coco` + `¾ de xícara de leite de coco` | `1 xícara de leite de coco` |
| `1 colher (sopa) de azeite` + `2 colheres (sopa) de azeite` | `3 colheres (sopa) de azeite` |
| `1 colher (chá) de azeite` e `1 colher (sopa) de azeite` | **Separadas**, sem conversão |
| `1 colher (sopa) de azeite ou manteiga` | Texto literal com alternativa, sem escolha automática |
| `2 ovos` ou instrução composta com molho e subtítulos | Texto literal, até revisão estruturada |

**Notas:** esses são **casos de regra**, não testes no navegador ou prova de que o algoritmo já foi executado no Windows. A consulta SQL confirmou que várias expressões de azeite e leite de coco ocorrem efetivamente nos 119 registros, inclusive frações com `de xícara`, para as quais o parser foi ajustado.

## Limitações conscientes

1. A implementação não é uma normalização completa dos **1.073 fragmentos**: não unifica formas implícitas como `2 ovos`, sinônimos, variantes, marcas, ingredientes compostos nem unidades de embalagem diferentes.
2. Alternativas `ou`, `a gosto`, opcionais, formas com dois ingredientes na mesma expressão, subtítulos `Salada:` e outras ambiguidades não geram totais automáticos. Ainda é necessária estruturação editorial individual.
3. O total é **culinário**, nunca cálculo nutricional, alegação de segurança para alergias ou estimativa clínica.
4. Somente o cardápio pessoal já planejado alimenta a lista; não houve mudança de datas nem edição de receitas em banco.

## Homologação pendente

- **Build novo ainda não apresentado:** executar `git pull --ff-only` e `npm run build` no Windows.
- Após compilar: conferir que a ceia **Leite dourado de coco** ainda aparece com suas medidas originais, incluindo o item de leite de coco já marcado. **Não repetir** os testes de filtro, ceias ou conteúdo integral.
- Para testar uma soma real, selecionar em dois horários/dias desejados receitas autorais que usam literalmente a mesma unidade e produto (ex.: azeite em `colher (sopa)`). A lista de compras deverá apresentar um único total, com as expressões originais visíveis, sem juntar `chá` e `sopa`.
- Confirmar que a nova quantidade não herda uma marcação anterior de menor quantidade. O teste visual de uma lista de um só ingrediente não prova a soma.
- Manter PR #16 sem merge até compilação, conferência das compras e organização do catálogo comercial.

**Nenhuma migração SQL ou publicação necessária nesta fase**; as alterações são de apresentação/cálculo conservador no frontend.
