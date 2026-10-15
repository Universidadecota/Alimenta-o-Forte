# Costa&Costa — Fichas técnicas completas e alertas contextuais (projeto da Fase A)
**Data:** 15/10/2026 · **Estado:** desenho técnico/funcional **ainda não implantado**; derivado da auditoria `docs/qa/20261015_recipe_technical_sheet_audit.md`. Não alterar a versão de produção sem aprovação dos testes.

## Objetivo do produto
Substituir o alerta global e extenso por apresentação **curta, legível e contextual**, sem tratar receita não avaliada como apta a quem tem alergias. Completar conteúdos nutricionais e de segurança somente a partir de referências verificáveis e avaliação editorial. O rótulo `publicada` nunca equivale a `revisada`.

## 1. Estrutura sugerida para ficha técnica de receita
Manter `recipes` e `recipe_ingredients` como origem, sem substituição direta dos ingredientes existentes.
- **Identificação:** `recipe_id`, titularidade (oficial/pessoal), categoria, nome, status de publicação, descrição, passos, tempo, imagem/atribuição e autorização quando aplicável.
- **Fórmula versionada:** `formula_version`/hash calculado de lista ordenada de ingredientes (nome, quantidade, unidade, estado, modo/obrigatoriedade), `servings`, `total_yield_quantity/unit` e `yield_verified_at`. Definir regra para mudança de modo de preparo, composição do produto e porções também invalidar revisões quando pertinente.
- **Ingredientes técnicos:** por item, identificação canônica opcional em `food_items`; descrição literal preservada; estado cru/cozido/drenado; quantidade original e conversão para g/ml **somente com equivalência documentada**; produto/marca/rótulo quando necessário; fonte e data da conversão; sinalização de opcional/a gosto.
- **Nutrição por receita e por porção:** energia, carboidratos, proteínas, gorduras totais/saturadas, fibras, sódio e demais nutrientes **apenas quando disponíveis**; alimento/composição de referência (TBCA/TACO ou rótulo verificado, com edição e data), fator de rendimento/porção, metodologia, responsável/revisor, data e status. O cálculo é bloqueado se houver ingrediente obrigatório com massa desconhecida, densidade não verificada ou rendimento inconsistente. Para opcionais, manter cenário específico e não somar valor fictício.
- **Alergênicos e risco de contato cruzado:** presença de alergênicos/derivados declarada, evidência por ingrediente e produto, possíveis fontes de contato cruzado, modo de preparo e origem dos insumos, resultado editorial, responsável/data e **versão da fórmula à qual se refere**. Mesmo avaliação revisada não significa garantia universal de ausência.
- **Processo editorial:** `draft -> in_review -> verified` ou `rejected`; revisão nutricional separada da revisão de alergênicos; histórico de aprovações e justificativa para alterações. Apenas administradores autorizados aprovam receitas oficiais; revisão profissional quando adequada.

## 2. Reaproveitar a estrutura de alergênicos existente
A tabela `public.cc_recipe_allergen_reviews` já existe e está vazia. Colunas: `recipe_id`, `status` (`pending/in_review/verified/rejected`), `declared_allergens`, `cross_contact_status` (`unknown/possible/assessed`), `cross_contact_notes`, `evidence_notes`, `reviewed_by`, `reviewed_at` e `updated_at`. RLS existente permite consulta e alterações por membros administrativos. **Não criar tabela duplicada** para o mesmo conceito.

**Antes de usar essas revisões no front:**
1. Associar revisão à versão/hash atual da receita. Invalidação **transacional** em alterações relevantes no ingrediente, na fórmula, nas instruções, no produto de origem ou no contato cruzado. Se divergirem hashes, status público = `not_reviewed` mesmo que exista linha com `status='verified'`.
2. Garantir que `verified` não signifique `safe`: os campos atuais só comprovam registro de revisão, não resultado de compatibilidade com cada perfil de alergia.
3. Manter `evidence_notes` e identificação do revisor em área administrativa. Se houver necessidade de exibição a usuários, disponibilizar apenas dados públicos mínimos, por RPC/view endurecida que respeite RLS e não revele rascunhos nem outras contas. Evitar conceder SELECT indiscriminado à tabela de revisões.
4. Sem revisar os casos de `cross_contact_status='possible'`, a interface deve continuar exibindo incerteza. `assessed` **não** implica ausência de contato cruzado.
5. Revisar triggers e fluxos `cc_save_official_recipe`, `save_personal_recipe` e qualquer edição direta autorizada para não conservar aprovações obsoletas.

## 3. Motor de avisos por receita (contrato proposto)
Entradas: usuário autenticado, alergias explicitamente cadastradas, receita publicada/pertencente ao usuário, revisão vigente e evidências relevantes.

