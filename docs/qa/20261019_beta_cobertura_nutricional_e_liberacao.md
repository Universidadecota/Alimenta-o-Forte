# Costa&Costa — Beta: cobertura nutricional e bloqueios de liberação (19/10/2026)

## Estado confirmado no Supabase real

- 34 alimentos publicados / 34 com referências de composição disponíveis.
- 58 variantes nutricionais cadastradas (10 anteriores + 40 TACO + 4 TACO + 4 USDA).
- **58/58** em `awaiting_specialist`: não equivalem a revisão/aprovação nutricional.
- Consulta autenticada com RLS/RPC `cc_beta_food_nutrition_references`: 34/34 alimentos publicados retornam ao menos uma variante.
- Consulta de alimento não publicado por conta comum: 0 variantes (teste SQL `SET LOCAL ROLE authenticated` e `request.jwt.claim.sub`).
- Consulta `anon`: sem `EXECUTE` em RPC de nutrição.
- Nenhum total nutricional de receita foi liberado ou inferido: `cc_recipe_nutrition_facts` exige status verified e revisor ativo e credenciado.

## Fontes e atribuição

- **TACO**, NEPA/UNICAMP, 4ª edição (2011), Tabela 1, por 100 g da parte comestível. DOI/URL: https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf
  - 44 linhas cadastradas nesta etapa para alimentos publicados; 10 variantes pré-existentes.
  - Cada linha nova registra o número do alimento, página impressa, variedade e preparo.
  - `NA`, `Tr` e dados ausentes não são convertidos artificialmente em zero.
  - A obra permite reprodução com a citação de sua fonte.
- **USDA FoodData Central** (CC0, domínio público) para quatro alimentos sem correspondência adequada na TACO:
  - Água potável: água engarrafada genérica, FDC 174158.
  - Cogumelo paris: `Mushrooms, white, raw`, FDC 169251.
  - Leite de vaca integral: `Milk, whole, 3.25% milkfat, with added vitamin D`, FDC 746782.
  - Tilápia: `Fish, tilapia, raw`, FDC 175176.
  - Os rótulos são explícitos sobre a **origem dos EUA**, fortificação e variações entre produtos brasileiros. A equivalência nutricional não está homologada.
  - Licenciamento oficial: https://fdc.nal.usda.gov/api-guide/
- **TBCA/USP não copiada**: o site consultado contém restrição explícita à reprodução/comercialização sem licença. Não foram importados dados nutricionais TBCA.

## Fluxo beta

- Ícones correspondentes aos alimentos e suas categorias: `src/FoodIcon.tsx`.
- Fichas alimentares com fonte e status de revisão: `src/FoodNutrition.tsx`, `src/FoodLibrary.tsx`.
- Seção nutricional de receitas sem valores inventados: `src/RecipeNutrition.tsx`.
- O usuário deve continuar vendo ausência explícita de números para receitas ainda não verificadas.

## Portões de liberação pendentes

1. Revisão especializada dos vínculos alimento-variante e da correspondência fonte/porção. Não transformar `awaiting_specialist` em `verified` por automação sem comprovação.
2. Vincular ingredientes das receitas à sua identidade alimentar e **massa aferida**; não calcular totais por receita sem essa etapa.
3. Homologação visual e móvel das tabelas nutricionais do beta.
4. Tratar alerta vermelho de **site perigoso** observado no Chrome em URLs temporárias `*.vercel.app`. Build Ready e HTTPS válido **não** significam liberação no Safe Browsing.
5. Usar endereço oficial estável (Vercel: Projeto → Settings → Domains), conferir DNS/certificado e verificar reputação antes de convidar testadores. Se o alerta persistir, seguir canal de revisão da Navegação Segura; não instruir pessoas a ignorá-lo.
6. Validar o fluxo login → receita → alimentos → cardápio → compras em navegador real com conta de teste.
7. Branch `feat/revisao-alergenos-fase1-12out2026`, PR #16 **draft**; nunca mesclar na `main` automaticamente.

## Auditoria rápida somente de leitura

```sql
select
 (select count(*) from public.food_items where published) as alimentos_publicados,
 count(distinct v.food_item_id) as alimentos_cobertos,
 count(*) as variantes,
 count(*) filter (where v.review_status = 'awaiting_specialist') as aguardando_revisao
from public.cc_food_nutrition_variants v
join public.food_items f on f.id=v.food_item_id and f.published;
```
