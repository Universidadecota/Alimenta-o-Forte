# Costa&Costa Alimentação Forte — Fase 3J
## Evidência oficial de origem por receita — 29/10/2026

**Tipo:** implementação de leitura administrativa sob demanda. **Ambiente:** Beta. Nenhuma migração, reconciliação persistida, aprovação editorial ou reescrita de receita.

### Dados e acesso verificados
- 119 receitas possuem inventário de medidas no piloto privado.
- As 119 têm uma linha correspondente em `public.cc_official_recipe_source_records`; nenhuma está sem fonte; `use_stage = personal_pilot` em todas.
- A fonte oficial registra `source_document`, `entry_number`, `source_page`, `original_title`, `original_ingredients` e `reference_hash`.
- RLS está ativada. Políticas de `cc_official_recipe_source_records` e `cc_pilot_ingredient_measure_reviews` permitem SELECT ao administrador via `cc_is_admin()`. O componente não deve ser deslocado para uma rota pública.
- `reference_hash` é exibido como identificador armazenado, sem alegar recálculo ou autenticação criptográfica nesta fase.

### Comportamento implementado
1. No painel global de conciliação por receita, cada linha divergente oferece **Examinar fonte** (além de **Ver histórico**).
2. O clique carrega **somente** a fonte oficial e os dois inventários daquela receita via SELECT. A consulta limita a leitura a 250 linhas por tabela e confere `count=exact` antes de apresentar qualquer resultado.
3. O relatório exibe os ingredientes integrais no documento de origem, referências de proveniência e a comparação histórica × atual **pelo mesmo `ingredient_id`**: texto, posição, ambos, exato ou registro atual ausente.
4. Ingredientes atuais sem ficha histórica são listados **separadamente**. Proximidade de posição, nomes semelhantes e partes de uma frase composta **não** estabelecem automaticamente vínculo 1:N.
5. Uma função pura revalida as contagens e categorias por receita contra a fotografia da pré-análise. Diferenças, relações cruzadas, IDs duplicados ou fonte ausente encerram a leitura com mensagem para reanalisar, sem relatório parcial.
6. Ao trocar de receita, o relatório anterior é descartado. Nenhuma consulta atualiza dados.

### Casos cobertos nos testes
- Desmembramento de `pimenta. Molho: 4 tomates maduros` em texto antigo reduzido + nova linha sem ficha histórica.
- Deslocamento de posição de `1 cebola`; texto e posição alterados de `azeite`; ausência de ingrediente atual.
- Identificação e preservação do texto oficial e hash de referência.
- Rejeição da fonte de outro estágio ou outra receita.
- Falha conservadora quando o inventário, a receita ou as contagens diferirem da análise global.

### Limites intencionais
- Não determina como um ingrediente antigo se relaciona a vários novos; isso depende de decisão editorial humana, com evidência e trilha de auditoria.
- Não cria tabela ou RPC, não edita `cc_official_recipe_source_records`, `cc_pilot_ingredient_measure_reviews` ou `recipe_ingredients`.
- Não libera valores nutricionais, ajustes de porções, compras ou decisões sobre alergênicos.
- Não reabre testes manuais já homologados pelo usuário.

### Próximo portão
Uma proposta futura de mapa 1:N deve definir identificadores de fonte/trechos, revisão editorial, razão da decisão, proteção contra repetição e plano de reversão; só poderá ser persistida mediante autorização específica.
