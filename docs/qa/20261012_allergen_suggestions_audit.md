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

## Homologação funcional local — 12/10/2026

- Perfil sem alergias: geração de 21 refeições em 7 dias; contagem confirmada na base local.
- Após definir `allergies={Leite}` no perfil local, a interface bloqueou a ação **Sugerir semana**, e a contagem no banco permaneceu em 21 refeições.
- Alerta permanente exibido no cardápio informando que as 21 refeições existentes não foram validadas para a alergia. Nenhum registro removido automaticamente.
- Escolha manual de outra receita apresentou confirmação de risco de alérgenos e contato cruzado. Usuário confirmou com **OK** e a alteração ocorreu conforme esperado.
- Build TypeScript e Vite aprovados; há aviso CSS não bloqueante sobre a posição do `@import`.
- Problema detectado: substituição manual resetava o número de porções para 1. Corrigido no commit `59842f8` para preservar as porções da refeição substituída; **a correção ainda exige teste de persistência no localhost**.

**Situação:** bloqueio automático e alerta/consentimento manual homologados nos cenários locais executados. Não equivale à certificação de segurança alimentar. A seleção manual e as refeições anteriores podem conter alérgenos; o PR permanece sem autorização de merge ou aplicação de migrações no Supabase de produção.

## Homologação de porções — 12/10/2026

- Usuário testou a substituição manual de uma refeição planejada com **2 porções**, confirmou o alerta de alergia e observou a nova receita com **2 porções**.
- Após atualizar o navegador, a nova receita continuou com **2 porções**, conforme capturas fornecidas.
- Resultado do cenário funcional local: **aprovado**. Correção implementada no commit `59842f8`.
- O cardápio permaneceu visualmente com 3 refeições em cada um dos 7 dias. Este resultado não é certificação de segurança alimentar e não autoriza merge nem aplicação de migrações em produção.
