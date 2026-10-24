# Alimentação Forte Beta · Matriz de revisão A3B/A4 — três saladas (24/10/2026)

## Escopo e estado constatado

Consulta **somente leitura** ao Supabase do Alimentação Forte, após a composição dos três molhos nas receitas. Os 42 ingredientes normalizados foram inspecionados. Não foram criadas evidências, achados ou aprovações nesta verificação.

| Receita oficial | ID | Hash atual da fonte | Ingredientes | A3B | A4 |
| --- | --- | --- | ---: | ---: | ---: |
| Caesar sem queijo, com frango | `ccea2f76-a9b0-477a-a5b7-2e4594d2cac7` | `6538873f59c212a1ac6f7b8e080965f1` | 15 | 0 | 0 |
| Asiática de repolho, alga e frango desfiado | `f56d235a-78da-4af5-9086-40bba1aaba33` | `0090d33f0c7ebbe7538b9d21e0be2ac6` | 13 | 0 | 0 |
| Peito de peru com abacate, brotos e molho verde | `39d71eb9-35b3-48f5-8610-6bcc4b7b110d` | `6c095d47bd7a8a7b20cb89d5204182c5` | 14 | 0 | 0 |

## Evidências prioritárias para a revisão autenticada

Estes são apontamentos de ingredientes escritos na receita — **não registros A3B/A4 e não resultados de exame laboratorial**. IDs permitem ao administrador localizar as entradas corretas no módulo de revisão; os demais ingredientes da receita também devem ser avaliados individualmente antes de qualquer certificação.

| Receita | ID do ingrediente | Texto efetivamente cadastrado | Alergênico textual / investigação |
| --- | --- | --- | --- |
| Caesar | `49592779-2064-4e38-9bc0-4ac860796ea0` | `1 ovo cozido` | `ovos` — declarado no texto |
| Caesar | `3133271f-26c5-4865-8dce-e6968e128a06` | `1 gema` | `ovos` — declarado; o molho não contém etapa de cocção da gema |
| Caesar | `e2ac01fc-2aa1-4ae8-b242-f078683a0836` | `3 filés de anchovas` | `peixes` — declarado no texto; plural **anchovas** não era reconhecido pela pista A3, corrigido no vocabulário |
| Caesar | `39be324e-a7b5-4196-b416-c797629b53b0` | `1 colher (sopa) de gergelim torrado (no lugar do crouton)` | `gergelim` — declarado no texto |
| Caesar | `39dd78df-ba89-4cb0-85e3-3c01b923ae1f` | `2 fatias de bacon crocante` | Consultar composição, marca/rótulo e contato cruzado; o nome **não comprova** presença de outro alergênico |
| Asiática | `07502fa6-d5a2-45e6-80a4-d67245229ba4` | `1 colher (sopa) de gergelim` | `gergelim` — declarado na salada |
| Asiática | `819f7843-7ac0-4454-bda9-3c84122a1e4a` | `1 colher (chá) de gergelim` | `gergelim` — declarado no molho |
| Asiática | `4eb9cefe-52b7-47a1-bc6f-f5e056013997` | `1 colher (sopa) de alga wakame hidratada (ou 1 folha de nori em tiras)` | Conferir versão simples ou temperada e respectivo rótulo; **soja é uma possibilidade**, não uma presença confirmada |
| Peru | `afd18b7a-371d-431f-a8f4-cf15a065b186` | `150 g de peito de peru natural cozido (em casa ou sem açúcar e amido no rótulo) em tiras` | Origem caseira versus industrial é alternativa da receita; marca, ingredientes, aditivos e alergênicos do produto **ainda não identificados** |

Os demais ingredientes não apresentam, pela sua redação isolada, os termos de risco destacados acima. **Isso não prova ausência de alergênicos** nem descarta derivados, fornecedores específicos ou contato cruzado.

## Segurança adicional: gema crua

O molho Caesar utiliza gema sem cocção, além de ovo cozido na salada. A orientação pública da Anvisa é evitar preparações com ovos crus, incluindo maionese caseira. A ficha deverá ter alternativa tecnicamente validada (por exemplo, ingrediente pasteurizado apropriado) ou revisão culinária responsável, mantendo o alerta sanitário até a solução editorial. Não substituir ingredientes automaticamente sem conferir o efeito sobre a receita e a lista de compras.

Fonte pública: <https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2020/anvisa-participa-de-evento-sobre-seguranca-de-alimentos/>.

## Roteiro para o administrador

1. Entrar com conta administrativa no aplicativo e abrir **Administração → Triagem editorial de alergênicos · Beta**. Selecionar cada receita pelo título e conferir o hash vigente.
2. Na etapa **A3B**, registrar **por ingrediente** a investigação, identificando a fonte realmente consultada. Para presença explícita na receita: `source_kind = recipe_text`, referência documental identificada e código canônico correspondente (`ovos`, `peixes` ou `gergelim`). Observações devem distinguir conteúdo declarado de risco não verificado.
3. Para bacon, algas e peito de peru industrializados, não preencher fonte `supplier_label` sem efetivamente consultar o rótulo. Usar situação `awaiting_supplier` e registrar as lacunas e o contato cruzado desconhecido.
4. Na etapa **A4**, somente depois de salvar a A3B atual para aquele ingrediente, avaliar `declared_in_recipe` quando a fonte textual sustenta a presença, ou `suspected`/`undetermined` quando faltar evidência. A validação no banco exige mesma versão de fonte e a A3B mais recente.
5. Não cadastrar exclusões de alérgenos, revisão `verified` ou liberação de cardápio a partir da falta de uma pista textual. A classificação A4 é **preliminar**.

## Ajuste técnico nesta etapa

- Pista `peixes`: reconhece agora os sinônimos e formas `anchovas`, `aliche(s)` e `anchovy/anchovies` além de `anchova`.
- Marcador editorial de ingrediente composto: reconhece `bacon`, **sem atribuir automaticamente alergênico**.
- Testes de falso positivo e regressão ampliados em `scripts/test-allergen-a3-text-hints.mjs`.
- Regras de elegibilidade para perfis com alergia, RLS, autenticação, fontes, receitas e registros históricos permanecem inalterados.

**Status: matriz de trabalho preparada.** A3B/A4 aguardam efetivo registro por responsável administrativo autenticado, verificação de fornecedores e avaliação editorial. Não há autorização de cardápio para alérgicos.
