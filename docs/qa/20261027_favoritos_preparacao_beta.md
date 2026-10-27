# Favoritos Costa&Costa Beta — implementação preparada, ainda sem ativação

Data: 27/10/2026. Base: branch Beta `feat/revisao-alergenos-fase1-12out2026` (HEAD `7cfaf1f`). Feature isolada em `feat/favoritos-receitas-beta-27out2026`.

O Prompt Mestre (11/10/2026) prevê favoritar uma receita, encontrá-la depois e não perder os dados entre sessões; é critério de aceite da Fase 1.

## Escopo do código preparado

- Tabela `public.favorites` privada por usuário, com chave primária composta, FK para `auth.users` e `recipes`, índice de referência, `DELETE` em cascata, RLS ativa e concessões mínimas `SELECT/INSERT/DELETE` somente para autenticados.
- Política de `INSERT`: exige dono autenticado e que a receita seja consultável pelo mesmo usuário segundo a RLS de `recipes`. Sem escrita para `anon` e sem `UPDATE`.
- UI: ação **Favoritar/Remover dos favoritos** na listagem e na ficha detalhada; filtro **Somente favoritas**, indicador acessível `aria-pressed`, persistência prevista no Supabase e escopo por conta. O modo demonstração local tem estado próprio do navegador.
- Alergias: favoritos são apenas atalhos pessoais. Favoritar **não** atesta ausência de alérgenos, não altera elegibilidade do gerador nem silencia o aviso compacto.
- Teste estático de contrato em `scripts/test-recipe-favorites.mjs`, integrado ao CI da branch.

## Bloqueio de ativação

A tentativa autorizada de migração gerenciada do Supabase retornou `Invalid or expired requestState`. Consulta posterior confirmou **que a tabela ainda não existe no banco real**. Não se tentou contornar a restrição por `execute_sql`, nem aplicar o SQL diretamente.

O DDL revisado foi preservado em `docs/qa/20261027_favoritos_ddl_pendente.sql`, **não em `supabase/migrations`** e **não aplicado**. A CLI local `supabase` não está instalada neste executor. Após nova autorização da integração/fluxo de migração, converter o DDL para migração versionada registrada, verificar política/privacidade, testar com duas contas e só então integrar a feature na branch Beta.

A divergência anterior A5 (objetos ativos no banco, versão `20261024163302` ausente do histórico) também deve ser conciliada em processo revisado. Nunca fazer `db push` amplo às cegas.

## Verificação necessária após implantação

1. Usuário A favoritar, atualizar a página, sair e entrar: favorito reaparece.
2. Usuário B não enxerga, não altera nem remove favoritos de A; `anon` não acessa.
3. Favoritos de receitas próprias e do catálogo Beta visível funcionam; IDs de receitas privadas de outros usuários são recusados.
4. Desfavoritar remove somente o próprio vínculo; apagar receita elimina vínculos sem afetar demais receitas.
5. Filtro, navegação por teclado, tela móvel e ausência de regressão no planejador.
6. CI verde e revisão visual antes de promover a feature ao subdomínio Beta.

**Estado:** código isolado para homologação; sem publicação no Beta real, sem alteração de contas, dados, políticas ou tabelas.
