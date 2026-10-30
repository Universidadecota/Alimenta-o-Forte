# Costa&Costa — Biblioteca de Alimentos Brasileiros, Fase 1

**Implementação:** 15/10/2026  
**Branch de homologação:** `feat/revisao-alergenos-fase1-12out2026`  
**PR:** #16 permanece sem merge.

## Decisão de produto

Conforme o Prompt Mestre, criar uma **biblioteca de alimentos independente das receitas**, com busca, navegação por categorias e fichas individuais. Não comprometer conteúdos demonstrativos como dados nutricionais validados. Não modificar receitas, cardápios, ingredientes nem compras existentes.

A primeira versão usa **34 nomes de alimentos comuns no Brasil, em 13 categorias**. Esses registros possuem `editorial_status = preliminary` e `published = true` para consulta; apenas nome e categoria foram preenchidos. **Nenhuma medida de porção, valor nutricional, descrição científica ou informação sobre alergênicos foi inventada.** A interface informa claramente que o conteúdo é preliminar. Nomes de categoria não constituem confirmação de composição nutricional nem garantia de segurança alimentar.

## Arquitetura

**Tabela** `public.food_items` com id, nome, categoria, descrição opcional, porção de referência opcional, dados nutricionais opcionais, origem da informação nutricional, data de revisão, status editorial, publicação e timestamps. Constraint recusa dados nutricionais sem fonte verificável, revisão e status verificado. Não permite porção incompleta ou não positiva.

**Migrações Cloud aplicadas:**
- `supabase/migrations/20261015040000_cc_food_items_library_phase1.sql` — remoto `20261015130445_cc_food_items_library_phase1_cloud`
- `supabase/migrations/20261015041000_cc_food_search_without_accents.sql` — remoto `20261015130844_cc_food_search_without_accents_cloud`

**Navegação/frontend:**
- `src/lib/foodLibrary.ts`: 13 categorias, consulta Supabase com `count=exact`, paginação de 18 itens por página, busca de nome sem acento (`search_name`) e filtro por categoria no backend, sem baixar desnecessariamente todo o catálogo. Sem configuração Supabase, mostra erro; não inventa dados de demonstração.
- `src/FoodLibrary.tsx`: tela `Alimentos`, pesquisa, chips de categorias, grade de fichas, detalhe com porção de referência e fonte quando existentes, navegação anterior/próxima, carregamento, erro e resultado vazio. Ficha sinaliza ausência de validação nutricional e de alergênicos.
- `src/App.tsx`: novo item de navegação `Alimentos`, ao lado de `Receitas`.
- `src/styles.css`: interface responsiva integrada à identidade visual Costa&Costa. Componentes usam teclado, botões legíveis e estados de carregamento/erro.

**Escopo excluído desta entrega inicial:** composição nutricional, dados de alergênicos validados, imagens licenciadas, relacionamentos automáticos com receitas, ficha com conteúdo científico e painel editorial de administração. Esses recursos dependem de fontes, revisão e testes adicionais.

## Segurança/isolamento

- RLS habilitada. Somente `authenticated` pode selecionar itens publicados; membros `cc_admin_members` podem ler rascunhos e realizar mutações futuras com política administrativa. `anon` não possui SELECT.
- Testes reais em transação `BEGIN/ROLLBACK`:
  1. Usuário comum lê **34** publicados, **0** rascunhos, inserção recusada: `PASS`.
  2. Administrador vê rascunho: `PASS`.
  3. Anônimo não consegue consultar a tabela: `PASS`.
  4. Pesquisa `feijao` retorna **2** itens; `maca` encontra **Maçã**.
- Após migração: **9 receitas**, **30 ingredientes**, **25 refeições planejadas**, **1 marcação de compras** preservadas. Rascunho de teste foi revertido na transação, sem persistir.
- Os **34 alimentos** pertencem a **13 categorias** e **0** possuem informações nutricionais numéricas. Não há vinculação automática de seus rótulos com os ingredientes existentes das receitas.

## Roteiro para homologação no Windows

