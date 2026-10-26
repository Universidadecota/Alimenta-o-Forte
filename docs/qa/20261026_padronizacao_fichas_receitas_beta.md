# Costa&Costa — padrão das fichas de receitas no Beta (26/10/2026)

## Escopo autorizado

Aplicar às demais receitas o padrão visual validado em **Ovos pochê com abacate e salmão defumado**:
ingredientes fáceis de consultar, etapas de preparo numeradas e blocos separados para dicas e
segurança **quando o conteúdo específico estiver revisado**.

## Auditoria de linha de base (consulta somente leitura)

- **119** receitas oficiais com registro documental no piloto pessoal.
- **114** elegíveis para planejamento (`is_plannable=true`).
- **119** possuem algum preparo cadastrado; **21** têm menos de 180 caracteres de instruções.
- **2** têm pelo menos 600 caracteres de instruções.
- **1** contém os cabeçalhos completos `DICAS PARA DAR CERTO:` e `INFORMAÇÕES DE SEGURANÇA:`.
- **119** têm vírgulas na lista de ingredientes; **32** incluem seções com dois-pontos,
  **4** apresentam quebras de linha e **1** inclui ponto e vírgula.
- O preparo original no registro-fonte **não é mais extenso** que o exibido para nenhuma
  das 119 fichas. Detalhar o preparo além do texto registrado exige revisão editorial humana.

Essas estatísticas são sinais de triagem, **não** classificação individual de qualidade ou segurança.
Receitas naturalmente simples podem ter preparo curto e completo.

## Padronização visual implementada

1. Listas simples são separadas em itens individuais mantendo as palavras e quantidades originais.
2. Pratos com componentes (`Molho:`, `Salada:`, etc.) são apresentados em grupos quando a
   separação por cabeçalhos é inequívoca. Caso contrário, o texto original permanece inteiro.
3. Textos breves, armazenados como parágrafo único, ganham separação **entre frases existentes**
   na lista numerada. Instruções já separadas por linhas são mantidas como cadastradas.
4. Dicas e segurança aparecem em blocos próprios somente quando cadastradas e revisadas;
   o aplicativo não gera recomendações nutricionais, culinárias ou de alergênicos automaticamente.
5. O painel de ingredientes permanece consultável durante a rolagem no desktop e empilha
   normalmente no celular.

## Inconsistência editorial identificada

- **Caldo de frango com legumes e chucrute**: o registro original inclui, após as três
  frases de preparo, um trecho de organização semanal com referências ao Dia 6, Dia 7,
  fase 2 e portal. Esse trecho não faz parte das operações da receita isolada. **Corrigido
  no campo de exibição**: permanecem apenas as três frases culinárias, em linhas próprias;
  o registro documental-fonte foi preservado sem edição.

## Primeiro lote de conteúdo revisado no banco (26/10/2026)

As cinco fichas abaixo agora incluem etapas descritas separadamente, dicas e observações
de segurança **específicas**, sem alterar os ingredientes originais ou os registros-fonte:

- Vinagrete de gengibre — informa explicitamente o gergelim;
- Vinagrete básico de limão e ervas — separa as alternativas do tempero;
- Kefir com morangos, chia e linhaça — não presume se a base do kefir é leite ou água;
- Omelete de cebolinha com abacate — esclarece o ponto de cozimento e a alternativa
  azeite/manteiga;
- Molho de tahine e limão — identifica o gergelim presente no tahine.

Todos os `UPDATE`s foram delimitados por `id`, `title` e conteúdo anterior exato; a
consulta posterior confirmou os novos campos de dicas e segurança e o estado
`ingredient_review_status=needs_structuring`. As novas advertências **não** constituem
homologação clínica/alimentar, nem garantem ausência de contato cruzado.

## Fila de revisão culinária priorizada

Fichas com menos de 180 caracteres na auditoria **anterior à primeira rodada**
(prioridade de análise, não defeito confirmado). As cinco marcadas como revisadas já
saíram dessa fila; restam **16**:

1. Vinagrete de gengibre — **revisada**
2. Vinagrete básico de limão e ervas — **revisada**
3. Kefir com morangos, chia e linhaça — **revisada**
4. Omelete de cebolinha com abacate — **revisada**
5. Molho de tahine e limão — **revisada**
6. Rolinhos de peru com abacate e rúcula
7. Rodelas de pepino com sardinha
8. Pão de linhaça com ovo e abacate
9. Tilápia grelhada com salada de alface, pepino e cenoura
10. Smoothie de coco e framboesa + ovo cozido
11. Peru grelhado com abobrinha e cogumelos
12. Ovos mexidos com cogumelos
13. Frutas vermelhas com creme de coco
14. Salmão assado com abobrinha e aspargos
15. Guacamole com palitos de pepino e cenoura
16. Chá de camomila com sementes de abóbora
17. Salada de ovos com rúcula e tomate-cereja
18. Molho cremoso de abacate e ervas
19. Sobrecoxa assada com alecrim e couve-flor assada
20. Ovos cozidos com páprica e azeitonas
21. Gazpacho verde de pepino e abacate

## Critérios para a revisão editorial por receita

- Comparar com o documento-fonte antes de alterar conteúdo.
- Especificar sequência, utensílios, fogo/temperatura, ponto e montagem quando houver
  fundamento culinário; não inventar rendimentos, pesos ou quantidades.
- Remover da **exibição** referências a outros dias e orientações gerais deslocadas da ficha,
  sem apagar o documento ou registro-fonte.
- Incluir observações de segurança quando pertinentes, distinguidas da garantia de ausência
  de alergênicos. Exigir avaliação específica antes de qualquer classificação de segurança.
- Testar a receita aberta, a impressão e os fluxos existentes após lotes de alterações.

**Não realizados nesta etapa:** homologação de alergênicos, dados nutricionais não verificados,
reescrita indiscriminada das demais receitas ou alteração das medidas-fonte.
