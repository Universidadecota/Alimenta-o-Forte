# Costa&Costa — Fase 2B | Base nutricional e vinculação de ingredientes
**Data:** 15/10/2026 · **PR #16:** rascunho, sem merge.

## Objetivo
Registrar composição nutricional **com referência e estado de preparo**, sem atribuir números imaginados; relacionar explicitamente ingredientes das receitas a alimentos; bloquear qualquer cálculo de receita com dados incompletos. **Não confundir classificação nutricional com validação de alergênicos.**

## Estado anterior e inventário
- 34 alimentos no catálogo público; todos `preliminary`, **0 valores nutricionais verificados**.
- 8 receitas oficiais com **33 registros de ingredientes**, mais uma receita pessoal (9 receitas ativas e 37 ingredientes no total).
- Nomes ambíguos: `Feijão` vs variedades; `Arroz` vs branco e estado cozido; `Iogurte natural` vs integral 10%; `Filé de peixe` vs espécies; medidas `lata`, `colher_sopa`, `cm`, `pitada`, `un`.
- Não existem equivalências universais seguras entre colher e grama ou entre unidade e massa comestível.

## Banco aplicado
Migração: `supabase/migrations/20261015193000_cc_food_nutrition_drafts_and_links.sql`, aplicada no Supabase como `cc_food_nutrition_drafts_and_links_cloud` (**sucesso**).
- `cc_food_nutrition_drafts`: revisão interna por alimento; estado (`raw/cooked/drained/prepared/packaged`), nome da fonte e referência de identificação, seis nutrientes por 100 g opcionais, notas, status de trabalho e autoria/data. **Valores só aceitos se acompanhados por fonte, identificação e estado de alimento; todos permanecem pendentes.**
- `cc_recipe_ingredient_food_links`: relação explícita por ingrediente de receita oficial, com status candidato/confirmado, justificativa, massa total em g **somente quando existe evidência**, e autoria/data. Alteração relevante no ingrediente invalida automaticamente o vínculo confirmado e a massa registrada. Excluir/reinserir ingredientes remove naturalmente links antigos via FK cascata; deve ser auditado no editor.
- Ambas as tabelas com RLS para administradores; sem privilégios a `anon`, sem policy de DELETE. Gatilhos e suas funções com acesso controlado.
- Adicionados **15 ingredientes comuns como `food_items` preliminares NÃO publicados**, preservando os 34 alimentos visíveis. Eles são rótulos editoriais novos, não dados nutricionais.
- Nenhum `nutrition_per_100g`, `nutrition_source` ou `nutrition_reviewed_at` alterado; **0 nutrientes verificados**.

### Conferência após aplicação (SQL somente leitura)
| Controle | Resultado |
|---|---|
| Alimentos totais | 49 |
| Publicados | 34 |
| Rascunhos nutricionais preenchidos | 0 |
| Vínculos registrados | 0 |
| RLS nas duas tabelas | ativa |
| Privilégios anônimos SELECT | negados |
| Policies | SELECT/INSERT/UPDATE autorizados apenas a `cc_is_admin()` |
| Simulação de usuário autenticado não administrador | `cc_is_admin() = false`; consultas retornam 0 nas tabelas |

A simulação foi feita em transação descartada (`ROLLBACK`); não substitui teste real de tentativa de gravação por sessão comum.

## Interface administrativa implementada no GitHub
- `src/FoodNutritionAdmin.tsx`: seção expansível **Base nutricional dos alimentos** em Gestão de Receitas Oficiais. Seleciona 49 alimentos (inclusive 15 rascunhos), cadastra valores opcionais **por 100 g**, fonte/título, referência/código/edição, URL HTTPS opcional, estado de preparo e pendências. **Salva só em `cc_food_nutrition_drafts`**, sem liberar conteúdo.
- `src/RecipeIngredientFoodLinks.tsx`: dentro da ficha técnica de cada receita oficial, permite relacionar cada ingrediente a um alimento, registrar motivo da correspondência, status candidato/confirmado e a massa total documentada para a receita. Nenhum vínculo inicial foi inventado ou selecionado automaticamente.
- `src/AdminRecipes.tsx` e `src/RecipeTechnicalSheet.tsx`: integração com os componentes de revisão; `src/styles.css`: responsividade das telas.
- `src/lib/recipeNutrition.ts`: motor matemático **conservador**, ainda não integrado à publicação. Só calcula quando todos os ingredientes necessários estão vinculados a fontes nutricionais verificadas, com massa e porções comprovadas. Em caso de falta, devolve `incomplete` com pendências; ingredientes opcionais requerem escolha explícita e ingredientes a gosto sem quantidade bloqueiam total definitivo. Mesmo resultado completo é `calculated_unreviewed`, não aprovação técnica.

## Fontes oficiais e próximos dados
- TACO/NEPA-UNICAMP, 4ª edição, 2011 (consulta/download no NEPA): https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/
- A TACO 4ª edição permite reprodução com citação de fonte em sua publicação; registrar código preciso do alimento, estado e edição antes de copiar qualquer valor.
- TBCA/USP, alternativa/complemento: https://www.tbca.net.br/ — conferir termos atuais de reprodução/uso antes de importação sistemática.
- Rotulagem e alergênicos em alimentos embalados devem respeitar referências ANVISA: https://www.gov.br/anvisa/pt-br/assuntos/alimentos/rotulagem

**Não transferir valores automaticamente por aproximação de nome.** Produtos embalados (leite de coco, iogurte, chocolate e adoçantes) podem requerer rótulos específicos; receita pronta exige avaliação de transformação no preparo.

