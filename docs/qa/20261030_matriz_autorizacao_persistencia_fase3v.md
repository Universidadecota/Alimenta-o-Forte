# Costa&Costa — Fase 3V: matriz de autorização e desenho de persistência (30/10/2026)

## Escopo e decisão operacional
**Etapa de arquitetura, não migração.** O desenvolvimento identifica como o futuro fluxo de decisões editoriais poderá coexistir com os revisores e registros já presentes no Supabase, sem criar permissões, atribuir papéis, alterar fontes, receitas, cálculos ou pareceres. Todas as propostas de persistência precisam ser avaliadas e autorizadas separadamente antes de qualquer SQL de escrita.

O código novo é um blueprint **somente de leitura**, exibido dentro da ficha administrativa existente. Todos os campos de habilitação de papéis, criação de tabelas, histórico de eventos, edição e publicação permanecem `false`.

## Auditoria do Supabase (consultas SELECT em 30/10/2026)

**Estruturas existentes:**
- `cc_admin_members` possui `user_id` e `created_at`, sem coluna própria de especialidade/função. A aplicação verifica `cc_is_admin()`, mas isso não equivale à autorização profissional para segurança culinária, nutrição ou direitos.
- `cc_pilot_ingredient_measure_reviews` guarda a análise de ingrediente, proposta e `review_status`; `cc_pilot_measure_review_events` possui histórico por ingrediente com ator e carimbos de tempo.
- `cc_recipe_allergen_reviews` tem status, alérgenos declarados e dados de contato cruzado, com políticas de INSERT, SELECT e UPDATE para administradores autenticados.
- `cc_food_nutrition_review_cases` e `cc_food_nutrition_review_events` registram fluxo nutricional; as políticas de leitura consultadas são restritas a administradores. Existem funções `cc_request_food_nutrition_review` e `cc_decide_food_nutrition_review` no banco, com `SECURITY DEFINER`; sua autorização específica deve ser examinada antes de qualquer reutilização.
- `cc_official_recipe_source_records` guarda hashes e textos originais, direitos e estágio de uso, com leitura administrativa; `recipes` conserva `published`.
- As oito tabelas examinadas possuem RLS ativa. Atenção: privilégios SQL sobre tabela e políticas RLS **são controles diferentes**; o fato de uma tabela possuir GRANT não prova que uma operação é permitida à sessão. Não inferir vulnerabilidade sem examinar políticas e funções de execução.
- **Nenhuma** das tabelas propostas no namespace `cc_aux_editorial_%` está instalada nesta data.

**Estado real do lote de piloto:** 3 receitas ainda não publicadas, 45 ingredientes sem quantidade numérica estruturada. As três fontes estão em `personal_pilot`, `commercial_rights_status=pending_review`, `ingredient_review_status=needs_structuring`. Não deduzir direitos aprovados, nutrição aprovada ou segurança validada.

## Matriz proposta de especialidades (não provisionada)

| Papel futuro | Etapa | Controles exigidos |
|---|---|---|
| `source_custodian` | Origem e versão | Fonte, integridade, snapshot, estágio privado |
| `measure_reviewer` | Quantidade, rendimento e consumo | Prova de medição e unidade explícita |
| `food_safety_reviewer` | Segurança alimentar | Pasteurização, conservação, descarte e condições de uso |
| `allergen_reviewer` | Alergênicos | Ingredientes, substituições, contato cruzado |
| `ingredient_reviewer` | Estruturação | Componentes, duplicidades e unidades |
| `nutrition_reviewer` | Nutrição | Porção efetivamente consumida, composição e evidências |
| `rights_reviewer` | Direitos | Autoria e licença/condições comerciais |
| `independent_approver` | Decisão final | Aprovador distinto do proponente, versionamento e pareceres íntegros |

Essas são atribuições *propostas*. A UI não implementa controle de acesso, nem concede papéis por meio dos nomes acima. O futuro fluxo precisa verificar funções reais no servidor, sem confiar em alegações do cliente.

## Tabelas futuras sugeridas (NÃO CRIADAS)

