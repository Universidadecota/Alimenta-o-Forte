# Costa&Costa Beta — A5.1: proteção do gerador semanal no servidor

Data: 24/10/2026. Branch `feat/revisao-alergenos-fase1-12out2026`. PR #16 **DRAFT**; não mesclar na `main` nem aplicar esta migração à produção antes de homologação independente.

## Motivo e escopo

A interface já bloqueia `Sugerir refeições da semana` quando o usuário tem alergias cadastradas. A RPC `cc_replace_week_main_meals`, que recebe e persiste as 21 refeições principais, ainda não relia `user_preferences.allergies`. Um chamador poderia tentar invocar a RPC diretamente, sem passar pelas advertências do cliente.

**A5.1 fecha especificamente essa lacuna:** a função `SECURITY INVOKER` passa a consultar, sob RLS, as alergias do **usuário autenticado** (`auth.uid()`) e rejeita a substituição semanal quando há qualquer alergia cadastrada. Se o perfil estiver ausente ou a leitura falhar, não há substituição. A leitura usa `FOR SHARE` para serializar uma atualização concorrente do perfil até a conclusão da transação.

Não se confia em uma lista de alergias enviada pelo navegador, e o bloqueio ocorre **antes de qualquer UPSERT** em `meal_plans` ou `planned_meals`. Assim, a operação continua atômica. As regras anteriores permanecem: segunda-feira válida, 21 refeições principais, sem datas/slots repetidos, porções válidas, comparação do estado esperado e RLS do proprietário.

## O que não muda

- A seleção, substituição, cópia e movimentação **manuais** de refeições permanecem em seus fluxos atuais, com alertas de alergias. Isso não significa recomendar ou aprovar essas escolhas.
- A3B/A4 continuam sendo investigação preliminar, sem evidência positiva de ausência ou controle adequado de contato cruzado. A constatação real `2 ovos`/`ovos`/`declared_in_recipe` continua apenas no histórico.
- Nenhuma receita recebe `verified`, nenhuma autorização de consumo é criada, nenhum cardápio é alterado por esta fase.
- A decisão futura por alergênico, insumo, fornecedor, derivados, preparo e contato cruzado pertence às próximas etapas A5.2/A5.3/A6, com revisão qualificada e revalidação final no servidor.

## Arquivos

- `supabase/migrations/20261024163302_cc_a5_weekly_allergy_server_guard.sql`: substitui somente a função semanal existente e preserva privilégios. Arquivo criado pela CLI do Supabase; **não aplicado**.
- `scripts/test-allergen-a5-week-guard.mjs`: checa a ordem do bloqueio, o vínculo ao perfil autenticado, a falha fechada e a preservação dos contratos originais. Não substitui um teste integrado de banco.

## Gates antes de executar a migração

1. Revisar diff do SQL e confirmar que a função atual do ambiente corresponde à migração original de 19/10/2026.
2. Executar testes em ambiente isolado: sessão sem perfil, perfil com `Soja`, perfil com mais de uma alergia, perfil sem alergias e alteração concorrente do perfil. Confirmar que os cenários bloqueados não alteram nenhuma linha de cardápio e que o perfil sem alergia continua apto à substituição de 21 refeições.
3. Testar que a seleção manual e RLS de usuários diferentes não sofrem regressão.
4. Revisar advisors e autorizar explicitamente a aplicação controlada. **Nenhum desses testes exige recriar contas ou repetir os testes de cadastro/recuperação de senha já encerrados.**

## Limitação temporal

Até a aplicação da migração A5.1, o bloqueio do navegador continua ativo, mas o endurecimento adicional do RPC ainda **não está ativo em produção**. Mesmo após a aplicação, pessoas com alergias permanecerão bloqueadas no gerador automático; a A5.1 **não é o desbloqueio solicitado pelo usuário**, e sim a base de segurança necessária para projetar a elegibilidade futura.
