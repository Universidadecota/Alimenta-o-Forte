# Costa&Costa — Fase 3R: mapa auditável de preparos auxiliares (30/10/2026)

## Objetivo e limites
Separar, **na visualização administrativa**, ingredientes da refeição principal, do molho preparado e do acompanhamento, sem alterar registros históricos, criar novas receitas, aprovar ingredientes ou calcular porções e compras. Os grupos são interpretação editorial de trechos e posições já existentes nos registros de origem: não são relações confirmadas do catálogo.

A fonte oficial, seu hash, a porção registrada e os 45 ingredientes originais (quantidade numérica estruturada nula) foram confrontados em leitura direta do Supabase. As três receitas permanecem `published=false`; medidas, direitos comerciais e segurança alimentar não homologados.

## Mapa documentado

| Receita | Refeição principal | Molho auxiliar | Acompanhamento | Rendimento ou uso do molho |
|---|---|---|---|---|
| Bolinhos de salmão com maionese caseira e salada de pepino | Posições 0–7: oito ingredientes | Posições 8–11: quatro ingredientes | Posições 12–15: quatro ingredientes | Não consta rendimento ou quantidade aplicada do molho |
| Caesar sem queijo, com frango | Posições 0–7: oito ingredientes | Posições 8–14: sete ingredientes | — | Fonte informa **2 a 3 porções do molho**, enquanto a refeição serve uma pessoa |
| Salada de ovos em canoas de endívia | Posições 0–9: dez ingredientes; na posição 1 há referência a **1 colher (sopa) de maionese caseira** | Posições 10–13: quatro ingredientes | — | Fonte do molho informa rendimento de **cerca de ½ xícara** e o prato usa 1 colher (sopa) |

Total: **7 blocos editoriais e 45 posições distintas**, sem ingredientes omitidos nem duplicados entre blocos. As referências a molho pronto no prato não são interpretadas como ingredientes independentes a somar à base do próprio molho.

**Não converter** meia xícara em colheres com base no volume teórico, nem deduzir automaticamente o consumo ou as sobras de molho: rendimento efetivo, densidade, perdas, utensílio e método precisam de validação culinária. A exibição do valor da fonte não equivale a seu uso validado para cálculo.

## Como funciona na Beta
**Administração → Medidas das receitas autorais → Ferramentas globais → Conciliação técnica → Fila editorial → Examinar fonte → Proposta editorial de preparo mais seguro.**

A tela informa:
- Os ingredientes na ordem e redação atuais, agrupados por tipo de preparo;
- Rendimento *quando a fonte o declara* e quantidade usada *quando está explícita*;
- Possível contagem dupla de maionese pronta + componentes;
- Avisos sobre repetição intencional de ingredientes (como suco de meio limão) em blocos diferentes;
- Bloqueio explícito de cálculos de compras, rendimentos consumidos e nutrição.

## Segurança e prova de integridade
- A divisão somente aparece depois da aprovação técnica **do snapshot de leitura** pelo método `getVerifiedSauceAudit`, que confronta receita não publicada, fonte oficial, hash, rendimento, texto integral e os 45 nomes, posições e medidas nulas correspondentes.
- Uma mesma posição não pode aparecer em dois blocos; nenhuma posição pode ficar de fora. IDs duplicados ou referência de maionese que não bate com a expressão atual também impedem a exibição.
- Testes em `scripts/test-pilot-preparation-partition.mjs` exercitam distribuição 8+4+4, 8+7 e 10+4, alterações de dados, duplicidade de ID, mudança de fonte e proibição explícita de cálculos.
- O build da aplicação executa todos os testes pertinentes antes de TypeScript/Vite.
- Nenhuma tabela, migração, RPC, RLS, regra de alerta de alergia ou cálculo foi alterado. Branch `main` preservada.

## Próxima decisão editorial
Antes de formalizar preparos auxiliares em entidades persistidas:
1. Revisar ingredientes, rendimento e composição de cada molho, especialmente o uso de gemas pasteurizadas e a conservação;
2. Definir a quantidade efetivamente consumida de cada subpreparo, potenciais sobras e opções de reaproveitamento seguro;
3. Modelar de forma explícita **receita principal → preparo auxiliar → quantidade aplicada**, com histórico versionado e controles de autoria;
4. Verificar como o planejador e a lista de compras vão aplicar essa relação **sem contagem dupla**;
5. Autorizar, de forma separada, qualquer mudança no banco e no catálogo comercial.

Este documento descreve uma análise de origem para revisão, não uma receita pronta para publicação.
