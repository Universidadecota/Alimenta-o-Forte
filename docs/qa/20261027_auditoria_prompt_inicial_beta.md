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
| Biblioteca de receitas | `RecipeDetails`, receitas pessoais, curadoria admin, fotos, busca e filtros | Parcial — padrão visual aplicado e lote das 16 fichas curtas revisado; resta auditoria qualitativa do restante do acervo |
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
3. **Acervo:** registros-fonte são conservados com medidas originais. **119 receitas** no piloto, **114** plannable; cinco receitas receberam revisão editorial em 26/10 e mais **16** em 27/10. Restam outras fichas cuja qualidade não pode ser presumida pela extensão do texto.
4. **Beta gratuito completo:** a decisão de 18/10 manda entregar módulos funcionais aos testadores antes de considerar o Beta completo, **sem ativar pagamento**. Recursos de Fase 2/3 ainda não presentes não devem ser rotulados como concluídos.

## Próximas entregas recomendadas

### P0 — manter integridade do núcleo

- Revisar qualitativamente o **restante do catálogo**, após o fechamento comprovado do lote das 16 receitas mais curtas, sem alterar a transcrição-fonte e sem aprovar alergênicos por inferência.
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

## Revisão das 16 receitas — execução verificada em 27/10

- Fila integral registrada em `docs/qa/20261026_padronizacao_fichas_receitas_beta.md`.
- Após falhas temporárias, o Supabase voltou a responder: consulta prévia leu o
  `original_ingredients`, `original_preparation` e texto atual das **16 fichas**;
  todas ainda coincidiam com os preparos-fonte, permaneciam em piloto e não publicadas.
- A consulta original de seleção está em `docs/qa/20261027_lote16_fontes_readonly.sql`.
  O lote editorial está em `docs/qa/20261027_lote16_receitas_revisao_controlada.sql`.
- A atualização foi **atômica** e delimitada por ID, título, fonte correspondente,
  `recipes.instructions = source.original_preparation` e `published=false`.
  Contagem divergente abortaria a transação inteira. O conector reportou execução sem erro.
- Releitura posterior: **16 de 16** com 5–6 etapas, dicas e cuidados de segurança;
  119 registros oficiais ainda no piloto, 114 elegíveis a planejamento,
  **0 preparos com menos de 180 caracteres**, **22 fichas** no catálogo com ambos
  os blocos de dicas e segurança. `cc_official_recipe_source_records` e os
  ingredientes não foram alterados.
- Testes locais `test-recipe-preparation-sections.mjs` e
  `test-pilot-ingredient-display.mjs` passaram. Esses testes não equivalem à
  homologação visual de todas as fichas em navegador nem à liberação de alergias.
- Referências gerais de segurança alimentar usadas para observações sobre
  higiene e temperaturas: [FoodSafety.gov — temperaturas mínimas](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures),
  [Ministério da Saúde — doenças de transmissão hídrica e alimentar](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dtha) e
  [Anvisa — cuidados no preparo](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/vai-preparar-a-ceia-fique-de-olho-nessas-dicas).

## Proteções

Esta entrega registra o diagnóstico e a **revisão editorial de exibição** de 16
receitas. Nenhuma fonte documental, ingrediente, medida, dado nutricional, conta,
classificação de alergênicos, migração ou RLS foi alterada; nenhuma publicação
geral ou merge em `main` está autorizada por este documento.
