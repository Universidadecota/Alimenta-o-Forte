# Favoritos Costa&Costa Beta — banco aplicado, interface aguardando homologação

Data: 27/10/2026. Base Beta: `feat/revisao-alergenos-fase1-12out2026` (HEAD inicial `7cfaf1f`). Desenvolvimento isolado em `feat/favoritos-receitas-beta-27out2026`, PR #17 em rascunho.

O Prompt Mestre (11/10/2026) prevê salvar uma receita favorita, encontrá-la novamente e preservar o dado entre sessões. Esta funcionalidade atende ao critério de aceite da Fase 1.

## Estado do banco em 27/10/2026

- Migração **aplicada com sucesso** pela integração Supabase: `cc_recipe_favorites_private_beta`, versão gerada e registrada `20261027145350`.
- SQL versionado no repositório: `supabase/migrations/20261027145350_cc_recipe_favorites_private_beta.sql`. A versão de banco foi obtida de `supabase_migrations` após a execução, não inventada.
- A tabela `public.favorites` existe, com PK composta `(user_id, recipe_id)`, FK para `auth.users` e `recipes`, índice `recipe_id`, zero linhas iniciais e RLS habilitada.
- Políticas efetivas verificadas no catálogo `pg_policies`: `SELECT`, `INSERT` e `DELETE` apenas para `authenticated` com `user_id = auth.uid()`. Inserção também exige receita consultável via RLS de `recipes`.
- Privilégios verificados: somente `SELECT/INSERT/DELETE` ao papel `authenticated`; nenhum privilégio da tabela para `anon` e nenhum `UPDATE`.
- Advisors de segurança pós-migração: nenhuma ocorrência de lint referindo-se a `favorites`. Índice de consulta reversa sinalizado como não usado por ainda não haver dados — esperado neste momento.

A primeira tentativa foi barrada por `Invalid or expired requestState`. Após o usuário confirmar as permissões do plugin, a segunda execução retornou `success:true`; a existência da tabela e a versão foram verificadas.

## Escopo funcional preparado

- Ação **Favoritar/Remover dos favoritos** em listagem e ficha detalhada, filtro **Somente favoritas** e atributo acessível `aria-pressed`.
- Persistência via Supabase por conta e carregamento ao autenticar, com proteção contra exibir favoritos de outra conta. Demonstração local permanece separada.
- Favoritar não certifica alimentos em relação a alérgenos, não modifica os bloqueios de geração de cardápio nem desativa alertas.
- CI da primeira implementação: [execução 40524153783](https://github.com/Universidadecota/Alimenta-o-Forte/actions/runs/40524153783) — aprovada, incluindo build e contrato estático de favoritos.

## Homologação pendente antes de promover ao domínio Beta

1. Conta A favorita e desmarca uma receita; verifica persistência após sair, entrar e recarregar.
2. Conta B não enxerga nem remove favoritos da conta A; visitante anônimo não pode consultar.
3. Receitas próprias e do catálogo visível podem ser favoritadas; ID de receita privada de terceiro é recusado.
4. Filtro, navegação por teclado e layout de celular; nenhuma regressão ao planejador.
5. CI da versão com migração versionada passa. Só então revisar PR #17 e promover à branch Beta, sem tocar em `main`.

**Estado:** banco pronto e protegido; o front ainda **não foi publicado no domínio Beta**. Há divergência anterior de histórico A5 a conciliar separadamente antes de qualquer `db push` amplo.
