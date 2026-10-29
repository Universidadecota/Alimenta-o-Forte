# Fase 3N — Rastreio literal de ingredientes adicionais na origem (Beta, 29/10/2026)

## Evidência de campo
Em consulta exclusivamente de leitura ao projeto Supabase do piloto, a conciliação identificou 1.072 expressões históricas, nenhuma sem ID atual, 48 ingredientes atuais sem ficha histórica por ID, 22 diferenças só de texto, 76 só de posição e 2 de ambos.

Dois exemplos revisados na fonte oficial — “Asiática de repolho, alga e frango desfiado” e “Peito de peru com abacate, brotos e molho verde” — mostraram ingredientes adicionais de molhos descritos na fonte, mas separados em novos IDs na ficha atual. A classificação “sem histórico” não significa necessariamente erro ou ingrediente inventado.

A comparação literal estrita aplicada a esses 48 novos IDs no retrato de 29/10/2026 encontrou:
- 40 nomes com uma ocorrência literal isolada na fonte oficial;
- 2 nomes com múltiplas ocorrências, sem indicação inequívoca de preparo;
- 6 nomes sem a mesma redação exata (por exemplo, anotações editoriais “salada” ou “molho”).

Os números são um diagnóstico pontual, não uma migração e não constituem validação de correspondência histórica.

## Funcionalidade
Administração → Medidas das receitas autorais → Ferramentas globais → Conciliação técnica → Fila editorial → Examinar fonte.

A lista **“Ingredientes atuais sem ficha histórica por ID”** agora exibe:
- contagem de trechos únicos, repetidos e não localizados;
- o indicador literal de cada ingrediente adicional;
- orientação para conferir seu contexto no preparo original.

O rastreio é sensível a maiúsculas, acentos e pontuação, com limites de palavra para evitar correspondência por substring interna. A ocorrência textual não prova identidade de ID, rendimento, segurança alimentar nem equivalência 1:N.

## Garantias
- Não altera receitas, ingredientes, fonte oficial, estado de revisão, aprovações, RLS, porções, compras ou nutrição.
- Usa exclusivamente a fonte já carregada sob demanda pelo administrador; não introduz novos endpoints nem consultas.
- Não cria correspondências automáticas, inclusive nos 40 casos de texto único.
- Teste unitário de contagens, ambiguidade, limites de palavra, caixa e preservação do inventário.
- Entrega exclusivamente na Beta; main fora de escopo.

## Próximo passo editorial
Conferir individualmente os 8 casos sem trecho único antes de discutir qualquer correção na base. Exige decisão editorial explícita antes de mudar ingredientes.
