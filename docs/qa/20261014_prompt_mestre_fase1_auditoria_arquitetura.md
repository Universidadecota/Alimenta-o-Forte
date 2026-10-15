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

### Cópia da lista para área de transferência — aprovado (14/10/2026)

O proprietário utilizou **Copiar lista** na aba Compras e colou o conteúdo no **Bloco de Notas do Windows** (`Ctrl+V`). A captura confirma exatamente quatro linhas: `Alface: 450 g`, `Arroz: 720 g`, `Feijão: 900 g`, `Peito de frango: 1350 g`. Acentos preservados, quatro ingredientes sem duplicações, quantidades consistentes com os três almoços planejados. **Aprovado** o caminho copiar→colar neste navegador/ambiente Windows.

Com esta evidência, os testes principais da lista simples de compras (geração, consolidação, ajuste por porções, marcação persistente, isolamento e cópia de texto) estão **aprovados nos cenários demonstrados**. Permanecem no escopo do Prompt Mestre, mas **não foram homologados**: adicionar/remover itens manuais, editar quantidades individualmente, retirar itens disponíveis em casa, compartilhar/exportar PDF/imprimir, converter outras unidades e reutilizar semanas. Evitar afirmar homologação total da seção 5 enquanto tais funcionalidades não estiverem implementadas ou validadas. A decisão de não implementar compras parciais permanece em vigor.

## Planejador diário — mover refeição entre dias, operação atômica

**Implementação na branch de homologação em 14/10/2026:**
- `src/CopyMealAction.tsx` disponibiliza **Copiar refeição** e **Mover refeição** usando o mesmo seletor de destino, somente para outro dia da mesma semana.
- `src/App.tsx` exibe um diálogo explícito informando que **mover remove a refeição da origem**. Quando o destino está ocupado, a receita atual aparece no aviso de substituição. Se houver alergias cadastradas, o diálogo inclui alerta de que a receita não foi avaliada como segura.
- `src/lib/planner.ts` chama a RPC `cc_move_planned_meal`, validando usuário autenticado, semana e porções. Após sucesso o aplicativo recarrega o plano do Supabase. Se a leitura falhar após uma transferência confirmada, orienta recarregar a página.
- `supabase/migrations/20261014190000_cc_move_planned_meal_atomic.sql` implementa uma única transação PostgreSQL por chamada: valida `auth.uid()` com RLS e `SECURITY INVOKER`, trava o plano e as linhas do período, verifica a origem e a versão previamente exibida do destino, substitui o destino somente após confirmação e atualiza a data da origem. Falhas revertidas pelo banco, sem cópia parcial. A função aceita apenas três slots ativos e destinos dentro da semana corrente; não apaga outros slots ou semanas.

**Aplicação Cloud:** migração remota `20261014212241` — `cc_move_planned_meal_atomic_cloud`. O arquivo versionado e o histórico remoto usam carimbos diferentes; **a reconciliação do histórico permanece pendente antes de qualquer `db push`**.

**Homologação SQL transacional, sem criar dados permanentes:**
1. Mover para um dia vazio — `PASS`, receita e 3 porções preservadas, origem eliminada.
2. Mover para um dia com outra receita — `PASS`, somente a origem transferida permanece no destino, sem duplicados.
3. Origem desatualizada — `PASS`, operação rejeitada.
4. Outra conta tentando transferir a receita alheia — `PASS`, operação rejeitada por separação de titularidade/RLS.

Os registros dos testes foram inseridos apenas em uma transação com `ROLLBACK`. **Pós-teste:** 24 `planned_meals`, 2 `meal_plans`, 1 marcação de compras e **zero planos temporários de QA**. Permissão de execução apenas para `authenticated`; `anon` não pode executar. Vercel retornou **success** para o commit `470ac28` com a interface e integração, mas a compilação no Windows e os testes de interface **ainda são pendentes**. Não houve merge do PR #16.

**Testes manuais ainda necessários:** usar um almoço existente para mover a terça-feira vazia, confirmar origem vazia/destino com as mesmas porções e persistência após `Ctrl + Shift + R`; depois testar **Cancelar** quando o destino está ocupado, sem alterar os dias; checar recálculo da lista simples de compras. Se desejar preservar o estado inicial do cardápio, pode mover de volta com confirmação. Evitar alterações nas refeições de outros dias.


