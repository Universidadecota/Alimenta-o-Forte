# Costa&Costa Beta · Fase A2 · Contrato de segurança para sugestões com alergias
Data: 23/10/2026. Branch: `feat/revisao-alergenos-fase1-12out2026`. PR #16 deve permanecer **draft, sem merge**. A `main` não deve ser alterada nesta fase.

## Evidência observada
- O painel administrativo lista 114 receitas habilitadas no Beta; a primeira triagem, da receita **Abacate recheado com ovo assado**, foi salva com `status=in_review` e `cross_contact_status=unknown`. A interface e consulta somente leitura ao banco confirmaram o salvamento.
- Nenhuma receita pode ser considerada segura por um rascunho. O botão de sugestão semanal deve continuar recusando pessoas com alergias até haver elegibilidade validada de ponta a ponta.
- O catálogo contém 1.073 ingredientes/itens de trabalho editorial. **Não exigir revisão manual individual de todos os 1.073**: agrupar e priorizar, usar pré-classificação automatizada como *hipótese* e aprovação humana qualificada dos casos/revisões relevantes.
- O formulário anterior apresentava `label` e controles comprimidos horizontalmente. Fase A2 aplica alinhamento vertical, largura integral, rótulos explícitos e texto redimensionável; regressão estática adicionada.

## Lacunas que impedem ativar sugestões para alérgicos
1. `cc_recipe_allergen_reviews.declared_allergens` lista suspeitas/presenças; a **ausência** de um alérgeno não é prova de que foi analisado e excluído. É necessária cobertura explícita por alérgeno.
2. `cross_contact_status=assessed` isoladamente não certifica ausência do risco específico; `possible` não deve ser elegível. Precisamos do resultado da avaliação por alérgeno, rótulos, fornecedores e processo.
3. A tabela não liga a revisão a uma **versão/fingerprint** da composição, preparo e insumos. Alterações posteriores devem revogar automaticamente a elegibilidade.
4. As políticas RLS existentes restringem `SELECT` de `cc_recipe_allergen_reviews` a administradores. **Nunca** abrir a tabela e suas evidências editoriais aos demais usuários para facilitar o gerador. Uma interface mínima e segura de elegibilidade deverá ser projetada no servidor.
5. O perfil aceita texto livre de alergias/intolerâncias; variações como `ovo`/`ovos`, `soja`/`soy` e derivados necessitam de uma **taxonomia canônica revisada**, sem confiança em busca textual ou ausência de palavras.
6. A regra `verified_requires_reviewer` da migração exige revisor, data, evidência e contato diferente de desconhecido, mas **ainda não satisfaz** os requisitos acima. A marca `verified` sozinha não poderá liberar sugestões.

## Contrato futuro da elegibilidade (não ativado neste commit)
- Entrada: usuário autenticado, lista de alergênicos normalizados em código controlado; versão atual dos ingredientes/preparo da receita, status e evidência de revisão, alérgenos presentes, **alérgenos especificamente excluídos**, resultados de contato cruzado **por alérgeno**, carimbo de revisão e validade de fornecedores.
- *Fail closed*: bloquear se informação ausente, inconclusiva, obsoleta, conflitante, não reconhecida, `pending`/`in_review`/`rejected`, contato `unknown`/`possible`, ingrediente sem confirmação, evidência ou versão divergente; bloquear também se houver erro de rede ou permissão.
- O servidor deve devolver aos usuários comuns **somente IDs elegíveis** para os alergênicos solicitados; não retornar notas editoriais e não confiar em aprovação feita somente no navegador. Revisar RLS e autenticação da interface antes de qualquer deploy.
- A sugestão de 7 dias deve trabalhar somente com esses IDs elegíveis e as categorias/tempos da receita. Caso faltem receitas para qualquer refeição, informar a insuficiência e preservar integralmente o cardápio anterior. Não preencher com receita não verificada.
- A edição de receita, de ingrediente, de rótulo/fabricante/fornecedor ou de preparo relevante exige invalidação da liberação correspondente e nova avaliação.
- Aprovação e responsabilidade editorial devem ser exercidas por profissional competente, com evidências auditáveis; nenhum preenchimento automático equivale à decisão final.

## Sequência de implementação
1. **A2 (este trabalho):** corrigir usabilidade e consolidar guardas/tests mantendo bloqueio.
2. **A3:** inventariar fontes e versões, definir taxonomia e classificação assistida escalável; elaborar contrato de dados e migração **sem aplicar à produção automaticamente**. Formalizar responsável editorial.
3. **A4:** revisão humana de um conjunto-piloto suficiente por categoria; rastrear origem, evidência e contato cruzado.
4. **A5:** implementar endpoint de IDs elegíveis com RLS e invalidação, testes negativos e positivos, testes com contas comuns; conectar o planejador em ambiente controlado.
5. **A6:** somente após homologação independente, testar conta com alergia a soja e geração das 21 refeições com segurança, preservar cardápio se indisponível. PR #16 continua draft até nova autorização de merge.

## Aceitação A2
- Campos de alergênicos/evidências/contato cruzado visualmente amplos em desktop e mobile; edição/salvamento não altera receitas nem status de aprovação.
- CI detecta redução regressiva dos campos e bloqueio de sugestão ainda presente.
- No banco: primeiro rascunho continua `in_review`/`unknown`; nenhuma receita passa automaticamente para `verified`.
- Autenticação, isolamento entre usuários, compras e recuperação de senha: **validados anteriormente, não repetir**.
