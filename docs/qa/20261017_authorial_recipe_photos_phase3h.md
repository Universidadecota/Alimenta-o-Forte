# Costa&Costa — Fase 3H: fotografias das receitas autorais

**Data:** 17/10/2026 · **Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** manter em rascunho, sem merge.

## Padrão editorial de imagem

O responsável perguntou o tamanho ideal para as imagens das receitas. Foi adotada a seguinte **recomendação**, sem obrigar o usuário a refazer imagens:

| Campo | Recomendação |
|---|---|
| Dimensões do original | **1200 × 800 px** |
| Orientação | Horizontal, proporção **3:2** |
| Formato ideal | **WebP** |
| Peso de trabalho recomendado | **150–400 KB**, sem degradar perceptivelmente a foto |
| Limite de entrada atualmente aceito | **12 MB** por foto |
| Tratamento já existente | redução para **máximo 1200 px no maior lado**, conversão no navegador para WebP (qualidade 0,83), rejeita resultado acima de **2 MB** |
| Enquadramento | prato principal centralizado e área de respiro nas bordas, pois os cartões usam `object-fit: cover` |
| Transparência | imagens geradas por IA devem permanecer sinalizadas como ilustrativas; imagens precisam representar o prato com fidelidade |

A proporção 3:2 é o compromisso entre a grade horizontal (com corte pela CSS) e a ficha completa/visualização ampliada; não é garantia de ausência de recorte em todos os dispositivos. O aplicativo não exige arquivos exatamente 1200 × 800, apenas recomenda essa origem.

## Risco de integridade identificado e corrigido

A interface antiga de Administração usava `cc_save_official_recipe` até para trocar uma foto. Essa RPC **apaga e reinsere todas as linhas de `recipe_ingredients`** na edição, portanto não deve ser usada para adicionar fotografias às **119 receitas autorais preservadas**; além do risco de regravar fragmentos, há validação de no máximo 40 ingredientes por essa RPC.

**Mitigação aplicada no Supabase** pela migration `supabase/migrations/20261017130000_cc_pilot_recipe_photo_only_phase3h.sql`, aplicada remotamente como `cc_pilot_recipe_photo_only_phase3h_cloud`:
- Nova RPC `public.cc_set_personal_pilot_recipe_photo(uuid,text,boolean)`, sob `SECURITY DEFINER`, com `search_path=''`, autorizada apenas para sessão autenticada administradora via `cc_is_admin()`.
- Confirma que a receita é oficial, não publicada e pertence ao `personal_pilot`. Aceita apenas uma URL `official/<uuid>.webp` no bucket oficial do Supabase ou `NULL` para remover foto.
- Atualiza **exclusivamente `recipes.url` e `recipes.image_is_ai`**. Não altera título, categoria, quantidade, ingredientes, preparo, rendimento, status de publicação nem fontes originais.
- Privilégio `EXECUTE` restrito a `authenticated`, combinado com checagem de administrador no corpo. Usuários anônimos e não administradores não podem alterar a foto por essa RPC.
- Teste SQL **transacional com ROLLBACK**: a conta administradora simulada executou a RPC mantendo URL e identificação da imagem sem mudança; hash/contagem das linhas originais de `recipe_ingredients` permaneceu igual. A conta não administradora foi rejeitada. Nenhuma foto nem dado do usuário foi modificado permanentemente neste teste.

**Mudanças no editor** `src/AdminRecipes.tsx`:
- Ao abrir uma receita do `personal_pilot`, os campos culinários tornam-se **somente leitura** (ingredientes e preparo podem ser consultados, mas não editados). O botão vira **Salvar somente fotografia**.
- A gravação da foto para piloto usa a nova RPC, nunca o salvamento editorial geral. Existe ainda conferência client-side de que os dados culinários originais não foram mudados.
- Exibe recomendação explícita **1200 × 800**, WebP e orientação horizontal.
- Para receitas oficiais que não pertencem ao piloto, mantém a gravação editorial anterior sem mudanças.
- `src/styles.css` acrescenta apresentação visual para o conteúdo protegido.

## Limites e próximos passos

- O bucket `recipe-illustrations` utiliza URLs públicas de imagem. **Receitas continuam privadas na aplicação, mas uma fotografia com URL conhecida poderá ser acessível fora dela**. Usar imagens sem segredos pessoais e revisar armazenamento/privacidade antes da comercialização.
- **Não foi feito envio de imagem real** e não foi realizado build Windows dos novos commits; não declarar homologação do frontend nem que o upload já foi testado.
- A rotina permite fotografias individuais por receita. Um fluxo de importação em lote para 119 fotos demandaria desenho próprio, consentimento e tratamento de nomes/associação, evitando associações erradas.
- **Próximo teste:** `git pull --ff-only`, `npm run build`; entrar em Administração → Gestão do catálogo de receitas, abrir uma receita do piloto e conferir que aparecem **Salvar somente fotografia** e campos culinários bloqueados. Antes de subir arquivos em massa, homologar um único upload com foto cujo nome corresponda à receita.
- Não repetir testes já homologados de filtro, ceias, compras e data de destino; não mesclar PR #16 antes da homologação.


