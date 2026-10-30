# Beta · Cobertura preliminar de gergelim/sésamo (24/10/2026)

## Origem do problema

- O onboarding oferecia `Outros`, mas não `Gergelim` como opção específica de alergia.
- A triagem textual A3 não reconhecia `gergelim`, `sésamo`, `tahine`, `tahini` ou `sesame`.
- A taxonomia preliminar A4 no Supabase não incluía o código `gergelim`.
- A Anvisa reconhece gergelim como alergênico passível de declaração voluntária fora do Anexo III da RDC nº 727/2022; fonte oficial: <https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/rotulagem-de-alergenicos.pdf/@@download/file> (questão 19).

## Alterações

- `src/Onboarding.tsx`: acrescenta botão **Gergelim**, mantendo `Outros` e todas as opções anteriores.
- `src/lib/allergenTriageHints.mjs`: inclui código editorial `gergelim` e sinônimos usuais, sempre como **pista**, nunca como conclusão de ausência ou segurança.
- `cc_allergen_a4_taxonomy`: inserido código `gergelim`, rótulo **Gergelim (sésamo)**, via transação de dados guardada e ensaiada com `ROLLBACK`, sem alteração de schema/RLS/GRANT.
- Script de reprodução de dados: `20261024_gergelim_taxonomia_a4_controlado.sql`.
- Teste direcionado: `scripts/test-allergen-gergelim.mjs`.

## Verificação

- `node scripts/test-allergen-gergelim.mjs`: OK.
- `node scripts/test-allergen-a3-text-hints.mjs`: OK.
- `node scripts/test-allergen-a4-findings.mjs`: OK.
- `node scripts/test-allergen-eligibility.mjs`: OK (segue *fail-closed*).
- `npm run build`: OK.
- Consulta SQL posterior: exatamente 1 código `gergelim`; 1 revisão `in_review` inalterada; 0 revisões `verified`; 0 achados A4 `gergelim` (não foram forjados).

## Limites

1. O aplicativo continua sem liberar sugestões semanais automáticas para qualquer pessoa que tenha alergias cadastradas; isso inclui agora a opção `Gergelim`.
2. A adição de um código de taxonomia não constitui revisão de receitas. Investigações A3B, constatações A4 e validações de rótulo/contaminação cruzada dependem de responsável administrativo autenticado e de evidência atual.
3. Não houve alteração nas preferências de usuários existentes, em receitas, permissões, DNS ou na branch principal.
4. A migração de guarda de servidor A5.1 não foi aplicada nesta etapa.
5. O esquema A4 continua sendo uma **taxonomia editorial não exaustiva**; não corresponde a garantia de cobertura de todas as alergias alimentares.
