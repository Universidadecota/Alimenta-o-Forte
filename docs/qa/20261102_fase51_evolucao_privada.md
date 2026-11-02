# Costa&Costa — Fase 51: Sua Evolução, primeiro incremento

## Princípio do produto
A primeira parte da promessa “Sua evolução” não é um painel de emagrecimento nem uma ferramenta médica. É um diário voluntário, privado e não prescritivo, sem metas, comparações ou julgamentos. Foco no bem-estar percebido e na observação livre de hábitos.

## Funcionalidades previstas nesta entrega
- Aba **Evolução** visível para usuário autenticado, sem publicar registros a outras contas.
- Um registro por dia e usuário, em data local escolhida pelo titular, sem datas futuras.
- Percepções opcionais: energia, bem-estar e qualidade percebida do sono (escala ordinal autorreferida 1 a 5); sem pontuação global.
- Hábitos opcionais: organização das refeições, pausa e movimento confortável. Três estados: não informar, sim e não.
- Comentário livre de até 280 caracteres, opcional.
- O usuário precisa aceitar explicitamente salvar suas percepções no momento de cada gravação. Nenhum registro é criado automaticamente.
- Histórico de até 90 registros carregados (30 mostrados de cada vez); editar, substituir ou excluir um dia mediante confirmação.
- Sem fotos, medições corporais, metas ou alertas automatizados nesta primeira etapa.

## Privacidade e arquitetura
Migração aditiva: `20261102193000_cc_evolution_private_checkins_phase51.sql`, criando **somente** `public.cc_evolution_checkins`.

- Chave UUID, vínculo `auth.users` com `ON DELETE CASCADE`, unicidade por `(user_id,recorded_on)`.
- RLS ativa. Políticas de SELECT/INSERT/UPDATE/DELETE restritas por `auth.uid()=user_id`, com UPDATE incluindo `WITH CHECK`, e inserção/edição sem datas futuras.
- `REVOKE ALL` para PUBLIC, anon e authenticated; só `authenticated` ganha SELECT/INSERT/UPDATE/DELETE (sem TRUNCATE).
- Dados da tabela não são enviados a métricas, analytics, logs ou compartilhamento social.
- A gravação depende de sessão autenticada no navegador; servidor aplica RLS independentemente do front.
- Não altera `recipes`, `meal_plans`, `planned_meals`, `user_preferences`, favoritos, compras, status de receitas, catálogo ou políticas pré-existentes.
- O diário não constitui diagnóstico, prescrição nem acompanhamento clínico.

## Validação obrigatória
1. GitHub CI com `npm run test:evolution-phase51` no build.
2. Inspecionar nova tabela: RLS, permissões do anon e políticas; negar leitura e UPDATE de outro titular em teste transacional com duas identidades; `ROLLBACK` obrigatório; nenhuma informação pessoal real exposta na saída.
3. Testar no navegador com uma conta de testes: sem aceite não salva; com aceite cria; ao recarregar preserva; com alteração edita mesmo dia; excluir confirma e remove.
4. Testar duas contas de teste distintas e verificar ausência de leitura/gravação cruzadas por HTTP/JWT.
5. Testar mobile e navegação, uso opcional dos campos, acessibilidade e ausência de comparação/julgamento.
6. Reconfirmar integridade da semana 02–08/11: 21 refeições, 2 compras e 2 decisões.
7. **Não fazer merge nem promover a produção sem homologação.**

## Limitações transparentes
- A verificação estática de políticas RLS não substitui testes de duas contas com sessão real.
- O histórico é deliberadamente simples: sem medidas corporais, fotos ou relatórios clínicos.
- Futuras fases devem oferecer exportação dos dados e fluxo adequado de exclusão/privacidade LGPD; há exclusão de cada registro desde já.
- Se a migração não estiver aplicada ao Supabase utilizado pela prévia, a tela mostrará falha de carregamento, sem criar registro local.
