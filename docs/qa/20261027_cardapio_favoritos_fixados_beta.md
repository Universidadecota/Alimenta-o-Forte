# Costa&Costa Beta — favoritos e refeições fixadas (27/10/2026)

## Escopo

- A tela **Cardápio** pode mostrar somente favoritas na lista de cada horário; a refeição já selecionada permanece na lista, mesmo que não seja favorita, para não perder a referência.
- Nas listas, favoritas aparecem primeiro com `♥`.
- Qualquer escolha manual (inclusive porções, adição a partir de Receitas ou cópia) fica **fixada** por padrão.
- Refeições sugeridas automaticamente não ficam fixadas. O usuário pode escolher **Fixar esta escolha** e posteriormente **Fixada · Liberar**.
- **Sugerir refeições da semana** renova somente horários principais não fixados. Horários opcionais permanecem intocados.
- Escolhas fixadas preservam receitas e porções após atualizar a página, sair/entrar e gerar sugestões; registros antigos recebem `is_locked=false` para evitar pressupor escolhas manuais sem evidências.
- Mantém as regras anteriores de pré-triagem de alergênicos para sugestões novas. Receitas manuais fixadas não são certificadas e devem ser conferidas individualmente.

## Implantação e compatibilidade

1. Aplicar a migração **`20261027200000_cc_weekly_manual_pins_beta.sql`** no projeto Supabase Alimentação Forte **antes** de liberar o novo frontend.
2. Confirmar `public.planned_meals.is_locked` com default `false`, RLS ativa, e a RPC `cc_replace_week_main_meals(date,jsonb,jsonb)` como `SECURITY INVOKER`.
3. Rodar `npm run build`, `node scripts/test-weekly-favorites-pins.mjs`, `npm run test:pilot-flow`, `node scripts/test-allergen-a5-week-guard.mjs`, `node scripts/test-recipe-favorites.mjs`.
4. Publicar apenas na branch Beta do domínio `alimentacaoforte.epsacore.com.br`. Preservar `main`.

## Homologação manual em duas contas

1. Na conta A, favoritar uma receita e habilitar **Mostrar somente favoritas nas opções** no Cardápio; verificar lista e prioridade das favoritas.
2. Escolher a favorita para um horário, ajustar porções e verificar que aparece **Fixada · Liberar**.
3. Gerar nova semana: horário fixado mantém receita e porções; outros horários devem receber sugestões e opcionais permanecer iguais.
4. Recarregar e entrar novamente: o horário continua fixado.
5. Liberar esse horário, renovar sugestões e verificar que pode mudar.
6. Na conta B, confirmar independência entre favoritos, planejamento e bloqueios da conta A.
7. Com alergia cadastrada, observar alerta e garantir que novas sugestões façam a pré-triagem, sem declarar segurança clínica de escolhas manuais fixadas.

> O teste Node valida o contrato e a lógica pura, não substitui homologação autenticada com dois usuários nem teste adversarial da RLS.