## Homologação necessária
1. No PowerShell, `git pull --ff-only`, `npm run build`. Validar integração TypeScript antes de qualquer merge.
2. Administração → Gestão de Receitas Oficiais → **Base nutricional dos alimentos**: abrir o cadastro, selecionar Alface (sem números), confirmar que só aparecem campos em branco e fonte a preencher. **Não cadastrar números de teste** no banco de trabalho.
3. Administração → Chá Cremoso de Cúrcuma → Ficha técnica → **Ingredientes e Biblioteca de Alimentos**: conferir sete ingredientes e dropdown de alimentos; os links devem estar inicialmente sem correspondência e nenhuma massa inventada.
4. Verificar páginas no desktop e em 390 px; testar gravação de anotação apenas com fonte documental identificada. Nunca registrar alegação clínica nem marcar receita como segura.
5. Validar RLS com sessão comum e revisão de dados reais da TACO/rótulos com responsável técnico antes de ativar cálculo na interface pública.
6. Reconciliar histórico local/remoto de migrações antes de `db push`; PR #16 mantém-se em rascunho e sem merge.

**Fora do escopo desta fase:** preenchimento automático dos 49 alimentos, avaliação clínica, identificação exaustiva de alergênicos, aprovação profissional, exibição de macro/micronutrientes ao consumidor, mudanças em cardápios e compras.

## Build no Windows recebido — 15/10/2026

**Evidência fornecida pelo proprietário:** `git pull --ff-only` avançou a branch `feat/revisao-alergenos-fase1-12out2026` de `8b541f3` para `0c4081b` (fast-forward). O comando `npm run build` executou `tsc -b && vite build` com **Vite 6.4.4**, **1.644 módulos transformados** e conclusão em **19,95 segundos**, sem erros informados. Artefatos locais: `index-Dun_Ac1e.css` e `index-FfrrOIu9.js`.

**Resultado:** sincronização e compilação Windows **aprovadas**. Isso não comprova que os novos formulários carregam ou gravam corretamente no navegador. As próximas verificações ficam limitadas a (1) seção administrativa “Base nutricional dos alimentos” com campos inicialmente vazios e (2) vínculos de ingredientes na ficha técnica, com opções sem correspondência pré-selecionada. Não registrar nutrientes fictícios nem confirmar vínculos por aproximação.

**PR #16:** permanece aberto, em rascunho e sem merge; não executar `supabase db push` até conciliar o histórico de migrações.

## Homologação visual — telas de nutrição e vínculos no desktop

**Evidências:** três capturas do aplicativo local `localhost:5173`, fornecidas pelo responsável. Na Administração > Receitas oficiais:

- **Base nutricional dos alimentos:** a seção expansível abre e apresenta seleção de alimento, estado, andamento editorial, fonte, referência/código/edição, URL, seis campos de composição por 100 g e observações técnicas. Captura exibiu `Abobrinha` no seletor e campos nutricionais vazios. Estado `Cru` e andamento `Aguardando profissional` aparecem selecionados na interface, mas **não correspondem a registro gravado** no momento da auditoria; opções selecionadas sem salvamento não equivalem a revisão.
- **Vínculos com receitas:** a ficha do `Iogurte Turbo` apresenta seção de ingredientes e biblioteca. Contagem visual `0 de 8 correspondências editoriais confirmadas`. Primeira entrada corresponde às 4 colheres de sopa de iogurte integral; os seletores de alimento, andamento, justificativa, massa e fonte estão presentes e vazios, sem correspondência arbitrária.
- **Classificação de aceite:** carregamento e **renderização desktop aprovados**, não a validação funcional de gravação de rascunhos/vínculos, revisão profissional, acessibilidade em celular ou cálculo nutricional.

**Conferência independente em SQL (somente leitura) após as capturas:** 0 registros em `cc_food_nutrition_drafts`, 0 em `cc_recipe_ingredient_food_links`, 0 alimentos com `nutrition_per_100g` preenchido. Catálogo total 49, publicados 34; 9 receitas ativas, 37 ingredientes, 25 refeições planejadas. Nenhum dado de teste de nutrição/vínculo ficou salvo. As duas tabelas continuam sob RLS administrativa.

**Próximo passo:** revisão documental da composição em fonte primária (código, edição e estado cru/cozido), testes de gravação com informação editorial real e testes de permissões com conta comum. Não copiar dados por nomes genéricos nem publicar nutrientes preliminares. PR #16 permanece em rascunho e sem merge.

## Conferência da fonte primária antes da importação

A publicação primária **TACO (NEPA/UNICAMP, 4ª edição, 2011)**, disponível em https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf , foi consultada para definir o contrato de correspondência exata.

- No quadro de composição da página impressa **30**, a TACO diferencia claramente **Abobrinha italiana, crua** (identificador de linha 71) de **Abobrinha paulista, crua** (linha 73) e da mesma italiana **cozida** (linha 70) ou **refogada** (linha 72). O nome genérico `Abobrinha` de `food_items` não informa qual variedade/estado usar.
- A mesma página traz **Alface americana, crespa, lisa e roxa, todas cruas** (linhas 77–80). O nome genérico `Alface` não autoriza escolher uma arbitrariamente.
- Na página impressa **32**, há **Cenoura cozida** (linha 109) e **Cenoura crua** (linha 110): fonte exata exige identificação do preparo.

**Decisão:** nenhum desses números foi importado ou atribuído a alimentos genéricos nesta etapa. A próxima versão deve representar **variante/estado do alimento** na referência técnica, com código de origem, e só então permitir uso em cálculos com revisão; uma única linha de rascunho por nome genérico é insuficiente para armazenar simultaneamente as composições de cru e cozido. Manter `cc_food_nutrition_drafts` como cadastro preliminar até ampliar o esquema de variantes. Não confundir estado escolhido na tela com registro gravado.
