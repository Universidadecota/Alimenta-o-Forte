# Fase 3L — Fila editorial priorizada das receitas (Beta, 29/10/2026)

## Contexto e objetivo
Após a conciliação por ID/texto/posição e a conferência da fonte oficial por receita, as divergências devem ser organizadas para facilitar a revisão manual. Esta entrega é exclusivamente de leitura.

## Onde encontrar
Administração → Medidas das receitas autorais · inventário e revisão → Ferramentas globais → Analisar todos os ingredientes → Conciliação técnica por receita → **Fila editorial priorizada**.

## Classificação exclusiva por receita
Cada receita divergente entra somente em uma categoria, conforme a primeira condição atendida:

1. **Histórico sem ingrediente atual**: pelo menos um ingrediente histórico não tem ID atual correspondente; atenção prioritária à preservação da origem.
2. **Ingrediente sem histórico**: ingrediente atual não tem ficha histórica; pode ser inclusão ou possível desmembramento, sem estabelecer equivalência.
3. **Texto divergente**: nome alterado e/ou nome e posição alterados, sem categorias anteriores.
4. **Somente posição**: texto preservado com posição distinta, sem nenhuma das outras divergências.

As contagens são de receitas, não de ingredientes. As colunas da fila continuam exibindo todas as divergências da receita, mesmo quando sua categoria é única. A ordem padrão mostra primeiro as lacunas históricas; o usuário pode inverter para começar pelas revisões mais simples, e filtrar por categoria.

## Evidência e limites
- **Examinar fonte** mantém a conferência oficial da receita (origem, inventário histórico, estado atual e hipóteses literais conservadoras).
- **Ver histórico** mantém a navegação para a revisão individual existente.
- Não altera receita, imagem, ingrediente, posição, relações 1:N, proposta, aprovação, porções, lista de compras, informação nutricional, políticas de segurança ou qualquer objeto no Supabase.
- A classificação é editorial e **não** equivale a parecer médico, nutricional, classificação de alergênicos ou autorização de segurança alimentar.
- Nenhuma categoria presume a realização de um desmembramento: a prova requer avaliação humana e autorização específica para qualquer futura migração.

## Validação automatizada
Os cenários de regressão cobrem precedência de classificação, receita sem divergência, contagens exclusivas, filtros, ordem nos dois sentidos e preservação do inventário de entrada no comando npm run test:measure-batch.

## Publicação
Fluxo de PR para a branch Beta feat/revisao-alergenos-fase1-12out2026; main fora de escopo.
