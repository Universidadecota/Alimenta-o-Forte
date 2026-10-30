# Costa&Costa Alimentação Forte — Fase 3I
## Painel de conciliação técnica por receita — 29/10/2026

**Escopo:** Beta `feat/revisao-alergenos-fase1-12out2026`. Nenhuma alteração de banco, receita, status editorial, porção, compra, nutrição ou alergênico.

### Motivo
A pré-análise de medidas contém um inventário histórico com vínculo ao ingrediente atual por `ingredient_id`. Revisões culinárias anteriores podem ter dividido uma expressão composta em duas ou mais linhas, alterando o texto e/ou a posição. Corresponder registros por ID, texto e posição é uma prova técnica preliminar, **não** equivale a concluir que cada fragmento é editorialmente idêntico à expressão original.

### Fotografia read-only de referência — 29/10/2026
- 1.072 registros no histórico `cc_pilot_ingredient_measure_reviews`.
- 1.120 ingredientes atuais nas receitas associadas ao piloto histórico.
- 972 registros preservam texto e posição exatamente. A comparação global anterior apontou 100 divergências históricas (22 apenas texto, 76 apenas posição, 2 ambos) e 48 ingredientes atuais sem ficha histórica correspondente.
- Estes números são uma fotografia temporal, não valores fixados no componente. O painel relê o banco ao executar a análise.

### Implementação
1. Paginar o histórico com contagem exata e ordem estável.
2. Identificar as receitas do próprio histórico e paginar **somente** os `recipe_ingredients` dessas receitas, também com contagem exata.
3. Somar por receita: correspondência exata, texto diferente, posição diferente, ambos diferentes, histórico sem ingrediente atual, ingrediente atual sem ficha histórica; expor quantidade atual e histórica.
4. Mostrar apenas as receitas com divergências na tabela expandível, com botão para filtrar o histórico da receita.
5. Falhar fechado se houver erro de leitura, paginação incompleta, ID duplicado, vínculo inválido ou soma inconciliável. Nenhuma conclusão parcial deve ser apresentada como resultado atualizado.
6. Preservar a validação no frontend e no RPC que impede salvar rascunho quando texto/posição não batem.

A ferramenta exibe diferença **por ID**, não infere equivalência semântica, não realiza junções automáticas 1:N e não gera/aprova rascunhos por causa das divergências. Continuam independentes os avisos de alergia, a segurança alimentar, a classificação nutricional e as unidades de compra.

### Portões antes de qualquer migração de conciliação
- Produzir mapa explícito da fonte oficial `cc_official_recipe_source_records` para cada expressão histórica (com `reference_hash` e posições originais) e cada ingrediente atual envolvido.
- Revisar manualmente os casos 1:N, campos compostos e reordenações; registrar motivo, autor e evidências.
- Definir tratamento dos 48 registros atuais sem histórico e verificar a diferença entre a antiga menção editorial a 1.073 expressões e as 1.072 efetivamente encontradas.
- Propor migração com prévia, validação de integridade, rollback e aprovação específica. **Não executar** nesta fase.
- Testar de modo automatizado a regra de integridade e confirmar Beta; **não reabrir testes funcionais já homologados pelo usuário**.

### Critérios de aceite
- A soma dos estados históricos corresponde exatamente ao total histórico.
- A soma das correspondências com os atuais mais os atuais sem ficha histórica corresponde exatamente ao total atual nas mesmas receitas.
- Uma divisão 1:N gera sinais separados de texto alterado, posição deslocada e novo ingrediente atual, sem criar associação artificial.
- Filtros por receita preservam acesso à fila existente sem qualquer escrita automática.
- Branch `main` permanece inalterada; release restrito ao ambiente Beta.
