# Fase 48 — dossiê editorial controlado (primeiro lote)

Data: 02/11/2026 (piloto interno). **Status: propostas não homologadas.**

## Método e preservação
Foram conferidas as receitas do Supabase, os ingredientes e os preparos cadastrados e a coluna `original_ingredients` da tabela de fontes originais `cc_official_recipe_source_records`. O material cadastrado registra **needs_structuring** e **personal_pilot**. A interface administrativa mostra esses textos existentes em um dossiê de **somente leitura**, com acesso à receita cadastrada e cópia de parecer para revisão posterior.

Não editar `recipes`, `recipe_ingredients`, fontes, `planned_meals`, `shopping_lists`, `shopping_list_items`, decisões, políticas de acesso nem o PDF nesta fase. Nenhuma aprovação editorial ou de segurança é inferida.

## Caso A — 1 colher (sopa) de maionese caseira
**Receita:** Salada de ovos em canoas de endivia, fonte **Cardápio da Semana 4 (Dias 22 a 28) - Desafio 30 Dias.pdf**.

O cadastro contém `1 colher (sopa) de maionese caseira (receita abaixo)`, enquanto a seção posterior contém componentes da maionese. **Proposta não aprovada:** estruturar como ingrediente usado no prato + seção complementar de preparo, com rastreabilidade do rendimento; evitar dupla contagem. Não converter automaticamente a medida nem alterar receitas já planejadas.

## Caso B — receita auxiliar de maionese e anotação da gema
A receita contém a entrada `Maionese caseira (rende cerca de ½ xícara; a sobra dura 2 dias na geladeira): 1 gema em temperatura ambiente`, além de suco de limão, óleo e sal. O texto de preparo prevê ovo cru e armazenamento refrigerado.

**Proposta não aprovada:** separar uma seção de preparo, rendimento e armazenamento dos ingredientes; solicitar análise específica de higiene, ovo cru/pasteurização, conservação, alergênicos e segurança alimentar. A descrição da fonte não é certificação de que dois dias sejam seguros; nenhuma recomendação de consumo ou conservação foi homologada.

## Caso C — chá com produto não identificado
**Receitas e documentos de origem:**
- Omelete enrolada com nori, cebolinha e gergelim — **Cardápio da Semana 4 (Dias 22 a 28) - Desafio 30 Dias.pdf**.
- Wraps de alface com ovos, bacon e abacate — **Cardápio da Semana 3 (Dias 15 a 21) - Desafio 30 Dias.pdf**.

Ambas contêm `1 xícara de chá.` e instruções para servir com chá, sem definir o tipo. A lista da semana reúne duas ocorrências sob a referência `2 xícaras de chá`.

**Proposta não aprovada:** classificar como bebida de acompanhamento, tipo não especificado, e obter confirmação documental antes de criar ingrediente comprável. Não inferir variedade de chá, ingredientes nem alergênicos.

## Interface implementada
- Painel `AdminEditorialF48`, exibido apenas sob `page==="Administração"&&isAdmin`.
- Evidência carregada diretamente de `recipes` e `pilotSource.originalIngredients` já autorizados no fluxo de administração; sem leitura ou gravação adicional.
- Botões para abrir receita cadastrada e copiar parecer explicitamente rotulado como não aprovado; cada evidência mantém nome da receita, documento e trecho literal.
- Se a fonte não estiver disponível, o dossiê declara a ausência e bloqueia a cópia daquele parecer.
- Nenhuma mudança nas 35 pendências da Fase 47 para usuários comuns. A revisão do catálogo ocorrerá em fase própria, com rollback e testes específicos.

## Validação exigida
1. GitHub CI e Vercel Preview READY.
2. Na prévia, login de administrador: Administração > Revisão editorial — Fase 48; três casos com evidências de 1, 1 e 2 entradas; abertura de receita; cópia de parecer sem dados alterados.
3. Usuário comum: nenhum painel administrativo visível.
4. Supabase (somente leitura): 21 refeições, dois itens comprados e duas decisões preservadas na semana 02 a 08/11/2026.
5. Testes garantem que a interface e a camada de parecer não chamam APIs de escrita.

**Não fazer merge ou publicar antes de homologação visual.** Mesmo após a publicação do painel, nenhuma proposta estará aprovada como correção de receita.
