# Costa&Costa — Fase 3H: fotografias das receitas autorais

**Data:** 17/10/2026 · **Branch:** `feat/revisao-alergenos-fase1-12out2026` · **PR #16:** manter em rascunho, sem merge.

## Padrão editorial de imagem

O responsável perguntou o tamanho ideal para as imagens das receitas. Foi adotada a seguinte **recomendação**, sem obrigar o usuário a refazer imagens:

| Campo | Recomendação |
|---|---|
| Dimensões do original | **1200 × 800 px** |
| Orientação | Horizontal, proporção **3:2** |
| Formato ideal | **WebP** |
| Peso de trabalho recomendado | **150–400 KB**, sem degradar perceptivelmente a foto |
| Limite de entrada atualmente aceito | **12 MB** por foto |
| Tratamento já existente | redução para **máximo 1200 px no maior lado**, conversão no navegador para WebP (qualidade 0,83), rejeita resultado acima de **2 MB** |
| Enquadramento | prato principal centralizado e área de respiro nas bordas, pois os cartões usam `object-fit: cover` |
| Transparência | imagens geradas por IA devem permanecer sinalizadas como ilustrativas; imagens precisam representar o prato com fidelidade |

A proporção 3:2 é o compromisso entre a grade horizontal (com corte pela CSS) e a ficha completa/visualização ampliada; não é garantia de ausência de recorte em todos os dispositivos. O aplicativo não exige arquivos exatamente 1200 × 800, apenas recomenda essa origem.

## Risco de integridade identificado e corrigido

A interface antiga de Administração usava `cc_save_official_recipe` até para trocar uma foto. Essa RPC **apaga e reinsere todas as linhas de `recipe_ingredients`** na edição, portanto não deve ser usada para adicionar fotografias às **119 receitas autorais preservadas**; além do risco de regravar fragmentos, há validação de no máximo 40 ingredientes por essa RPC.

**Mitigação aplicada no Supabase** pela migration `supabase/migrations/20261017130000_cc_pilot_recipe_photo_only_phase3h.sql`, aplicada remotamente como `cc_pilot_recipe_photo_only_phase3h_cloud`:
- Nova RPC `public.cc_set_personal_pilot_recipe_photo(uuid,text,boolean)`, sob `SECURITY DEFINER`, com `search_path=''`, autorizada apenas para sessão autenticada administradora via `cc_is_admin()`.
- Confirma que a receita é oficial, não publicada e pertence ao `personal_pilot`. Aceita apenas uma URL `official/<uuid>.webp` no bucket oficial do Supabase ou `NULL` para remover foto.
- Atualiza **exclusivamente `recipes.url` e `recipes.image_is_ai`**. Não altera título, categoria, quantidade, ingredientes, preparo, rendimento, status de publicação nem fontes originais.
- Privilégio `EXECUTE` restrito a `authenticated`, combinado com checagem de administrador no corpo. Usuários anônimos e não administradores não podem alterar a foto por essa RPC.
- Teste SQL **transacional com ROLLBACK**: a conta administradora simulada executou a RPC mantendo URL e identificação da imagem sem mudança; hash/contagem das linhas originais de `recipe_ingredients` permaneceu igual. A conta não administradora foi rejeitada. Nenhuma foto nem dado do usuário foi modificado permanentemente neste teste.

**Mudanças no editor** `src/AdminRecipes.tsx`:
- Ao abrir uma receita do `personal_pilot`, os campos culinários tornam-se **somente leitura** (ingredientes e preparo podem ser consultados, mas não editados). O botão vira **Salvar somente fotografia**.
- A gravação da foto para piloto usa a nova RPC, nunca o salvamento editorial geral. Existe ainda conferência client-side de que os dados culinários originais não foram mudados.
- Exibe recomendação explícita **1200 × 800**, WebP e orientação horizontal.
- Para receitas oficiais que não pertencem ao piloto, mantém a gravação editorial anterior sem mudanças.
- `src/styles.css` acrescenta apresentação visual para o conteúdo protegido.

## Limites e próximos passos

- O bucket `recipe-illustrations` utiliza URLs públicas de imagem. **Receitas continuam privadas na aplicação, mas uma fotografia com URL conhecida poderá ser acessível fora dela**. Usar imagens sem segredos pessoais e revisar armazenamento/privacidade antes da comercialização.
- **Não foi feito envio de imagem real** e não foi realizado build Windows dos novos commits; não declarar homologação do frontend nem que o upload já foi testado.
- A rotina permite fotografias individuais por receita. Um fluxo de importação em lote para 119 fotos demandaria desenho próprio, consentimento e tratamento de nomes/associação, evitando associações erradas.
- **Próximo teste:** `git pull --ff-only`, `npm run build`; entrar em Administração → Gestão do catálogo de receitas, abrir uma receita do piloto e conferir que aparecem **Salvar somente fotografia** e campos culinários bloqueados. Antes de subir arquivos em massa, homologar um único upload com foto cujo nome corresponda à receita.
- Não repetir testes já homologados de filtro, ceias, compras e data de destino; não mesclar PR #16 antes da homologação.
