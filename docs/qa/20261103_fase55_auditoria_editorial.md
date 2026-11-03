# Costa&Costa — Fase 55 | Qualidade editorial das receitas

**Auditoria:** 03/11/2026  
**Fonte:** Supabase de produção `gclhailalyrokvmkwllm`, consultas somente leitura; código do repositório `Universidadecota/Alimenta-o-Forte` em `main`.  
**Escopo:** distinguir lacunas estruturais, literalidade do acervo piloto, direitos comerciais pendentes e consistência de apresentação. **Não incluir diagnóstico nutricional nem transformar medidas originais.**

## 1. Diagnóstico confirmado

| Achado | Quantidade | Interpretação correta |
|---|---:|---|
| Receitas em `recipes` | 128 | 127 oficiais (sem proprietário pessoal) e 1 particular |
| Receitas oficiais piloto com fonte declarada | 119 | Origem preservada em `cc_official_recipe_source_records` |
| Receitas oficiais fora do piloto | 8 | Exigências editoriais distintas das fontes piloto |
| Receitas com `published=true` | 7 | Publicação técnica **não** equivale a aprovação nutricional, autoral ou alergênica |
| Fichas piloto aguardando estruturação | 119 | Status `needs_structuring` |
| Fichas piloto com direitos comerciais pendentes | 119 | Status `pending_review` |
| Revisões de medidas piloto | 1.072 | 1.068 pendentes; 3 rascunhos; 1 confirmada |
| Ingredientes em `recipe_ingredients` | 1.157 | Muitos contêm a medida no **texto original**, não em campo numérico |
| Ingredientes sem quantidade numérica (todos) | 1.124 | **Não** interpretar como 1.124 ingredientes ausentes |
| Outras receitas oficiais com medidas a conferir | 2 | `Chá Cremoso De  Cúrcuma` e `Iogurte Turbo` |

Nas duas receitas fora do piloto, os quatro ingredientes sem quantidade numérica são: **2 opcionais com `measure_mode=unspecified`** (um em cada receita) e **2 explicitamente marcados `taste` (“a gosto”)**. Os marcados como “a gosto” não são erro de estruturação; os opcionais devem ser conferidos editorialmente, sem inventar quantidades. **Nenhum ingrediente fora do piloto foi marcado como `measured` com quantidade ausente.**

Os 128 registros apresentam ingredientes e instruções de preparo cadastrados; tempo de preparo e número de porções têm valores positivos. **Isso não equivale a uma avaliação humana de clareza, segurança, precisão ou direitos.**

## 2. Cuidados com alergênicos, fontes e compras

- A presença de um ingrediente ou a publicação técnica de uma receita **não demonstram ausência de alergênicos ou de contato cruzado**. Manter alertas existentes e confirmar rótulos/ingredientes por revisão humana.
- A biblioteca nutricional tem 197 alimentos, dos quais 163 ainda não estão publicados. Esta fase não altera status de revisão ou publicação de alimentos.
- Os 119 registros de fonte autoral do piloto estão marcados `pending_review` quanto a direitos comerciais. **Não publicar comercialmente** até revisão própria; a UI conserva o bloqueio do piloto.
- O planejamento semanal e os totais de compras não foram modificados. A lista de compras usa regras existentes para preservar medidas originais e não faz conversões presumidas de colheres em gramas ou ajuste automático para quantidade de pessoas.
- Nenhuma conversão de “a gosto”, opcionais, receitas anexas ou unidades caseiras foi realizada.

## 3. Implementação nesta branch

