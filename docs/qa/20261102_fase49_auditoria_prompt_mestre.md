# Costa&Costa — Fase 49 | Auditoria de aderência ao Prompt Mestre

**Referência:** Prompt Mestre “Costa&Costa — Plataforma inteligente de alimentação e vida saudável”, entregue pelo responsável, incluindo as 21 seções e os 14 critérios de aceite da Fase 1.  
**Data-base:** 02/11/2026. **Código auditado:** `main@b24a074a3bb6f80143f33c75b77ab6698d0b6a20` (Fase 47). **Fase 48:** PR #57 aberto em draft; captura do cabeçalho e dos dois primeiros pareceres na prévia; não incorporado.  
**Fontes:** árvore e arquivos reais do GitHub, SQL SELECT/metadata do Supabase e homologações anteriores documentadas.  
**Natureza:** diagnóstico documental, **sem deploy, merge, edição de receitas, RLS, autenticação, banco ou dados pessoais**.

## 1. Resumo executivo

**Direção correta, produto incompleto.** O núcleo de receitas, cardápio e compras existe e foi bastante aprimorado entre 27/10 e 02/11, mas o Prompt Mestre descreve um produto maior: perfil completo, acompanhamento de evolução, hábitos, jornada de 30 dias, conteúdo educativo e, posteriormente, assistente operacional e assinatura. A simples existência de uma função ou tabela **não certifica aceite ponta a ponta**.

- **Núcleo com implementação e evidências:** login/onboarding, geração/edição de refeições de sete dias, seis horários, biblioteca de receitas, favoritos, alimentos, compras, registro de comprado e PDF.
- **Limitadores da Fase 1:** porções do acervo piloto não redimensionadas com segurança; lista ainda requer revisão de medidas; navegação final sem Perfil; testes móveis e de duas contas não completados como matriz integral; catálogo de terceiros e direitos/conteúdo ainda sob gates editoriais.
- **Módulos ausentes do escopo principal:** Evolução (medidas/fotos/gráficos), Jornadas de hábitos de 30 dias, Educação alimentar organizada e Assistente Costa&Costa.
- **Comercialização:** não autorizada. A diretriz histórica de 18/10 é de **beta gratuito completo** para testadores autorizados, sem cobrança, preservando a distinção entre conteúdo interno e publicação comercial.

## 2. Base real — evidência coletada

### Código e infraestrutura
- React + TypeScript + Vite: `src/main.tsx`, `src/App.tsx`, `vite.config.ts`; Supabase `src/lib/supabase.ts`, `src/lib/planner.ts`.
- Menu atual: **Início / Cardápio / Receitas / Alimentos / Compras** (+ Administração condicional); destino do prompt: **Início / Cardápio / Receitas / Evolução / Perfil**, com compras e alimentos como acessos rápidos secundários.
- `src/AuthGate.tsx` dá acesso a login, registro e recuperação. `src/Onboarding.tsx` grava objetivo, gostos, aversões, alergias, tamanho da casa e tempo de preparo.
- `src/lib/planner.ts` possui 7 dias, 3 refeições principais + lanches/ceia opcionais. `src/App.tsx` oferece troca, cópia, movimentação e preservação de fixados.
- `src/RecipeDetails.tsx` implementa favoritos; `src/App.tsx` usa `favorites`, além de preferências e compras persistidas.
- `src/lib/shopping.ts` e `src/lib/weeklyPrint.ts` diferenciam quantidades estruturadas e trechos piloto; `src/lib/shoppingProgress.ts` mantém os comprados em leituras não destrutivas, após regressão corrigida na Fase 45.
- PWA: `index.html` não declara manifest e a árvore auditada **não contém manifest nem Service Worker**; a presença de CSS responsivo não significa que seja instalável. Suporte real Android/iPhone exige teste.
- `vercel.json` define build `npm run build`, `dist` e rewrite SPA; o pipeline `.github/workflows/ci.yml` executa os scripts de regressão. Devem ser preservados.

