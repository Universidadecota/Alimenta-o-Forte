# QA — lista de compras após alteração de porções (14/10/2026)

O teste com duas capturas do aplicativo Costa&Costa mostrou o almoço de 14/10/2026 novamente com 3 porções. Na lista da semana de 12 a 18/10, **Alface** continuou marcada como comprada, agora exigindo **150 g**. Os demais itens ficaram desmarcados: arroz 240 g, feijão 300 g, peito de frango 450 g.

Uma consulta de leitura ao Supabase Cloud principal confirmou:
- `planned_meals.servings=3` para a refeição testada.
- `shopping_list_items.name=alface`, `completed=true`, `quantity=100`, `unit=g`.
- Lista e item associados ao mesmo proprietário.

**Aceite:** a alteração de porções recalcula as quantidades sem perder a marcação comprada. Nenhuma alteração de dados foi feita durante a verificação.

**Ressalva comercial:** a compra foi marcada quando a necessidade era 100 g. Após passar a 3 porções a necessidade tornou-se 150 g, mas a marcação permanece verdadeira. Isso está coerente com a chave atual por ingrediente/unidade e a quantidade dinâmica no cardápio. Para o uso comercial, precisamos definir se aumentos devem desmarcar o item, mostrar saldo pendente, ou exigir confirmação; a regra atual não distingue compra parcial.

**Outras pendências:** copiar lista, regressões finais de Fase 1, revisão do PR #16 e homologação de versão de produção.
