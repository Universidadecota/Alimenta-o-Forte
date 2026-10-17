# Costa&Costa — Fase 3I.2: triagem conservadora em lote

**Data:** 17/10/2026  
**Branch:** `feat/revisao-alergenos-fase1-12out2026`  
**PR #16:** manter aberto e em rascunho, sem merge.

## Objetivo
Evitar abrir os **1.073 fragmentos** um a um apenas para descobrir o tipo de revisão necessário. Gerar, **sob demanda e somente em memória no navegador**, uma classificação que separa medidas simples de intervalos, alternativas, opcionais, preparos compostos e outros casos manuais. **A pré-análise não grava rascunhos, não confirma medidas, não muda receitas e não altera o planejamento.**

## Evidências já homologadas (não repetir)
- Inventário administrativo com 1.073 registros e 43 páginas de 25 itens; pesquisa por `fraldinha` localiza `150 g de fraldinha` e `150 a 180 g de fraldinha`.
- Proposta `150 · g · fraldinha` apresentada em leitura; o intervalo continua sem valor único inventado.
- Build anterior do frontend (Fase 3I) aprovado pelo usuário; nova versão requer apenas seu próprio build.
- Consulta somente leitura anterior: todos os registros em `pending`, sem rascunhos ou confirmações.

## Implementação
- **`src/lib/pilotMeasureBatch.ts`** (novo): motor puro que usa `parsePilotMeasure` e `splitPilotIngredient`. Separa cada texto **inteiro** nas categorias mutuamente exclusivas:
  1. **Medida identificada:** somente leitura numérica reconhecida pelo parser conservador; exemplo `150 g de fraldinha`.
  2. **Intervalo de medidas:** ex. `150 a 180 g de fraldinha`, inclusive faixas explícitas entre parênteses. Não escolhe média nem um dos limites.
  3. **Alternativas:** `ou` na descrição; não escolhe nem substitui ingredientes.
  4. **Preparos compostos:** cabeçalhos como `Salada:`, `Chimichurri:` ou mais de um ingrediente no mesmo fragmento.
  5. **Opcionais e a gosto:** `opcional`, `a gosto`, `se preferir` e instruções similares.
  6. **Outras medidas para revisão:** sem extração segura, inclusive `suco de ½ limão` ou `sal`. Ausência de sugestão não significa ausência de medida na receita.
- **`src/PilotIngredientMeasureReview.tsx`**: novo botão **Analisar todos os ingredientes**. Consulta o Supabase em páginas de 250 linhas, com ordenação estável pelo `ingredient_id`, contagem exata e verificação de que todos os registros foram lidos. Mostra total, pendentes, contagem de cada categoria e amostras, com acesso à pesquisa daquele texto. Todos os resultados são calculados no navegador e descartados ao sair da tela; nenhuma chamada `insert`, `update` ou `upsert` é feita pela função `analyzeAll`.
- **Unidades legíveis:** `colher_sopa` torna-se **colher (sopa)**, `colher_cha` torna-se **colher (chá)**; `xicara` vira **xícara** na visualização da sugestão. Os códigos do banco permanecem estáveis.
- **`src/styles.css`**: agrupamentos legíveis em desktop e celular.
- **`scripts/test-pilot-measure-batch.mjs`** e `package.json`: comando `npm run test:measure-batch` para cobrir casos simples, faixas, escolhas, compostos, opcionais, sem quantificação, rótulos e somatório de grupos. O teste importa módulos TypeScript puros após transpilação; não acessa nem modifica Supabase.

## Segurança, integridade e limitações
- Nenhuma migration SQL nesta subfase. O inventário continua sob RLS administrativo da Fase 3I, com snapshot de texto original imutável.
- A classificação é **heurística e conservadora**, não laudo profissional nem confirmação editorial. Prioridade por categoria significa que um ingrediente pode ter mais de uma questão (por exemplo, faixa e alternativa), mas aparecerá em uma categoria principal; o **texto integral** permanece visível para revisão.
- A contagem será exata apenas depois que o botão analisar todos completar. **Não informar quantos itens são simples ou ambíguos antes do processamento completo.**
- Sugestões ainda não liberam redimensionamento, nutrição ou substituições de ingredientes. Não reescrever fontes, não misturar medidas de unidades distintas e não publicar as 119 receitas piloto.
- **Ações de gravação de rascunho continuam exclusivamente individuais e explícitas**, como na Fase 3I anterior. Uma eventual gravação em lote exigirá etapa separada, com prévia e proteção contra reaplicação.

## Homologação pendente
1. Executar no Windows, uma única vez para esta versão:
   ```powershell
   git pull --ff-only
   npm run build
   npm run test:measure-batch
   ```
