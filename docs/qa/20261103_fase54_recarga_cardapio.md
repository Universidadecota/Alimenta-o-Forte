# Costa&Costa — Fase 54 | Leitura confiável do cardápio

**Data:** 03/11/2026  
**Ambiente-base:** produção da Fase 53 (merge PR #62, `main@f040b103631755b10e8ebf25f6adb5521f2e9fb6`).  
**Objetivo:** tornar explícita a diferença entre uma semana de fato vazia e uma consulta ainda não concluída ou que falhou.  
**Escopo:** somente frontend e testes. **Não alterar dados no Supabase** nem gerar novas refeições, listas ou receitas.

## Evidência anterior e diagnóstico

Na homologação posterior à limpeza da tabela legada `profiles`, a interface chegou a mostrar `0/21` e `0/3` na semana de 02–08/11, apesar de o Supabase registrar 21 refeições pertencentes à conta observada. Após o usuário pressionar `Ctrl + F5`, todos os sete dias apareceram como `3/3`.

**Não foi comprovada a causa específica do episódio** (possíveis fatores incluem estado transitório, cache ou resposta de leitura). Não há evidência de perda de dados ou relação causal com a remoção de `profiles`.

Na implementação anterior `src/App.tsx`, o `loadWeek` acionava `setPlan({})` antes da consulta, tratava erros com um aviso genérico e voltava `loading=false` no final; o `weekLoadedScope` registrava sucesso, mas a grade do Cardápio podia ser renderizada mesmo antes de `weekReady` se tornar verdadeiro. Isso confundia visualmente **pendência da consulta** com **ausência de refeições**, embora os controles de escrita fossem bloqueados pela flag `weekReady`.

## Mudanças na Fase 54

1. Estado `weekLoadError` independente do erro genérico, para falhas ao ler o planejamento.
2. Estado `weekReloadToken` permite repetir a consulta explicitamente, pelo mesmo `loadWeek(userId, weekStart)`.
3. **“Recarregar semana salva”** no Cardápio e **“Tentar novamente”** na mensagem de erro. A ação apenas incrementa o gatilho de leitura; não chama `replaceWeekMainMeals`, `saveMeal` ou qualquer escrita.
4. Enquanto `weekReady` estiver falso ou a leitura estiver em andamento, ocultar a grade de `0/3` e o formulário de refeições, apresentando mensagem de carregamento/erro. Os controles de alteração permanecem desativados.
5. A página Início mantém o indicador `—` até a confirmação de carregamento, evitando um `0/21` enganoso enquanto a consulta não termina.
6. Quando a leitura terminar com sucesso e **não houver refeições de verdade**, exibir `0/3` e as opções de planejamento como normalmente.
7. Ao trocar de usuário ou semana, a leitura anterior é invalidada pelo cleanup `alive=false`, evitando resultados fora de contexto.
8. Teste `scripts/test-week-loading-phase54.mjs`, adicionado ao build para proteger os estados e a natureza read-only da recarga.

## Homologação da prévia

- Entrar na prévia e abrir a semana com refeições existentes. Verificar que o Cardápio contém as **21 refeições originais**, com 3/3 por dia.
- Clicar **Recarregar semana salva** e confirmar que o botão fica indisponível temporariamente, o planejamento mostra **“Aguardando a leitura do cardápio salvo...”** e as 21 refeições reaparecem.
- Não utilizar **Sugerir refeições da semana**, não alterar porções e não marcar compras durante o teste visual.
- Usar os botões de navegação para uma semana realmente vazia, se houver, e confirmar que 0/3 só aparece quando a consulta termina normalmente.
- Simular uma falha de rede via DevTools *Network → Offline* apenas em ambiente de prévia; clicar em Recarregar semana salva. Após falha, deve aparecer aviso explícito e botão **Tentar novamente**; a grade vazia não deve aparecer como se a semana estivesse confirmada.
- Retornar a *Online*, clicar **Tentar novamente** e confirmar o restabelecimento das refeições existentes, sem regravação.
- Conferir visualização em 390 px, pois a Fase 53 foi homologada nessa largura.

## Critérios de publicação

1. GitHub Actions, TypeScript e build Vercel Preview aprovados.
2. Cenários de recarga normal e recuperação da falha validados visualmente.
3. Supabase: contagens de refeições, preferências e compras preservadas.
4. **Aprovação explícita para merge na main** e publicação no site oficial.

O usuário mantém a preferência de trabalhar diretamente no Supabase sem exigir backup; **nenhuma escrita no banco é necessária nesta Fase 54**. A limpeza de tabelas é escopo independente do PR #63, que permanece sem merge.


## Capturas de homologação — 03/11/2026

O responsável enviou **cinco capturas da prévia** `costa-costa-alimentacao-2oyuoysoo-myclever607-7251s-projects.vercel.app`, sem executar operações de escrita:

| Tela | Evidência visível | Estado |
|---|---|---|
| Início | Indicadores **3/3 refeições de hoje** e **21/21 refeições da semana**, com estado “Dia planejado” | Aprovado visualmente |
| Compras | Lista consolidada com nomes e quantidades legíveis, sem a legenda redundante | Aprovado visualmente |
| Perfil | Preferências exibidas, conta autenticada | Aprovado visualmente |
| Evolução | Histórico privado e filtros de percepção/período exibidos | Aprovado visualmente |
| Administração | Painel de triagem nutricional N2, totais e opções de revisão carregados | Aprovado visualmente |

**O que essas imagens ainda NÃO provam:** funcionamento de `Recarregar semana salva`, tratamento de uma falha de consulta em modo offline, recuperação com `Tentar novamente`, persistência de marcação de Compras ou operação em celular. As capturas não incluem o botão novo nem mostram a sequência de recarga.

**Próxima homologação recomendada:** na prévia, abrir `Cardápio` da semana 02–08/11, conferir 3/3 nos sete dias, clicar `Recarregar semana salva` e confirmar que continuam 21 refeições sem alteração. Opcionalmente, simular `Offline` no DevTools, tentar recarregar, verificar aviso explícito, voltar a `Online` e usar `Tentar novamente`. Não utilizar o botão `Sugerir refeições da semana` durante esses testes.

O PR #64 segue **draft**, sem merge. A produção permanece na Fase 53. Nenhum dado do Supabase foi alterado em resposta às capturas.


## Segunda rodada de homologação visual — 03/11/2026

O responsável enviou **nove capturas adicionais** da prévia Vercel da Fase 54. O botão `Recarregar semana salva` está visível na página Cardápio. As telas mostram os dias **02, 03, 04, 05, 06, 07 e 08/11/2026**, cada um com **3/3 refeições**, incluindo nomes, categorias e porções. Não há erros de consulta exibidos, nem qualquer evidência de substituição das refeições.

**Verificação independente no Supabase (somente leitura):** a conta de homologação possui **21 refeições na semana**, distribuídas em **sete dias com três refeições**; **0 referências a receitas ausentes** e **0 registros associados a planos de outra semana**. A estrutura de assinaturas e revisão nutricional profissional segue preservada.

**Limites da evidência:** as capturas não mostram o instante do clique ou a sequência antes/depois da recarga. Assim, confirmam que o **resultado final continua íntegro**, mas não provam isoladamente que `Recarregar semana salva` foi acionado. Tampouco foi demonstrada a recuperação após falha offline. A inspeção estática de código e os testes da CI cobrem o fluxo de recarga sem escrita, mas não substituem um teste manual de falha.

**Conclusão da rodada:** aprovado visualmente o preenchimento completo dos sete dias e o estado sem falso vazio; teste de falha de conexão fica documentado como **pendente, não bloqueador por si só para revisão de código**, a critério do responsável. **PR #64 ainda sem autorização de merge/publicação.**
