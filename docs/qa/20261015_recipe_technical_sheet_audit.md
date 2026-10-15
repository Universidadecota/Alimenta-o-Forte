# Costa&Costa — Auditoria inicial das 9 receitas ativas
**Data:** 15/10/2026 · **Origem:** Supabase do projeto Costa&Costa Alimentação Forte, consultas **somente leitura**. **Base Git:** commit `d51435c`. Esta auditoria não valida qualidade nutricional nem segurança para alergias.

## Inventário efetivamente encontrado
- **9 receitas não arquivadas**: 8 oficiais (7 publicadas + 1 rascunho) e 1 pessoal não publicada; **30 registros de ingredientes** no conjunto.
- **34 alimentos em `food_items`**: catálogo inicial de consulta ainda sem informações nutricionais verificadas conforme registro da Fase 1; os nomes não estão vinculados de forma validada às receitas.
- **0 registros em `cc_recipe_allergen_reviews`**. Nenhuma receita possui avaliação de alergênicos registrada.
- **50 linhas em `source_recipe_review`**, todas `metadata_only`, `nutrition_reviewed=false`. Essa tabela é inventário de fontes/metadados; não é comprovação de revisão de uma receita publicada. `rights_status=licensed` reflete declaração armazenada e deve permanecer rastreável.
- Estado de publicação não é status de revisão nutricional ou de segurança. **Não alterar publicações nesta auditoria.**

## Achados individuais — revisão exigida, sem corrigir por aproximação

| Receita | Escopo e ingredientes | Pendência de ficha técnica |
|---|---|---|
| [Exemplo] Frango com arroz, feijão e salada | Oficial/publicada; 4 itens; 1 porção | Identificar peso cru/cozido de arroz, feijão e frango, modo de cocção, rendimento e eventuais ingredientes auxiliares; instruções ainda são ilustrativas. |
| [Exemplo] Iogurte com banana e aveia | Oficial/publicada; 3 itens; 1 porção | Especificar produto de iogurte, composição/rotulagem, peso da unidade de banana e aveia (incluindo origem), além de definição de porção. |
| [Exemplo] Omelete de tomate | Oficial/publicada; 2 itens; 1 porção | Precisar peso dos ovos e do tomate por unidade, uso ou não de gordura/temperos e técnica; não presumir ingrediente ausente. |
| [Exemplo] Peixe assado e legumes | Oficial/publicada; 3 itens; 1 porção | Especificar espécie e apresentação do peixe, estado cru/cozido, óleo/temperos e rendimento após preparo; não estimar sem fonte. |
| [Exemplo] Salada de grão-de-bico e ovos | Oficial/publicada; 3 itens; 1 porção | Confirmar peso drenado/cozido do grão-de-bico, tamanho dos ovos e tomate, rendimento e ingredientes auxiliares. |
| [Exemplo] Sopa de legumes com frango | Oficial/publicada; 3 itens; 1 porção | Confirmar líquido incorporado, peso e estado dos alimentos, rendimento final e equivalência entre ingredientes e preparo. |
| Chá Cremoso de Cúrcuma | Oficial/publicada; 7 itens; 1 porção cadastrada | **Prioridade alta:** descrição fala em 2 copos generosos, mas `servings=1`; confirmar rendimento real. Leite de coco = 1 lata por porção de referência, sem volume verificado. Adoçante `taste`, manteiga opcional `unspecified` já corrigidos para não inventar quantidades. Confirmar tipo/rotulagem de produto e ingredientes para alergênicos. |
| Iogurte Turbo | Oficial/não publicada; 1 item | **Prioridade alta:** cadastrado apenas iogurte (4 colheres de chá por porção), enquanto preparo cita creme de leite, adoçante e demais ingredientes. Validar a fonte original, lista integral e unidade antes de publicar; não trocar colher de chá por colher de sopa automaticamente. |
| Ovos Mexidos com Bacon | Pessoal/não publicada; 4 itens | Preparação cita temperos adicionais, não incluídos na lista estruturada; conferir composição e caráter opcional. **Não modificar receita pessoal nem publicá-la automaticamente.** |

**Importante:** nomes como ovos, peixe, iogurte, leite de coco e seus derivados podem demandar avaliação de alergênicos por ingrediente e por produto; isso **não** constitui laudo sobre a receita, nem avaliação de contato cruzado. Não classificar receita como segura a partir de palavras-chave.

## Lacunas transversais observadas
1. As receitas guardam `servings` e ingrediente com `quantity/unit`, mas não registram estado do alimento (cru/cozido/drenado), rendimento final auditado, referência da composição nutricional ou versão da fórmula.
2. Ingredientes nomeados em texto livre não possuem vínculo verificado com `food_items`. Medidas como `un`, `lata`, `cm`, `pitada` e colheres **não podem ser convertidas em g/ml automaticamente**.
3. A tabela `cc_recipe_allergen_reviews` já existe e exige, para `verified`, revisor, data, evidência e `cross_contact_status` diferente de `unknown`; porém **não há revisões** e a interface atual não tem mecanismo completo de invalidação automática da revisão quando a receita muda.
4. O aviso atual em `src/App.tsx` aparece para qualquer usuário com alergias cadastradas no Cardápio; a função de sugestão automática está bloqueada nesse caso. Isso é conservador enquanto faltam evidências.
5. O editor de receitas oficiais já suporta ingredientes, porções, descrição, modo de preparo e imagem, mas não um fluxo completo de homologação nutricional/alergênicos.

## Sequência editorial para os dados atuais
**P0:** reconciliar rendimento e unidade do Chá Cremoso, corrigir os itens ausentes do Iogurte Turbo somente com a fonte original, e auditar segurança das 7 receitas oficiais publicadas.  
**P1:** completar ingredientes auxiliares, pesos e estado de preparo, fontes rastreáveis e critérios objetivos de revisão para todas as oficiais.  
**P2:** tratar receita pessoal em fluxo separado e somente mediante ação do proprietário.  
**P3:** calcular valores nutricionais apenas quando cada entrada da fórmula puder ser vinculada a quantidade em massa/volume validada, fonte nutricional e rendimento aprovados.

## Estado da execução
- **Feito:** inventário e identificação de lacunas no Supabase (SELECT; sem alterações).
- **Não feito:** correção de receitas, publicação, alteração de dados, avaliação profissional, informação nutricional calculada, implantação de alertas por receita, migração ou merge.
- **Proteções:** PR #16 permanece aberto sem merge; não executar `supabase db push` com histórico de migrações ainda não reconciliado. Não alterar a proteção atual de sugestões automáticas em contas com alergias.
