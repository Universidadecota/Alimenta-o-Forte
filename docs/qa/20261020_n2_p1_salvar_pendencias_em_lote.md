# Costa&Costa — N2 P1: salvamento revisado de pendências em lote (20/10/2026)

## Escopo entregue
- **Somente Administração**, fila N2 P1: 9 receitas com até 5 ingredientes cada, 40 ocorrências ao todo.
- Após clicar em **Pré-preencher sugestões desta receita**, o administrador pode conferir/corrigir cada situação e usar **Salvar N pendência(s) revisada(s)**.
- O botão envia apenas os campos `ingredient_id`, `triage_status` e `review_note`. **Nunca envia** `food_item_id`, variante nutricional, massa, evidências de pesagem, `match_status` ou qualquer aprovação.
- A função de gravação `public.cc_n2_save_recipe_triage_batch(recipe_id, entries)` grava entre 1 e 5 itens de **uma única receita oficial ativa, habilitada no beta e pertencente à fila P1**. A operação é atômica.
- Cada justificativa precisa ter de 12 a 2000 caracteres; a triagem deve ser `need_mass`, `need_food`, `ambiguous_or_optional` ou `candidate_documented`. Não salva entradas pendentes sem justificativa.
- O banco impede IDs repetidos, ingredientes de outra receita, lote malformado e usuários não administradores.
- O botão pede confirmação explícita; nenhuma gravação ocorre ao pré-preencher.
- O controle só envia triagens alteradas e válidas; salvamentos repetidos com conteúdo idêntico não fazem atualizações desnecessárias.
- Rascunhos de outros ingredientes são preservados após salvar o lote.

## Validação feita no Supabase real, sem resíduos
- Simulação de conta administradora: duas triagens criadas no mesmo lote, ambas presentes durante a transação.
- A mesma operação repetida retornou **0 alterações** (idempotência).
- Justificativa menor que 12 caracteres: **bloqueada**.
- IDs de ingredientes duplicados: **bloqueados**.
- Ingrediente de outra receita: **bloqueado**.
- Conta comum: chamada ao RPC negada por permissão.
- Papel `anon`: sem direito de execução.
- `ROLLBACK` aplicado ao término do teste. Auditoria subsequente: **0 triagens e 0 vínculos artificiais remanescentes**.
- Build/Testes GitHub Actions e deploy Vercel: concluídos com sucesso no commit da interface.

## Limites e governança
- `Pré-preencher` **não é** `Salvar`.
- `Salvar pendências` **não é** `Salvar vínculos candidatos`.
- `Vínculo candidato` **não é** `Vínculo confirmado`, e nenhum destes é aprovação de valor nutricional.
- A validação de uma massa depende de evidência aferida e a ficha de receita depende de revisor habilitado.
- As receitas originais e seu rendimento permanecem inalterados.
- O estado de 114 receitas beta, 58 variantes nutricionais em `awaiting_specialist` e 0 fichas nutricionais de receitas verificadas continua sob as restrições já registradas.
- O repositório é público: este documento não revela IDs de usuários, textos do catálogo privado ou segredos.

## Sobre a URL do preview
Os endereços de previews anteriores do Vercel continuam apontando para builds anteriores. O navegador não muda sozinho um endereço de preview para o commit mais recente.
Para conferir a nova opção, abra Vercel → projeto Costa&Costa → **Deployments**, escolha o deploy mais recente **Ready** da branch `feat/revisao-alergenos-fase1-12out2026` e use **Preview**. Não contorne qualquer alerta de site perigoso; a reputação do domínio deve ser verificada antes de convidar testadores.

## Próximo bloqueio do beta
A pré-triagem reduz trabalho administrativo, mas **ainda não produz valores nutricionais por porção**. Para isso, precisamos das massas e rendimentos verificados, das variantes alimentares revisadas e da aprovação técnica competente. Seguir com a validação dos 40 ingredientes P1 é a próxima atividade editorial.
