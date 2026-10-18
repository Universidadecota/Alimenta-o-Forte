# Costa&Costa — Homologação consolidada da Fase 1 (18/10/2026)

**Base:** Prompt Mestre da plataforma Costa&Costa; leitura da branch `feat/revisao-alergenos-fase1-12out2026` (App.tsx, planner.ts, shoppingProgress.ts, suggestions.ts, RecipeDetails.tsx e CI); capturas do preview de 18/10. **Não é certificado de produção.** PR #16 deve permanecer draft, sem merge.

## Semáforo de aceite — critérios originais

| # | Critério do Prompt Mestre | Evidência verificada | Estado |
| - | - | - | - |
| 1 | Criar conta e acessar | Interface autenticada observada em preview; fluxo completo de criação não testado nesta auditoria | Parcial |
| 2 | Completar perfil | Preferências consultadas em `user_preferences` no App; onboarding end-to-end não testado | Parcial |
| 3 | Criar cardápio de sete dias | Navegação semanal e persistência implementadas em `planner.ts`; preview mostra semana e refeições | Parcial |
| 4 | Adicionar receitas em todas as categorias habilitadas | `recipeFitsSlot` separa refeições, saladas, ceias e lanches; cobertura integral não demonstrada | Parcial |
| 5 | Trocar almoço de quarta sem alterar outros dias | `saveMeal` altera dia/slot específico; teste real com segunda conta pendente | Parcial |
| 6 | Ajustar porções | Ajustes nas receitas estruturadas; piloto com medidas não revistas preserva rendimento original | Parcial por limitação explícita |
| 7 | Lista consolidada | `consolidateShopping` e `collectPilotShopping` distinguem unidades e ambiguidade; compras visíveis nas capturas | Parcial |
| 8 | Marcar produtos comprados | `shoppingProgress.ts` grava e lê por usuário/semana; reconciliação após alteração implementada, falhas de rede não simuladas ponta a ponta | Parcial |
| 9 | Salvar receita favorita | Não comprovado nos arquivos analisados | **Pendente de auditoria** |
| 10 | Sair e entrar sem perder dados | Supabase usado para planejamento e compras; teste de reautenticação não documentado | Pendente |
| 11 | Segundo usuário não acessa dados privados do primeiro | RLS precisa ser conferido por políticas e teste real de acesso cruzado; ausência de prova não significa falha | **Bloqueador de liberação** |
| 12 | Navegação no celular | Interface mobile implementada; não há evidência de teste sistemático em telas pequenas | Pendente |
| 13 | Persistência após recarga | Arquitetura com Supabase; recarga real do fluxo completo não documentada | Pendente |
| 14 | Botões principais funcionam | Há handlers nas telas principais; nenhuma varredura integral foi homologada | Pendente |

## Prioridade de resolução

**P0 — segurança e dados antes do piloto:** isolamento por RLS (incluindo compras, cardápio e imagens privadas); autenticação/recuperação de acesso; persistência após novo login e troca de dispositivo; reação a falhas de conexão sem estados enganadores.

**P1 — integridade funcional:** sequência editar cardápio → recalcular compras → marcar → recarregar → navegar semanas; não herdar marcações antigas; classificação de receitas e porções no piloto; verificar visualmente a seção expansível no celular.

**P2 — completude do Prompt Mestre:** favoritos; funções ainda não comprovadas (exportação PDF/impressão/compartilhamento, opções de cardápios); navegação final mobile-first; PWA; documentação LGPD para lançamento comercial.

## Observações verificadas

- `src/lib/planner.ts` oferece 6 horários e salva os dados em `meal_plans` / `planned_meals`.
- `src/lib/shoppingProgress.ts` lê `shopping_lists` / `shopping_list_items` por usuário e semana; usa nome, unidade e quantidade para identificar marcações.
- `src/lib/suggestions.ts` recusa sugestão automática na presença de alergias cadastradas sem informação verificada de alérgenos.
- `src/RecipeDetails.tsx` mostra ingredientes originais e um bloco expansível de medidas/segurança.
- `.github/workflows/ci.yml` define build e testes unitários; sucesso no deploy Vercel não equivale a prova de que todos os testes do Actions foram executados.
- Capturas anteriores mostram catálogo e compras no preview, mas não demonstram recuperação de sessão e isolamento multiusuário.

## Estratégia de homologação sem 1.000 testes manuais

1. Rodar CI automatizado e registrar status comprovado de cada job.
2. Criar testes automatizados de políticas RLS para duas contas e arquivos privados, sem usar dados reais de saúde.
3. Executar um único cenário controlado de ponta a ponta, com duas contas de teste e uma semana descartável, preservando o acervo original.
4. Corrigir apenas bloqueios P0/P1; não exigir revisão individual de cada ingrediente.
5. Preparar checklist de aceite do piloto pessoal, mantendo a comercialização fora do escopo até completar P0 e pendências regulatórias/editoriais.

## Proteções de alteração

Somente relatório documental nesta etapa; **nenhuma alteração** em banco, receitas, medidas nutricionais, imagens, `main` ou políticas RLS. Nenhum merge do PR #16.

## Anexo — Auditoria SQL somente leitura de RLS, vínculos e Storage (18/10/2026)

Inspeção executada diretamente no Supabase `gclhailalyrokvmkwllm`, sem alterar registros.

- `meal_plans`, `planned_meals`, `shopping_lists` e `shopping_list_items`: RLS habilitado, política `ALL` restrita a `user_id = auth.uid()` nos filtros e validação de gravação.
- `user_preferences`: RLS habilitado, políticas `SELECT`, `INSERT`, `UPDATE`, `DELETE` próprias por `user_id = auth.uid()`.
- `profiles`: RLS habilitado, `SELECT` e `INSERT` próprios por `id = auth.uid()`.
- `planned_meals`: chave estrangeira composta `(user_id,meal_plan_id) → meal_plans(user_id,id)`, evitando associar refeição ao cardápio de outro usuário; porções restritas a 1–20.
- `shopping_list_items`: chave estrangeira composta `(user_id,shopping_list_id) → shopping_lists(user_id,id)`; quantidade positiva e unidades enumeradas em CHECK.
- Bucket `personal-recipe-images`: privado, política de `SELECT`, `INSERT` e `DELETE` requer a primeira pasta de nome do arquivo igual ao `auth.uid()`; só arquivos WebP até 2 MiB.
- Bucket `recipe-illustrations`: público para mídia ilustrativa; gravação e exclusão oficiais condicionadas a `cc_is_admin()` e caminho `official/{uuid}.webp`.

**Interpretação:** controles de isolamento e integridade estrutural encontrados. A inspeção de definições de políticas não substitui tentativa autenticada com duas contas independentes, auditoria de RPCs SECURITY DEFINER nem análise abrangente de todas as tabelas/buckets. Classificar a segurança de ponta a ponta como **parcial; aguardando homologação multiusuário**.

Nenhuma migration, `UPDATE`, `INSERT`, `DELETE` ou alteração de Storage foi executada.
