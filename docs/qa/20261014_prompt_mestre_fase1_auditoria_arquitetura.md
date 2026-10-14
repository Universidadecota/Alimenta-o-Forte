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

## Validação visual do Início e correção de sobreposição (14/10/2026)

O proprietário compilou `ce43818` no Windows com `npm run build` (TypeScript + Vite, 1636 módulos e nenhum erro). Duas capturas do navegador na conta principal mostram data **quarta-feira, 14 de outubro**, objetivo **Comer melhor**, **1/3 refeições planejadas hoje**, **1/21 na semana**, almoço `[Exemplo] Frango com arroz, feijão e salada`, preparo de 35 minutos e 3 porções; café da manhã e jantar aparecem corretamente como não planejados. As informações são consistentes com o planejamento testado no Cloud.

**Resultado:** dados do Dashboard e apresentação desktop aprovados visualmente. Links ainda não foram clicados pelo proprietário; navegação funcional e responsividade em celular continuam pendentes.

**Ajuste após captura:** a antiga barra fixa `session-bar` de `AuthGate.tsx` encobria cartões ao rolar. O controle de conta e o botão Sair foram integrados ao cabeçalho de `App.tsx`, com estilo responsivo em `src/styles.css`; CSS flutuante antigo removido de `src/auth.css`. O botão mantém `supabase.auth.signOut()`. Mudança no GitHub, **ainda sem teste visual local nem build local subsequente**; status Vercel era pendente na última consulta.

**Próximos passos:** `git pull --ff-only`, `npm run build`; confirmar que a conta não sobrepõe o conteúdo ao rolar; clicar em `Ver meu cardápio`, `Lista de compras` e `Ver receita`; testar no celular ou emulado. Não executar merge do PR #16 antes de outras regressões e revisão do histórico de migrações.

## Resultado de homologação visual e regressão do build (14/10/2026)

O proprietário enviou quatro capturas de localhost:5173 após sincronização da branch até `6da5acc`:
- O Dashboard Início exibe **1/3 refeições hoje** e **1/21 na semana**, com o almoço demonstrativo de frango/arroz/feijão/salada, **35 minutos e 3 porções**.
- O atalho **Ver receita** abriu o detalhe da receita correta, incluindo ingredientes e preparo.
- O atalho **Ver meu cardápio** abriu o planejador semanal com quarta-feira 14/10 selecionada e a refeição correspondente.
- O atalho **Lista de compras** abriu a lista simples de 4 ingredientes, preservando a marcação de Alface 150 g; a barra de sessão deixou de encobrir o conteúdo nas capturas.

**Compilação local encontrou erro de TypeScript TS18047 em `src/App.tsx` (Supabase possivelmente nulo no callback `onClick` da ação Sair).** Isso não é evidência de falha da autenticação em execução; é restrição de nulidade do compilador dentro de closure JSX. Correção aplicada no commit `b19dd6b`: `supabase.auth.signOut()` → `supabase?.auth.signOut()`. Pendente repetir `npm run build` local e validar logout sem regressão. PR #16 ainda sem merge; banco sem alterações nesta etapa.

## Planejador diário — cópia de refeição na mesma semana (14/10/2026)

**Novo incremento implementado na branch, ainda pendente de homologação local:**
- `src/CopyMealAction.tsx`: seletor de dia de destino (outro dia da semana atual) e botão **Copiar refeição**, exibido somente quando o período selecionado contém receita.
- `src/App.tsx`: conserva receita e quantidade de porções na cópia, requer confirmação antes da gravação e informa explicitamente quando o destino já está ocupado. Usa `saveMeal` + `loadWeek` sob usuário autenticado, com o RLS e as validações existentes. O dia de origem não é modificado.
- Perfis com alergia/intolerância recebem no diálogo o alerta sobre ausência de revisão de segurança da receita. O sistema **não** afirma que a cópia é segura para o perfil.
- Alterações pendentes bloqueiam temporariamente navegação entre dias/semanas. Atualização do cardápio antes de confirmar a persistência.
- `src/styles.css`: layout adaptado a celular/desktop.
- **Sem nova tabela nem migração**. Não modifica a interface simples de compras nem abre funcionalidade de compra parcial.

### Teste manual recomendado
1. Conta principal, semana 12–18/10: quarta-feira 14/10 possui almoço `[Exemplo] Frango com arroz, feijão e salada` com **3 porções**; quinta-feira 15/10 deve estar vazia antes do teste.
2. No almoço de quarta, selecionar `quinta-feira, 15 de outubro` em **Copiar almoço para** e clicar **Copiar refeição**.
3. Conferir confirmação (incluindo alerta de alergia para esta conta), aceitar; ir a quinta 15/10 e verificar o almoço **igual e com 3 porções**.
4. Voltar a quarta 14/10 e conferir a receita de origem intacta. Recarregar com `Ctrl+Shift+R` e conferir ambos os dias.
5. Voltar a quarta e repetir a cópia para quinta; **cancelar** a confirmação. Confirmar que a quinta não mudou.
6. Em Compras, conferir a consolidação proporcional de ambos os dias. **Não desmarcar compras** sem intenção: marcadores continuam sendo semanais e por ingrediente/unidade.
7. Para restabelecer o estado anterior do teste, selecionar quinta 15/10 e retirar somente o almoço do dia pela caixa de seleção original, com atenção para não alterar quarta.

