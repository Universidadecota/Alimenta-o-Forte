# Costa&Costa — Fase 52: visualização de Sua Evolução

**Base:** Fase 51 publicada na `main` (merge `45daa296793c26be4c3a57a03de6e6ab83929801`). **Estado:** branch de testes, sem publicação oficial.

## Objetivo
Apresentar o histórico pessoal já autorizado em um gráfico simples, compreensível e sem metas compulsórias. Não produzir pontuações globais, recomendações médicas, juízos de valor nem comparações entre usuários.

## Implementação
- Componente `EvolutionTrends.tsx` dentro da aba Evolução e **sem nova consulta**: recebe exclusivamente `rows` carregadas pela Fase 51 na sessão autenticada e protegidas pelo RLS da tabela `cc_evolution_checkins`.
- Alternância entre **Energia, Bem-estar e Descanso**.
- Janela de **7, 30 ou 90 dias corridos**, terminando na data local do usuário.
- Escala ordinal de 1 a 5, mantendo os valores informados literalmente; **sem média**, previsão, conversão clínica, interpolação de períodos, penalidades ou linhas ligando datas sem registro.
- Data, valor, contagem de dias registrados e número de dias com a percepção selecionada.
- Tabela acessível abaixo do gráfico, com ação **Abrir registro**, levando ao formulário de edição do próprio dia.
- Estado vazio informativo tanto quando não há registros no período quanto quando existem dias registrados sem nota para aquela percepção.
- A criação, alteração ou exclusão na mesma sessão atualiza imediatamente a visualização.
- Responsivo em desktop/celular. Controles `aria-pressed`, descrição acessível no gráfico e tabela para quem não usa gráficos visuais.

## Proteções
- **Nenhuma migração SQL, DML, mudança de RLS, Storage, auth, catálogo, planejamento, compras, favoritos ou preferências.**
- O módulo não lê outra conta, não cria armazenamento paralelo e não transmite as percepções a analytics.
- O estado não aparece se o carregamento inicial falhou ou está em progresso.
- A lista exibida corresponde à consulta protegida da Fase 51 (até 90 registros recentes); nenhuma alegação de histórico completo.
- A visualização usa apenas percepções auto-relatadas, não é ferramenta de diagnóstico.

## Testes
`npm run test:evolution-phase52` integrado ao build. A regressão testa:
1. Janelas de 7/30/90 dias atravessando meses e anos.
2. Pontos ordenados cronologicamente e dias ausentes **não conectados**.
3. Notas ausentes não transformadas em zero ou média.
4. Registros apenas de hábitos/comentário sem percepções não transformados em notas.
5. Apenas valores válidos 1–5; datas futuras fora da visualização.
6. Seleção da série, do intervalo, tabela acessível, abertura do dia.
7. Sem chamadas a endpoints, mutações ou armazenamento no componente.

## Homologação visual requerida
Na prévia Vercel com uma conta de testes:
1. Evolução sem registros → painel vazio e sem série fictícia.
2. Criar registros fictícios em dias distintos, deixando ao menos um dia sem registro entre eles; observar apenas pontos sem ligação através do intervalo.
3. Mudar Energia → Bem-estar → Descanso, e 7 → 30 → 90 dias.
4. Conferir tabela de valores, seleção do registro para edição e recarga da página.
5. Alterar e excluir um registro pela interface; verificar atualização de gráfico e histórico após recarga.
6. Conferir acessibilidade em teclado e largura móvel.
7. Confirmar em Supabase (somente leitura) que as 21 refeições, 2 compras e 2 decisões de novembro permanecem intactas, além de RLS ativa.

**Critério de liberação:** CI e Preview READY, homologação visual e autorização de merge. Continuar beta sem liberação comercial.