## Homologação do build Windows e visual do editor — 17/10/2026

**Evidência enviada pelo responsável:** captura de `localhost:5173` na Administração, com a receita **Agrião com tiras de fraldinha e chimichurri** selecionada; log de `git pull --ff-only` avançando a branch de `da37777` até **`13a073b`** sem conflitos, seguido de `npm run build`.

- **Build aprovado**: `tsc -b && vite build`, Vite **6.4.4**, **1.646 módulos transformados**, sem erros TypeScript, concluído em **33,68 segundos**.
- Arquivos gerados: `dist/assets/index-DukKnRnr.css` **54,58 kB** (gzip **11,70 kB**) e `dist/assets/index-CQzZxyIJ.js` **510,21 kB** (gzip **144,81 kB**). Aviso Vite de chunk acima de 500 kB é **não bloqueante**.
- **Interface visual aprovada**: receita do piloto apresenta mensagem de proteção dos dados, título, tempo/rendimento, consultas somente leitura de ingredientes e preparo, seletor de fotografia, orientação **1200 × 800 px** e WebP, controle **Imagem ilustrativa gerada por IA**, status **Piloto pessoal · privado** e botão **Salvar somente fotografia**.
- **Consulta SQL somente leitura**: **119** receitas do `personal_pilot`, **0** publicadas e **0** com foto vinculada no momento da consulta; nenhuma fotografia real foi enviada nessa homologação.

**Resultado:** build e interface do editor de fotos **APROVADOS**; upload, persistência da URL, miniatura e exibição nos cartões/ficha **ainda não homologados**. Não solicitar novamente compilação ou captura da tela de proteção. Prosseguir com **uma única foto de teste**, apropriada para a receita escolhida, usando o seletor, a confirmação e **Salvar somente fotografia**; após salvar, conferir na biblioteca e na ficha a imagem, sem alterar ingredientes. Verificar persistência da URL no banco e ausência de mudança no conteúdo, antes de cadastrar as demais fotografias.

**Observação editorial secundária:** o texto de rendimento exibido na captura é `1 porções de referência`; ajustar a flexão singular/plural em um lote futuro, sem reabrir o teste de foto. PR #16 continua aberto em rascunho, **sem merge**.


## Primeira fotografia homologada no cartão e correção do rótulo IA — 17/10/2026

**Evidência visual enviada pelo responsável:** captura da página **Receitas**, `localhost:5173`, na qual a foto da receita autoral **Agrião com tiras de fraldinha e chimichurri** aparece no cartão correto, com enquadramento do prato, texto e botões legíveis. O cartão exibe `Imagem ilustrativa gerada por IA`; a abertura da ficha completa ainda não foi mostrada nessa captura.

**Conferência somente leitura no Supabase:**
- A receita continua **`published=false`** e associada ao `personal_pilot`.
- O campo `url` está presente e aponta para o Storage público oficial `recipe-illustrations/official/<uuid>.webp`; o objeto existe com MIME **`image/webp`** e tamanho **188.516 bytes**.
- A receita apresenta **13 registros de ingredientes**.
- Totais do acervo: **119** receitas piloto, **1** fotografia vinculada, **0** receitas piloto publicadas, **1.073** registros de ingredientes. A consulta foi somente leitura; não alterou os planejamentos, que somavam **30** registros no momento da verificação.

**Inconsistência detectada:** o campo persistido `recipes.image_is_ai` está **`false`**, mas `src/lib/planner.ts` anteriormente forçava `imageIsAi=true` para todas as receitas oficiais. Isso fazia a interface declarar que a foto era gerada por IA sem depender do dado armazenado, inclusive no catálogo autoral.

**Correção versionada:** `src/lib/planner.ts` passa a respeitar `image_is_ai` para as receitas do `personal_pilot` e receitas particulares; mantida a apresentação ilustrativa legada para as sete receitas oficiais antigas. **O banco não foi alterado e a procedência da imagem não foi inferida a partir da aparência.** Se a fotografia foi efetivamente gerada por IA, o responsável deve marcar `Imagem ilustrativa gerada por IA` no editor e salvar a foto/atribuição; se é uma fotografia convencional, a legenda deixará de ser exibida após o próximo build.

**Homologação:** upload/persistência no Storage e exibição da foto no cartão estão **aprovados**. **Pendentes:** novo build Windows da correção do rótulo, conferência visual do rótulo correspondente ao campo cadastrado e exibição na ficha completa. Não repetir o upload original nem modificar qualquer ingrediente, preparo ou planejamento.

**PR #16** permanece aberto, em rascunho, sem merge. As demais 118 fotos deverão ser cadastradas somente após validar o rótulo e a ficha.


## Correção da pré-visualização — quantidades textuais originais

**Relato e evidências:** em 17/10/2026 o responsável forneceu duas capturas da pré-visualização de **Carne moída refogada com couve e abacate**, mostrando linhas como `quantidade não informada — 150 g de carne bovina moída`, `quantidade não informada — ¼ de cebola`, `quantidade não informada — 1 dente de alho`. A redação era enganosa: o próprio fragmento já incluía uma quantidade, mas o componente antepunha uma etiqueta gerada de um campo numérico ainda não estruturado.

