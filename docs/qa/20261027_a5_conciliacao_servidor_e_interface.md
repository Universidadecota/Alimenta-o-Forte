# Costa&Costa — A5: estado real do filtro de alergias e confirmação do cardápio

**Verificação:** 27/10/2026 · Projeto Supabase `gclhailalyrokvmkwllm` · branch Beta `feat/revisao-alergenos-fase1-12out2026`.

## Resultado confirmado por consultas de leitura

1. A função `cc_allergy_candidate_ids()` existe no banco e consulta as alergias do **usuário autenticado**, sem confiar em alergias enviadas pelo navegador. Seu `EXECUTE` está limitado a `authenticated` e aos papéis de serviço/administração.
2. A função `cc_replace_week_main_meals(date,jsonb,jsonb)` existe no banco como invocadora e, antes do primeiro UPSERT, verifica o perfil do usuário com `FOR SHARE`, a integridade das 21 refeições e se cada ID pertence ao conjunto da pré-triagem. O banco rejeita IDs incompatíveis ou não triados.
3. **Divergência operacional importante:** a lógica A5 está presente no banco, mas a versão `20261024163302` **não aparece** em `supabase_migrations.schema_migrations`. A presença da função **não equivale** à aplicação regular/registrada da migração. Não executar `db push`, `migration repair` ou reaplicar o SQL às cegas; primeiro conciliar os objetos implantados com a versão do repositório em ambiente controlado.
4. Existem **114 receitas planejáveis** no piloto. Nenhuma possui `ingredient_review_status='structured_confirmed'`; existem **0 avaliações de receitas verificadas**, **1 evidência A3B** e **1 constatação A4**. Os resultados da busca textual são apenas triagem e **não comprovam ausência de alergênicos, derivados ou contato cruzado**.
5. No recorte examinado (ovos, leite, soja e gergelim), 114 receitas foram comparadas entre ingredientes-fonte e nomes estruturados: nenhuma divergência de **presença exclusiva no campo estruturado** foi detectada para os quatro conjuntos de expressões. Esse teste limitado não demonstra que os demais termos, produtos compostos, instruções ou fornecedores estejam cobertos.

## Ajuste da interface entregue nesta branch

`src/App.tsx` agora mantém a proposta de 21 refeições após o usuário confirmar a substituição. Se a resposta da gravação falhar ou for interrompida, o cliente:

- consulta novamente o cardápio gravado;
- compara **ID e porções das 21 refeições**, dia a dia;
- confirma o salvamento somente quando os valores persistidos coincidirem;
- caso contrário, mantém o estado recuperado do servidor e solicita conferência, sem afirmar incorretamente que nada foi gravado;
- se nem mesmo a leitura for possível, informa a incerteza e orienta atualizar e verificar antes de repetir.

A frase compacta e expansível `⚠️ ALERTA DE ALERGIA — [Ingrediente]` continua inalterada. O contrato está protegido por regressão em `scripts/test-allergy-week-pretriage.mjs`.

## Gate antes da alegação de segurança alimentar

- Homologar cenários autenticados, com perfil sem alergias, com soja, com alergias múltiplas, com `Outros`, com receita excluída, com alteração concorrente do perfil e com falha de rede após persistência; confirmar que nenhuma rejeição altera parcialmente a semana.
- Criar/revisar evidência positiva **por ingrediente, receita, alergênico, versão de fonte, fornecedor/rótulo e contato cruzado**, com reavaliação após mudanças. A presença de texto não identificado na receita não é atestado de ausência.
- Conciliar o estado das funções SQL e o histórico da migração em fluxo revisado; não alterar permissões, dados pessoais, histórico ou funções de produção para registrar apenas esta auditoria.
- Manter o Beta gratuito, a `main` preservada, o PR #16 em rascunho e a exigência de verificação individual dos rótulos e do preparo.

**Escopo desta entrega:** melhoria de comunicação e conciliação da gravação no front-end + testes e auditoria somente de leitura no Supabase. Nenhuma receita foi liberada como clinicamente segura; não houve mudança de esquema, RLS, dados de usuário ou publicação em `main`.