## Refinamento de UX — ações contextuais no planejador

**Motivação:** após testar a transferência de quarta 14/10 para terça 13/10, o proprietário confirmou a mudança: **terça 13 tem 1/3 refeições, almoço com 3 porções; quarta 14 tem 0/3**, e compilou `3c68650` no Windows com sucesso. Apesar do comportamento funcional, avaliou que o seletor e os botões Copiar/Mover visíveis permanentemente tinham aparência pouco profissional. Solicitou visual mais limpo e ações reveladas ao passar o mouse sobre a refeição.

**Ajuste implementado na branch:**
- `src/CopyMealAction.tsx` mantém as mesmas operações `onCopy` e `onMove`, sem alterar chamadas ao Supabase, porções ou confirmações;
- Desktop com mouse: dois ícones discretos aparecem ao passar o cursor sobre a linha de refeição ou ao dar foco via teclado, com rótulo acessível e `title`;
- Toque/celular: um único ícone de três pontos, sempre acessível, abre as opções Copiar e Mover;
- Ao escolher a ação, formulário compacto revela apenas a escolha do dia, o botão Continuar e texto explicativo. Exige selecionar explicitamente um dia de destino. O botão Fechar/Escape cancela a ação na interface, sem alterar o cardápio;
- `src/styles.css` remove o bloco antigo de botões permanentes e adiciona comportamento responsivo e foco de teclado. Avisos de alergias, confirmação pré-gravação e operação transacional do banco continuam preservados.

**Estado:** commits de componente `c2c5acb` e CSS `93c524e`; status Vercel **success** em `93c524e`. **Ainda faltam** `npm run build` no Windows, inspeção visual no computador e em modo mobile/touch, e verificação de interação. Não movimentar de novo refeições reais apenas para validar a aparência. PR #16 permanece sem merge.


## Ajuste final do planejador — popover sem deslocamento de layout

O usuário enviou duas capturas do planejador de terça-feira, 13/10, ao testar o novo menu contextual: os ícones **Copiar** e **Mover** apareceram perto da refeição; ao clicar em **Mover**, o painel de seleção do destino foi exibido e a quarta-feira ficou selecionável. Nenhuma confirmação final foi mostrada; não é evidência de nova movimentação.

**Avaliação UX:** a versão anterior já reduzia os controles visíveis, porém o formulário aberto ainda aumentava a altura da linha e deslocava visualmente as refeições. Foi implementado um ajuste de **posicionamento flutuante** (`src/styles.css`, commit `48ba4a2`): formulário e menu de toque posicionados em sobreposição, acompanhados de elevação visual e controle de recorte da lista enquanto abertos. `src/CopyMealAction.tsx` marca o estado `is-open` também no menu de toque (commit `86f8584`). As ações de copiar/mover, confirmação de alergias e transação SQL permanecem inalteradas.

**Status:** Vercel retornou `success` para `48ba4a2`. **Pendente**: `npm run build` no Windows e captura do menu flutuante aberto no navegador; verificar celular e acessibilidade antes de aprovar o novo visual. Não executar nova transferência de refeição para validar um ajuste puramente visual.


## Validação visual do popover — desktop (14/10/2026)

O proprietário enviou captura de `localhost:5173` com **Cardápio**, terça-feira 13/10, almoço de frango, e ação **Mover refeição** aberta após as alterações até `7f3b9bc`. O popover é sobreposto ao cartão, **sem aumentar a altura da linha ou deslocar o jantar**. O seletor nativo de destino abriu e listou os demais dias, com o botão de continuar inativo até selecionar um dia. Os ícones de Copiar e Mover aparecem discretos ao lado do almoço.

**Avaliação visual desktop: aprovada no cenário exibido.** Não foram feitos novos movimentos de refeições nem mudanças no banco neste teste; a captura não atesta o comportamento em telas de toque ou o clique fora do popover. Testes mobile, teclado, foco, Escape e saída por clique externo permanecem para a bateria de acessibilidade/responsividade. **Decisão de produto:** não dedicar mais ciclos a este refinamento no desktop antes de avançar nas necessidades essenciais da Fase 1.


## Refeições opcionais — três períodos adicionais (15/10/2026)