### Supabase — agregados em 02/11 (SELECT, sem dados pessoais)
| Indicador | Valor |
|---|---:|
| Receitas cadastradas | **128** |
| Publicadas | **7** |
| Não publicadas | **121** |
| Receitas pessoais (subset do total) | **1** |
| Ingredientes associados | **1.157** |
| Alimentos cadastrados | **197** |
| Refeições planejadas (todos os planos do ambiente) | **177** |
| Planos semanais | **10** |
| Favoritos persistidos | **12** |
| Registros de lista de compras | **2** |
| Itens comprados persistidos | **2** |
| Preferências de usuários | **4** |

No conjunto de onze tabelas-base inspecionadas (`profiles`, `user_preferences`, `food_items`, `recipes`, `recipe_ingredients`, `meal_plans`, `planned_meals`, `shopping_lists`, `shopping_list_items`, `favorites`, `cc_shopping_decisions`), **RLS está ativa em todas** e há políticas registradas. **Isso não prova isolamento efetivo de todas as RPCs, Storage e contas.** A estrutura SQL consultada não mostra as tabelas finais previstas para `body_measurements`, `progress_photos`, `habit_programs`, `habit_checkins`, `educational_contents`, `meal_logs` e `notifications`. Ausência dessas tabelas específicas não exclui implementações alternativas, mas a árvore de interfaces também não mostrou módulos operacionais correspondentes.

## 3. Matriz das 21 áreas do Prompt Mestre

Legenda: **PRESENTE** = evidência de módulo/fluxo no código; **PARCIAL** = escopo ou homologação incompletos; **NÃO IDENTIFICADO** = código/tabelas equivalentes não localizados. Nenhum rótulo substitui teste real.

| # | Área | Diagnóstico em 02/11 | Diferença principal |
|---:|---|---|---|
| 1 | Objetivo principal | **PARCIAL** | Alimentação/planejamento fortes; evolução/hábitos não entregues |
| 2 | Identidade visual | **PARCIAL** | Marca e paleta presentes; modo escuro, contraste e mobile final não homologados |
| 3 | Navegação | **PARCIAL** | Falta Perfil e Evolução na estrutura de cinco áreas desejada |
| 4 | Cadastro e perfil | **PARCIAL** | Login/onboarding presentes; edição duradoura do Perfil, campos extras e privacidade incompletos |
| 5 | Dashboard inicial | **PARCIAL** | Refeições, data e atalhos; falta resumo de hábitos/evolução |
| 6 | Planejador semanal | **PARCIAL** | 7 dias/6 horários, geração, troca, cópia, movimentação, favoritos de receitas; faltam modelos de semanas anteriores, conclusão da refeição e porções piloto seguras |
| 7 | Cardápio diário | **PARCIAL** | Acesso e edição do dia; marcar refeição realizada ainda não comprovado |
| 8 | Biblioteca de receitas | **PARCIAL** | Catálogo, busca, fotos, favoritos, receitas pessoais e edição; taxonomia completa, padronização, revisão de conteúdo e compartilhamento faltam comprovação |
| 9 | Biblioteca de alimentos | **PARCIAL** | 197 registros, busca/categorias; dados nutricionais e revisões qualificadas incompletos |
| 10 | Lista de compras | **PARCIAL** | Consolidação conservadora, decisões, comprado, PDF e cópia; redimensionamento, estoque, ajustes livres, WhatsApp e precisão ainda não atendidos integralmente |
| 11 | Evolução | **NÃO IDENTIFICADO** | Registro privado de medidas, gráficos, fotos, sono e energia |
| 12 | Jornada 30 dias | **NÃO IDENTIFICADO** | Lições, check-ins, progresso e continuidade sem penalidades |
| 13 | Conteúdos educativos | **NÃO IDENTIFICADO** | Biblioteca editorial e gestão de conteúdos publicados |
| 14 | Jejum educativo opcional | **NÃO IDENTIFICADO** | Seção educativa segura, sem protocolo automático |
| 15 | Assistente Costa&Costa | **NÃO IDENTIFICADO** | Comandos sobre dados reais e confirmação antes de gravar |
| 16 | Painel administrativo | **PARCIAL** | Curadoria e nutrição bem desenvolvidas; faltam gestão completa de usuários/conteúdo/jornadas e relatórios |
| 17 | Arquitetura | **PARCIAL** | React/TS/Supabase/RLS/Vercel; PWA e vários modelos de dados pendentes |
| 18 | Confiabilidade e UX | **PARCIAL** | Recuperação de acesso, persistência e responsividade no código; faltam provas de instalação PWA, LGPD, acessibilidade e mobile amplo |
| 19 | Implementação por fases | **PARCIAL** | Fase 1 avançada; Fase 2 e Fase 3 não concluídas |
| 20 | Critérios de aceite | **PARCIAL** | Matriz dos 14 cenários com evidências e testes ainda pendentes no arquivo JSON desta auditoria |
| 21 | Entregáveis técnicos | **PARCIAL** | Documentação/CI/planos/arquitetura presentes; falta entrega consolidada de UX e manual de operação do beta |

