# Costa&Costa — Fase 3A–3C: Acervo pessoal de 119 receitas e 172 alimentos do piloto
**Data:** 15/10/2026 · **Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** draft/sem merge.

## Pedido do responsável
Uso **pessoal por cerca de três meses**, com possibilidade de comercialização futura somente após decisão posterior. Material-fonte: **6 PDFs** de quatro semanas de cardápios, dez saladas proteicas, dez lanches e dez ceias. O responsável proibiu alterar ingredientes, preparo, alternativas, quantidades e receitas. Não atribuir as receitas a dias; permitir escolha livre no cardápio pessoal.

## Importação realizada no Supabase (auditada)
- Criada e aplicada migração `supabase/migrations/20261016100000_cc_official_recipe_sources_pilot_3a.sql`: tabela `cc_official_recipe_source_records` com RLS somente para administrador autenticado, fonte exata, página, dia apenas **da fonte** (sem criar agendamento), ingredientes originais, preparo, duração, rendimento e checksum de cada receita.
- Foram registradas **119 receitas oficiais NÃO publicadas** na tabela `recipes` (`published=false`, `owner_user_id=NULL`) vinculadas a **119** fontes preservadas.
- Distribuição: **84 refeições semanais (4×21)**, **10 saladas**, **10 lanches**, **10 ceias**, **5 molhos caseiros adicionais**. **114** podem ser escolhidas no planejador, cinco molhos servem somente como preparos complementares (não como refeição diária).
- A importação foi feita **diretamente no Supabase**, em lotes transacionais de um documento cada, com checagem de índice e hash para evitar substituição indevida de receita existente. **O texto integral dos PDFs não foi enviado ao GitHub**; foi produzido arquivo JSON de backup particular no ambiente da conversa.
- `recipe_ingredients` contém **1.073 expressões originais** divididas conservadoramente por vírgula; quantidade/medida ainda `unspecified`. A **fonte textual completa** é a verdade, e o front do piloto apresenta ingredientes originais, sem alegar ter convertido colheres, unidades, xícaras ou alternativas em medidas consolidadas. **Lista de compras automática:** não somar essas expressões até revisão editorial e estruturação individual; apresentar texto original por receita como conferência manual.
- Os seis PDFs incluem recomendações, dicas e receitas complementares; as instruções de cada receita foram preservadas, mas orientações gerais continuam nos documentos originais (que não foram publicados no repositório).

## Alimentos cadastrados
- Criada e aplicada migração `supabase/migrations/20261016110000_cc_pilot_food_registry_phase3b.sql` com tabela de vínculo `cc_pilot_food_registry` (RLS administrativa).
- Inventário inicial **172 nomes de alimentos/ingredientes do conjunto de PDFs**: **148 novos** em `food_items`, **24 já existentes** reaproveitados, registrados na tabela de piloto.
- Após a carga, a biblioteca contém **197 alimentos totais**, **34 publicados (anteriores)** e **163 não publicados**. Os novos permanecem **`editorial_status=preliminary`, `published=false` e `nutrition_per_100g=NULL`**. Não marcar alimentos como clinicamente seguros, aceleradores confirmados ou nutricionalmente aprovados.
- O inventário é uma **primeira revisão de nomes**, ainda exige reconciliação de sinônimos, tipos de peixe/carne, produtos de embalagem, formas cruas/cozidas e opções de ingredientes. Não atribuir nutrientes por correspondência genérica ou sugerir substituições automáticas.

## Disponibilização no uso pessoal, sem publicação comercial
- `src/lib/planner.ts`: quando `cc_is_admin()` é verdadeiro, busca as 114 receitas do piloto na tabela privada e permite que o administrador as selecione. Usuários comuns veem somente receitas públicas e suas próprias receitas. Cada receita mantém seu subtipo e texto original.
- `src/App.tsx`: seleção por **Café da manhã, Almoço, Jantar, Lanche da manhã, Lanche da tarde, Ceia**. As saladas do PDF podem ser escolhidas em almoço **ou** jantar; lanches somente em horários de lanche; ceias exclusivamente no horário de ceia; o título do PDF não define a data em que o usuário consumirá a receita.
- `src/RecipeDetails.tsx`: mostra os ingredientes e o tempo **originais** no modo piloto, sem converter ou multiplicar quantidades que não foram estruturadas. As porções da fonte ficam visíveis; escolher uma porção de planejamento não reescreve o PDF.
- `src/lib/shopping.ts`: ingredientes de receitas piloto ainda não estruturadas ficam em **observações para conferência manual**, nunca somados em compras com quantidades fictícias. Para receitas antigas estruturadas, a consolidação anterior permanece.
- `src/lib/suggestions.ts`: **não** incorpora rascunhos do piloto à geração automática de semana enquanto ingredientes não estiverem validados. A escolha **manual** no cardápio continua liberada.
- `src/lib/foodLibrary.ts` e `src/FoodLibrary.tsx`: o administrador pode consultar os alimentos preliminares com indicação de uso pessoal; usuários comuns continuam vendo somente alimentos `published=true`.
- `supabase/migrations/20261016120000_cc_planner_private_pilot_admin_guard_phase3c.sql`: substitui função guard do planejamento para permitir **somente** que um administrador autenticado planeje uma receita oficial não publicada identificada como `personal_pilot` para o **próprio usuário**. Demais regras originais mantidas.

## Verificação de integridade (SQL)
| Item | Encontrado |
|---|---:|
| Registros com fonte original | 119 |
| Planejáveis manualmente | 114 |
| Molhos complementares não planejáveis | 5 |
| Receitas do piloto publicadas | **0** |
| Receitas do piloto não publicadas | **119** |
| Expressões de ingredientes preservadas em linhas | 1.073 |
| Alimentos do inventário piloto | 172 |
| Alimentos totais | 197 |
| Alimentos publicados anteriormente | 34 |
| Nutrientes publicados no catálogo de alimentos | **0** |
| Refeições planejadas preexistentes | **25**, preservadas |

Conferência amostral de textos no banco: `Omelete de espinafre e tomate` (10 min, porção 1), `Salada Cobb completa` (25 min), `Leite dourado de coco` (ceia, 8 min), `Molho Caesar sem queijo` (molho, 5 min). Os seis documentos possuem índices consecutivos e nenhum preparo vazio. Teste de inserção de refeição piloto sob conta administradora em transação `BEGIN/ROLLBACK` executado sem erro, sem registro permanente.

## Pendências/limites antes de comercializar
1. **Homologar o build Windows** (`git pull --ff-only`, `npm run build`) e o acesso visual em **Receitas**, **Cardápio** (salada em jantar, ceia só em ceia) e **Alimentos**. Ainda não declarar interface homologada.
2. Conciliar os 172 nomes: alimentos/variedades específicas e opções "ou" dos PDFs; estruturar individualmente as 1.073 expressões em unidades corretas, sem inventar gramas nem substituições, antes de habilitar soma automática e redimensionamento.
3. Verificar custos, notas de rótulo e ingredientes compostos (molhos, maionese), riscos de alimentos crus, alergênicos e contato cruzado com profissional habilitado. **Não alterar o texto original dos PDFs**; adicionar notas editoriais separadas quando necessárias.
4. Preparar acesso multiusuário pago, direitos de uso do conteúdo, termos, LGPD, perfil de alergias e revisão técnico-profissional **somente em fase comercial posterior**. Nenhum resultado de saúde individual ou promessa de emagrecimento pode ser inferido do material.
5. Manter PR #16 aberto/draft; harmonizar migrações aplicadas no Supabase com repositório antes de deploy/merge.