Estados de saída **não clínicos**:
- `contains_declared_allergen`: ingrediente contém alergênico relevante confirmado => aviso específico visível e nenhuma recomendação automática para aquele perfil.
- `possible_cross_contact`: risco possível identificado => aviso específico visível; não recomendar automaticamente.
- `insufficient_information`: revisão ausente, desatualizada, incompleta ou produto/rótulo não verificado => aviso breve e bloqueio de recomendações automáticas com alergias.
- `reviewed_no_declared_match`: não foi identificado conflito nos dados revisados e atuais, com contato cruzado avaliado; **não exibir “livre de”, “seguro para alérgicos” nem garantir ausência de risco**. Aplicar critérios conservadores e revisão da adequação das regras antes de recomendar.
- `no_allergies_declared`: não se aplica aviso personalizado, mas a ficha pode indicar estado editorial pendente.

A classificação deve ser **por receita e por alergia**, não por semana inteira. Prioridade de exibição = presença confirmada > contato cruzado possível > informação insuficiente > dados revisados sem correspondência. Uma semana com diversas receitas pode apresentar resumo dos estados, mantendo identificação de cada receita.

**Estado de partida real:** nenhuma avaliação registrada. Logo, para usuários com alergias cadastradas, todas as receitas devem continuar como `insufficient_information` e a sugestão automática permanece bloqueada. Não liberar por mera correspondência de nomes ou por ausência de palavras como “soja”.

## 4. Interface móvel, sem “assustar” e sem esconder riscos
- **Cardápio:** uma linha de alerta contextual, por exemplo “Alergia cadastrada: soja · receitas ainda não verificadas”, acompanhada de link `Conferir receitas`. A mensagem essencial deve continuar visível; detalhes pedagógicos em seção expansível para reduzir altura, nunca ocultar a existência do risco.
- **Receita:** próximo à lista de ingredientes, identificar alergênico confirmado e incertezas por receita. Se aparecer conflito relevante, apresentar o aviso de forma destacada sem cores alarmistas desnecessárias. Um acionamento de detalhes explica fonte, estado editorial e contato cruzado.
- **Ao adicionar/copy/mover/sugerir:** manter confirmação específica; não autorizar sugestões automáticas para perfis com alergias enquanto o motor não oferecer avaliações completas com critérios revisados. Não usar alerta longo repetido quando o aviso essencial + confirmação contextual bastarem.
- **Acessibilidade:** WCAG, botão/link com nome claro, leitor de tela para mudanças relevantes, contraste e alvos de toque adequados (390 px e aparelho físico). Alertas não dependem apenas de cor.
- **Perfil sem alergias cadastradas:** não impor mensagens personalizadas de alergia; manter indicação discreta de dados demonstrativos ainda sem verificação.

## 5. Sequência de implementação protegida
1. Obter referências editoriais para os 8 registros oficiais e corrigir pendências confirmadas **com aprovação humana**, sem tocar receita pessoal. Manter Iogurte Turbo não publicado.
2. Definir dados faltantes, relacionamento opcional com biblioteca, versionamento e workflow de revisão; preparar migração **em arquivo Git** e revisar RLS/ACL/triggers antes de aplicar. Não executar `supabase db push`.
3. Criar painel de revisão editorial restrito à administração, com provas, fontes, checklist e status. O revisor aprova separadamente nutrição e alergênicos.
4. Implementar API de leitura mínima por receita com verificação da versão; testes com usuário comum/admin/anônimo, mudanças em ingredientes e rascunhos.
5. Introduzir alertas compactos com fallback seguro e testes de interface em celular. Substituir o aviso global **somente após** testes completos do motor.
6. Planejar ativação progressiva e conciliar histórico de migrações local/remoto antes de qualquer merge/deploy.

## 6. Critérios de aceite
- **Dados:** sem quantidade inventada, sem conversão não validada, sem alegações nutricionais clínicas ou declaração genérica de receita segura. Toda porção calculada tem fonte, fórmula versionada e rendimento verificado.
- **Segurança:** receita alterada perde avaliação vigente; RLS impede alteração de revisão por usuário comum e exposição de dados de outras contas; rascunhos oficiais não aparecem em API pública; revisão vazia nunca libera recomendação.
- **Produto:** sem bloqueio indevido de receitas existentes e sem exclusão de planejamentos/compras; avisos essencialmente curtos e contextualizados, com informação detalhada sob demanda.
- **Homologação:** testes de receita com alérgeno presente, contato cruzado possível, sem avaliação, avaliação obsoleta, perfil sem alergias, perfil com múltiplas alergias e tratamento de falhas de rede; testes 390 px e desktop; build e logs.
- **Produção:** aprovação editorial e de segurança, testes de permissões, migrações reconciliadas, decisão explícita sobre PR #16.

## Referências de trabalho (não substituir revisão regulatória/nutricional)
- Anvisa: `https://www.gov.br/anvisa/pt-br/assuntos/alimentos/rotulagem/rotulagem-nutricional/` (RDC 429/2020 e IN 75/2020 para alimentos embalados; aplicabilidade à apresentação de receitas deve ser avaliada).
- Anvisa: `https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/rotulagem-de-alergenicos.pdf` (orientações referentes à RDC 727/2022; não fazer alegações indiscriminadas de ausência de alergênicos).
- Bases brasileiras de composição: TBCA/USP e TACO/Unicamp, condicionadas à verificação da versão, definição de porção e termos de uso. Não copiar valores sem vincular alimento, unidade e fonte.