2. No `localhost:5173`, abrir **Administração → Receitas oficiais → Medidas das receitas autorais · inventário e revisão**, clicar **Analisar todos os ingredientes**; verificar total **1.073** e as seis categorias.
3. Em **Medida identificada**, abrir exemplos e conferir a unidade legível; em **Intervalo de medidas**, observar `150 a 180 g` sem sugestão de número único.
4. **Não salvar nenhuma proposta nessa homologação.** Enviar uma única captura do resumo. Evitar repetir os testes das fotos, compras, cardápio, pesquisa de fraldinha e build anterior.

**PR #16:** permanecer em draft, sem merge até homologação funcional desta nova etapa.

## Correção de compilação e tela em branco — 17/10/2026

O responsável apresentou capturas do Chrome DevTools em visualização mobile (390 × 545) com a área administrativa em branco e o erro **`Uncaught ReferenceError: suggest is not defined`** em `PilotIngredientMeasureReview.tsx:192`. O `favicon.ico` retornou 404, erro independente e não bloqueante para o funcionamento da fila.

No PowerShell, após atualização **`d1ed224..b310d01`**, `npm run build` falhou com três erros claros:

1. **`src/lib/pilotMeasureBatch.ts:62` — TS2352:** `Object.fromEntries(... [])` inferia `never[]` e não era compatível com `Record<MeasureGroup,BatchGroupSample[]>`. Corrigido com objeto tipado explícito com as seis categorias.
2. **`src/PilotIngredientMeasureReview.tsx:103` — TS2345:** `setQuantity` recebia valor possivelmente numérico de `proposal.quantity`. Corrigido para converter sempre em `String(...)`, mantendo o estado como texto.
3. **`src/PilotIngredientMeasureReview.tsx:192` — TS2304:** uma ocorrência antiga `suggest(r.source_text)` permaneceu após a substituição por `suggestMeasure`. Corrigida para `suggestMeasure(r.source_text)`. O mesmo erro causou a falha de renderização observada no navegador.

O comando `npm run test:measure-batch` do usuário retornou **OK** na versão anterior; isso valida os exemplos do algoritmo puro, mas não a compilação TypeScript do componente nem a renderização React. O sucesso desse teste não deve ser descrito como homologação total.

**Correções no GitHub:** `77a5264` (tipagem explícita), `b9d42dc` (estado de texto e referência de função). Inspeção estática posterior confirmou que `suggest(` não aparece mais no componente, `suggestMeasure(` aparece nas duas ocorrências corretas, a quantidade é texto e a coleção de exemplos tem todas as seis chaves.

**Status:** as três causas reportadas foram corrigidas no código, porém **o build Windows posterior às correções e a renderização mobile ainda estão pendentes de homologação**. Nenhuma migração ou atualização de dados foi executada; inventário e receitas permanecem preservados, sem confirmação automática.

**Teste novo e suficiente:** `git pull --ff-only` + `npm run build`; o teste `npm run test:measure-batch` **não precisa ser repetido**, pois já passou. Após compilar, atualizar a página (`Ctrl+Shift+R` se necessário), abrir **Administração → Medidas das receitas autorais · inventário e revisão → Analisar todos os ingredientes**, conferir resumo com 1.073 registros e seis grupos em modo desktop/mobile. Enviar uma captura do resultado ou um novo erro específico. Não salvar nenhum rascunho ainda, não refazer os testes do catálogo ou fotografias. PR #16 deve permanecer draft, sem merge.

## Build Windows corrigido e aprovado — 17/10/2026

O responsável executou novamente `git pull --ff-only` no PowerShell, atualizando a branch de `b310d01` a `5b610a2` sem conflitos; em seguida, executou `npm run build` com resultado positivo:

- `tsc -b && vite build`: **sem erros de TypeScript**, confirmando a correção dos três problemas anteriores (`TS2352`, `TS2345`, `TS2304`).
- Vite `6.4.4`; **1.648 módulos transformados**; build concluído em **16,71 segundos**.
- Arquivos gerados: `dist/assets/index-CFO06f9I.css` (57,84 kB; gzip 12,26 kB) e `dist/assets/index--6XNEiZu.js` (522,52 kB; gzip 148,54 kB).
- Aviso sobre chunk superior a 500 kB **não bloqueante**; otimização reservada para trabalho posterior.
- O teste separado `npm run test:measure-batch` já havia retornado **OK** na versão anterior à correção; não solicitar nova repetição desnecessária.

**Estado de homologação:** sincronização e compilação TypeScript/Vite agora **aprovadas**. A restauração da renderização da página administrativa e a análise completa dos 1.073 ingredientes **ainda requerem evidência no navegador**. Próxima verificação única: recarregar o `localhost:5173`, entrar em Administração → Medidas das receitas autorais → clicar `Analisar todos os ingredientes`; confirmar os 1.073 registros distribuídos em seis grupos e encaminhar captura. Nenhum rascunho deve ser salvo nesse teste.

Este registro é exclusivamente documental. Não modifica receitas, ingredientes, fotografias, dados nutricionais ou planejamento. PR #16 permanece aberto em draft, sem merge.
