# Fase 3M — Relatório CSV de pendências editoriais (Beta, 29/10/2026)

## Motivação
A fila da fase 3L classifica receitas com divergências históricas. Nesta fase, a administração pode baixar um inventário **filtrado e ordenado** para conferência editorial sem modificar receitas ou vínculos.

## Fluxo
1. Administração → Medidas das receitas autorais → Ferramentas globais.
2. Executar a pré-análise existente e abrir **Fila editorial priorizada**.
3. Selecionar a categoria de pendência e a ordem.
4. Acionar **Baixar CSV da fila (N)**. O arquivo é gerado no navegador apenas após esse clique.

O CSV inclui: prioridade editorial, título e ID da receita, contagens de divergências (texto, posição, ambas, histórico sem atual, atual sem histórico), total e orientação editorial. Não inclui texto completo de receitas, ingrediente histórico, documentos de origem ou dados de usuários. Não é compartilhado com serviços externos.

## Preservação e segurança
- Mesma leitura existente sob acesso administrativo; nenhuma consulta adicional ao Supabase.
- Não cria nem altera registros, propostas, aprovações, ingredientes, relações 1:N, RLS, políticas de Storage ou dados nutricionais.
- A lista exportada reflete **o filtro e a ordem visíveis**. A exportação de zero itens fica desabilitada.
- CSV separado por ponto e vírgula, UTF-8 com BOM, células entre aspas e aspas duplicadas; campos com possível fórmula de planilha recebem prefixo de texto para evitar execução de fórmulas na abertura.
- É um relatório de pendências técnicas, **não uma validação clínica, nutricional ou de alergênicos**.

## Verificações
Regressões adicionadas ao teste de medidas em lote cobrem filtro, conteúdo exclusivo, ordem herdada, BOM, escaping e neutralização de fórmula. Build do Vite/TypeScript pela Vercel e conferência da identidade da branch Beta.

## Publicação
PR isolado para feat/revisao-alergenos-fase1-12out2026. Não modificar main.
