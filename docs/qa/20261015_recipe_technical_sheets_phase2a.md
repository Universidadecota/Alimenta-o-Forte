# Costa&Costa — Fichas técnicas Fase 2A: implementação e homologação

**Data:** 15/10/2026  
**Branch:** `feat/revisao-alergenos-fase1-12out2026`  
**PR #16:** rascunho, **sem merge**.  
**Escopo:** primeira infraestrutura e tela administrativa de referências e pendências, **não** fichas nutricionais completas ou avaliação profissional.

## Implementação realizada

1. **Banco:** `supabase/migrations/20261015190000_cc_recipe_technical_sheets_phase2a.sql` aplicado no projeto Supabase principal por migração `cc_recipe_technical_sheets_phase2a_cloud`. Tabela `public.cc_recipe_technical_sheets` contém fonte/página, rendimento editorial opcional, anotações de ingredientes/preparo/nutrição/alergênicos e andamento editorial (`pending`, `in_review`, `awaiting_specialist`). **Não há estado “verificado” ou aprovação automática nesta fase.**
2. **Segurança:** RLS habilitada. Políticas de SELECT/INSERT/UPDATE exigem `cc_is_admin()`; nenhuma política de DELETE; `anon` não possui privilégios de SELECT/INSERT na tabela. Gatilho impede vincular ficha a receita pessoal ou arquivada e proíbe alterar a chave `recipe_id`; gatilhos marcam andamento novamente como `pending` após alterações relevantes de ingredientes/receita. Funções dos gatilhos sem privilégios EXECUTE aos clientes.
3. **Dados editoriais iniciais:** Chá Cremoso de Cúrcuma — origem livro *50 Receitas Para Emagrecer De Vez*, página impressa 18 e rendimento declarado de **2 copos**; Iogurte Turbo — mesma fonte, página impressa 12, sem rendimento preenchido por suposição. As duas fichas foram registradas como `pending`. **Nenhuma receita foi publicada/despublicada ou alterada nesta fase.**
4. **Interface:** `src/RecipeTechnicalSheet.tsx` implementa consulta por receita oficial selecionada e formulário com fonte, página, rendimento, pendências, status editorial e leitura restrita do status já registrado em `cc_recipe_allergen_reviews`. Integrado a `src/AdminRecipes.tsx` após o formulário de receita existente. `src/styles.css` inclui layout responsivo e foco visível. O campo “rendimento da fonte” **não** atualiza as porções de receitas e compras.
5. **Restrições preservadas:** zero valores nutricionais atribuídos, zero avaliações de alergênicos promovidas para verificadas, nenhuma liberação do gerador automático para perfis com alergias, nenhuma alteração nas receitas pessoais, nas compras ou nos planejamentos.

## Evidências do Supabase (somente leitura após a migração)

| Indicador | Resultado |
|---|---|
| `cc_recipe_technical_sheets` | 2 registros, ambos `pending` |
| `anon` SELECT / INSERT | ambos `false` |
| `authenticated` SELECT / UPDATE | `true`, restritos por RLS a `cc_is_admin()` |
| Triggers | `cc_recipe_technical_sheet_guard_trg`, `cc_recipe_ingredient_sheet_invalidate`, `cc_recipe_sheet_invalidate` ativos |
| Receitas ativas | 9 |
| Ingredientes | 37 |
| Refeições planejadas | 25 |
| Avaliações de alergênicos registradas | 0 |

## Próxima homologação (pendente)

No Windows, na branch de desenvolvimento:

```powershell
git pull --ff-only
npm run build
```

1. Entrar na aplicação e abrir **Administração → Gestão de receitas oficiais**. Selecionar **Chá Cremoso de Cúrcuma**. Verificar seção **Ficha técnica editorial**, livro e página 18, rendimento 2 copos e status Pendente.
2. Selecionar **Iogurte Turbo**. Verificar página 12, rendimento em branco e oito ingredientes no editor. O status da receita permanece **Rascunho**.
3. Registrar uma anotação editorial de teste não sensível, salvar a ficha e reabrir a receita. Confirmar persistência. Depois limpar essa anotação de teste para não confundir revisão final.
4. Testar usuário comum: não visualizar o painel administrativo e não conseguir consultar nem gravar a tabela (teste com contas separadas). Verificar que receitas pessoais continuam privadas.
5. Verificar 390 px e desktop. Confirmar que salvar **ficha técnica** não modifica as porções, cardápio nem lista de compras.

**Ainda não comprovados nesta etapa:** build da nova interface no Windows, gravação por administrador via UI, RLS com sessão não administradora real, invalidação após edição transacional de receita, visualização mobile do formulário. **Não mesclar/deploy até validar.**

## Próximo desenvolvimento após homologação
- Versão/fingerprint da fórmula e histórico de revisões completo;
- Mapeamento de ingrediente/estado (cru/cozido) para `food_items`, fontes nutricionais rastreáveis e cálculo com unidades convertidas apenas mediante evidência;
- Workflow de aprovação por responsável técnico, revisão de rótulos e contato cruzado; integração futura de alertas específicos por receita sem alegação indiscriminada de segurança;
- Reconciliação do histórico de migrações local/remoto antes de `db push`.

## Evidência de build e abertura da ficha — 15/10/2026

**Windows PowerShell**: usuário executou `git pull --ff-only` com avanço de `50a409a` para `8b541f3` e `npm run build`, incluindo `tsc -b` e `vite build`; Vite v6.4.4, **1.642 módulos** transformados, build bem-sucedido em **15,91 s**.

**Evidência visual**: captura de `localhost:5173` da seção **Ficha técnica editorial** para a receita Chá Cremoso de Cúrcuma dentro da Gestão de Receitas Oficiais. Exibidos: livro *50 Receitas Para Emagrecer De Vez*, página 18, rendimento 2 copos, 7 ingredientes, revisão editorial pendente, revisão de alergênicos “Não registrada” e contato cruzado “não avaliado”. Campos de notas, andamento editorial e botão “Salvar ficha técnica” estão presentes. **Homologação de carregamento e renderização em desktop: aprovada.**

**Ainda não demonstrados:** clique em salvar com confirmação e releitura do banco; persistência após sair/voltar à receita; exposição/negativa via sessão real não administrativa; layout responsivo a 390 px; abertura do Iogurte Turbo no editor. A presença do botão não comprova persistência. A aprovação nutricional e de alergênicos permanece inexistente. Nenhum novo merge ou deploy autorizado por esta evidência.