**Decisão autorizada pelo proprietário:** incluir lanche da manhã, lanche da tarde e ceia como períodos **opcionais**, sem tornar seis refeições obrigatórias e sem poluir o visual do Cardápio.

**Verificação de compatibilidade feita no Supabase Cloud antes da mudança:** a restrição `planned_meals_slot_check` já permite `breakfast,lunch,dinner,morning_snack,afternoon_snack,supper`; nenhuma nova tabela ou alteração de constraint é necessária. Catálogo de receitas existente: quatro cafés, dois almoços, dois jantares e uma receita de categoria `snack`. O catálogo guarda o **tipo da receita**, que não é a mesma coisa que o horário em que a receita é planejada.

**Alterações versionadas:**
- `src/lib/planner.ts`: diferencia `RecipeCategory` (inclui Lanche) de `Slot` (6 períodos do dia). `slots` mantém os três principais para sugestões e contadores; `optionalSlots` guarda os três adicionais; `daySlots` define a ordem cronológica. Conversão de leitura/gravação usa os seis códigos realmente aceitos no Cloud.
- `src/App.tsx`: painel `Adicionar lanche ou ceia` exibe opcionalmente os outros três campos; eles ficam recolhidos quando vazios, mas permanecem visíveis quando já planejados, mesmo com o painel recolhido. Os dias mostram os três principais + indicador de opcionais existentes. Escolha em receitas de categoria `Lanche` leva à seleção explícita do período antes de gravar. O gerador da semana só troca café, almoço e jantar; mensagem explicita que as refeições opcionais já gravadas permanecem.
- `src/lib/shopping.ts`: consolidação usa os seis períodos, mantendo a lista de ingredientes simples. Não inclui compras parciais.
- `src/HomeDashboard.tsx`: mantém indicador das três refeições principais, mas mostra cartões dos opcionais quando existem e indica o total de opcionais planejados.
- `src/PersonalRecipeForm.tsx`: cadastro de receita continua classificando receitas nas quatro categorias originais, sem criar categoria incompatível de banco.
- `src/styles.css`: controles opcionais discretos e responsivos.
- `supabase/migrations/20261015002000_cc_move_optional_slots.sql`: extensão mínima da RPC transacional de Mover para aceitar os três códigos opcionais, preservando RLS e checagem de titularidade. Aplicada no Cloud como `cc_move_optional_slots_cloud`.

**Verificações executadas:** Vercel retornou `success` no commit `8838727`. SQL temporário, transação `BEGIN/ROLLBACK`, demonstrou movimentação de `morning_snack` com duas porções e gravação dos três slots opcionais. Conexão via RLS `authenticated`; função é `SECURITY INVOKER`, executável por `authenticated` e não por `anon`. Conferência pós-teste: 24 refeições reais, 2 planos reais, 1 marcador de compra, 0 planos de QA e 0 refeições opcionais reais (ainda não cadastradas). Nenhuma receita ou preferência real foi modificada nesses testes.

**Pendente para homologar no Windows:**
1. `git pull --ff-only` e `npm run build`; conferir sem erros.
2. Na semana 12–18/10 abrir **Cardápio** e mostrar `Adicionar lanche ou ceia`. Sem clicar, a tela inicial deve manter só as três refeições principais; após clicar, os 3 horários extras devem aparecer.
3. Selecionar uma receita da categoria `Lanche` em um slot opcional (após conferir ingredientes/alergênicos e confirmar o aviso de segurança), salvar 1 porção e verificar após `Ctrl+Shift+R`.
4. Recolher horários não preenchidos e confirmar que o opcional preenchido continua visível.
5. Conferir que a lista de compras inclui seus ingredientes consolidados; o indicador de refeições principais segue `n/3`, com opcionais identificados separadamente.
6. Confirmar opção Mover/Copiar no período opcional, apenas após testes visuais básicos; confirmar persistência e isolamento entre contas.
7. Testar mobile e ações por teclado. **Não declarar Fase 1 concluída antes das pendências da matriz de aceite.**

**Limites:** os lanches não são sugeridos automaticamente (a biblioteca ainda tem dados demonstrativos e não verificados). Não prometer ausência de alérgenos nem qualquer resultado clínico. Não realizar `supabase db push` ou merge PR #16 antes da reconciliação dos históricos de migrações local/remoto.
