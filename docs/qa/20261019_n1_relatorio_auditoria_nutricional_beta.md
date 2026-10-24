# Costa&Costa — N1: auditoria nutricional do catálogo beta (19/10/2026)

**Escopo:** 114 receitas liberadas pelo administrador em `public.cc_beta_recipe_access`. Auditoria somente de leitura no Supabase real. Sem modificação de ingredientes, receitas, porções, evidências ou decisões editoriais.

## Resultado medido

| Indicador | Resultado |
|---|---:|
| Receitas beta auditadas | 114 |
| Receitas com preparo registrado | 114 |
| Receitas com rendimento original registrado | 114 |
| Receitas com fonte sinalizada `needs_structuring` | 114 |
| Ocorrências de ingredientes inventariadas para estas receitas | 1.041 |
| Ocorrências com medida confirmada | 1 |
| Ocorrências em rascunho | 3 |
| Ocorrências com revisão pendente | 1.037 |
| Ocorrências com quantidade métrica estruturada (`g,kg,ml,l`) na tabela operacional | 0 |
| Vínculos ingrediente ↔ alimento/variante nutricional existentes | 0 |
| Fichas técnicas existentes para estas receitas | 5 (todas pendentes) |
| Receitas aptas a cálculo nutricional auditável neste momento | **0** |
| Variantes nutricionais de alimentos com status `verified` | 0 (58 aguardando especialista) |

**Interpretação:** os rendimentos originais foram cadastrados, mas rendimento **não significa massa de porção aferida**. A existência de ingredientes em texto não implica gramagem, alimento equivalente nem preparo/nutrientes verificados. Portanto **114/114 estão bloqueadas para cálculo nutricional publicado** até saneamento de evidências.

O inventário geral de medidas possui 1.073 linhas, mas **somente 1.041 correspondem às 114 receitas habilitadas**; não confundir os universos ao reportar cobertura.

## Matriz N1 por receita

- **Arquivo anonimizado**: [20261019_n1_matriz_nutricao_beta_anonimizada.csv](./20261019_n1_matriz_nutricao_beta_anonimizada.csv) — 114 linhas, sem títulos, UUIDs de receitas, textos originais, dados pessoais ou segredos. O código de auditoria usa os 12 primeiros caracteres de `md5(recipe_id::text)` apenas para correlação administrativa; **não** serve como controle de acesso.
- **Consulta para uso interno**: [20261019_n1_matriz_nutricao_beta.sql](./20261019_n1_matriz_nutricao_beta.sql) — reproduz a matriz com títulos **somente ao ser executada por um administrador no Supabase**. Não adicionar o resultado integral ao repositório público.
- Campos fundamentais: quantidades de ingredientes, revisões pendentes, confirmações, vínculos com massas/variantes, situação da ficha técnica, rendimento, prioridade de triagem e motivos de bloqueio.
- A saída `PRONTA_PARA_REVISAO_FINAL_DO_CALCULO`, caso surja no futuro, **não** equivale a `verified` nem autoriza publicação automática. A liberação final depende de evidências, dos controles de revisão e da verificação do cálculo.

## Priorização operacional

| Fila | Critério simples | Receitas | Ocorrências de ingredientes | Situação |
|---|---|---:|---:|---|
| P1 | Até cinco ingredientes | 9 | 40 | Revisar primeiro; nenhum valor aprovado |
| P2 | Entre seis e nove ingredientes | 57 | 437 | Em espera de N2 |
| P3 | Dez ou mais ingredientes | 48 | 564 | Em espera de N2 |
| **Total** | | **114** | **1.041** | **0 aptas a cálculo** |

**Esta classificação é apenas uma estimativa de esforço editorial**, não uma avaliação de segurança alimentar, nutrição nem dificuldade de preparo. Qualquer ingrediente sem massa comprovada pode bloquear uma receita curta.

## Próxima fase N2 — vinculação e evidências

1. Começar pelas **nove receitas P1**, sem alterar seu texto de origem. Conferir cada ingrediente, quantidade, unidade, item opcional e alternativas.
2. Medir ou comprovar a **massa efetivamente usada** na receita e o rendimento/porção. Usar unidades de cozinha padronizadas somente com evidências verificadas, não conversões genéricas para xícara, colher ou unidade.
3. Identificar alimento **e variante de preparo** adequados, distinguindo cru, cozido, grelhado etc.; não equiparar alimentos heterogêneos apenas por nome.
4. Associar referência nutricional com fonte rastreável e validação do responsável habilitado. Os 58 registros nutricionais dos alimentos estão em `awaiting_specialist` e não passam automaticamente a `verified`.
5. Registrar o estado da ficha técnica em `cc_recipe_technical_sheets` e os vínculos em `cc_recipe_ingredient_food_links`; não criar associações ou aprovações sem evidência.
6. Só então implementar/homologar motor de cálculo por **receita integral e por porção**, com critérios para ingredientes opcionais, perdas no preparo, rendimento final e dados ausentes.
7. A segurança de alergênicos é uma **trilha independente**: nenhum cálculo nutricional prova ausência de alergênicos ou de contato cruzado.

## Salvaguardas

- Fonte editorial preservada; nenhuma receita inventada, reescrita ou publicada pela auditoria.
- Nenhum alimento, ficha técnica ou número nutricional é confirmado automaticamente.
- Branch de desenvolvimento atual; a `main` e o PR #16 draft permanecem sem merge.
- A classificação N1 não exige mudanças no esquema nem credenciais de administrador no código do aplicativo.
- O repositório GitHub é **público**; por isso a exportação por receita está **anonimizada**. O SQL permite a quem possui acesso legítimo ao banco obter os títulos sob autorização.
