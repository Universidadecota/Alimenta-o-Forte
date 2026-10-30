# Costa&Costa Alimentação Forte — Fase 3W: auditoria de RPCs e plano de migração segura
**Data:** 30/10/2026  
**Natureza:** auditoria somente leitura + especificação de testes e implantação futura. **Nenhuma migração, SQL de escrita, RLS ou RPC nova foi executada.**

## Objetivo
Dar continuidade às Fases 3T–3V, confrontando as futuras regras de autorização dos preparos auxiliares com **as funções, grants, políticas e triggers de revisão realmente existentes** no Supabase. Criar um roteiro verificável que possa ser aprovado e executado futuramente em **ambiente de teste isolado**, antes de uma eventual implantação no catálogo.

A fonte de verdade deste levantamento é a consulta de 30/10/2026 a `pg_proc`, `pg_policies`, `pg_trigger`, catálogo de tabelas e grants, sem mutações. Nenhuma prova real de acesso por diferentes contas foi executada nesta fase; as hipóteses de autorização precisam de ensaios com sessões separadas.

## 1. Auditoria das funções de revisão existentes

| Função / controle real | Comportamento confirmado no código SQL | Reutilização sugerida e ressalva |
|---|---|---|
| `cc_is_admin()` | SECURITY DEFINER, `search_path=''`, consulta `cc_admin_members` com `auth.uid()`; EXECUTE para `authenticated`/`service_role` | Reutilizar como **acesso administrativo básico**, nunca como credencial nutricional, culinária ou de direitos |
| `cc_request_food_nutrition_review(...)` | SECURITY DEFINER, valida administrador via `cc_is_admin()`, exige justificativa, verifica dados, bloqueia a variante `FOR UPDATE`, cria/atualiza caso e registra evento | Referência para solicitação transacional e documentação; domínio é **variantes nutricionais**, não molhos |
| `cc_decide_food_nutrition_review(...)` | SECURITY DEFINER, verifica `cc_nutrition_reviewers.active` e `credential_verified_at`, exige motivo, trava variante e caso `FOR UPDATE`, impede `requested_by=auth.uid()`, compara snapshot e grava evento | Referência útil para **separação autor/aprovador, credenciamento e concorrência**; não reaproveitar sem validar escopo e permissões |
| `cc_invalidate_nutrition_review_on_edit()` | Trigger após UPDATE na variante; ao mudar snapshot, invalida revisão anterior e registra evento | Adaptar conceito à versão da fonte, receita e ingredientes do subpreparo |
| `cc_allergen_review_guard()` | Trigger liga `reviewed_by` a `auth.uid()` ao marcar `verified` e protege transferência de receita | **Não há separação autor/aprovador demonstrada** neste mecanismo; aprovação final independente exige controle adicional |
| `cc_invalidate_allergen_review()` | Trigger acionado por INSERT/UPDATE/DELETE em `recipe_ingredients`, reverte revisão de alergia a `pending` quando necessário | Modelo para invalidar pareceres após alteração de ingredientes |
| `cc_protect_pilot_measure_review_source()` | Trigger BEFORE UPDATE impede mudar `ingredient_id`, `recipe_id`, `source_text`, `source_position` e impede escrever se o nome da receita divergir do histórico | Preservar origem, mas não presumir que isso seja controle de versão integral do molho |
| `cc_recipe_nutrition_reviewer_guard()` | Trigger exige credenciamento ativo em `cc_nutrition_reviewers` antes de status `verified` | Confirma outro controle de revisor especializado já presente, sem extrapolação para aprovação de molhos |

### Riscos e diferenças de autorização
- As funções públicas de solicitação/decisão de variante nutricional têm `EXECUTE` para `authenticated` e `service_role`, mas exigem verificações no próprio corpo. **O GRANT não é aprovação**: revisar o corpo, funções chamadas e a identidade efetiva do usuário sempre que conceder execução.
- As funções de trigger consultadas têm grants variados; algumas podem herdar `EXECUTE` de `PUBLIC`. Isso **não as torna chamadas RPC válidas**; deve-se inventariar `pg_proc.proacl`, `has_function_privilege` e contexto de trigger antes de endurecer privilégios.
- Os eventos históricos de nutrição e de medidas possuem leitura administrativa; o fato de o fluxo de aplicação registrar novos eventos **não prova imutabilidade física contra papéis privilegiados**. Desenhar retenção, acesso e proibição de UPDATE/DELETE nas novas tabelas.
- Existe `cc_allergen_review_guard` como controle de quem marca status verificado, mas não deduzir aprovação independente de outra pessoa nem credenciamento profissional.
- O novo fluxo editorial não poderá transformar `cc_recipe_allergen_reviews.verified` ou uma decisão nutricional de **outra entidade** em aprovação automática do molho: deve validar vínculos, snapshots e versão expressamente.

## 2. Situação das receitas desta análise
Três receitas de molho permanecem não publicadas: bolinhos de salmão e maionese caseira, Caesar com frango e salada de ovos em canoas de endívia. São **45 ingredientes sem quantidade numérica estruturada**, `commercial_rights_status='pending_review'`, `ingredient_review_status='needs_structuring'` e fontes em `personal_pilot`. A ficha editorial da Fase 3T continua rascunho local, sem persistência.

