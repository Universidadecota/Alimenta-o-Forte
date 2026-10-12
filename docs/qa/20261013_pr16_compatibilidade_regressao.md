# Costa&Costa — compatibilidade e regressão pré-implantação (13/10/2026)

**Projeto Supabase remoto:** `gclhailalyrokvmkwllm`. **Branch GitHub:** `feat/revisao-alergenos-fase1-12out2026`. **PR:** #16. Somente consultas de leitura no remoto. **Não executar db push, db reset remoto, migração ou merge.**

## Achados concretos (produção, somente leitura)

1. `public.recipes` possui `url` (texto), `owner_user_id` (UUID) e não possui `image_url`. O ajuste local na migração antiga de imagens foi necessário para instalações limpas; seu efeito sobre o histórico remoto requer conciliação.
2. `public.cc_recipe_allergen_reviews` **não existe** na produção, coerente com a Fase 1 ainda não implantada.
3. A listagem de migrações remotas mostra **22 versões** com prefixos diferentes dos nomes/versões dos 23 arquivos aplicados no Supabase local. Portanto, não assumir que a CLI reconhece equivalência. Não alterar artificialmente a tabela `schema_migrations` sem inventário e validação.
4. Há no remoto a migração `20261011214444_optional_meal_slots`, ausente no histórico observado da inicialização local. No remoto, o `planned_meals_slot_check` aceita `breakfast,lunch,dinner,morning_snack,afternoon_snack,supper`. Isso não equivale ao modelo atual de três refeições no `src/lib/planner.ts`. A divergência exige análise antes de sincronizar migrações ou afirmar paridade de banco.
5. O `src/lib/planner.ts` do PR usa `slots=[Café da manhã,Almoço,Jantar]`; a opção `Lanche` aparece no tipo, mas não é inserida pelo gerador atual. Verificar o efeito de slots opcionais na UI e no relatório de compras antes da liberação.

## Regressão a realizar EXCLUSIVAMENTE no ambiente local

- [ ] Confirmar login e isolamento de sessão usando usuários de teste.
- [ ] Cadastrar/editar/arquivar receita pessoal, incluindo visualização e imagem privada.
- [ ] Criar/editar/publicar receita oficial com usuário administrador fictício e conferir imagem pública.
- [ ] Montar cardápio manual, navegar semanas, ajustar porções e confirmar persistência após atualizar o navegador.
- [ ] Confirmar totalização da lista de compras em função das porções.
- [x] Bloqueio de sugestão automática para perfil com alergia a leite — observado; 21 refeições preservadas, confirmado por SQL local.
- [x] Aviso de risco no cardápio e confirmação de seleção manual — observado.
- [x] Preservação das 2 porções ao substituir receita manualmente — confirmado visualmente após recarga.
- [x] Testes locais RLS/guard: `cc_allergen_rls_local_v2.sql` e `cc_allergen_integrity_local_v3.sql`, encerrados em ROLLBACK.
- [ ] Repetir regressão após conciliar as diferenças de schema/migrações.

## Critério de liberação

Manter PR #16 **sem merge** e evitar operações no banco remoto até: inventário das migrações compatibilizado com o histórico de produção, regressão local restante concluída, plano de backup/recuperação revisado e autorização explícita para implantação. O status `verified` é revisão editorial, **não certifica segurança alimentar**.
