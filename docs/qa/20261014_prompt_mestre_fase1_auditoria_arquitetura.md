# Costa&Costa — Mapa, arquitetura e auditoria de Fase 1
**Referência:** Prompt Mestre Costa&Costa recebido em 14/10/2026. **Branch de trabalho:** `feat/revisao-alergenos-fase1-12out2026`. **PR #16:** permanece sem merge.

## 1. Decisões de escopo e produto
- Não reconstruir o aplicativo do zero. Continuar React 18 + TypeScript + Vite 6 + Supabase Cloud, com RLS.
- Prioridade absoluta: cardápio semanal/diário, receitas, lista automática de ingredientes, autenticação, persistência, privacidade e mobile.
- Lista de compras **simples**: mostra ingredientes consolidados conforme porções, com marcação comprado/não comprado por pessoa e semana. Não implementar comércio de alimentos, registro de compras parciais, saldos ou estoque. Esta decisão revoga a experiência experimentada em 14/10.
- Conteúdo de alimentação é educativo. Sem inventar nutrição, prescrever dietas nem prometer segurança para pessoas com alergias. A sugestão automática permanece bloqueada em perfis com alérgenos cadastrados enquanto não houver revisão adequada.
- Para fases futuras, construir somente bases quando necessárias: evitar menus e botões sem ação. Manter revisão de UX e segurança antes de incorporar Evolução e Perfil na navegação final.

## 2. Mapa de navegação
**Situação implementada:** navegação Início, Cardápio, Receitas, Coleção EDV e Compras; administração adicional se a conta possuir permissão. Em telas pequenas, barra inferior responsiva para as opções atuais.

**Destino do Prompt Mestre:**
```
Público
  → Apresentação → Entrar / Criar conta / Recuperar senha
  → Onboarding (preferências e alergias; opcional onde possível)
Autenticado: navegação final
  Início → refeições reais de hoje → abrir cardápio / receita / compras
  Cardápio → semana → dia → refeição → receita / substituição / porções
  Receitas → biblioteca → detalhe → adicionar ao cardápio
  Evolução (Fase 2) → registros e gráficos privados
  Perfil (Fase 1, pendente) → dados e preferências / privacidade
Atalhos secundários
  Compras → ingredientes da semana → marcar / copiar
  Biblioteca de Alimentos (Fase 1, pendente)
  Coleção EDV (conteúdo existente; manter rótulos de demonstração)
  Favoritos (conflito de fase: indicado na Fase 2, mas no aceite da Fase 1)
  Administração (somente administradores; conteúdo editorial)
Fase 2: Jornada 30 Dias, Educação, favoritos, fotos privadas e evolução
Fase 3: assistente inteligente, assinaturas e administração avançada
```
**Observação:** o menu final de cinco abas ainda não está pronto. Não expor atalhos vazios para Evolução, Perfil ou Biblioteca.

## 3. Arquitetura existente (inspecionada)
```
src/main.tsx → AuthGate.tsx (sessão Supabase, login/cadastro/reset, onboarding)
             → Onboarding.tsx (user_preferences)
             → App.tsx (navegação interna)
                ├── HomeDashboard.tsx (novo; refeições reais de hoje)
                ├── lib/planner.ts (loadWeek/saveMeal/removeMeal; 3 slots ativos)
                ├── lib/suggestions.ts (gerador com bloqueio por alergias)
                ├── RecipeDetails.tsx / PersonalRecipeForm.tsx
                ├── AdminRecipes.tsx
                ├── EdvCollection.tsx
                └── lib/shopping.ts + lib/shoppingProgress.ts
src/lib/supabase.ts → Supabase Auth / PostgREST / Storage
```
O frontend lê o cardápio real para montar as compras, sem armazenamento fictício quando o Cloud está configurado. As chaves administrativas não pertencem ao cliente.

### Modelo do Cloud confirmado em 14/10/2026
**13 tabelas `public` atuais, todas com RLS ativado:** `cc_admin_members`, `cc_recipe_allergen_reviews`, `meal_plans`, `planned_meals`, `profiles`, `recipe_ingredients`, `recipes`, `shopping_list_items`, `shopping_lists`, `source_recipe_review`, `subscription_plans`, `user_entitlements`, `user_preferences`.

**Ainda não há** tabelas `food_items`, `favorites`, `meal_logs`, `body_measurements` no Cloud. `cc_recipe_allergen_reviews` já existe na data desta inspeção, porém não há registros de avaliação editorial (0). A receita demonstrativa não deve ser rotulada como segura.

**Contagens de leitura**: 9 receitas, 22 refeições planejadas, 1 lista semanal e 1 marcação; 29 migrações registradas no histórico remoto. O histórico de migrações locais e remotas necessita reconciliação antes de qualquer `db push` ou merge.

