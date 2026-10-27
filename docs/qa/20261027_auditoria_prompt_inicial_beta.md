# Costa&Costa — aderência ao Prompt Mestre e próxima revisão editorial

**Data:** 27/10/2026  
**Base:** Prompt Mestre anexado pelo responsável (11/10/2026), código da branch
`feat/revisao-alergenos-fase1-12out2026`, registros QA anteriores e validações
informadas pelo responsável. **PR #16 permanece em draft, sem merge.**

## Resumo executivo

O desenvolvimento permanece alinhado ao núcleo da proposta: **planejador semanal,
receitas e compras**, sobre React/TypeScript e Supabase, com identidade Costa&Costa.
Isso **não equivale à conclusão integral** do Prompt Mestre nem do Beta gratuito
completo decidido em `docs/qa/20261018_diretriz_beta_gratuito_completo.md`.

Esta análise distingue código existente, testes comunicados pelo responsável,
pendências de homologação e funcionalidades não localizadas. Nenhum status
`implementado` é usado como sinônimo de teste ponta a ponta nesta auditoria.

## Matriz de aderência

| Área do Prompt Mestre | Evidência na branch / histórico | Resultado |
| --- | --- | --- |
| Identidade visual e acesso | `src/PublicLanding.tsx`, `src/AuthGate.tsx`, paleta Costa&Costa | Implementado; polimento e acessibilidade a conferir |
| Cadastro, login e recuperação de senha | AuthGate/Onboarding; recebimento de e-mail, autenticação e redefinição já testados pelo responsável | Validado no cenário informado; não repetir testes sem mudança relevante |
| Perfil e preferências | `src/Onboarding.tsx`, `user_preferences`; não foi encontrada tela completa e permanente de **Perfil** na navegação | Parcial |
| Isolamento de usuários e persistência de compras | RLS/fluxos em `planner.ts` e `shoppingProgress.ts`; testes com duas contas e persistência já informados | Validado nos cenários anteriores informados; preservar |
| Painel inicial | `src/HomeDashboard.tsx`: data, refeições e atalhos do planejamento e compras | Parcial — jornada, evolução e registros futuros inexistentes |
| Planejador semanal e diário | `src/App.tsx`, `src/lib/planner.ts`: sete dias, seis horários, criação/troca/cópia/movimentação, 21 principais sugeridas | Funcional no núcleo; faltam modelos favoritos, repetição semanal salva e marcar refeição realizada |
| Sugestão inteligente | `src/lib/suggestions.ts`: tempo, desgostos, variedade simples, alergias por IDs pré-triados | Parcial — orçamento, estoque, favoritos e preferências nutricionais não entram no motor atual |
| Segurança de alergias | Alerta compacto e expansível em `App.tsx`, triagem `cc_allergy_candidate_ids`, revisão de evidências | **Crítico:** pré-triagem não assegura ausência, derivados ou contato cruzado; revisão individual e proteção final no servidor pendentes de homologação |
| Biblioteca de receitas | `RecipeDetails`, receitas pessoais, curadoria admin, fotos, busca e filtros | Parcial — padrão visual aplicado, mas revisão editorial individual incompleta; 16 preparos curtos na fila |
| Medidas e porções | Quantidades originais preservadas no piloto; redimensionamento impedido até estruturação | Lacuna consciente e segura; não inventar conversões |
| Biblioteca de alimentos | `src/FoodLibrary.tsx`; registros editoriais e revisão nutricional separados | Parcial — composição e dados ainda sujeitos a revisão qualificada |
| Lista de compras | Consolidação compatível, rastreio de comprado, impressão/PDF e cópia (`shopping.ts`, `App.tsx`) | Funcional parcialmente: expressões ambíguas preservadas; faltam edição livre completa, estoque e compartilhamento WhatsApp |
| Favoritos de receitas | Não localizado fluxo de salvar e consultar favoritos em `src/App.tsx` | **Pendente; critério 9 de aceite da Fase 1** |
| Evolução e fotos pessoais | Nenhuma página/módulo identificado na navegação atual | Pendente — Fase 2 |
| Jornada de 30 dias | Nenhum módulo funcional identificado no app atual | Pendente — Fase 2 |
| Conteúdo educativo e jejum opcional | Não localizados módulos de usuário completos | Pendente — Fase 2 / escopo de segurança |
| Assistente Costa&Costa | Não há assistente operacional de linguagem natural na interface atual | Pendente — Fase 3 |
| Administração | `AdminRecipes`, `AdminBetaAccess`, nutrição e fila de alergênicos | Parcial — existem ferramentas específicas, não todo o painel/relatório proposto |
| PWA e dispositivos móveis | Navegação responsiva existente; não localizado diretório público com manifest e Service Worker no projeto inspecionado | Instalação PWA não demonstrada; teste mobile completo pendente |
| LGPD e portabilidade/exclusão | RLS, Storage privado e controles de acesso existentes | Ainda não demonstrado o ciclo completo de consentimento, exportação e exclusão de dados |

