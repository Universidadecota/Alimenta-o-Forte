# Fase 3I.6 — execução segura do relatório real

O arquivo `scripts/audit-measure-from-supabase.mjs` executa somente GET na API REST; ele não altera receitas, rascunhos ou decisões editoriais. O relatório vem do parser TypeScript existente, não da aproximação SQL.

## Pré-condições
- Node 20+, dependências instaladas com `npm ci`.
- Sessão autorizada a consultar `cc_pilot_ingredient_measure_reviews` por inteiro; **não** usar chave `service_role` no computador do usuário.
- Variáveis de ambiente fornecidas pelo executor seguro: `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_ACCESS_TOKEN` (JWT de usuário habilitado, nunca commitado).
- `CC_EXPECTED_INVENTORY_COUNT=1073`, valor conferido via SQL somente leitura em 18/10/2026. Atualizar somente após uma nova contagem independente.
- Arquivo de saída em pasta privada, fora do repositório Git.

## Execução
```bash
node scripts/audit-measure-from-supabase.mjs /caminho/privado/relatorio-inventario.json
```

O executor deve disponibilizar as quatro variáveis acima por mecanismos seguros do ambiente; não colar JWT ou chaves privadas em issues, prints ou conversas.

## Critérios de aceite
1. Contagem exatamente igual à contagem independente do banco, sem filtragem por RLS.
2. 1.073 IDs únicos, posições únicas e nenhum texto vazio.
3. Classificações `simple`, `range`, `choice`, `compound`, `optional`, `manual` somam 1.073.
4. Cada sugestão é rastreável ao ID do ingrediente; sugestões não equivalem a aprovações.
5. Conferir com o Supabase os totais por status antes da publicação do resultado.
6. Executar a suíte do CI; testes unitários offline não comprovam permissão real de leitura.

## Estado
**Ainda sem execução autenticada comprovada do inventário completo.** Não aprovar ingredientes nem alterar o banco. Guardar relatório bruto fora do GitHub.
