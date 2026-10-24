# Alimentação Forte Beta · Segunda passagem de integridade das receitas (24/10/2026)

## Síntese verificada no Supabase

- **119 receitas oficiais** do piloto pessoal foram incluídas no rastreio de separadores de seções internos aos ingredientes (`Salada:`, `Molho:`, `Maionese:`, `Vinagrete:`, `Acompanhamento:` e `Por porção:`).
- Cinco fragmentos concatenados foram identificados e reparados em quatro receitas da Semana 4; outros **16 fragmentos** estavam concatenados em **15 receitas** do catálogo.
- Os dois lotes somam **21 fragmentos problemáticos**, encontrados em **19 receitas**. A normalização separou os itens sem inventar quantidades, mantendo os textos originais das fontes inalterados.
- Conferência global após as transações: **119 receitas, 1.120 fragmentos individuais e zero ocorrências restantes dos seis marcadores de seção embutidos** na expressão auditada.
- Esse resultado **não equivale** a auditoria culinária individual de todos os 1.120 itens; outros tipos de omissão podem existir.

## Tratamento das cinco pendências da Semana 4

| Receita | Ação concluída | Limite mantido |
| --- | --- | --- |
| Amêijoas (vôngole) à portuguesa | Corrigido `Dore` → `Doure`; modo exibido dividido em cinco etapas; ingrediente de tomate da salada separado; interface informa 20 min de preparo **mais até 30 min de molho opcional**. | Duração e texto originais permanecem no registro de fonte. |
| Bolinhos de salmão com maionese caseira | Gema da maionese e pepino da salada agora constam como ingredientes próprios da lista de compras. | A maionese original usa gema não cozida; o alerta sanitário do aplicativo permanece, sem aprovação de segurança microbiológica. |
| Ceviche de peixe branco com abacate | Conferida a integridade dos nove fragmentos; o alerta contextual sobre peixe cru já constava na interface e foi preservado. | Limão não substitui cocção; não classificar como seguro sem revisão especializada. |
| Rolê de frango com bacon, espinafre e tomate | Acompanhamento de tomate assado e folhas verdes separado do item “palitos”; preparo exibido detalha o uso do forno já previsto, a higienização das folhas e a montagem. | Nenhum ingrediente ou tempo adicional foi inventado; fonte original mantida. |
| Salada Cobb completa | Azeite do molho separado da cebolinha na lista de compras; preparo exibido ganhou etapa explícita para deixar o bacon crocante. | Sem inventar tempo fixo para o bacon; fonte original mantida. |

## Histórico de scripts reprodutíveis

1. `docs/qa/20261024_vongole_preparo_tempo_controlado.sql`: corrige e organiza **somente** `recipes.instructions` do vôngole, com guardas de ID, fonte, hash, duração e ausência de A3B/A4.
2. `docs/qa/20261024_semana4_fragmentos_preparo_complementos.sql`: separa fragmentos em quatro receitas e completa os dois métodos culinários, com guardas transacionais e contagens esperadas.
3. `docs/qa/20261024_catalogo_fragmentos_titulos_de_secao.sql`: separa os outros 16 fragmentos, com lista fechada de IDs, origem oficial validada, bloqueio se existir A3B/A4 e assertiva de zero ocorrências restantes.

Todos os três scripts tiveram ensaio prévio com **`ROLLBACK`**, execução posterior com **`COMMIT`** e verificação independente do banco. Nenhum deles faz DDL, RLS, GRANT, aprova receita ou altera usuário/plano.

## Apresentação no aplicativo

- `src/lib/pilotRecipeTime.mjs` centraliza a exibição de duração, incluindo a possibilidade de até 30 min de molho de vôngole. A mesma regra é usada na ficha, no calendário semanal e nos cartões de receitas.
- `src/RecipeDetails.tsx` distingue documento original preservado de texto exibido com complementos editoriais, sem afirmar que todo preparo ainda é literal.
- Os textos das fichas com correção culinária são divididos em etapas na visualização. O acervo pessoal e a lista de compras mantêm quantidade não redimensionada onde a medida ainda é ambígua.

## Validação e limites

- `node scripts/test-recipe-time-display.mjs`: passou.
- `node scripts/test-planner-shopping.mjs`: passou.
- `node scripts/test-allergen-gergelim.mjs`: passou.
- `node scripts/test-allergen-eligibility.mjs`: passou, com regra de bloqueio preservada.
- `tsc --noEmit`: passou.
- Os casos de alergênicos A3B/A4 e checagem de rótulos continuam **pendentes de administrador autenticado**. A normalização de ingredientes não implica ausência nem autorização automática para usuários alérgicos.
