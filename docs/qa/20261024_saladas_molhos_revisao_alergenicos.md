# Costa&Costa / Alimentação Forte — três saladas e seus molhos (24/10/2026)

## Validação da composição editorial

Foi utilizado o mesmo documento de origem **Saladas Verdes com Proteína - Desafio 30 Dias.pdf**; as fichas independentes dos molhos (entradas 12, 13 e 15) **não foram modificadas**.

| Salada (entrada) | Molho copiado (entrada) | Ingredientes normalizados após ajuste | Hash novo da ficha composta |
| --- | --- | ---: | --- |
| Caesar sem queijo, com frango (1) | Molho Caesar sem queijo (12) | 15 | `6538873f59c212a1ac6f7b8e080965f1` |
| Asiática de repolho, alga e frango desfiado (8) | Vinagrete de gengibre (15) | 13 | `0090d33f0c7ebbe7538b9d21e0be2ac6` |
| Peito de peru com abacate, brotos e molho verde (10) | Molho cremoso de abacate e ervas (13) | 14 | `6c095d47bd7a8a7b20cb89d5204182c5` |

- Preparos, componentes e hashes atualizados em uma **transação guardada**, ensaiada primeiro com `ROLLBACK`. Depois de `COMMIT`, verificou-se que `recipes.instructions` coincide com `original_preparation` em todas as três fichas e que a lista de compras não possui mais placeholders `receita abaixo`.
- Texto de exibição nas três fichas aponta `receita abaixo`, seguida realmente da lista completa do molho. O preparo começa pelo molho e depois apresenta o preparo da salada.
- Os lotes dos molhos mantêm rendimento de **2 a 3 porções**. Nenhum percentual arbitrário de molho por porção de salada foi inferido; a lista de compras contempla o lote completo.
- Build `npm run build` aprovado; regressão pura `node scripts/test-planner-shopping.mjs` aprovada. A implantação Vercel do código de avisos `eabe22b9eeaa2b568a9e35ea71423b5ae9221473` alcançou `READY` e foi vinculada ao domínio de pré-visualização antes da atualização dos dados.

## Riscos alimentares a investigar, sem certificação

| Receita | Elementos observados | Situação de revisão |
| --- | --- | --- |
| Caesar | **Ovos:** 1 ovo cozido e 1 gema no molho sem cocção. **Peixe:** 3 filés de anchovas. **Gergelim:** 1 colher (sopa) na salada. | Presença textual explícita; deve ser registrada em A3B e depois A4 por administrador autenticado; gema não cozida exige orientação de pasteurização e cuidados sanitários |
| Asiática | **Gergelim:** 1 colher (sopa) na salada + 1 colher (chá) no vinagrete. **Soja:** não está declarada na fórmula; confirmar no rótulo da alga se temperada ou processada com molho de soja. | Gergelim é ingrediente explícito; soja é **possibilidade dependente do rótulo**, não evidência de presença confirmada |
| Peru com molho verde | Peito de peru caseiro ou industrializado conforme rótulo; demais ingredientes não informam, por si só, cobertura de todos os alergênicos. | Confirmar ingrediente real e rótulo do produto escolhido; não declarar ausência comprovada de alergênicos |

**Lacuna específica do catálogo A4 (corrigida parcialmente no mesmo dia):** códigos `ovos`, `peixes` e `soja` existiam; `gergelim` não estava cadastrado durante a verificação inicial. Em 24/10 foi inserido o código `gergelim` com o rótulo **Gergelim (sésamo)**, junto a uma opção de seleção no cadastro e pistas A3 para gergelim, sésamo e tahine. A política de elegibilidade permanece estritamente bloqueada para usuários alérgicos: classificação preliminar não equivale a cobertura completa ou liberação.

**Estado de homologação:** nas três saladas, 0 evidências A3B, 0 findings A4, 0 avaliações finais positivas. A atualização de texto e ingredientes aciona as invalidações técnicas existentes, mas **não autoriza a geração automática de cardápios para alérgicos**.

## Limites preservados

- Fichas independentes dos molhos e demais receitas não foram alteradas.
- Nenhuma evidência clínica, assinatura de revisor, revisão A4 ou indicação de alimento seguro foi fabricada.
- Nenhuma alteração em `planned_meals`, contas, perfis, permissões, políticas RLS ou configurações DNS.
- PR #16 permanece em fluxo de revisão, sem merge para a branch principal e sem habilitação global das sugestões semanais para pessoas com alergias.

## Próximas ações de segurança

1. Executar a triagem A3B e classificação preliminar A4 por usuário administrador autenticado, com as novas referências/hashes e textos dos ingredientes; registrar presença de **ovos** e **peixes** na Caesar.
2. Homologar visualmente a nova opção **Gergelim** no cadastro e a pista editorial na fila A3, sem inferir cobertura automática.
3. Validar rótulos e possibilidade de soja na alga escolhida, além das versões de peito de peru industrializado.
4. Manter bloqueada a sugestão automática para perfis alérgicos até concluir as garantias de segurança no servidor e a homologação pertinente.