O schema remoto possui opções para seis períodos em `planned_meals.slot`, mas o frontend `lib/planner.ts` apresenta somente café da manhã, almoço e jantar. A extensão para lanches opcionais deve ocorrer como etapa testada, sem refazer o banco às cegas.

### PWA
O `index.html` inclui metadados mobile e tema; `vite.config.ts` usa Vite básico. Não foram encontrados `public/manifest.webmanifest`, `public/manifest.json` nem `public/sw.js`; logo, **não está comprovada a instalabilidade PWA**. A afirmação no README ainda é objetivo técnico, não homologação.

## 4. Matriz de aceite da Fase 1 (evidência conservadora)
| # | Critério do Prompt Mestre | Estado | Próxima validação |
|---|---|---|---|
| 1 | Cadastrar e fazer login | Parcial | Login com duas contas testado; validar cadastro novo e recuperação de senha de ponta a ponta |
| 2 | Concluir perfil | Parcial | Onboarding implementado; validar atualização posterior e consentimentos de saúde |
| 3 | Planejar os 7 dias | Parcial | CRUD da semana existe; 21 refeições exercitadas localmente; testar fluxo completo no Cloud |
| 4 | Inserir receitas nas categorias ativas | Parcial | Receitas oficiais/pessoais existem; ampliar biblioteca e validar categorias requeridas |
| 5 | Trocar almoço de quarta sem afetar outros dias | Parcial | Substituições testadas anteriormente; repetir no Cloud com cardápio completo |
| 6 | Alterar porções | **Aprovado no cenário testado** | Quantidades proporcionais 2↔3 confirmadas no Cloud e UI |
| 7 | Gerar lista consolidada | **Aprovado no cenário testado** | Validar mais receitas, equivalência de unidades e categorias |
| 8 | Marcar ingredientes comprados | **Aprovado no cenário testado** | Persistência após reload e isolamento semanal/por usuário verificados |
| 9 | Salvar favorito | Não implementado | Resolver conflito de fase: o aceite exige, mas Fase 2 também inclui favoritos |
| 10 | Sair e entrar sem perder dados | Parcial | Testar logout/login dos registros da mesma conta em novo navegador |
| 11 | Impedir acesso cruzado | **Aprovado nos cenários testados** | Duas sessões reais verificaram leitura privada; testes SQL de escrita com RLS/FK, faltam regressões API |
| 12 | Navegação no celular | Parcial | Layout responsivo observado; testar Android/iPhone e acessibilidade |
| 13 | Dados após atualizar | **Aprovado nos cenários testados** | Revalidar porções, compras, receitas e preferências em fluxo combinado |
| 14 | Ações reais de todos os botões | Parcial | Inventário funcional por tela e verificação de erro/loading |

## 5. Primeira entrega incremental implementada agora
**Dashboard operacional (`src/HomeDashboard.tsx` + `App.tsx` + `styles.css`):**
- Apresenta data local em pt-BR e objetivo do onboarding convertido em texto legível.
- Exibe, a partir de `planned_meals` carregados, refeições de hoje e quantidade de refeições planejadas na semana (3×7 na versão atual).
- Mostra receita, preparo e porções apenas quando esses dados existem.
- Botões reais para abrir cardápio do dia, detalhe da receita cadastrada, lista de compras e receitas.
- Ao voltar para Início a partir de outra semana, reposiciona na semana atual; a tela mostra carregamento até os dados pertinentes estarem prontos.
- Projeto responsivo (3→2→1 colunas), contrastes, foco de teclado e mensagens de vazio/carregamento.
- Não cria tabelas, não altera RLS, não modifica cardápios existentes, e não depende de Docker.

**Status de validação:** código integrado ao PR #16, mas ainda requer `npm run build` e homologação visual com a conta real no PC. O status Vercel do último commit estava pendente quando consultado. Não afirmar conclusão do aceite apenas pela alteração no GitHub.

## 6. Próximos incrementos — ordem recomendada
1. **Homologar Início** com data e refeições reais no Cloud; testar navegação mobile e link para detalhe.
2. **Concluir o planejador diário**: horários opcionais, detalhes e ações de trocar/copiar/mover refeições com confirmação, mantendo persistência.
3. **Biblioteca de alimentos brasileiros**: schema e importação de fontes autorizadas, busca e associação com receitas; nutricionais apenas verificados.
4. **Perfil e preferências**: edição de preferências/alergias com revalidação segura dos planejamentos e proteção LGPD.
5. **Aprimorar receitas**: categorias, pesquisa, ações compartilhar/imprimir e revisar imagens/conteúdos demonstrativos.
6. **PWA/mobile e acessibilidade**: manifest, ícones, offline limitado seguro, acessibilidade e testes em dispositivos.
7. **Reconciliação das migrações + auditoria final do PR #16** antes de qualquer merge e ativação comercial.

**Limites:** Fase 2 e 3 permanecem futuras, salvo decisão expressa do usuário. Não introduzir funcionalidades de marketplace nem compras parciais.