## 4. Os 14 critérios de aceite da Fase 1

A matriz rastreável completa está em **`docs/qa/20261102_fase49_aceite_prompt_mestre.json`**. Não confundir **código existente**, **testes unitários/integração**, **capturas do piloto** e **aceite E2E completo**.

| # | Critério | Implementação | Situação de aceite |
|---:|---|---|---|
| 1 | Cadastro e acesso | Presente | Fluxos anteriores exercitados; validação controlada final |
| 2 | Completar perfil | Parcial | Falta Perfil permanente, completar/editar |
| 3 | Semana de 7 dias | Presente | Semana piloto observada; teste E2E isolado |
| 4 | Receitas em categorias | Parcial | Cobertura de todas as categorias habilitadas |
| 5 | Trocar almoço de quarta | Presente | Teste atômico do slot específico |
| 6 | Ajustar porções | Parcial | Bloqueio honesto do piloto; redimensionamento seguro pendente |
| 7 | Compras consolidadas | Parcial | 35 revisões e porções ainda limitam a lista definitiva |
| 8 | Marcar comprado | Presente | ✓ leite de coco e ✓ azeite preservados; cenário ligado/desligado |
| 9 | Favoritar receita | Presente | Implementação + 12 favoritos persistidos; revalidar conta-teste |
| 10 | Logout/login sem perda | Parcial | Persistência de alguns fluxos observada; ciclo completo pendente |
| 11 | Dois usuários isolados | Parcial | RLS e testes de módulo; E2E/RPC/Storage abrangente pendente |
| 12 | Navegação em celular | Parcial | CSS móvel disponível; iOS/Android e acessibilidade não aceitos |
| 13 | Recarregar sem perda | Parcial | Compras e decisões verificadas; todos os fluxos pendentes |
| 14 | Sem botões decorativos | Parcial | Fluxos centrais têm handlers; varredura de todas as telas pendente |

**Conclusão de aceite:** nenhum teste adicional foi executado simulando usuário final real nesta Fase 49. Não emitir rótulo “14/14 aprovados” nem liberar beta geral/comercial por este relatório.

## 5. Riscos e gates para o beta

### P0 — segurança, saúde e direitos
1. **Alérgenos:** pretriagem e alertas não garantem ausência de alergênicos, derivados ou contato cruzado. Confirmar a defesa nos limites do servidor e a revisão especializada antes de oferecer sugestões como seguras. Não afirmar segurança clínica.
2. **Preparos e direitos:** as 121 receitas não publicadas não devem ser liberadas globalmente por conveniência. Preservar direitos/condições de origem, status editorial e aprovação responsável. A Fase 48 contém dossiê de proposta, **não aprovação**.
3. **Privacidade:** realizar testes efetivos de conta 1 × conta 2 incluindo Storage e RPC; planejar consentimento, exportação e exclusão LGPD antes de novos dados de saúde/fotos.
4. **Integridade de compras:** manter guarda contra DELETE em leitura; não inferir ovos, xícaras, porções ou ingredientes sem evidências.

### P1 — fechar Fase 1 do Prompt Mestre
5. **Perfil permanente:** edição de preferências, alergias e rotina com salvamento/retomada seguros; somente dados necessários.
6. **Porções e compras:** desbloquear cálculos somente após receita estruturada, validar unidades compatíveis e mostrar limite quando impossível.
7. **Homologação em dispositivos:** 14 cenários E2E, tela pequena, teclado, acessibilidade e PWA instalável (manifest e estratégia de SW/offline sem armazenar conteúdo sensível indevidamente).
8. **Beta controlado:** definir e testar acesso `admin` / `beta_tester` / usuário comum no servidor. Verificar o que os 7 conteúdos publicados e 121 rascunhos permitem a cada perfil, sem abrir o acervo por RLS ou `published` sem aprovação.

