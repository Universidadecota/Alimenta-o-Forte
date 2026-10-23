# Costa&Costa Beta — A3B: evidências de alergênicos por ingrediente
Data: 23/10/2026. Branch `feat/revisao-alergenos-fase1-12out2026`. PR #16 segue em rascunho; `main` não é alterada.

## Objetivo e escopo efetivo
- A3 já foi validada visualmente; a fila, as pistas textuais e o rascunho anterior continuam intactos.
- A3B acrescenta um módulo ADMINISTRATIVO para selecionar um ingrediente de uma receita e registrar, por versão, fonte consultada, marca/fornecedor, composição e derivados suspeitos, pendências de contato cruzado e situação da investigação.
- O histórico é **somente acréscimo (append-only)**: cada salvamento faz `INSERT` em vez de reescrever o registro anterior. O banco registra data, usuário, nome atual do ingrediente e `reference_hash` da fonte, ignorando valores desses campos enviados pelo navegador.
- Registros antigos são detectados como desatualizados quando texto do ingrediente ou referência original muda. A interface não permite considerar uma evidência desatualizada como conclusão; ainda não existe aprovação nesta fase.
- Os únicos estados permitidos são `investigating` e `awaiting_supplier`. Não existem campos para "sem alergênicos", "contato cruzado ausente", "verificado" nem liberação.

## Arquivos
- `src/AdminAllergenIngredientEvidence.tsx`: consulta RLS restrita; seleciona ingrediente; grava nova evidência somente mediante ação/confirmacão administrativa. Se a tabela ainda não existir, exibe informação de espera e preserva o formulário A3 em funcionamento.
- `src/AdminAllergenReviewQueue.tsx`: carrega IDs e posições reais dos ingredientes e o hash original para detectar evidências desatualizadas.
- `supabase/migrations/20261023185000_cc_allergen_ingredient_evidence_a3b.sql`: tabela com RLS administrativa, trigger de captura de origem no servidor, sem concessão de `UPDATE/DELETE` a `authenticated` e sem qualquer procedimento de aprovação.
- `scripts/test-allergen-a3b-evidence.mjs`: travas estáticas de regressão ligadas ao CI.

## Ativação controlada (pendente)
**A migração está preparada no repositório e NÃO deve ser aplicada automaticamente no banco principal.** Antes:
1. Registrar um backup recuperável do banco principal (ou ponto de restauração equivalente) e identificar o destino exato `gclhailalyrokvmkwllm`.
2. Revisar SQL de criação, políticas RLS, permissões e comportamento do trigger.
3. Aplicar a migração com autorização para este passo no banco principal já escolhido pelo usuário; não criar outro ambiente.
4. Executar consultas de auditoria: tabela vazia inicialmente; apenas admin consegue ler e inserir; anon/usuário comum não acessa; atualizar/apagar via app são negados; o insert captura a origem real.
5. Só então fazer uma nova verificação visual **da novidade A3B**, sem repetir cadastro, autenticação, compras, isolamento nem a A3.

## Limites e próximo gate
- Mesmo evidências completas de um ingrediente não provam segurança da receita inteira. Rótulos mudam com lotes e fornecedores, equipamentos e ambiente de preparo.
- O hash atual cobre a referência textual original e o nome transcrito do ingrediente; eventual revisão de preparo e fornecedores ainda exige critérios adicionais de versionamento antes de liberação.
- O perfil alérgico segue integralmente bloqueado em `proposeWeek`. Nenhum dos 114 itens está autorizado só por pistas textuais, tampouco pela ausência de palavras como "soja".
- Na fase seguinte serão necessários taxonomia revisada, evidência por alergênico, avaliação de contato cruzado pelo responsável qualificado, invalidação ao mudar fonte e **validação no servidor**. Somente um conjunto-piloto comprovado permitirá retomar, com segurança, a geração das 21 refeições principais preservando lanches/ceia opcionais.