**Causa confirmada no código:** `src/AdminRecipes.tsx` aplicava `formatRecipeIngredient(item)` a todos os ingredientes, independentemente da fase de importação; `src/lib/ingredientMeasures.ts` traduz `quantity=null` ou `measure_mode='unspecified'` para `quantidade não informada`. A fonte original está salva em `cc_official_recipe_source_records.original_ingredients` e cada fragmento em `recipe_ingredients.name`.

**Auditoria SQL somente leitura:** entre os **1.073** fragmentos de ingredientes das **119** receitas do piloto, os **1.073** registros têm `quantity=NULL`; **747** já começam com números ou frações em `name`. Isso não prova que os demais 326 não tenham medidas; alguns são `sal`/`pimenta`, alternativas, expressões com outra gramática ou subpreparos. Os nove ingredientes da receita das capturas foram conferidos individualmente; todo o texto, incluindo as medidas de `150 g`, `¼`, `1 dente`, `2 folhas`, `1 colher (sopa)` e `½`, permanece cadastrado.

**Correção aplicada no GitHub:** `src/AdminRecipes.tsx` apresenta na pré-visualização das receitas do piloto **apenas cada expressão original `item.name`**, com aviso de que a medida está no texto e o redimensionamento automático ainda não foi disponibilizado. Receitas legadas estruturadas continuam com `formatRecipeIngredient`. Corrigido também singular/plural (`1 porção` no modal e `1 porção de referência` na leitura protegida). Não mudou receita, ingredientes, quantidade, modo de preparo, foto ou dia.

**Limitação e próxima etapa:** essa é uma correção de **exibição**, não uma migração de `quantity`/`unit` ou autorização de multiplicar porções. A estruturação quantitativa dos 1.073 fragmentos deve ocorrer **em estágio de revisão separado**, registrando texto literal, medida extraída, unidade original, ingrediente, opção/preparo e confiança editorial. Somente equivalências seguras podem ser confirmadas, sem sobrescrever a fonte, sem transformar ausência em zero e sem liberar cálculo nutricional. Priorizar os 747 prefixos numéricos e depois exceções do piloto.

**Homologação pendente:** executar uma vez `git pull --ff-only` e `npm run build` no Windows e reabrir a **mesma pré-visualização** de Carne moída. Esperado: `150 g de carne bovina moída`, `¼ de cebola`, `1 dente de alho`, etc., **sem prefixo** `quantidade não informada —`. Não reenviar foto, não repetir testes de compras nem alterar receitas. PR #16 permanece aberto, em rascunho, sem merge.


## Evidência visual final — pré-visualização, ficha e ampliação

O responsável apresentou três capturas de `localhost:5173` em **17/10/2026**, usando a receita autoral **Agrião com tiras de fraldinha e chimichurri**.

- **Pré-visualização administrativa**: lista mostra as expressões originais como `150 g de fraldinha`, `1 colher (chá) de manteiga`, `2 punhados de agrião`, `¼ de cebola roxa` e os componentes do chimichurri, **sem o prefixo incorreto `quantidade não informada`**. Renderiza `25 minutos · 1 porção`, comprovando também a correção de flexão singular.
- **Ficha completa**: mostra a foto, identificação da receita, ingredientes originais e modo de preparo, mantendo o esclarecimento de que não há redimensionamento automático das porções.
- **Ampliador de imagem**: exibe a fotografia em formato horizontal sem distorção perceptível, com identificação da receita na legenda.
- A foto exibida já tinha sua existência WebP e URL confirmadas no Supabase em leitura anterior. Estas imagens não comprovam a origem por IA; respeitar o valor expresso do campo `image_is_ai`, sem inferir.
- O teste original sugeria também verificar **Carne moída refogada com couve e abacate**; esta captura usa outra receita do mesmo componente administrativo. **O comportamento de renderização comum foi demonstrado**, sem afirmar um novo teste dessa outra receita.

**Status**: apresentação literal dos ingredientes do piloto, singular da porção, exibição na ficha e ampliação da foto **homologados visualmente**. O build/console desta captura não foi fornecido; não atribuir resultado novo de compilação. Não repetir o upload, o zoom nem a exibição do modal.

**Pontos editoriais a alinhar posteriormente, sem alterar dados:** a legenda administrativa ainda fala em `receita proveniente de material fornecido para uso pessoal`, embora o projeto já registre autoria declarada. A ficha ainda declara que não há `soma automática na lista de compras`, embora as Fases 3F/3G tenham somas **parciais e conservadoras** de medidas equivalentes. Ajustar a redação para comunicar corretamente que **somente a soma segura parcial existe** e que a estruturação completa/reescala de porções ainda não está disponível. Manter receitas e fotos intactas.

**Próxima fase sugerida**: inventário e extração estruturada revisável das quantidades textuais de 1.073 fragmentos, sem sobrescrever os `name` originais ou assumir equivalências inseguras. PR #16 deve permanecer aberto, em rascunho, sem merge.
