# Costa&Costa — Fase 53: auditoria integrada da experiência e pré-comercial

## Escopo e status
- Auditoria estática e verificações controladas no Supabase, GitHub e Vercel.
- Base: produção Fase 52, commit `63bd28f15494ca51222ebba430be54ae727c7601`.
- Esta entrega **não publica, altera nem aprova receitas**, não reprocessa compras, não recria cardápios e não modifica políticas, tabelas ou dados do Supabase.
- A aprovação em CI não substitui teste visual real em dispositivo móvel ou leitor de tela.

## Integração de módulos
`src/App.tsx` conecta Início, Cardápio, Receitas, Alimentos, Compras, Perfil, Evolução e Administração (apenas para admin). A navegação móvel reaproveita os mesmos destinos. 
- Perfil: usa componente `UserProfile`, condicionado ao carregamento das preferências.
- Compras: usa `ShoppingListSections`, com marcações e decisões carregadas do servidor.
- Evolução: usa `EvolutionPanel` e histórico gráfico da Fase 52, conectado ao usuário.
- Cardápio e receitas mantêm as rotinas anteriores; nenhuma rotina de dados foi alterada nesta fase.

## Correção de UX incluída no PR
**Achado F53-UX-01 — orientação ao mudar de tela.**
- Antes: botões da sidebar e navegação inferior não expunham `aria-current`, não havia atalho para ir ao conteúdo e o foco não acompanhava a troca de página.
- Depois: `aria-current="page"` nas duas navegações, `<nav aria-label>` nomeadas, salto de teclado para a região principal, foco programático no h1 e retorno ao topo ao mudar a seção, com foco visível nos botões; preserva a estrutura do menu e permite rolagem horizontal na barra móvel.
- O efeito **não roda na montagem inicial** e não modifica o estado de receitas, preferências, compras ou evolução.
- Teste de regressão estática `npm run test:integrated-phase53` entra em todos os builds.

## Auditoria de segurança (02/11/2026) — somente leitura
- 37 tabelas `public` identificadas; todas com RLS habilitada.
- 9 tabelas ainda têm permissão técnica SELECT concedida ao papel `anon`, mas apenas três políticas de leitura anônima retornadas autorizam dados públicos: planos de assinatura ativos, receitas publicadas e ingredientes das receitas publicadas.
- Teste `BEGIN; SET LOCAL ROLE anon; ... ROLLBACK` mostrou **zero registros visíveis** de perfis, preferências, cardápios, refeições planejadas, listas e itens de compras.
- Leitura anônima de catálogo mostrou **7 receitas publicadas e 25 ingredientes correspondentes**. Isso não significa autorização comercial comprovada.
- Não se conclui que todas as políticas sejam seguras somente porque a RLS está ativada. A auditoria de políticas especializadas permanece requisito de go-live.

## Auditoria editorial/nutricional
Contagens obtidas com agregações (sem expor dados pessoais):
- `recipes`: **128 registros**, **7 publicados**, **121 não publicados**.
- `cc_official_recipe_source_records`: **119** com direitos comerciais `pending_review` e estrutura de ingredientes `needs_structuring`.
- `cc_recipe_allergen_reviews`: **1** em `in_review`.
- `cc_recipe_nutrition_facts`: **0 registros** identificados nessa tabela.
- `cc_recipe_technical_sheets`: **7** em `pending`.
- `source_recipe_review`: **50** com `rights_status='licensed'`. São registros em **outra tabela**; não inferir que liberem os 119 registros ou as 7 receitas públicas.
- Catálogo ainda em beta; revisar licenças, autoria, composição, medidas, alergênicos e evidências nutricionais receita por receita. Não aprovar por dedução.

## Riscos e prioridades
1. **Bloqueio pré-comercial:** reconciliar autorização de direitos das receitas publicadas com sua respectiva fonte; não liberar catálogo comercial até evidência documentada.
2. **Bloqueio pré-comercial:** revisão de ingredientes, medidas, alergênicos e informações nutricionais por profissional competente antes de alegações de segurança ou valores nutricionais.
3. **Usabilidade:** concluir testes manuais de navegação, foco, rolagem e teclado nas 7 seções em desktop e celular.
4. **Privacidade:** validar acesso entre duas sessões reais, exportação/exclusão da conta e política de retenção dos registros pessoais antes de abertura comercial. A remoção por dia já funciona na Evolução, mas não equivale a fluxo de exclusão de conta.
5. **Performance:** testar as interações de filtros, modais e listas em aparelho móvel real; a aprovação do build não mede INP.

