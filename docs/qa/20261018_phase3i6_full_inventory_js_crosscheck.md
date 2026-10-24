# Fase 3I.6 — triagem integral em memória (18/10/2026)

## Fonte e segurança
Consulta SQL somente leitura à tabela `public.cc_pilot_ingredient_measure_reviews`, agrupada por `source_text` com contagem das ocorrências. Retornaram **470 textos distintos cobrindo 1.073 ocorrências**. Nenhum texto original ou revisão foi modificado.

As regras de `classifyMeasure` e `parsePilotMeasure` de `src/lib/pilotMeasureBatch.ts` e `src/lib/pilotMeasure.ts` foram reproduzidas em JavaScript e executadas sobre cada um dos 470 textos distintos, ponderados por ocorrência. Este resultado **não é execução direta do script TypeScript** e requer confronto integral antes da homologação definitiva.

| Classificação | Ocorrências | Textos distintos |
| --- | ---: | ---: |
| simple | 468 | 195 |
| manual | 494 | 169 |
| choice | 57 | 53 |
| compound | 40 | 40 |
| range | 9 | 9 |
| optional | 5 | 4 |
| **Total** | **1.073** | **470** |

## Interpretação
- `simple`: propostas de medidas, **não aprovadas** e não aplicadas no banco.
- `manual`: categoria técnica residual; não significa 494 correções manuais obrigatórias. Ex.: sal, pimenta, suco de ½ limão.
- `choice`, `compound`, `range` e `optional`: requerem regras conservadoras e, quando aplicável, revisão editorial.
- 468 ocorrências simples em 195 textos literais: oportunidade de revisar/validar expressões comuns sem repetir operações por receita.

## Próxima homologação
Executar `scripts/audit-measure-inventory.mjs` sobre os 1.073 registros originais com os mesmos arquivos TS atuais, conferir seis categorias, contagens e cobertura por IDs, e corrigir qualquer divergência antes de persistir propostas.

Garantias: sem `UPDATE`, `INSERT`, `DELETE`; manter PR #16 draft, sem merge e sem aprovação automática.
