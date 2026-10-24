# Costa&Costa — Fase A1 | Inventário e triagem administrativa de alergênicos

**Data:** 23/10/2026
**Supabase:** gclhailalyrokvmkwllm
**Branch:** feat/revisao-alergenos-fase1-12out2026
**PR #16:** manter rascunho e sem merge.

## Escopo
Iniciar o trabalho editorial de alergênicos. Não habilitar sugestões automáticas para perfis alérgicos nem alterar conteúdo ou avaliações de receitas automaticamente.

## Inventário real — somente leitura
| Categoria | Receitas |
|---|---:|
| Café da manhã | 28 |
| Almoço | 38 |
| Jantar | 28 |
| Lanches | 20 |
| **Total** | **114** |

- 114/114 possuem textos de ingredientes e preparo originais.
- 114/114 apresentam ingredient_review_status = needs_structuring.
- 114/114 têm pelo menos uma linha de ingredientes transcritos (média 9,1).
- 114/114 seguem com commercial_rights_status = pending_review. Direitos e segurança alimentar são trilhas distintas.
- 0 registros em cc_recipe_allergen_reviews; 0 avaliações verificadas.
- Busca textual preliminar por alguns nomes de soja nos textos originais: 0 ocorrências. **Isso não demonstra ausência de soja, derivados, rotulagem variável ou contato cruzado.**
- A tabela de avaliações existe e mantém RLS administrativo. Nenhuma avaliação foi criada por este inventário.

Consultas reproduzíveis, apenas SELECT:

~~~sql
select r.category,count(*) as receitas
from public.cc_beta_recipe_access b
join public.recipes r on r.id=b.recipe_id
where b.enabled
group by r.category order by r.category;

select count(*) as revisoes,
       count(*) filter (where status='verified') as verificadas
from public.cc_recipe_allergen_reviews;

select count(*) as receitas_beta,
       count(*) filter (where s.ingredient_review_status='needs_structuring') as aguardando_estrutura
from public.cc_beta_recipe_access b
left join public.cc_official_recipe_source_records s on s.recipe_id=b.recipe_id
where b.enabled;
~~~

## Fluxo administrativo preparado
1. Somente um administrador autenticado vê Administração → Triagem editorial de alergênicos.
2. A fila mostra as receitas beta, filtros de estado e pesquisa por título.
3. A seleção abre ingredientes e preparo originais e os ingredientes transcritos.
4. O administrador registra hipóteses de alergênicos/derivados, evidências e pendências de contato cruzado.
5. Salvar faz upsert de uma receita com status in_review e cross_contact_status unknown, exigindo notas mínimas.
6. A tela não oferece a ação verified ou rejected; registros com essas decisões são somente leitura.
7. RLS e gatilhos existentes seguem protegendo a gravação e invalidando análises após mudanças relevantes.

## Limitações importantes
- Esta triagem não constitui certificação clínica. A ausência de uma palavra ou uma lista vazia não declara alimento seguro.
- Status in_review jamais libera sugestões automáticas.
- O bloqueio em src/lib/suggestions.ts para alergias cadastradas permanece inalterado.
- Não alterar published, permissões beta, cardápios, compras, ingredientes nem preferências existentes.
- Não permitir que IA ou busca textual marque verified.
- A próxima fase requer revisão qualificada com evidências, ingredientes derivados, rótulos/fornecedores, preparo e contato cruzado.
- cross_contact_status assessed sozinho não equivale a ausência de risco; o modelo de elegibilidade deverá registrar conclusão explícita e escopo.

## Homologação
- [ ] GitHub Actions aprovado no commit final.
- [ ] Fila visível somente na Administração e apenas com dados autorizados.
- [ ] Seleção abre ingredientes sem modificar conteúdos.
- [ ] Em ambiente de teste, rascunho salva como in_review, cross_contact_status unknown e reviewed_by / reviewed_at nulos.
- [ ] Conta sem administração não consegue ler/escrever avaliações (RLS).
- [ ] Perfil com soja segue impedido de gerar cardápio automático.
- [ ] Nenhuma receita recebe verified por causa desta entrega.
- [ ] Revisor qualificado e processo de aprovação final definidos antes de implementar elegibilidade de sugestões.

Não executar gravações de teste no banco real. Não mesclar PR #16.

## Referências
- [Anvisa — Rotulagem de alergênicos](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/rotulagem-de-alergenicos.pdf)
- [FARE — Avoiding Cross-Contact](https://www.foodallergy.org/resources/avoiding-cross-contact)
- [Fase 1 — homologação](../homologacao-alergenos-fase1.md)