## 3. Desenho de migração em cinco fases — todas PENDENTES

| Fase futura | Objetivo | Evidência mínima de aceite |
|---|---|---|
| 01 — Baseline e recuperação | Inventariar dependências, privacidade, schemas, grants, triggers e esquema de backup | Snapshot e teste de recuperação **em base isolada**, ponto de retorno definido |
| 02 — Governança | Aprovar especialidades, escopo de papel, validade, evidências e autor ≠ aprovador | Responsáveis designados e revisão de segurança do contrato de dados |
| 03 — Protótipo aditivo | Construir **apenas na base de teste** cinco tabelas versionadas e RPCs com RLS/GRANT mínimos | Triggers, versionamento, grants e funções auditados, sem acesso amplo |
| 04 — Testes adversariais | Exercitar 14 cenários de permissões, concorrência, idempotência e restauração | Resultado documentado por usuário de teste; nenhum bypass aceito |
| 05 — Decisão de migração | Revisar evidências, falhas, diffs, retenção, eventual rollout e reversão | **Nova autorização explícita** para migração de produção e gate separado para publicação |

Nesta fase a aplicação mostra estes passos como `not_executed`; os testes locais automatizados só validam **o desenho** da matriz. Não são testes de autorização autenticados no Supabase real.

## 4. Matriz de testes futura — 14 cenários (NÃO EXECUTADOS)

| Cenário | Perfil e teste | Resultado exigido |
|---|---|---|
| `anon_no_access` | Anônimo lê/escreve casos ou executa RPC | Negado |
| `standard_no_access` | Conta comum acessa caso alheio ou envia parecer | Negado |
| `admin_no_specialty` | Administrador sem habilitação tenta validar segurança/nutrição | Negado |
| `specialist_only_own_gate` | Revisor de medidas tenta decidir direitos | Apenas a competência específica |
| `author_cannot_finalize` | Autor tenta finalizar seu próprio pedido | Negado |
| `independent_final_gate` | Aprovador independente com todas as etapas e versão válida | Só evento editorial, sem publicação |
| `expired_revoked_role` | Especialista com grant vencido, revogado ou token antigo | Negado pela consulta do banco |
| `stale_expected_version` | Dois revisores escrevem ao mesmo tempo na mesma versão | Um avança, outro recebe conflito |
| `duplicate_idempotency` | Reenvio do mesmo pedido | Um único efeito, sem duplicar evento/parecer |
| `changed_source` | Ingrediente, instrução ou fonte muda após parecer | Invalidação ou reabertura versionada |
| `event_immutability` | Tentar UPDATE/DELETE e forjar ator/carimbo de data | Negado; usar identidade e horário do servidor |
| `private_evidence` | Usuário sem escopo acessa evidência de outro caso | Negado no banco e no Storage |
| `no_auto_publish` | Parecer final emitido | Não altera `recipes.published`, ingredientes, nutrição ou compras |
| `rollback_restore` | Falha no meio de transação e restauração de backup | Sem evento parcial e sem perda de histórico |

### Como executar futuramente sem afetar produção
A) Preparar instância Supabase de teste isolada, dados sintéticos e contas de teste separadas.  
B) Confirmar identidades e funções por **sessões reais**; `SET ROLE` sozinho não prova `auth.uid()` nem todo o modelo de acesso.  
C) Executar tentativas permitidas e proibidas via cliente com políticas efetivas e verificar SQL de auditoria no servidor.  
D) Testar duas sessões simultâneas e chaves de idempotência repetidas.  
E) Restaurar o ambiente isolado a partir de cópia de teste e anexar evidência; não usar `DROP`/DELETE no catálogo real para “rollback”.  
F) Em implantação futura, primeiro **bloquear as RPCs novas**/reverter uma versão via evento auditado. Não apagar histórico de decisões; detalhar plano de down migration somente após verificar dependências.

## 5. Implementação desta etapa na Beta
- `src/lib/pilotAuxiliaryMigrationRunbook.ts`: cinco padrões de controle existentes auditados, cinco fases futuras e 14 cenários com marca `not_executed`; falha fechada se o blueprint afirmar migração, evento ou papel ativo.
- `src/PilotAuxiliaryReviewWorksheet.tsx`: visualização recolhível do plano dentro da matriz técnica de autorização da receita, sem botões de executar SQL ou conceder papéis.
- `scripts/test-pilot-auxiliary-migration-runbook.mjs`: testes sintéticos do contrato e de tentativas de forjar status ativo; executados antes do build TypeScript/Vite.
- `package.json`: script `test:auxiliary-migration-runbook` como gate de build.
- Nenhum arquivo em `supabase/migrations`, esquema, grants, políticas ou dados de receita foi modificado.

## 6. Pontos que dependem de decisão humana antes de nova fase
Definir os responsáveis pelas especialidades e sua competência; política de retenção/provas, separação de aprovador e proponente, escopo de direitos comerciais, recuperação e ambiente de teste. Só depois revisar SQL e testar migração em base isolada, com autorização própria. **Não confundir READY na Vercel com aprovação de RLS ou de segurança alimentar.**
