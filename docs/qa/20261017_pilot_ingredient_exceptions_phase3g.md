# Costa&Costa — Fase 3G | Ingredientes alternativos, subtítulos e variações de medidas

**Data:** 17/10/2026  
**Branch:** `feat/revisao-alergenos-fase1-12out2026`  
**PR #16:** manter em rascunho, sem merge.

## Evidências já homologadas — não repetir

A Fase 3F foi aprovada visualmente com 2 ceias planejadas: **Sopa cremosa de couve-flor com noz-moscada** e **Gazpacho verde de pepino e abacate**. A lista somou **2 colheres (sopa) de azeite** e **1½ xícara de leite de coco**, exibindo as expressões originais. Os dois planejamentos foram confirmados no Supabase.

A auditoria atual de leitura confirmou **119 receitas originais**, **1.073 fragmentos de ingredientes**, **28 refeições planejadas** e **zero receitas piloto publicadas**. Nenhuma receita ou planejamento foi editado nesta Fase 3G.

## Diagnóstico do conteúdo real

Consulta SQL somente leitura:
- **1.073** fragmentos individuais importados dos seis PDFs, contendo **470** expressões textuais distintas;
- **63** fragmentos com a palavra `ou` (alternativas ou contexto);
- **40** fragmentos com dois-pontos; vários combinam ingredientes de partes distintas da mesma receita, como `Salada:`, `Molho:`, `Chimichurri:`, `Tahine:`, `Vinagrete:` e `Maionese:`;
- **309** fragmentos com pelo menos um parêntese aberto, que podem conter preparo, alternativas, tamanhos e observações; **não** presumir que todos são separáveis.

Exemplos encontrados nos próprios registros: `Fraldinha com chimichurri e escarola refogada` contém `1 colher (chá) de manteiga. Chimichurri: 3 colheres (sopa) de salsinha picada`; `Camarão grelhado com chili e limão e salada de abacate` contém `sal. Salada: ½ abacate em cubos`; `Peito de peru com abacate, brotos e molho verde` contém `1 colher (sopa) de semente de abóbora. Molho: molho cremoso de abacate (receita abaixo).`.

## Mudanças no GitHub — aguardando build/testes

1. `src/lib/pilotIngredientReview.ts` (novo): **separação conservadora somente na lista de compras** quando há subtítulo explicitamente identificado após ponto e dois-pontos (incluindo títulos de molho, salada, farofa, chimichurri e outros encontrados nos PDFs). Trechos sem separação segura continuam inteiros. Rótulos como `Por porção` e `Pão (por pessoa)` não participam da soma por dependerem do rendimento. Cada item preserva a expressão completa original por referência.
2. `src/lib/pilotMeasure.ts`: amplia a leitura de frações juntas ao número (`1½`), números e unidades unidos (`150g`, `200ml`) e contagens elementares inequivocamente comparáveis (`1 ovo` e `2 ovos`; `½ cebola` e `1 cebola`; tomates). Não equipara `ovo` e `ovo cozido` nem unidades diferentes.
3. `src/lib/shopping.ts`: aplica a análise das expressões **derivadas apenas para compras**; o texto imutável dos 119 registros, seu modo de preparo e seus ingredientes fonte permanecem inalterados. Grava no item de apresentação se há opção `ou`, ingrediente opcional, trecho composto/ambíguo e, quando subdividido, as expressões originais completas. A chave de compra de itens somados passa a depender também do total, evitando reutilização indevida da marcação `comprado` de outra quantidade. Uma linha única anterior continua com a chave legada.
4. `src/App.tsx` e `src/styles.css`: mostram avisos simples para escolhas e opcionais e, quando houve divisão de subtítulos, mostram o trecho completo de origem para conferência. **Não escolhem produtos nem convertem medidas.**
5. `scripts/test-pilot-ingredients.mjs` e `package.json`: acrescentam `npm run test:ingredients`, com casos de regressão para azeite, leite de coco, ovos, cebolas, medidas incompatíveis, alternativas, ingredientes opcionais, subtítulos e quantificação por porção.

## Regras preservadas

