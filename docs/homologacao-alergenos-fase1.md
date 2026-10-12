# Costa&Costa — revisão de alérgenos (Fase 1)

**Escopo:** estrutura editorial de dados, sem alteração no gerador de cardápio e sem liberação automática de sugestões para usuários com alergias.

## Fluxo previsto
1. Uma receita nova começa sem avaliação (equivale a **pendente**).
2. Apenas administradores autorizados podem registrar declarações, origem das evidências e análise de contato cruzado.
3. A situação **verificada** exige identidade do revisor, data, evidências e análise de contato cruzado — a marcação não constitui certificação de segurança.
4. Reavaliar o conteúdo sempre que ingredientes, preparo ou fornecedores forem modificados (etapa posterior exige invalidação automática).
5. A geração automática segue bloqueada para qualquer conta com alergias/intolerâncias cadastradas, até existir filtragem validada, revisão profissional, testes de segurança e autorização específica para implantação.

## Checklist de homologação antes da migração
- [ ] Revisar SQL e RLS em ambiente de teste.
- [ ] Usuário comum não consegue ler, criar nem alterar avaliações.
- [ ] Administrador consegue criar rascunho de avaliação.
- [ ] Não permite verificar sem revisor, data, evidência ou análise de contato cruzado.
- [ ] Confirma ausência de alterações em receitas, cardápios e lista de compras.
- [ ] Confirma que o bloqueio da sugestão automática continua vigente.
- [ ] Validar o gatilho que invalida avaliações após alterações de ingredientes, instruções, descrição, título e porções.
- [ ] Validar que somente receitas oficiais recebem avaliação e que o revisor é atribuído pela sessão autenticada.
- [ ] Testar migrações base e complementar em sequência e verificar rollback em ambiente isolado.

**Importante:** Não aplicar diretamente em produção sem homologação e autorização explícita para executar migração.

## Revisão final do PR #16 — 12/10/2026

**Conclusão: NÃO LIBERAR PARA PRODUÇÃO NESTA ETAPA.** Não realizar merge do PR, deploy ou aplicação manual de migrações até resolver e validar as pendências abaixo.

### Cenários aprovados no PostgreSQL local
- RLS e isolamento entre usuário comum e administrador; proteção da identidade do revisor.
- Revisão incompleta rejeitada; revisão válida com auditoria; invalidação após mudança de ingredientes e de título.
- Bloqueio de sugestão automática em perfil de teste com alergia a leite; 21 refeições preexistentes preservadas.
- Confirmação explícita antes de seleção manual, aviso de risco e manutenção das porções após atualização de página.

### Pendências e riscos identificados na revisão do código
1. **Compatibilidade de schema:** o PR inclui alteração em `20261011200000_private_recipe_image_path_check.sql` que renomeia `image_url` para `url` em instalações novas. Revisar o esquema efetivo remoto e eventual histórico de migrações antes de qualquer implantação; a execução local bem-sucedida não garante compatibilidade remota.
2. **Limite da revisão de alérgenos:** o registro `verified` depende de evidências e contato cruzado informado, mas não representa certificação de ausência de alérgenos. Alterações de fornecedor/origem não são detectáveis pelo schema/trigger atual.
3. **Alterações de receita:** os gatilhos reagem a ingredientes, instruções, descrição, título e porções. Revisar também alterações em outros atributos ou dependências que possam modificar risco alimentar, especialmente fornecedor e substituições de ingredientes fora dos fluxos previstos.
4. **Experiência com plano anterior:** as refeições anteriormente planejadas permanecem disponíveis, mesmo após cadastro de alergia; mostrar alerta não garante prevenção de consumo. Manter comunicação clara e avaliar reforços no detalhe da receita e lista de compras.
5. **Regressões:** executar smoke end-to-end de autenticação, cadastro e edição de receitas oficiais/pessoais, planejamento manual, lista de compras, imagens e operações administrativas em ambiente isolado.
6. **Implantação:** elaborar inventário de migrações já aplicadas no remoto (somente leitura), verificar dependências, plano de backup/rollback e executar em homologação antes de produção.

**Não há autorização técnica de liberar recomendações automáticas para pessoas com alergias.** Permanecer com bloqueio por padrão.
