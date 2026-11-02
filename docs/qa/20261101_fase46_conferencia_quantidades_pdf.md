# Costa&Costa — Fase 46: conferência de quantidades e PDF compacto

Data de implementação: 01/11/2026. Status: **em homologação em preview**, sem merge ou publicação em produção.

## Objetivos
1. Apresentar itens recorrentes em descrições e preparos diferentes (ovos/gemas, azeite em colheres de chá e sopa, tomate, pepino etc.) para **conferência humana**, sem produzir um valor de supermercado presumido.
2. Reduzir o excesso de espaço na impressão A4 do documento de compras, sobretudo a última página.
3. Preservar integralmente identidade, quantidade literal, receitas originais, 21 refeições, decisões da Fase 45 e estados comprados, com ênfase nas duas marcações restauradas (leite de coco e azeite).

## Entrega técnica
- Painel expansível, recolhido por padrão, em Compras: **Conferir alimentos em diferentes apresentações**; apresenta os trechos e o número de usos, nunca soma unidades nem muda chave de item.
- Reconhecimento textual conservador e auditável; alternativas, opcionais, trechos ambíguos e referências incompletas não entram na triagem. Variedades que podem ser diferentes (cebola comum e roxa) são separadas.
- PDF inclui um **resumo curto** das famílias que exigem conferência, preservando todos os detalhes e as receitas de origem em suas seções já existentes.
- Ajustes de densidade *somente na impressão da lista de compras*, mantendo margens A4 e layout dos PDFs de cardápio/geladeira.
- Teste automatizado: scripts/test-shopping-phase46.mjs, exigido no npm run build.

## Limitações intencionais
- Não converte colheres em mililitros, xícaras em unidades, gemas em ovos inteiros nem soma quantidades com apresentações diferentes.
- A quantidade de usos de uma receita não indica embalagens a comprar. Sem redimensionamento das receitas originais para moradores.
- Sem SQL, RLS, políticas, alterações em receitas, cardápio, lista de compras persistida, base nutricional ou alergênicos.
- O cabeçalho/rodapé com about:blank no PDF segue como opção do navegador, não é alterado pelo aplicativo.

## Critérios de homologação
1. GitHub CI e preview Vercel aprovados.
2. Página Compras mantém total de medidas e produtos, marcações de comprado e escolhas anteriores.
3. Painel de conferência identifica ovos/gemas e azeite com unidades distintas, mantendo o texto original; nenhuma soma adicional indevida.
4. Novo PDF mantém ✓ leite de coco e ✓ azeite, escolha da banha/azeite e inclusão da água.
5. Conferir legibilidade das páginas impressas e se houve redução de espaço ocioso (não presumir redução de páginas sem teste visual).
6. Teste de integridade read-only no Supabase para as 21 refeições, compras e decisões.

Não aplicar o PR à main antes da homologação.
