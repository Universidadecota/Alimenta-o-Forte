# Costa&Costa — Fase 3E: posicionamento culinário autoral e piloto pessoal

**Data:** 17/10/2026  
**Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** manter draft e sem merge.

## Decisão do responsável
O responsável declarou que **todas as 119 receitas cadastradas foram criadas por ele, com adaptações apoiadas pelo Claude IA**. Decidiu seguir o posicionamento de **biblioteca culinária autoral**, com cardápio montado livremente pelo usuário e lista de compras. O aplicativo será utilizado inicialmente **por aproximadamente três meses para testes pessoais**, antes de se avaliar uma futura assinatura paga.

**Não oferecer como serviço clínico:** prescrição dietética individualizada, tratamentos, diagnóstico, alegações de que receitas curam doenças, garantias de emagrecimento ou de segurança para alergênicos. O piloto pessoal não comprova eficácia ou segurança clínica. A declaração de autoria é relato do responsável, não auditoria jurídica de direitos.

## Adaptações no código
- `src/App.tsx`: mensagem de piloto culinário e receitas autorais; excluído o acesso à **Coleção EDV** da navegação, sem apagar seus registros. A página de receitas autorais deixa de exibir, por padrão, receitas oficiais legadas que não pertencem às 119 autorais. Administradores podem localizá-las pelo filtro **Legado** para consultar histórico.
- Os seletores do cardápio continuam apresentando receitas autorais e particulares; uma receita legada **já presente no dia selecionado** continua aparecendo para que o planejamento histórico não desapareça. O histórico de planejamento é preservado.
- Retirado o gerador automático de semana da interface/código nesta etapa. O cardápio segue montado manualmente pelo usuário; as regras de horário e o alerta de alergia já existentes permanecem.
- `src/HomeDashboard.tsx`: retira do painel inicial a exposição da meta pessoal ligada a saúde/peso e apresenta a compra como ingredientes das receitas escolhidas. Dados de `user_preferences` **não foram apagados**, e a proteção de alergias permanece.
- `src/AdminRecipes.tsx`: remove do painel culinário o componente visual de **credenciamento médico**; nenhum cadastro médico foi apagado ou ativado. Distingue `Piloto pessoal · privado` de receitas comuns e oculta a ação de publicação para os 119 itens do piloto.
- `src/RecipeDetails.tsx`: sinaliza finalidade culinária e autoria reportada, sem modificar ingredientes, rendimentos ou preparos. `index.html`: descrição do produto alinhada a receitas e compras. `src/styles.css`: aviso discreto de escolha manual.
- A estrutura de revisão médica existente permanece restrita e **inativa**; a negociação pendente com a Dra. Juliana não condiciona o desenvolvimento culinário.

## Segurança e procedência no Supabase
**Migração aplicada** `supabase/migrations/20261017120000_cc_culinary_authorial_pilot_publish_guard_phase3e.sql`, nome remoto `cc_culinary_authorial_pilot_publish_guard_phase3e_cloud`.
- Dois triggers bloqueiam receita do `personal_pilot` que tente mudar para `published=true` ou ser associada retroativamente como piloto a receita pública. A publicação futura requer transição editorial explícita.
- O bloqueio de publicação foi testado em SQL transacional (`BEGIN` / `ROLLBACK`): a tentativa recebeu a exceção esperada e não persistiu alterações.

**Migração aplicada** `supabase/migrations/20261017121000_cc_pilot_authorship_declaration_phase3e1.sql`, nome remoto `cc_pilot_authorship_declaration_phase3e1_cloud`.
- As 119 fontes recebem `authorship_reported=true`, `ai_assistance_reported=true`, declaração textual de criação pelo responsável com adaptações via Claude e a data do relato, **17/10/2026**.
- Todos os registros mantêm `commercial_rights_status='pending_review'`. Isso não declara exclusividade legal, regularidade de publicidade nem validação clínica.

## Integridade verificada (antes de build novo)
| Indicador | Confirmado |
|---|---:|
| Receitas do piloto pessoal | **119** |
| Receitas planejáveis | **114** |
| Registros com autoria e apoio de IA declarados | **119** |
| Registros ainda pendentes de revisão para venda | **119** |
| Receitas autorais do piloto publicadas | **0** |
| Refeições históricas planejadas preservadas | **26** |
| Fragmentos de ingredientes vinculados ao piloto | **1.073** |
| Alimentos previamente públicos | **34** |
| Profissionais médicos com acesso ativo | **0** |

**Ponto de atenção antes da venda:** existem ainda **sete receitas oficiais legadas publicadas** (seis rotuladas `[Exemplo]` e `Chá Cremoso De Cúrcuma`). Elas não fazem parte das 119 autorais. Estão ocultas da galeria principal do piloto e continuam em registros históricos de planejamento. **Não foram excluídas nem despublicadas nesta fase**, para não comprometer os 25 vínculos antigos. É necessário planejar a retirada segura desses conteúdos antes do lançamento comercial; ocultação visual **não equivale** a despublicação no banco/API.

## Não feito / próximos passos
1. **Compilação do frontend:** executar `git pull --ff-only` e `npm run build` no Windows; nenhuma homologação de build foi recebida para esses commits ainda. Os pontos-chave de imports, props e proteções foram conferidos estaticamente no GitHub.
2. Homologação direcionada: tela inicial (sem metas médicas), **Receitas** (autorais no filtro `Todos`, receitas legadas no filtro administrativo), **Administração** (sem credenciamento médico e sem opção de publicar receita do piloto). Não repetir os testes de compras, ceias ou médico já validados.
3. Próxima fase funcional: **consolidação conservadora das medidas de compras**. Somar quantidades de um mesmo ingrediente apenas quando unidade, identificação, preparo e produto forem inequivocamente compatíveis; preservação de `a gosto`, opcionais, alternativas `ou` e quantidade não informada, sem conversões ou escolhas inventadas. Testes com casos reais dos 1.073 fragmentos.
4. Antes da comercialização: confirmar autoria/documentação de direitos, revisar termos de uso, LGPD, publicidade, condições de assinatura/cancelamento e integridade dos cadastros. Revisão de nutricionista pode ser contratada pontualmente se houver conteúdo nutricional técnico; não tornar parceria médica obrigatória para uma biblioteca culinária.
5. Manter PR #16 rascunho, sem merge. Conciliar migrações locais/remotas antes de deploy.