## Diferenças relevantes de produto

1. **Navegação:** o prompt previa `Início / Cardápio / Receitas / Evolução / Perfil`. Hoje a barra usa `Início / Cardápio / Receitas / Alimentos / Compras` (e `Administração` para administradores). Compras e Alimentos são úteis, mas a navegação final ainda não atende ao mapa definido.
2. **Gerador:** o prompt manda excluir ingredientes identificados como alergênicos do usuário. Hoje existem pré-triagem e alertas, **não** atestado seguro. O documento `20261024_beta_alergenicos_a5_1_guard_servidor.md` registra migração A5.1 preparada e **não aplicada** naquela data; conferir estado real antes de qualquer liberação.
3. **Acervo:** registros-fonte são conservados com medidas originais. **119 receitas** no piloto, **114** plannable, conforme auditoria de 26/10; cinco receitas receberam revisão editorial naquele dia. Permaneciam **16 preparos curtos** a revisar. Não se presume que todas as demais estejam completas só por excederem 180 caracteres.
4. **Beta gratuito completo:** a decisão de 18/10 manda entregar módulos funcionais aos testadores antes de considerar o Beta completo, **sem ativar pagamento**. Recursos de Fase 2/3 ainda não presentes não devem ser rotulados como concluídos.

## Próximas entregas recomendadas

### P0 — manter integridade do núcleo

- Revisar as **16 receitas** com base nos campos `original_ingredients` e `original_preparation`, sem alterar a transcrição-fonte e sem aprovar alergênicos por inferência.
- Completar a defesa ponta a ponta do gerador de cardápios para usuários com alergias: elegibilidade, derivados, incerteza, mudança de preferências, servidor e rechecagem na gravação.
- Não repetir cadastro, recuperação de senha, isolamento de usuários e persistência já demonstrados, salvo regressão diretamente relacionada.

### P1 — fechar critérios do primeiro produto

- Favoritos e recuperação de cardápios anteriores; conclusão de refeição quando aplicável.
- Refinar consolidação e gestão manual de compras, conferindo o tratamento das medidas em revisão.
- Melhorar a navegação, perfil e experiência mobile; comprovar instalação PWA antes de anunciá-la.

### P2 — completar a visão Beta e produto comercial futuro

- Evolução, hábitos, fotos privadas, jornada e conteúdos educativos com privacidade adequada.
- Assistente operacional com confirmação antes de escrever alterações, conforme o prompt.
- Instrumentar portabilidade/exclusão LGPD, suporte, observabilidade e testes de acessibilidade.
- Cobrança e comercialização continuam desativadas no Beta, até decisão explícita.

## Situação da revisão das 16 receitas em 27/10

- Fila integral registrada em `docs/qa/20261026_padronizacao_fichas_receitas_beta.md`.
- O Supabase confirmou estrutura/tabelas, mas o recurso de execução SQL do conector **não retornou conteúdo** nas tentativas desta sessão. Portanto, **nenhuma das 16 foi editada hoje**.
- A consulta somente leitura para retomar a revisão individual está em
  `docs/qa/20261027_lote16_fontes_readonly.sql`.
- Não atualizar `recipes.instructions` sem ler e comparar o conteúdo atual e a fonte de cada `recipe_id`. O material antigo de origem permanece inalterado. Atualizações futuras devem ser delimitadas por ID, título e valor anterior, seguidas de releitura.

## Proteções

Esta entrega registra o diagnóstico e a consulta de trabalho. Nenhuma receita,
alergênico, quantidade, dado nutricional, conta, migração ou RLS foi alterado;
nenhuma publicação geral ou merge em `main` está autorizada por este documento.
