# Costa&Costa — Fase 2E: fluxo de revisão nutricional auditável
**Data:** 15/10/2026 · **Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** rascunho, sem merge.

## Contexto
A Fase 2D registrou composição da TACO para **10 variantes** (abobrinha, alface, cenoura), mantendo `review_status='awaiting_specialist'`. A interface pode editar valores como administrador, mas isso não deve equivaler a revisão técnica nem a disponibilização ao usuário final.

## Implementação no Supabase
Migração aplicada: `supabase/migrations/20261015220000_cc_food_nutrition_review_workflow_phase2e.sql` (aplicação remota com sucesso sob o nome `cc_food_nutrition_review_workflow_phase2e_cloud`).

- `cc_nutrition_reviewers`: rol de revisores habilitados **exclusivamente por provisionamento seguro no banco**, após verificação externa da qualificação e do registro profissional. **Nenhum revisor pré-cadastrado**. Sem SELECT/INSERT/UPDATE/DELETE via navegador.
- `cc_food_nutrition_review_cases`: uma solicitação/parecer atual por variante; registra solicitante, data, justificativa, conteúdo técnico submetido como snapshot, status e, quando houver, responsável/parecer/data. Não possui escrita direta pelo navegador; RLS de leitura apenas para administrador.
- `cc_food_nutrition_review_events`: trilha append-only de pedidos, decisões e invalidações, com data/autor/justificativa/snapshot. Não disponibiliza edição direta via cliente.
- RPC `cc_request_food_nutrition_review(uuid,text)`: exige sessão de administrador, justificativa 12–2000 caracteres, fonte, código, estado do alimento e ao menos energia registrada. Faz pedido e captura a versão submetida.
- RPC `cc_decide_food_nutrition_review(uuid,text,text)`: exige conta ativa da tabela de profissionais credenciados, fundamento 20–2000 caracteres, pedido vigente, mesma versão da ficha, separação de responsabilidades (revisor diferente do solicitante). Só aceita `approved` ou `changes_requested`. Status `approved` significa **parecer técnico registrado sobre os dados da variante**, **não** publicação nutricional nem segurança para alergias.
- Gatilho `cc_fnrc_variant_invalidate`: mudanças em nome, variedade, preparo, fonte, nutrientes ou notas invalidam qualquer solicitação/parecer, registrando evento. A linha permanece em histórico; não há reaproveitamento tácito da aprovação.

## Defesa em profundidade
A migração concede `EXECUTE` das RPCs a usuários autenticados, **mas autoriza a execução da operação apenas após validação de privilégios dentro da função**; o acesso anônimo às RPCs é revogado. O usuário autenticado comum não recebe permissões de escrita nas tabelas. O cadastro de profissionais não pode ser feito por administrador no navegador. A aplicação não exibe controle de aprovação no front nesta fase; não existe cadastro de profissional aprovado.

Revisões continuam totalmente separadas das verificações de alergênicos e de `food_items.nutrition_per_100g`; os valores públicos e o motor nutricional continuam bloqueados.

**Cautela sobre traços:** a revisão deve conferir explicitamente `Tr` para o sódio da abobrinha italiana crua e documentar seu significado, sem converter para `0`. Antes da publicação, será necessário incorporar um indicador estruturado para valor traço/não quantificado e conferir todos os nutrientes obrigatórios conforme a aplicação.

## Interface administrativa (no GitHub)
Novo `src/FoodNutritionReviewPanel.tsx` integrado a `src/FoodNutritionAdmin.tsx` e estilizado em `src/styles.css`.
- Selecionar uma variante revela uma seção **Revisão técnica e histórico** abaixo de seu formulário.
- A seção permite descrever motivo e enviar solicitação formal; impede envio com alterações locais ainda não salvas.
- Mostra status do pedido, justificativa e os últimos 10 eventos. Após editar e salvar a variante, o componente reconsulta o caso; a alteração invalida a revisão anterior no servidor.
- Não permite parecer ou aprovação pelo administrador. Nenhuma ação do painel publica valores nutricionais.
- A interface original de variedades, medidas e ingredientes é preservada.

## Auditoria independente no Supabase (após a aplicação)
| Item | Resultado |
|---|---:|
| Variantes nutricionais | 10 |
| Variantes aguardando especialista | 10 |
| Profissionais credenciados | 0 |
| Solicitações registradas | 0 |
| Pareceres/eventos | 0 |
| Valores nutricionais no catálogo público | 0 |
| Receitas ativas | 9 |
| Refeições planejadas | 25 |

Verificações: `anon` não pode ler casos nem executar RPCs; `authenticated` não tem INSERT/UPDATE direto na tabela de casos nem INSERT no cadastro de revisores; RLS nos casos e eventos requer `cc_is_admin()`. Simulação autenticada não-administradora obteve `cc_is_admin=false` e **0 linhas**.

**Testes ainda pendentes:** tentativa negativa de chamada RPC por usuário comum em sessão real, tentativa de decisão por usuário não credenciado, gravação de uma solicitação administrativa legítima pela interface, edição de dados invalidando a solicitação e persistência do histórico. Não criar dados de teste fictícios para pareceres. A compilação da interface ainda precisa ser feita no Windows.

## Homologação direcionada
1. Na branch atual: `git pull --ff-only` e `npm run build`.
2. Na Administração → Receitas oficiais → Base nutricional, selecionar **Abobrinha italiana crua** e rolar ao fim da variante; a nova seção deve mostrar **Nenhuma solicitação formal registrada** e motivo para solicitar, sem botão de aprovação.
3. Verificar 390 px e desktop. Não modificar nutrientes e **não enviar pedido de revisão agora**, pois nenhum revisor está habilitado.
4. Antes de um pedido real: verificar documentação/fonte, obter profissional habilitado com credenciais verificadas, provisionar mediante autorização explícita e testar o workflow em ambiente controlado.
5. Manter PR #16 sem merge até revisão de segurança e reconciliação das migrações local/remoto.

**Não implica:** registro profissional obtido, validade clínica, alimento livre de alergênicos, liberação de cálculo ao consumidor, homologação de build ou merge.

## Teste negativo das RPCs — acesso sem privilégio

**Teste executado:** transação `BEGIN … ROLLBACK` com `SET LOCAL ROLE authenticated` e identificador de usuário não administrador de teste. Para cada chamada, o bloco PL/pgSQL exigiu o erro exato, abortando a validação caso a operação passasse indevidamente.

- `cc_request_food_nutrition_review` recusou com **“Apenas administradores podem solicitar revisao tecnica”**.
- `cc_decide_food_nutrition_review` recusou com **“Revisor tecnico nao credenciado”**.
- Transação revertida; **0** profissionais cadastrados, **0** revisões e **0** eventos. `cc_food_nutrition_variants` permanece com **10** linhas e `food_items.nutrition_per_100g` com **0** linhas preenchidas; **25** refeições planejadas preservadas.

**Limite:** simulação SQL não substitui teste com dois usuários reais. O front ainda não passou por build Windows, navegação/solicitação legítima ou verificação visual mobile. Antes de liberar o parecer para uso real, validar também a adequação do protocolo de credenciamento e o tratamento formal de valores `Tr`/ausentes.
