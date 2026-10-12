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
- [ ] Avaliar invalidação de revisões após edição de ingredientes antes da fase pública.

**Importante:** Não aplicar diretamente em produção sem homologação e autorização explícita para executar migração.