### P2 — completar a promessa “Sua evolução”
9. **Evolução opcional:** criar modelo e interface privados para medidas, energia/sono e registros; fotos somente em Storage privado e com opção de exclusão. Evitar cobrança psicológica, métricas compulsivas e diagnósticos.
10. **Hábitos e jornada 30 dias:** aulas curtas, check-ins voluntários, retomada e indicadores sem punição.
11. **Educação alimentar:** acervo editorial com status rascunho/revisão/publicado, referências revisadas e moderação.

### P3 — inteligência e negócio
12. **Assistente operacional:** leitura de dados autorizados, ferramentas restritas, preview e confirmação antes de alterar plano ou compras; controles contra prescrições e informações médicas não verificadas.
13. **Comercialização:** estrutura de planos e assinatura **desligada no beta**, liberada somente após aceite, termos, proteção de dados e segurança de conteúdo.

## 6. Plano de trabalho recomendado (próximos incrementos)

| Sequência | Entrega verificável | Condição de saída |
|---|---|---|
| **49 (esta)** | Diagnóstico atualizado + matriz 14/14 rastreável + prioridades | Documento revisado, sem deploy |
| **50** | Perfil do usuário e consentimentos básicos, respeitando RLS | Editar preferências e retomar em sessão/dispositivo de teste |
| **51** | Testes E2E de Fase 1 + mobile/PWA de base | Matriz aceite com links de evidência; nenhuma alteração em conta real |
| **52** | Conferência de porções e compras com fonte estruturada | Subtotal confiável somente para ingredientes elegíveis |
| **53** | Evolução privada e opcional (modelo + UX) | RLS, isolamento multiusuário, exportação/exclusão e acessibilidade |
| **54** | Jornada de hábitos de 30 dias e conteúdos educativos | Check-ins voluntários, retomada e painel de curadoria |
| **55+** | Assistente operacional e teste do beta controlado | Confirmação explícita antes de escrever dados; revisão de segurança |

A numeração acima é um **roteiro proposto**, não licença para pular P0 nem autoriza publicação. A conclusão da Fase 48 depende de homologação própria em PR #57.

## 7. Cenário único sugerido de teste de aceitação (sem risco ao catálogo)

Usar **duas contas descartáveis**, receitas próprias de teste e uma semana futura sem dados reais. Cenário: cadastro → onboarding → criar semana de 7 dias → adicionar/trocar um almoço de quarta → aplicar porções permitidas → gerar compras → marcar/desmarcar → favoritar → atualizar navegador → logout/login → trocar para segunda conta e conferir ausência de dados da primeira → repetir no celular → registrar erros de controle. Testes especializados de RLS/Storage e alergias permanecem separados. Não publicar rascunhos nem alterar permissões do acervo como parte desse teste.

## 8. Critério de comercialização

**Não comercializável ainda, por decisão de prudência técnica e conteúdo:** faltam módulos do Prompt Mestre e validações essenciais de porções, segurança alimentar, direitos, privacidade e UX. O próximo objetivo é **beta gratuito completo controlado**, nunca liberar o conteúdo privado como atalho. A administração deve continuar protegida por autorização no servidor, não só pela interface.

## 9. Referências internas cruzadas

- `docs/qa/20261014_prompt_mestre_fase1_auditoria_arquitetura.md`
- `docs/qa/20261018_fase1_homologacao_consolidada.md`
- `docs/qa/20261018_diretriz_beta_gratuito_completo.md`
- `docs/qa/20261027_auditoria_prompt_inicial_beta.md`
- `docs/qa/20261030_homologacao_funcional_producao.md`
- `docs/qa/20261102_fase47_triagem_precisao_compras.md`
- PR #57 da Fase 48 em draft, prévia administrativa separada.

**Escopo executado na Fase 49:** leitura de código, auditoria SQL somente leitura, documentação e matriz automatizável. **Nenhuma alteração de produção, migração, conteúdo nutricional, receitas, permissões, usuários ou marcação de compra.**
