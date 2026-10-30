# Costa&Costa — Homologação funcional pós-transição para main
**Data-base:** 30/10/2026 · **Ambiente:** produção técnica em desenvolvimento · **Execução no Supabase:** SELECT, sem DML/DDL.

## 1. Cobertura do banco já verificada

| Verificação somente leitura | Resultado no banco |
|---|---|
| RLS de recipes, recipe_ingredients, favorites, meal_plans, planned_meals, shopping_lists, shopping_list_items, user_preferences | Ativada |
| Receitas | 128, sendo 7 publicadas e 120 oficiais não publicadas |
| Favoritos persistidos | 12 |
| Cardápios/planos semanais | 9 planos, 156 refeições, 2 refeições fixadas |
| Listas de compras | 1 |
| Itens comprados persistidos | 0 |
| Preferências registradas | 4 |
| Revisões históricas de ingredientes | 1.072 |
| Refeições órfãs | 0 |
| Divergências de titularidade entre refeição e plano | 0 |
| Divergências de titularidade entre item e lista de compras | 0 |
| Favoritos ou refeições associados a receitas inexistentes | 0 |

**Ponto importante:** a lista de mercado é gerada no aplicativo com base nos ingredientes e nas refeições planejadas. `shopping_list_items` guarda as marcações realmente efetuadas como compradas. Uma lista sem itens gravados não significa, por si só, erro de geração.

**Integridade de titularidade:** os relacionamentos já são protegidos pelas chaves estrangeiras compostas:
- `planned_meals(user_id,meal_plan_id) -> meal_plans(user_id,id)`;
- `shopping_list_items(user_id,shopping_list_id) -> shopping_lists(user_id,id)`.

Não é necessária nem foi executada migração adicional para essas duas relações. O RLS das linhas também restringe `user_id=auth.uid()`. A verificação de permissões efetivas HTTP/JWT em cada usuário permanece uma etapa distinta.

## 2. Nova regressão obrigatória no CI

O script **já existente** `scripts/test-planner-shopping.mjs` estava exposto via `npm run test:pilot-flow`, mas não participava automaticamente de `npm run build`. Agora passa a rodar antes de `tsc -b && vite build`.

Este conjunto utiliza funções puras com stub do Supabase em memória. Confere:
- isolamento entre sessões no carregamento de receitas e preferências;
- dias e seis espaços de refeição, inclusive lanches e ceia;
- fixação de refeições e preservação dos itens fixados na sugestão semanal;
- preferências, substituições e filtragem de alergênicos (falha fechada quando não há pré-triagem);
- compras derivadas do cardápio, total de ingredientes medidos, notas para opcionais e ingredientes a gosto;
- não inferir quantidades de ingredientes piloto sem revisão editorial;
- alteração da chave de compra quando a quantidade muda, evitando reaproveitar checkboxes de semana modificada;
- impressão do cardápio, ingredientes e lista de compras;
- comportamento de recuperação de autenticação e seleção de sugestões.

**Limite:** são testes automatizados de lógica de negócio, **não** uma execução HTTP com contas reais, nem uma prova da segurança de todas as RPCs.

## 3. Matriz de aceitação funcional ainda necessária com usuários controlados

| Perfil | Ação manual | Critério de aprovação |
|---|---|---|
| Anônimo | Abrir página pública e diagnóstico `/?diagnostico-acesso=1` | Sem fontes, revisões ou receitas oficiais privadas |
| Usuário comum | Entrar, consultar catálogo e favoritos, gerar semana e acessar Compras | Somente receitas publicadas e próprias; sem menu Administração; sua lista e preferências persistem após recarregar |
| Administrador | Entrar, revisar catálogo/edição e acessar diagnóstico | Administração disponível, rascunhos privados preservados e protegidos; não publicar conteúdo em revisão |
| Ambas as contas | Alternar sessões e recarregar | Nenhum cardápio, favorito ou item comprado migra para outra conta |
| Administrador | Ajustar apenas uma receita de teste sem evidência vinculada, caso necessária | IDs existentes preservados; edição protegida por snapshot; nenhum ingrediente histórico substituído |
| Usuário com alergia | Gerar sugestão semanal controlada e abrir receitas | Preferência por opções sem o alergênico declarado; alertas visíveis, sem afirmar segurança absoluta |

**Esses testes manuais não são marcados como concluídos neste relatório.** Para evitar alteração não solicitada, não houve criação/exclusão de usuários, cardápios, ingredientes, compras ou favoritos. A comercialização permanece pendente de decisão do responsável.

## 4. Publicação e critérios
- Integração do teste na `main` apenas após o workflow do GitHub (testes + compilação) passar.
- A Vercel deverá confirmar READY para o **mesmo commit da main**; o deploy do domínio não deve ser promovido sem essa verificação.
- Não alterar políticas RLS nem tabelas de produção por observações de contagem que não constituam bug.
- Caso uma das sessões encontre alerta, registrar a categoria e a contagem sem guardar JWT, e-mail ou dados pessoais; corrigir e revalidar o cenário específico.

**Referências técnicas:** `scripts/test-planner-shopping.mjs`, `src/lib/planner.ts`, `src/lib/shopping.ts`, `src/lib/shoppingProgress.ts`, `src/lib/flowReadiness.ts`, `src/AccessSecurityDiagnostics.tsx`.