## Roteiro de homologação para a prévia
- Em desktop, pressionar Tab na primeira tela: deve aparecer “Pular para o conteúdo principal”; Enter deve ir ao conteúdo.
- Navegar pela sidebar em Início → Cardápio → Receitas → Alimentos → Compras → Perfil → Evolução; o título e o topo devem acompanhar a mudança, e apenas a aba corrente deve ter `aria-current`.
- Em celular/tablet: navegar pelas 7 seções com a barra inferior, inclusive as abas acessíveis via rolagem horizontal. Confirmar foco visível, ausência de corte de conteúdo e títulos.
- Confirmar que abrir Perfil e Evolução não altera o cardápio. Verificar Compras sem mudar marcações.
- Conferir receitas e alertas existentes sem editar/publicar.
- Validar acessibilidade com leitor de tela e navegação por teclado quando possível.

## Portas de liberação
1. GitHub Actions completo com teste F53 e TypeScript.
2. Vercel Preview READY.
3. Homologação visual desktop/mobile.
4. Autorização explícita para merge; manter produção na Fase 52 até lá.
5. **Mesmo após publicar correção de UX, não abrir comercialmente até concluir revisão de direitos e segurança alimentar.**


## Atualização de homologação — após limpeza do banco (02/11/2026)

A auditoria de limpeza no PR #63 removeu uma tabela **legada e vazia**, `public.profiles`, com `DROP TABLE ... RESTRICT` aplicada diretamente no Supabase. Após a migração, as contagens de integridade confirmaram **36 tabelas públicas, todas com RLS**, 4 contas Auth, 4 preferências, 128 receitas e 1.157 ingredientes. Nenhuma estrutura de assinatura ou revisão nutricional profissional foi removida.

O responsável enviou capturas das áreas Início, Cardápio, Receitas, Alimentos, Compras, Perfil, Evolução e Administração no domínio oficial. As áreas carregaram visualmente.

**Observação importante de carregamento:** inicialmente a interface mostrava 0/21, embora 21 refeições já estivessem gravadas na conta analisada. Após o usuário realizar `Ctrl + F5`, a semana 02–08/11 voltou a apresentar **3/3 refeições por dia**, totalizando 21, com receitas e porções. A causa da divergência inicial não foi provada; não regenerar/regravar as refeições como solução.

### Melhoria F53-UX-02 — legibilidade das medidas em Compras

Captura da produção demonstrou que o ingrediente aparecia concatenado à legenda, por exemplo `AbobrinhaQuantidade estruturada`. A causa estava no JSX `<span>{item.name}<small>Quantidade estruturada</small></span>` e ausência de tratamento de exibição do `small` nesse contexto.

**Correção nesta branch:**
- Separar explicitamente o nome e a legenda em elementos distintos e classes dedicadas: `cc-shopping-ingredient-name` e `cc-shopping-structured-text`.
- Layout em coluna com quebra de linha, controle de palavras longas e tamanhos legíveis no celular; manter a quantidade alinhada à direita.
- Preservar `purchaseKey(item)`, `purchased(item)`, `onToggle(item)`, `aria-pressed`, dados e filtros do planejamento, sem alterar backend.
- Acrescentar regressões estáticas no teste `test:integrated-phase53`.

### Testes móveis a homologar na prévia

- Em Chrome DevTools, alternar 360×800, 390×844 e 768×1024 (ou dispositivos equivalentes).
- Confirmar rolagem horizontal da navegação inferior, acesso às sete seções sem sobreposição, foco visível ao usar Tab e indicação da aba atual.
- Na seção Compras, conferir que `Abobrinha` aparece na linha superior e `Quantidade estruturada` na inferior; verificar textos longos e valor à direita sem corte.
- Alternar Início → Cardápio → Compras → Perfil → Evolução e conferir retorno ao topo e rótulo da página.
- Não marcar compras nem regerar cardápio durante o teste visual; preservar 21 refeições, 2 compras marcadas e 2 decisões.
- Testes automatizados de fonte/CSS/build não substituem um ensaio visual em navegador real.

**Publicação:** PR #62 ainda em homologação (não mesclar sem aprovação); produção permanece na Fase 52.
