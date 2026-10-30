# Costa&Costa — Fase 3U: projeto do fluxo de decisão editorial (30/10/2026)

## Entrega e delimitação
Esta etapa **não implementa aprovação real**. Ela propõe responsabilidades, etapas, evidências e um contrato futuro de histórico imutável para o preparo auxiliar. A prévia é exibida somente na ficha administrativa da Fase 3T, depois da conferência de fonte e ingredientes já existente.

Em 30/10/2026, as três receitas examinadas continuam `published=false`, com **45 ingredientes sem quantidades numéricas estruturadas**; as fontes correspondentes permanecem `use_stage=personal_pilot`, `commercial_rights_status=pending_review` e `ingredient_review_status=needs_structuring`. Nenhuma decisão comercial, culinária ou de segurança foi registrada ou inferida nesta etapa.

### Estruturas de autorização existentes
O aplicativo já utiliza `cc_is_admin()` para exibir superfícies administrativas, e o banco possui `cc_admin_members` e mecanismos de revisão separados de medidas, alergênicos e nutrição (`cc_pilot_ingredient_measure_reviews`, `cc_pilot_measure_review_events`, `cc_recipe_allergen_reviews`, `cc_food_nutrition_review_cases`/`events`). Esses recursos **não estabelecem por si só um aprovador de preparos auxiliares**. Os títulos de função abaixo são uma **proposta de governança**, não papéis que tenham sido criados ou atribuídos.

## As oito verificações propostas

| Etapa | Função responsável proposta | Pré-condição para decisão futura |
|---|---|---|
| 1. Fonte, versão e integridade | Administração técnica | Confirmar no servidor receita, hash e estágio da fonte, revisão das instruções e fotografia dos ingredientes |
| 2. Medidas, rendimento e uso | Revisor culinário/de medidas | Quantidades e unidade aferidas, evidência documental e vínculo inequívoco ao molho |
| 3. Segurança e conservação | Responsável por segurança alimentar | Verificação de gema pasteurizada em preparo sem cocção, higiene, conservação e descarte |
| 4. Alergênicos e substituições | Revisor de alergênicos | Conferência de ovo, peixe, gergelim e outros ingredientes conforme receita; avaliar contato cruzado |
| 5. Estruturação e compras | Revisor de ingredientes | Ingredientes e unidades validados, referência ao molho pronto resolvida para evitar dupla contagem |
| 6. Nutrição e porcionamento | Revisor nutricional | Confirmar consumo efetivo, cálculo de ingredientes, porção e rastreabilidade nutricional |
| 7. Direitos comerciais | Responsável pelos direitos da fonte | Validar autorização para uso da receita e suas adaptações |
| 8. Decisão independente | Aprovador final/master, distinto do autor | Verificar o conjunto de pareceres, fonte e versão antes da mudança oficial |

Apenas a etapa 2 pode indicar **dados organizados para conferência humana**, quando o rascunho tem valores compatíveis e um texto mínimo de evidência. Isso **não** significa que as medições, segurança ou qualquer etapa tenham sido aprovadas. Etapas de estruturação, direitos e decisão final ficam explicitamente bloqueadas. Não há botão de avançar, assinar, homologar ou publicar.

## Contrato de auditoria FUTURO (não executado)
Para desenhar migração posterior, considerar registros versionados de `recipe_id`, `auxiliary_block_key`, `source_reference_hash`, `proposal_version`, `expected_version`, `actor_user_id` autenticado, `reviewer_role` validado no servidor, `decision` tipada, referência de evidência, `created_at` fornecido pelo banco, `previous_version` e `resulting_version`. Não usar nome digitado, hora do navegador nem qualquer campo de permissão enviado pelo cliente como prova de autorização.

Os eventos propostos incluem: envio à análise, devolução para correção, pareceres de medidas, segurança, alergênicos, ingredientes, nutrição, direitos, decisão independente e reabertura de versão. A interface desta fase mostra um envelope **vazio**, com `eventKind=not_recorded` e IDs, responsável, data e decisão `null`. **Nenhum evento efetivo foi criado.**

### Requisitos para futura persistência
1. Usar tabelas de decisões/versionamento e eventos append-only com RLS explícita. Nenhuma escrita genérica de clientes anônimos ou acesso com `service_role` no navegador.
2. Exigir identidade real do usuário autenticado e autorização do papel específico no servidor. `cc_is_admin()` isoladamente não basta para comprovar competência técnica em segurança, nutrição ou direitos.
3. Separar proponente de aprovador; impedir autoaprovação, verificar conflito de papéis e garantir que o aprovador final seja independente.
4. Conferir novamente a integridade do snapshot oficial, hashes de fonte, versão dos ingredientes, porções, direitos, instruções, pareceres e status publicado na mesma transação de decisão. Mudança em qualquer dependência deve invalidar aprovação anterior e exigir reabertura versionada.
5. Usar controle concorrente por `expected_version`, idempotência da submissão e identidade da decisão para prevenir aprovações duplicadas ou concorrentes.
6. Preservar o histórico por inclusão de novos eventos; nunca sobrescrever/apagar silenciosamente decisões antigas. Acesso de auditoria separado e mínimo necessário.
7. Não alterar `recipes.published`, `recipe_ingredients`, cálculos de compras/nutrição, alergênicos nem fonte original por consequência automática de um parecer. Uma publicação futura terá etapa e autorização próprias.
8. Definir rollback de **estado de aprovação/publicação** por nova revisão auditável, sem editar eventos passados nem alterar documento de origem.

## Implantação desta fase
- `src/lib/pilotAuxiliaryEditorialWorkflowPreview.ts`: função pura de prévia. Todas as flags de escrita/aprovação, publicação, nutrição e compras são permanentemente `false`.
- `src/PilotAuxiliaryReviewWorksheet.tsx`: mostra as oito etapas após gerar a ficha local; não disponibiliza controles de parecer, aprovação, atribuição de papel ou publicação.
- `scripts/test-pilot-auxiliary-editorial-workflow.mjs`: testa bloqueios, rascunhos completos e incompletos, alterações indevidas de flags do cliente e valores de status falsamente tranquilizadores.
- `npm run build` executa estes testes junto com as regressões das fases anteriores.
- **Nenhuma migração, tabela, RPC nova, mudança de RLS, escrita no banco, publicação de receita ou alteração na branch `main`** faz parte desta entrega.

## Próxima decisão técnica
Antes de qualquer criação de tabela de aprovação, definir formalmente quem pode emitir cada parecer, como serão registradas evidências documentais, qual mecanismo de dupla checagem será adotado e quem autoriza a publicação comercial. Só então preparar desenho de migração e revisão de segurança com plano de rollback, sem habilitar gravação até aprovação explícita.