1. Na branch atual, executar `git pull --ff-only` e `npm run build`. Atualizar navegador em localhost com `Ctrl + Shift + R`.
2. Acessar **Alimentos** e verificar a biblioteca com 34 itens, 13 filtros e fichas legíveis.
3. Pesquisar **feijao**, sem acento: devem aparecer **Feijão carioca** e **Feijão preto**.
4. Pesquisar **maca**, sem acento: deve aparecer **Maçã**.
5. Selecionar categoria **Frutas**, abrir a ficha **Banana** e voltar à listagem. A ficha deve avisar que nutrientes e alergênicos ainda não estão verificados.
6. Testar as páginas (18 registros na primeira, 16 na segunda), busca vazia, filtro por categoria, mensagens de erro e vista de celular.
7. Visitar **Cardápio**, **Receitas** e **Compras** para garantir que nada mudou e que os horários opcionais e o status de compra seguem preservados.

## Pendências relevantes antes da venda

- Conteúdo nutricional por fonte oficial/licenciada e validação editorial, com porções de referência e instruções pertinentes.
- Campo/processo explícito de revisão de alergênicos antes de usar dados alimentares em decisões de restrição; **não garantir ausência de contaminação cruzada**.
- Qualidade de busca com conjunto maior (sinônimos de alimentos e tratamentos regionais), categorização editorial de casos como tomate e cogumelos.
- Integração a receitas somente com relações verificadas, sem cruzamentos automáticos por nome.
- Layout responsivo e acessibilidade a homologar manualmente em dispositivo móvel.
- Não executar `supabase db push` nem merge do PR #16 enquanto os históricos local/remoto de migrações não forem reconciliados e a regressão da Fase 1 não for concluída.

## Evidências de homologação visual e regressão — 15/10/2026

**Origem:** capturas de tela fornecidas pelo proprietário no Chrome em `localhost:5173`, incluindo emulação responsiva de 390 px com zoom de 100%. Os testes listados abaixo foram observados visualmente; não equivalem a testes automatizados nem em aparelho físico.

- **Alimentos:** 34 registros exibidos; busca `feijao` retorna Feijão carioca/Feijão preto, e `maca` retorna Maçã; filtros Legumes e Cereais e tubérculos renderizam resultados; abertura e retorno da ficha individual confirmados; avisos sobre falta de validação nutricional e de alergênicos presentes.
- **Paginação:** controles exibem páginas 1 de 2 e 2 de 2, com Anterior/Próxima habilitados ou bloqueados conforme a página; distribuição esperada: 18 + 16 alimentos.
- **Mobile:** biblioteca, cartões, filtros e ficha legíveis e centralizados nas capturas de 390 px. Commit `a24e84a` compilado em Windows, conforme saída enviada pelo proprietário (`tsc -b && vite build`, 1.641 módulos).
- **Cardápio:** semana 12–18/10 e refeição de almoço com 3 porções preservadas; lanche da tarde opcional Chá Cremoso de Cúrcuma com 2 porções preservado; avisos de alergênicos continuam visíveis. A captura de 390 px mostrou aviso de alergias em duas colunas estreitas, necessitando ajuste visual.
- **Receitas:** listagem e cartões existentes visíveis sem defeitos aparentes de renderização. Abrir receita completa e testar salvamento pela interface não foram demonstrados nesta regressão.
- **Compras:** confirmação visual da lista da semana 12–18/10 com Alface 450 g (marcada como comprada), Arroz 720 g, Feijão 900 g, Peito de frango 1.350 g, Gengibre 4 cm, Cúrcuma 2 colheres de chá, Canela 2 pitadas e Pimenta-caiena 2 pitadas. Bloco separado *A gosto e opcionais*: adoçante a gosto e manteiga com quantidade não informada, opcional. Botão Copiar lista visível, mas sua ação não foi retestada nesta etapa.

**Correção visual aplicada após evidência:** commit `2f2c6a8` em `src/styles.css` dispõe apenas `.notice[role="alert"]` verticalmente em telas até 620 px, deixando o título acima do texto e preservando integralmente a mensagem. **Pendente:** novo `npm run build` no Windows e validação visual desse alerta em 390 px.

**Não foi executada nova migração Supabase, modificação de conteúdo nutricional ou merge do PR #16.** Restam validação visual do alerta, abertura da receita completa e testes pertinentes de acessibilidade em telefone físico. A reconciliação dos históricos de migrações local/remoto continua condição separada para merge/deploy.
