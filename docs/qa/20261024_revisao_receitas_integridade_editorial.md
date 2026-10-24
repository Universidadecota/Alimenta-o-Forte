# Costa&Costa / Alimentação Forte — integridade das receitas (24/10/2026)

## Objetivo e alcance

- Pedido do usuário: detalhar a **Salada de ovos em canoas de endívia** (Semana 4, Dia 26), eliminar referência externa ao Dia 24, explicar a maionese caseira e revisar as demais receitas quanto a lacunas.
- Fontes: versão revisada de **Cardápio da Semana 4 (Dias 22 a 28) - Desafio 30 Dias** fornecida pelo usuário (página 5), respectivos registros em `cc_official_recipe_source_records`, `recipes` e `recipe_ingredients`.
- Revisão editorial da Semana 4: **21 fichas**. Triagem automatizada dos **119 registros** de receitas oficiais do piloto pessoal (busca de preparos vazios, ingredientes muito curtos e referências dependentes de outro texto). A triagem automatizada **não** equivale a uma revisão gastronômica ou sanitária individual de todas as fichas.

## Correção concluída no banco

- Receita `fd9d66ab-d656-4bac-8ac6-2607ffad8cc4`, Dia 26, entrada 13: a fonte da receita e `recipes.instructions` agora reproduzem a versão revisada do PDF, com a receita completa de maionese antes dos ovos.
- A referência `(ver receita do Dia 24)` passou a `(receita abaixo)`.
- `recipe_ingredients`: o ingrediente com referência externa foi corrigido e quatro fragmentos foram adicionados para contemplar gema, limão, óleo e sal na lista de compras; **14 fragmentos após a correção**, anteriormente 10.
- Identificação documental: entradas 14 (**Bife à rolê com bacon, cenoura e couve refogada**) e 15 (**Ceviche de peixe branco com abacate**) da Semana 4 passaram de `source_day=24` para `source_day=26`, conforme o próprio PDF. Seus ingredientes e preparos não foram alterados.
- Alteração transacional, com verificação do ID, título, documento, número da entrada, página, hash de referência anterior, ausência de evidência A3B/A4 e quantidade de ingredientes. Arquivo de reprodução: `20261024_semana4_receita_ovos_correcao_controlada.sql`.
- Novo hash da fonte da receita corrigida: `f3babecdf97e8f272d3110824817556d`.

## Outras referências incompletas encontradas — corrigidas na mesma data

Nos 119 registros oficiais, havia **quatro** fichas com referência a instruções situadas fora da própria ficha (incluindo a salada de ovos corrigida). As outras três foram **consolidadas editorialmente** em 24/10/2026, depois da triagem inicial:

| Receita exibida isoladamente | Referência original que confundia o usuário | Preparação complementar no cadastro | Correção efetuada |
| --- | --- | --- | --- |
| **Caesar sem queijo, com frango** | `Molho Caesar (receita abaixo)` | **Molho Caesar sem queijo** (entrada 12 de *Saladas Verdes com Proteína*); contém gema crua e anchovas | Ingredientes e preparo incorporados; referências de compra substituídas por itens reais; alerta de gema, peixe e gergelim na interface |
| **Asiática de repolho, alga e frango desfiado** | `vinagrete de gengibre (receita abaixo)` | **Vinagrete de gengibre** (entrada 15 do mesmo documento) | Ingredientes e preparo incorporados; gergelim original e do molho representados separadamente; aviso para checar soja no rótulo |
| **Peito de peru com abacate, brotos e molho verde** | `molho cremoso de abacate (receita abaixo)` | **Molho cremoso de abacate e ervas** (entrada 13 do mesmo documento) | Ingredientes e preparo incorporados; rendimento original de 2 a 3 porções exposto |

As **fichas independentes** dos três molhos permaneceram intactas. As fichas das saladas agora incorporam integralmente as receitas dos molhos, com rendimentos próprios não redimensionados. Foi preservada a trilha editorial de composição, inclusive hashes anteriores, no script `20261024_tres_saladas_molhos_autossuficientes.sql`. A classificação de alergênicos segue **pendente**; nenhuma receita foi homologada como segura para alergias.

## Pontos de detalhamento da Semana 4

| Receita | Lacuna editorial identificada | Recomendação |
| --- | --- | --- |
| **Salada Cobb completa** | Exige bacon crocante, sem explicar como obtê-lo | Acrescentar método, ponto e tempo de preparo do bacon após validação culinária |
| **Rolê de frango com bacon, espinafre e tomate** | Cita tomate assado e folhas verdes como acompanhamento sem especificar o preparo do tomate e a montagem do acompanhamento | Acrescentar instrução de forno/tempo/temperatura e montagem após validação culinária |
| **Amêijoas (vôngole) à portuguesa** | Tempo informado como 20 minutos, porém o texto prevê 30 minutos adicionais de molho | Explicitar `20 min de preparo + até 30 min de molho, quando necessário`; revisar pequeno erro de digitação `Dore` → `Doure` |
| **Bolinhos de salmão com maionese caseira** | A maionese contém gema sem cocção e informa refrigeração até 2 dias | Adicionar aviso específico sobre gema pasteurizada; frio e limão não tornam ovo cru convencional isento de risco |
| **Ceviche de peixe branco com abacate** | Preparação com peixe não cozido | Explicar que limão não substitui cocção e incluir informação clara de segurança |

Esses são **pontos de revisão**, não receitas declaradas inválidas, e não tiveram passos culinários inventados no banco. Propostas de preparo adicional precisam ser aprovadas contra a fonte/autoria.

## Apresentação e segurança no aplicativo

- `src/RecipeDetails.tsx` no PR #16: quebras de linha do texto dos ingredientes agora são respeitadas; fichas de saladas com molho incorporado informam que se trata de **composição editorial** com o rendimento original do molho.
- Na área **Ver informações sobre medidas e segurança**: aviso contextual sobre molhos com gema não cozida, recomendando gema pasteurizada; aviso sobre ceviche de peixe cru.
- O texto editorial sobre “sobra dura 2 dias na geladeira” foi preservado como fornecido. A advertência informa que esse prazo **não é garantia de segurança microbiológica**.
- **Implantação confirmada** em pré-visualização, vinculada ao domínio `alimentacaoforte.epsacore.com.br`. O domínio acompanha a branch de trabalho e não é ainda um deployment convencional de produção.

## Critério de conclusão

1. **Concluído:** receita de ovos detalhada no banco, fonte revisada, fragmentos da lista de compras, dois rótulos de dia corrigidos.
2. **Concluído na pré-visualização vinculada ao domínio:** avisos de segurança, molhos incorporados e respeito às quebras de linha na interface; verificação visual da salada de ovos recebida do usuário.
3. **Concluído após revisão inicial:** 3 receitas com molhos referenciados fora da ficha, agora autossuficientes e com ingredientes na lista de compras.
4. **Identificado e pendente:** homologação de alergênicos das fichas alteradas e 5 observações de detalhamento e segurança na Semana 4.
5. **Não realizado:** aprovação formal de alergênicos para qualquer receita, merge de PR, implantação de migração de proteção A5.1 ou modificação do calendário planejado.
