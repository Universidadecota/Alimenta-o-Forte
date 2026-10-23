# Costa&Costa Beta — A4: constatações preliminares por alergênico

Data: 23/10/2026. Branch feat/revisao-alergenos-fase1-12out2026. PR #16 permanece **draft**; main não deve ser mesclada sem nova autorização.

## Ponto de partida: validações encerradas
- A3B aplicada no Supabase principal gclhailalyrokvmkwllm após dispensa explícita de backup pelo usuário em 23/10/2026.
- Testes transacionais A3B anteriores: INSERT administrativo permitido, comum impedido, UPDATE/DELETE negados no app, sem linhas artificiais persistidas.
- Em 23/10/2026 às 15h37 (Brasília), o usuário registrou a primeira evidência A3B real para **2 ovos**, usando texto original da receita; consulta ao Supabase confirmou estado investigating, fonte recipe_text, alérgeno suspeito ovos, notas de composição e contato cruzado. Essa evidência **não libera** a receita.
- Cadastro, login, recuperação de senha, isolamento de usuários, compras e testes visuais A3/A3B: **não repetir**.

## O que a A4 acrescenta
- Taxonomia editorial inicial, controlada no banco, para seleção de códigos de alergênicos.
- Constatação administrativa por **ingrediente + alergênico**, vinculada ao evidence_id da A3B vigente, com observações e contato cruzado.
- Situações limitadas a declared_in_recipe, suspected e undetermined; contato cruzado limitado a not_assessed e possible_reported. **Não há estado que signifique ausência comprovada nem autorização para consumo.**
- Histórico append-only: cada constatação recebe recorded_by, recorded_at, texto atual do ingrediente e reference_hash atual da fonte capturados pelo banco; aplicativo não pode UPDATE/DELETE.
- O trigger rejeita fontes ausentes/desatualizadas, ingrediente fora de receita oficial ativa, evidência A3B que não seja a mais recente ou que pertença a outro ingrediente; presença declarada exige fonte textual e alérgeno identificado na A3B.
- Painel A4 aparece após A3B na triagem administrativa; antes da migração mostra estado de espera e preserva as funções anteriores.
- O gerador semanal permanece integralmente bloqueado para perfis com alergias. Nenhum registro A4 altera status para verified.

## Limites obrigatórios
1. A taxonomia inicial é uma lista de trabalho; não cobre automaticamente todas as equivalências de alergênicos, derivados e sinônimos em perfis livres.
2. Uma constatação de presença no **texto** não valida fornecedor, embalagem, ingredientes compostos, preparo, lotes ou riscos de contato cruzado.
3. A validação de ausência de alérgeno, quando possível, demanda evidência suficiente e profissional habilitado. Esses campos e permissões **ainda não existem**.
4. O fingerprint definitivo para futura elegibilidade também deverá cobrir preparo, versões de insumos e informações relevantes de fornecedor.
5. No passo A5, endpoint seguro de IDs elegíveis, RLS, revalidação do servidor e critérios positivos específicos por alérgeno deverão ser desenhados, revisados e homologados antes de tocar no planejador.

## Pendência editorial observada (não corrigida automaticamente)
- A lista transcrita da receita “Abacate recheado com ovo assado” também mostra “1 xícara de café preto”. Verificar se pertence à receita ou a uma refeição composta antes de qualquer reconciliação de ingredientes. Não remover nem alterar a origem sem conferência.

## Código, validação e ativação
- src/AdminAllergenStructuredFindings.tsx: formulário administrativo e histórico preliminar; entrada manual, nunca aprova.
- src/AdminAllergenReviewQueue.tsx: integra seção A4 abaixo da A3B.
- supabase/migrations/20261023193000_cc_allergen_a4_structured_findings.sql: esquema, taxonomia inicial, políticas RLS e trigger.
- scripts/test-allergen-a4-findings.mjs: testes de regressão estática; CI executa o script.
- Próximo gate: testes locais/CI → revisar migração e executar testes de permissão transacionais → ativação controlada no Supabase principal → uma única validação visual nova de A4, sem refazer QA encerrada.

**Registro A4 é triagem preliminar, nunca liberação nutricional, médica ou de cardápio.**
