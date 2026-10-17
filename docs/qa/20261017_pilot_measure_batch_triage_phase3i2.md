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