- Nenhuma receita foi reescrita, excluída, publicada ou atribuída a outro dia.
- O módulo médico continua inativo e separado da experiência culinária; nenhum dado nutricional foi inventado ou aprovado.
- Alternativas como `azeite ou manteiga` são exibidas como **escolha do usuário** e não viram duas compras obrigatórias ou uma substituição automática.
- Unidades incompatíveis, ingredientes com qualificadores diferentes e medidas por porção permanecem distintos.
- O conteúdo integral do PDF/receita continua sendo fonte de verdade para consultas e preparo.
- Os sete registros legados continuam separados do catálogo autoral e exigirão decisão controlada antes da futura assinatura paga.

## Homologação necessária, ainda não concluída

**Executar no Windows apenas uma vez para esta nova versão:**

```powershell
git pull --ff-only
npm run build
npm run test:ingredients
```

Se os comandos forem bem-sucedidos, validar visualmente um caso novo de ingrediente composto, por exemplo a receita **Fraldinha com chimichurri e escarola refogada**, ou a salada **Agrião com tiras de fraldinha e chimichurri**, em um dia escolhido para teste. A lista de compras deverá distinguir a manteiga/semente de girassol da salsa do chimichurri, com o texto original preservado e sem soma imprópria.

**Não repetir** os testes da Fase 3F de azeite/leite de coco ou builds anteriores. A criação do teste automatizado **não comprova sua execução**; até receber o retorno, o status é **implementado, pendente de compilação, regressão e evidência visual**. PR #16 permanece aberto em draft, sem merge.


## Build e regressão homologados no Windows — 17/10/2026

O responsável forneceu a saída dos três comandos no PowerShell, na pasta do projeto Costa&Costa Alimentação Forte:

- `git pull --ff-only`: atualização **`8c38c83..fa66344`** por fast-forward da branch `feat/revisao-alergenos-fase1-12out2026`, sem conflitos.
- `npm run build` (`tsc -b && vite build`): **aprovado, sem erros de TypeScript**, Vite **6.4.4**, **1.646 módulos transformados**, conclusão em **36,24 s**; `dist/assets/index-C2AimQq9.css` **53,09 kB** (gzip 11,43 kB), `dist/assets/index-DnDLtONw.js` **506,26 kB** (gzip 143,76 kB).
- Aviso não bloqueante: chunk maior que **500 kB**; otimização do carregamento fica para fase posterior.
- `npm run test:ingredients`: **aprovado**, com saída `OK: verificações do parser, frações, alternativas e subtítulos, sem modificar receitas.` O script cobre os casos explicitamente codificados de medidas, alternativas, opções, cabeçalhos e porção. Não interpretar esse teste como validação integral dos 1.073 fragmentos.

**Resultado:** sincronização, compilação de produção e teste automatizado da Fase 3G **homologados**. **Pendente:** somente evidência visual da lista de compras para um ingrediente composto real com subtítulo — por exemplo `Fraldinha com chimichurri e escarola refogada` — com ingredientes separados e texto original preservado. Não repetir comandos, build, testes Fase 3F ou exames médicos. Caso use uma data livre no cardápio para o teste, não substituir refeições já planejadas.

Nenhuma migração, receita, planejamento ou dado nutricional foi alterado nesta etapa documental. O PR #16 permanece aberto, em draft e sem merge.


## Fase 3G.1 — Dia de destino visível antes de adicionar receita

**Evidência de uso, 17/10/2026:** o responsável compartilhou imagens da busca e seleção da receita **Fraldinha com chimichurri e escarola refogada**, do alerta prévio de alergias e da tela de cardápio. Identificou uma falha de usabilidade: o comando dizia **"Adicionar ao dia selecionado"**, mas a página **Receitas** não informava qual dia estava selecionado, podendo gerar adição em data diferente da esperada.

**Ajustes implementados, ainda sem build Windows nesta fase:**
- `src/App.tsx`: na biblioteca e na ficha, painel **Dia escolhido para o cardápio** com data completa em português, **seletor dos sete dias da semana atual**, intervalo semanal visível e atalho **Escolher outra semana**, que abre o Cardápio.
- Cartões e detalhes da receita exibem a data no próprio botão (ex.: **Adicionar em 17/10**; para lanches/saladas **Escolher horário · 17/10**), independentemente de o usuário ter rolado a lista e não estar vendo o painel.
- Antes de abrir a inclusão, o frontend confirma se a data selecionada pertence à semana atual. Se a data estiver inválida, conduz à escolha no Cardápio.
- Se já existir **outra receita no mesmo dia e horário**, a inclusão iniciada pela biblioteca pede confirmação de substituição, indicando dia, horário e as duas receitas. Cancelar na inclusão direta mantém a pessoa na página Receitas.
- `src/RecipeDetails.tsx`: prop controlada `destinationDateLabel` para mostrar a mesma data na ficha completa; `src/styles.css`: painel responsivo, com rótulos explícitos.
- O estado selecionado continua sendo o mesmo do Cardápio; a implementação não altera ou migra dados, receitas, porções, fontes ou planejamento existente.