| Nome proposto | Finalidade | Campos mínimos importantes |
|---|---|---|
| `cc_aux_editorial_cases` | Caso por receita + bloco auxiliar, com ponteiro de versão | case_id, recipe_id, auxiliary_block_key, current_version, workflow_state, created_by, created_at |
| `cc_aux_editorial_case_versions` | Fotografia imutável de cada proposta e fonte | case_id, version, source_reference_hash, recipe_snapshot_hash, ingredients_hash, proposed_payload, created_by |
| `cc_aux_editorial_role_grants` | Habilitação real, escopo e prazo de papéis especialistas | user_id, role_code, scope, granted_by, valid_from, expires_at |
| `cc_aux_editorial_evidence` | Referências a provas e respectivos hashes, em armazenamento privado | evidence_id, case_id, version, evidence_kind, digest_sha256, storage_object_ref |
| `cc_aux_editorial_decision_events` | Eventos append-only de análise, devolução, parecer, reabertura e decisão independente | event_id, case_id, version, event_type, actor_user_id, reviewer_role, decision, evidence_id, expected_version, created_at |

### Requisitos de segurança para eventual migração
1. **Autenticação real e privilégio mínimo:** funções especializadas concedidas por procedimento seguro, validade/escopo explícitos, sem autoatribuição. RLS de leitura restrita. Bloquear escrita direta de usuários e anônimos em casos/pareceres/eventos, usando procedimentos transacionais aprovados.
2. **Definição de funções:** quaisquer RPCs `SECURITY DEFINER` devem ter `search_path` explícito, qualificação de objetos, auditoria de `GRANT EXECUTE`, identidade obtida de `auth.uid()` no servidor e validação do papel por acesso controlado ao banco. Não aceitar `actor_id`, `role` ou decisão já aprovada como prova enviada pelo frontend.
3. **Concorrência e idempotência:** `expected_version` com bloqueio transacional de caso e revalidação do conteúdo; usar chave idempotente por ação. Duas pessoas que enviam a mesma versão não devem gerar duas aprovações.
4. **Segregação:** proponente e aprovador final diferentes, conflitos avaliados no servidor. A aprovação de segurança e nutrição pode depender de pessoa qualificada distinta, conforme política futura.
5. **Imutabilidade:** registrar novos eventos, nunca sobrescrever/remover pareceres antigos em operações de negócio; definir política de retenção, auditoria de acesso e revisão de eventual superusuário/bypass de RLS.
6. **Evidência e proteção de dados:** arquivos privados, hashes de integridade, acesso mínimo, sem informações sensíveis ou tokens expostos em logs e sem objetos públicos de Storage.
7. **Reabertura e rollback:** nova versão e novo evento, preservando a cadeia anterior; retirar acesso após revogação e impedir reaproveitar evidências de uma versão antiga.
8. **Publicação independente:** evento de parecer não executa `UPDATE recipes SET published=true` e não altera `recipe_ingredients`, nutrição, alertas ou compras. A disponibilização comercial requer gate separado e direitos comprovados.

## Implementação entregue nesta fase
- `src/lib/pilotAuxiliaryAuthorizationBlueprint.ts`: descrição tipada de oito papéis propostos, cinco tabelas, oito controles de servidor; **todos** explicitamente ainda não implementados. Valida o contrato da Fase 3U e rejeita tentativa de apresentar eventos fictícios como reais.
- `src/PilotAuxiliaryReviewWorksheet.tsx`: seção recolhível **“Examinar matriz proposta de responsabilidades e tabelas futuras”**. Não existem botões de aprovar, delegar, migrar ou publicar.
- `scripts/test-pilot-auxiliary-authorization-blueprint.mjs`: regressão de papéis, tabelas, separação de responsabilidades, status falsos, eventos forjados e flags de gravação. Integrado ao `npm run build`.
- Nenhum SQL DDL/DML, função ou política aplicada no Supabase.

## Próxima decisão técnica (antes de qualquer migração)
Verificar detalhadamente o corpo e os privilégios de execução das RPCs existentes que alteram revisões, formalizar quem poderá exercer cada especialidade e submeter um desenho de migração **separado**, com testes de RLS por usuário anônimo, usuário padrão, administrador, revisor de especialidade e aprovador independente, concorrência e recuperação. Não confundir esta documentação com liberação para operação real.
