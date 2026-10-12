# Fase 1 — Auditoria de bloqueio de sugestões para alergias (12/10/2026)

**Escopo:** branch `feat/revisao-alergenos-fase1-12out2026`. Não equivale a homologação clínica e não autoriza aplicar migrações à produção.

## Evidências dos testes SQL locais relatadas

- `cc_allergen_rls_local_v2.sql`: consulta, inserção e alteração negadas a usuário comum; administrador consegue consultar e atualizar; identidade `reviewed_by` sobrescrita pelo usuário autenticado; modificação de ingrediente invalida revisão. Final `ROLLBACK`.
- `cc_allergen_integrity_local_v3.sql`: inserção administrativa; `verified` sem evidências ou com contato cruzado `unknown` rejeitado; revisão válida registra administrador e data; edição do título da receita invalida revisão. Final `ROLLBACK`.
- Esses resultados foram informados a partir das execuções no Docker local; não demonstram aprovação de testes de interface ou produção.

## Auditoria estática de recomendações

- `src/lib/suggestions.ts` / `proposeWeek`: antes de construir qualquer plano, lança erro quando `prefs.allergies.length > 0`. Não se baseia na mera existência de `cc_recipe_allergen_reviews` para tratar receitas como seguras.
- `src/App.tsx` / `generate`: lê preferências novamente do banco; se contêm alergias, retorna antes de chamar `proposeWeek`, pedir confirmação ou chamar `saveMeal`. Erros na leitura de preferências abortam a geração.
- `src/Onboarding.tsx`: oferece seleção de alergias e informa que não há prevenção automática de alérgenos ou contaminação cruzada.
- **Limitação importante:** seleção manual de receitas continua permitida pelo produto; o usuário precisa conferir ingredientes e potenciais contatos cruzados. As regras atuais não certificam adequação para alérgicos.
- **Pendente:** executar teste funcional em ambiente isolado (conta de teste com alergias) confirmando que o botão “Sugerir semana” não faz gravações em `planned_meals`, inclusive após alterar preferências; testar comportamento sem alergias e erro de leitura.
- **Pendente:** validar fluxos administrativos reais e revisar segurança das recomendações/seleções manuais antes de qualquer promessa de segurança alimentar.
- **Não fazer:** aplicar migrações em produção, mesclar PR #16 ou habilitar recomendações automáticas para usuários com alergias com base nesta auditoria.