**Status:** alterações de código versionadas, **sem confirmação de build Windows ou teste visual**. Não considerar esta correção homologada antes do próximo build.

**Observação separada sobre Fase 3G:** as capturas de compras enviadas mostram itens compostos muito pequenos para confirmar inequivocamente a separação de manteiga e salsinha do chimichurri. Manter o teste visual dessa subdivisão como **pendente**, sem repetir os testes automatizados ou a soma de azeite e leite de coco, que já foram aprovados.

**Próxima conferência:** executar apenas `git pull --ff-only` e `npm run build`; abrir Receitas e verificar a data completa, trocar o dia pelo seletor e confirmar que o botão mostra a data escolhida. Para esta correção de rótulo, **não é necessário salvar uma nova refeição** ou modificar planejamentos. PR #16 continua draft e sem merge.


## Homologação parcial da data de destino — build Windows e botões

**Evidências fornecidas:** o responsável atualizou o repositório por `git pull --ff-only`, avançando de `fa66344` até `da37777`, e executou `npm run build` (`tsc -b && vite build`) com sucesso, sem erros TypeScript, Vite 6.4.4, 1.646 módulos e conclusão em 16,96 s. Gerou `dist/assets/index-B6WLIc76.css` (54,06 kB, gzip 11,61 kB) e `dist/assets/index-sMGo1U0N.js` (508,16 kB, gzip 144,24 kB). Aviso de chunk acima de 500 kB não bloqueante.

Na captura da tela **Receitas** no `localhost:5173`, os cartões mostram **`Adicionar em 16/10`** e **`Escolher horário · 16/10`**, confirmando a exibição da data efetivamente selecionada. Como a captura mostra o meio da página, **não há evidência visual ainda do painel e do seletor superiores** nem da atualização dinâmica do botão ao mudar o dia. Não confundir o dia selecionado (16/10) com o dia do relógio.

**Resultado:** Git, TypeScript, build e **rótulo com data nos cartões aprovados**. **Pendente somente nesta correção:** captura mostrando o painel `Dia escolhido para o cardápio`, troca de 16/10 para outro dia livre (sem gravar nenhuma receita) e botão apresentando a nova data. O fluxo de proteção contra substituição foi implementado, mas não exercitado no navegador; não informar homologação funcional dessa confirmação.

**Não repetir:** builds, teste automatizado de ingredientes, soma de azeite ou catalogação. Este registro é documental; não altera as 119 receitas, a lista de compras ou qualquer planejamento. PR #16 continua draft, sem merge.


## Homologação dos botões após troca da data de destino — 17/10/2026

O responsável apresentou nova captura de `localhost:5173` na página **Receitas**, após a captura anterior com destino **16/10**. Nos mesmos cartões do catálogo autoral, agora aparecem as ações **`Adicionar em 17/10`** e **`Escolher horário · 17/10`**.

**Conclusão:** demonstrada a **atualização da data exibida nos botões** ao passar do destino 16/10 para 17/10, sem cadastrar nova refeição. O build Windows do commit `da37777` já havia sido aprovado (Vite 6.4.4, TypeScript sem erros).

A captura mostra os cartões, **não o seletor de datas situado acima deles**. Portanto a aparência/uso direto desse seletor e o fluxo de confirmação antes de substituir uma refeição permanecem sem evidência visual específica; não há necessidade de repetir a simples troca de data nos botões. O objetivo central da correção — deixar claro o dia da inclusão no próprio botão — está **homologado**.

Este registro é exclusivamente documental. Não alterar os planos, receitas ou marcações, nem repetir build, fase 3F ou testes já aprovados. PR #16 segue aberto em rascunho, sem merge.