1. `src/lib/recipeQualityAudit.ts`: **função pura somente leitura**. Identifica separadamente as fichas piloto por id, consulta os estados `ingredient_review_status` e `commercial_rights_status`, mede lacunas apenas nas receitas fora do piloto e produz fila de revisão. Não interage com Supabase.
2. `src/AdminRecipes.tsx`: painel **“Qualidade das receitas · conferência editorial”**, acessível somente na área administrativa já protegida, exibindo quatro indicadores e a lista de fichas a conferir com atalho **Abrir ficha**. A consulta reaproveita o carregamento existente, incluindo os dois status da fonte.
3. `src/styles.css`: layout responsivo de cartões, lista de pendências e mensagens de privacidade/revisão.
4. `scripts/test-recipe-quality-phase55.mjs`: teste com dados fictícios que assegura não contar a falta de medidas numéricas piloto como erro e preservar exceções “a gosto”. Executado em todos os builds por `package.json`.

**Esta fase não altera o banco, as permissões RLS, as receitas ou a visibilidade do acervo.** Não ativar assinaturas nem revisão profissional; ambos são módulos futuros preservados.

## 4. Homologação proposta

- Abrir prévia Vercel → **Administração** → **Gestão do catálogo de receitas**.
- Verificar painel: **127 receitas oficiais**, **119 pilotos aguardando medidas**, **119 com direitos em análise**, **2 receitas não-piloto a conferir**. Os valores dependem do estado atual do banco; alterações posteriores podem modificar os indicadores.
- Abrir **Ver receitas a conferir (2)**, localizar **Chá Cremoso de Cúrcuma** e **Iogurte Turbo**; usar **Abrir ficha** sem salvar nem publicar. Conferir que uma medida opcional exige decisão humana, não atribuição automática.
- Confirmar que as 119 receitas piloto seguem sob proteção editorial e com ingredientes originais preservados.
- Testar no celular (390 px): métricas em duas colunas e botão Abrir ficha legível.
- Reconfirmar o Cardápio da semana 02–08/11 e a lista de Compras, sem regenerar refeições.
- Manter produção na Fase 54 até aprovação explícita de publicação.

## 5. Limitações e prioridades futuras

- O painel é uma **triagem técnica**, não um laudo clínico, regulatório nem comprovação de autoria.
- Uma receita com todos os campos preenchidos pode conter instruções vagas, alérgenos não identificados, medidas inadequadas ou material sem licença. A verificação humana continua imprescindível.
- Priorizar as duas fichas não-piloto para conferência editorial; posteriormente revisar fontes, status de direitos e estruturação gradual das medidas piloto por receita e por evidência.
- Somente após revisão documentada poderemos avaliar mudanças nos dados originais, sem inferir massas ou composições nutricionais.

**Publicação:** criar PR rascunho e Vercel Preview; não fazer merge sem autorização.


## Primeira homologação visual recebida — 03/11/2026

Captura enviada pelo responsável da prévia `costa-costa-alimentacao-egb5xewfl-myclever607-7251s-projects.vercel.app`, na seção **Administração → Gestão do catálogo de receitas**, desktop.

- O painel **Qualidade das receitas · conferência editorial** aparece no lugar previsto, com marcação **Somente leitura**.
- Os quatro indicadores visíveis são **127** receitas oficiais, **119** piloto aguardando estruturação das medidas, **119** piloto com direitos comerciais em análise e **2** outras receitas a conferir. Conferem com o levantamento SQL de 03/11/2026.
- A explicação do acervo piloto e a nota sobre as outras 8 receitas e 2 ingredientes sem quantidade estruturada aparecem completas e legíveis.
- O controle **Ver receitas a conferir (2)** está visível, mas **fechado** na captura: sua lista e o botão **Abrir ficha** ainda não foram homologados visualmente.
- Não há evidências de edição, publicação, alterações de alergênicos ou gravações em banco. Esta captura não valida comportamento móvel ou medidas na ficha.

**Resultado:** apresentação desktop dos indicadores aprovada. **Pendente:** abrir `Ver receitas a conferir (2)` para confirmar as duas receitas e os avisos; testar abertura de uma ficha sem salvar e a visão em 390 px. A produção permanece na Fase 54, e o PR #65 segue sem merge.
