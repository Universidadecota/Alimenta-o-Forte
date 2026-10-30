# Costa&Costa — Transição para dois perfis e branch estável (30/10/2026)

## Objetivo autorizado
Encerrar o papel especial de participante Beta, manter apenas o funcionamento administrativo ou comum e consolidar o desenvolvimento no branch main. **Nenhuma conta de Auth, receita, ingrediente, revisão, fotografia ou planejamento é apagada.** A empresa continua em desenvolvimento e não liberada comercialmente.

## Acesso
- Administrador: identidade autenticada incluída em cc_admin_members; acessa o painel e a coleção oficial privada, além do catálogo publicado e seus dados pessoais.
- Usuário comum: identidade autenticada sem papel administrativo; acessa receitas publicadas e suas próprias receitas, compras, cardápios e favoritos. Não vê catálogo oficial privado, fontes e revisões administrativas.
- Anônimo: somente as informações públicas já permitidas pelas políticas atuais. Não é um terceiro perfil de usuário logado.

## Migração segura
Arquivo supabase/migrations/20261030150800_remove_beta_access_two_roles.sql:
1. Remove exclusivamente duas políticas SELECT antigas que abriam receitas e ingredientes Beta.
2. Neutraliza cc_beta_can_view_recipe para retornar sempre false. Funções dependentes continuam com assinatura intacta e não liberam dados privados.
3. Desativa os vínculos antigos de cc_beta_members sem remover o usuário de auth.users.
4. Revoga acesso às funções legadas que reativavam membros e receitas Beta. Mantém o histórico de cc_beta_recipe_access para auditabilidade, mas sem caminho de liberação.
5. Mantém políticas para administrador, usuário proprietário e receitas publicadas. Não altera nenhum status published.

A mesma migração **não apaga as contas**: havia quatro contas cadastradas e uma associação administrativa quando a transição foi planejada. A seleção das duas contas que a pessoa utilizará e a eventual exclusão de contas excedentes devem ser feitas apenas após identificar e preservar os dados de cada titular.

## Interface
- O componente AdminBetaAccess foi removido da interface administrativa e o catálogo pessoal deixou de consultar cc_beta_recipe_sources.
- A página de diagnóstico de JWT classifica contas como administrador ou comum, sem a categoria de participante Beta.
- O cadastro público foi ocultado do site e da tela de autenticação; login e recuperação de senha continuam.
- **Importante**: ocultar o cadastro no frontend não desliga por si só o endpoint de signup no Supabase Auth. Desativar novos cadastros definitivamente exige conferir a configuração de registro no painel Auth/Providers do Supabase. Não considerar esse bloqueio concluído só com a mudança visual.

## Consolidação para main e deploy
- Todos os testes e a compilação Vercel devem passar na branch de mudança.
- Aplicar a migração e verificar o estado real do banco e as políticas restantes.
- Mesclar o código aprovado com main, preservando o histórico de commits. Não apagar a antiga branch Beta: ela pode ser arquivada depois, sem risco de perda de código.
- Criar deployment de produção a partir do commit específico de main (não da branch Beta), conferir READY e atribuir o domínio alimentacaoforte.epsacore.com.br a essa versão.
- A associação permanente do branch de produção na configuração Git/Vercel deve ser verificada; se não houver ferramenta para alterá-la, reportar claramente a limitação, sem afirmar que automações de novos pushes já estão configuradas.
- O domínio em produção técnica **não representa autorização de comercialização**.

## Verificações requeridas
- Perfil comum: SELECT de receitas não publicadas/fonte administrativa = 0 ou negado; próprias receitas e itens conservados.
- Perfil administrador: SELECT de fontes e receitas privadas via política administrativa continua habilitado.
- Triggers que impedem publicar fontes em personal_pilot e apagar histórico de ingredientes continuam ativos.
- Contagem de 1.072 revisões editoriais em 119 receitas e 3 receitas de molhos não publicadas preservadas.
- Testes de JWT HTTP de duas contas reais continuam a depender das sessões de login do operador, sem compartilhar tokens.
