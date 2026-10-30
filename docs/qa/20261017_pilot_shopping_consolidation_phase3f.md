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

## Build Windows homologado — 17/10/2026

O responsável forneceu logs de sincronização e build do PowerShell. O histórico incluiu um build anterior do commit `2ee0761` (Vite 6.4.4, 1.644 módulos, 39,21 s) e dois builds do código novo, ambos aprovados:

- `git pull --ff-only`: fast-forward de `2ee0761` até **`8c38c83`** na branch `feat/revisao-alergenos-fase1-12out2026`, com novo parser `src/lib/pilotMeasure.ts` e ajustes no agrupamento e apresentação da lista de compras.
- `npm run build` (`tsc -b && vite build`): **nenhum erro TypeScript**. Vite **6.4.4**, **1.645 módulos transformados**, geração `dist/assets/index-C94dBnbL.css` (**52,94 kB**, gzip 11,40 kB), `dist/assets/index-4koMuIYd.js` (**503,54 kB**, gzip 142,72 kB).
- Primeira compilação do commit `8c38c83`: **24,37 s**; após `git pull --ff-only` responder `Already up to date`, segunda compilação idêntica: **7,92 s**.
- Aviso Vite de chunk maior que 500 kB: **não bloqueante**, para otimização futura.

**Classificação:** Git, TypeScript e build de produção da Fase 3F **APROVADOS**. **Não repetir build** desta versão; o registro documental não muda o código executável.

**Teste ainda pendente:** confirmar na tela **Compras** a apresentação de um total efetivamente combinado ao planejar duas receitas autorais com o mesmo ingrediente e a mesma unidade, com as expressões originais preservadas, sem somar `colher (chá)` com `colher (sopa)`. Verificar que uma marcação antiga não se transmite indevidamente a novo total. Sem essa captura não declarar a soma operacional homologada. PR #16 permanece rascunho/sem merge.


## Homologação visual da consolidação de compras — 17/10/2026

**Evidências do usuário:** quatro capturas do app local `localhost:5173` mostrando:

- `Cardápio`: **Sopa cremosa de couve-flor com noz-moscada** como **Ceia** da sexta-feira, **16/10/2026**, e **Gazpacho verde de pepino e abacate** como **Ceia** de sábado, **17/10/2026**. Ambas com rendimento original de 2 porções e sem redimensionamento de ingredientes.
- `Compras`: **20 itens do acervo pessoal** na semana 12–18/10/2026, incluindo **`2 colheres (sopa) de azeite`** com **2 usos** e as duas expressões `1 colher (sopa) de azeite` de origem. Visualizados também **`1½ xícaras de leite de coco`** com duas expressões de fonte e **`1½ dentes de alho`** com expressões diferentes, preservadas.
- Ingredientes com especificações diferentes permaneceram separados na listagem: **`½ xícara de água`** e **`½ xícara de água gelada`**. Quantidades ausentes como `sal`, `pimenta` e `noz-moscada` não foram inventadas.
- A nova linha consolidada de leite de coco aparece **desmarcada** na captura. Isso é consistente com a proteção contra herdar o status comprado do item anterior de `1 xícara de leite de coco`; não é prova de todos os cenários de alteração de compra.

**Conferência independente somente leitura no Supabase:** os dois planejamentos aparecem gravados exatamente em `2026-10-16`/`supper` (sopa) e `2026-10-17`/`supper` (gazpacho), cada qual com `servings=2`. Total de **28 registros de refeições planejadas** após as inclusões, **119 receitas fonte preservadas**, **0 receitas do piloto publicadas**. Nada foi alterado pela auditoria.

**Resultado homologado:** incorporação das duas receitas ao cardápio, persistência no Supabase e exibição visual do total correto de azeite, leite de coco e alho com medidas compatíveis e referências de origem, sem modificação dos textos de receitas. **Não repetir esse cenário** ou os builds já aprovados.

**Limites:** este teste não valida todas as 1.073 expressões nem qualquer equivalência de unidades diferentes. Alergênicos e composição nutricional seguem sem verificação; checklist marcado/não marcado depende de testes adicionais para todos os casos. O bundle Vite ainda gera aviso não bloqueante de chunk acima de 500 kB. Próximas tarefas podem priorizar exceções de normalização (alternativas, gramática, ingredientes compostos) e otimização de performance sem refazer a homologação existente.

**PR #16:** continua aberto, em rascunho e sem merge. Não publicar receitas comerciais nem alterar as refeições efetivamente planejadas pelo usuário.
