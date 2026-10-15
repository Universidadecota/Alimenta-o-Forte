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
