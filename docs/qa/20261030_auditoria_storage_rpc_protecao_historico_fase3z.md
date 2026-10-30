# Costa&Costa Alimentação Forte — Fase 3Z
## Auditoria real de RPCs, Storage e proteção do histórico de ingredientes
**Data: 30/10/2026 · Ambiente: Supabase remoto de pré-lançamento controlado**

### 1. Auditoria de acesso executada em modo de leitura
- Conferidas 11 funções `SECURITY DEFINER` que podem alterar o catálogo, integrantes da Beta, medidas ou receitas pessoais. As funções inspecionadas verificam `cc_is_admin()` ou `auth.uid()` com limite por proprietário, usam `search_path=''` e rejeitam `anon` no privilégio SQL EXECUTE. Uma concessão `authenticated` NÃO substitui a verificação interna; a auditoria individual de cada rota HTTP permanece pendente.
- Buckets presentes: `personal-recipe-images` (**privado**, 5 objetos) e `recipe-illustrations` (**público**, 130 objetos, 120 no prefixo `official/`). Ambos limitados a arquivos WebP de até 2 MiB.
- Políticas de `storage.objects`: imagens privadas exigem pasta cujo primeiro segmento é `auth.uid()` para SELECT, INSERT e DELETE; imagens oficiais permitem INSERT e DELETE somente para administradores e nomes no formato `official/<uuid>.webp`. O bucket público permite leitura de quem possui a URL, independentemente do estado Beta ou do controle editorial — não incluir conteúdo sigiloso nessa área.
- Avisos do advisor antes e depois da migração: **26** funções `SECURITY DEFINER` executáveis por authenticated, **3** tabelas internas com RLS sem política e **1** alerta para proteção contra senhas vazadas. Isso NÃO equivale a 26 vazamentos; manter revisão individual de função, grants e funções chamadas.
- O trigger `cc_guard_personal_pilot_recipe_publish` já bloqueia publicação de fontes `personal_pilot`. Não foi necessário modificá-lo.

### 2. Risco efetivo identificado: exclusão em cascata do histórico
A função administrativa `public.cc_save_official_recipe(...)` faz, ao editar receita oficial existente:
1. UPDATE da receita;
2. DELETE de **todos** os seus `recipe_ingredients`;
3. INSERT de novos ingredientes, criando novos IDs.

Existem FKs `ON DELETE CASCADE` apontando para `recipe_ingredients(id)`, inclusive de:
- `cc_pilot_ingredient_measure_reviews`;
- `cc_allergen_ingredient_evidence`;
- `cc_allergen_a4_ingredient_findings`;
- `cc_n2_ingredient_review_notes`;
- `cc_recipe_ingredient_food_links`.

Sem proteção, uma edição por esse caminho pode apagar registros dependentes. A fotografia anterior à correção confirmou **1.072 revisões históricas de 119 receitas** vinculadas a ingredientes. Não houve teste de exclusão real antes da correção.

### 3. Correção aplicada no Supabase operacional
Migração efetivamente registrada: **`20261030130912_cc_guard_pilot_ingredient_history_on_delete_3z`**.

Arquivo versionado: `supabase/migrations/20261030130912_cc_guard_pilot_ingredient_history_on_delete_3z.sql`.

Uma função de trigger `SECURITY DEFINER` com `search_path=''` e sem `EXECUTE` para `PUBLIC`, `anon` e `authenticated` consulta os vínculos históricos. O trigger `BEFORE DELETE ON public.recipe_ingredients` rejeita, com erro PostgreSQL **23503**, a exclusão de qualquer ingrediente com linha correspondente em `cc_pilot_ingredient_measure_reviews`.

**Efeito intencional:** para as 119 receitas historicamente conciliadas, a rotina de salvar receita oficial que apaga/recria todos os ingredientes **não conseguirá concluir** enquanto existirem esses vínculos; a transação deve falhar sem excluir nem recriar os ingredientes. A edição de receitas sem histórico vinculado não é bloqueada por esta proteção. Correções editoriais dessas receitas devem passar, futuramente, por atualização que preserve os IDs ou por fluxo versionado com integridade histórica. Não contornar o trigger para editar receitas do piloto.

O trigger **não concede acesso a usuário algum**, não publica receitas, não modifica a RLS, não altera alergênicos e não remove nem atualiza registros existentes.

### 4. Verificações reais após aplicação
- `pg_trigger` confirmou a presença e ativação do novo trigger, com execução **BEFORE DELETE**;
- `pg_proc` confirmou `SECURITY DEFINER` e `search_path=''`;
- `has_function_privilege('anon'/'authenticated', ..., 'EXECUTE') = false` para a função de trigger;
- Contagem histórica permaneceu **1.072 registros de 119 receitas**;
- O advisor manteve os mesmos tipos e quantidades de avisos anteriores;
- O arquivo versionado e o teste `scripts/test-pilot-history-delete-guard.mjs` verificam o contrato SQL antes de cada build.

**Limitação de homologação:** não executamos DELETE sobre ingredientes reais, nem mesmo em transação revertida. Verificamos a instalação, privilégios e invariantes, e usamos teste de código da migração. O efeito negativo completo deve receber teste de integração com fixtures isoladas/usuários controlados quando a rotina versionada de edição for construída.

### 5. Próximas verificações em produção controlada
1. Testar chamadas HTTP com JWT real de anon, usuário comum, participante Beta e administrador, incluindo escrita negativa e Storage sem tocar dados de outros usuários;
2. Confirmar se interfaces de edição das 119 receitas devem exibir mensagem amigável de histórico protegido e orientar fluxo versionado;
3. Construir editor in-place/por versões preservando IDs e trilhas para as fontes do piloto, antes de liberar alterações nesses ingredientes;
4. Revisar individualmente funções privilegiadas remanescentes e habilitar proteção contra senhas vazadas em Auth após validar o impacto;
5. Manter liberação comercial e aprovação de medidas como decisões independentes.

### 6. Referências
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/storage/security/access-control

**Nota:** este relatório descreve uma mudança real e restritiva no banco; não representa testes HTTP autenticados, garantia de invulnerabilidade ou homologação de receitas.