**Não homologado até execução real:** compilar `npm run build` no Windows, navegação no celular, persistência e comportamento de substituir um destino já ocupado. A função **Mover refeição** e operações entre semanas não foram implementadas neste incremento.


### Resultado do primeiro teste de cópia — interface e Cloud

**Evidência recebida em 14/10/2026:** o usuário executou `git pull --ff-only` até `c11a885` e compilou `npm run build` com sucesso (`tsc -b && vite build`, 1637 módulos, 34,17 s, sem erros). Na captura de localhost, a **quinta-feira 15/10** tem 1/3 refeições, almoço `[Exemplo] Frango com arroz, feijão e salada`, 35 min, **3 porções**; a quarta 14/10 também aparece com 1/3.

**Conferência somente de leitura diretamente no Supabase Cloud:** a conta principal possui a mesma receita no slot `lunch`, com **3 porções**, em **segunda 12/10, quarta 14/10 e quinta 15/10**. A consulta comprovou que quarta e quinta coexistem e a cópia foi persistida no banco. A segunda-feira também está preenchida; não assumir que foi preenchida por este teste, pois não foi solicitado e a origem não está demonstrada. Nenhum dado foi modificado pela conferência.

**Aceite parcial aprovado:** compilação local, cópia para quinta, preservação da quarta e persistência no banco. **Ainda falta:** repetir visualização após `Ctrl+Shift+R`, testar cancelamento de substituição e conferir consolidação das compras. Não declarar que todas as variações de cópia estão homologadas.

### Persistência após recarregar — cópia quarta para quinta

O proprietário enviou duas capturas adicionais após o teste de atualização da página no localhost:5173. A primeira mostra quarta-feira, 14/10, com o almoço `[Exemplo] Frango com arroz, feijão e salada` e **3 porções**; a segunda mostra quinta-feira, 15/10, com a **mesma receita e 3 porções**. Ambos os dias apresentam 1/3 refeições, e a segunda-feira 12/10 também apresenta 1/3 — informação já existente no Cloud, que deve ser preservada.

**Aceite aprovado:** cópia entre dias da mesma semana com persistência após atualização de página e preservação do dia de origem. Confirmado anteriormente por consulta ao Cloud na mesma conta e agora pela interface recarregada.

**Ainda pendente:** verificar cancelamento do diálogo de confirmação sem gravação; substituição intencional de destino ocupado; consolidação da lista simples com múltiplas refeições; teste responsivo. Não confundir esta aprovação específica com homologação de toda a Fase 1.

### Cancelamento da cópia — homologação por interface e Cloud (14/10/2026)

O proprietário selecionou **quarta-feira 14/10** como origem, escolheu **terça-feira 13/10** como destino e acionou **Copiar refeição**. A primeira captura mostra o diálogo de confirmação detalhando receita, **3 porções**, destino correto e alerta sobre **alergia/intolerância à soja, sem validação de ausência de contaminação cruzada**. O usuário cancelou; na segunda captura terça-feira permaneceu com **0/3 refeições** e almoço sem receita.

**Conferência read-only no Supabase Cloud:** para a conta principal, a semana 12–18/10 continua contendo somente os almoços de **segunda 12, quarta 14 e quinta 15**, todos com a receita demonstrativa de frango/arroz/feijão/salada, **3 porções**. Não existe almoço planejado para terça 13. **Aprovado:** cancelamento não grava no destino nem remove a origem. O aviso de alergia está presente, mas não comprova segurança alimentar.

**Próximo teste sugerido:** consolidar a lista de ingredientes da semana com 3 ocorrências da receita × 3 porções, sem modificar refeições nem marcações. Quantidades teóricas: Alface 450 g, Arroz 720 g, Feijão 900 g, Peito de frango 1350 g (assumindo 50, 80, 100 e 150 g por porção na receita demonstrativa). A conclusão depende da conferência da interface.

### Compras consolidadas após copiar três almoços — aprovado (14/10/2026)

Captura do aplicativo localhost:5173 na aba **Compras**, semana de 12 a 18/10, mostra **quatro ingredientes distintos**, todos com as quantidades esperadas após a cópia de refeições: **Alface 450 g**, **Arroz 720 g**, **Feijão 900 g**, **Peito de frango 1350 g**. Os três almoços iguais foram confirmados no Cloud na consulta anterior, cada um com 3 porções. O aplicativo preservou a caixa marcada de Alface, e as outras três permaneceram desmarcadas.

**Aprovado no cenário:** soma proporcional de ingredientes de três receitas iguais na mesma semana, consolidação sem duplicar linhas e preservação visual da marcação de comprado após a mudança do planejamento. Não houve mutação de dados para elaborar esta verificação. **Não testado aqui:** botão `Copiar lista`, mescla de unidades diferentes, destinos já ocupados, uso em celular real, acessibilidade e demais requisitos da Fase 1.
