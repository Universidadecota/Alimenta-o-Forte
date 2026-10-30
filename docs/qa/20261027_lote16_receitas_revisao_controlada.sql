-- Costa&Costa | 16 fichas de preparo curto: revisão editorial delimitada.
-- Aplicação somente após conferir a consulta _fontes_readonly.sql.
-- Preserva fontes/ingredientes/medidas/tempo/rendimento/status de alergênicos.
-- É atômico: se uma ficha não corresponder ao preparo-fonte, nada será alterado.
DO $cc$
DECLARE
  v_updated integer;
BEGIN
  WITH revisoes(recipe_id,titulo,preparo_revisado) AS (
    VALUES
    ('997b66fd-2f5b-49c4-8949-90e391ae8974'::uuid,'Chá de camomila com sementes de abóbora',$r01$
Prepare o chá de camomila conforme a apresentação que você tem em casa, usando água quente e deixando em infusão por 5 minutos. Sirva sem açúcar.
Separe as 3 colheres (sopa) de sementes de abóbora e uma frigideira seca, sem adicionar óleo.
Aqueça a frigideira em fogo baixo a médio. Coloque as sementes e mexa por cerca de 3 minutos, até ficarem levemente tostadas e aromáticas, sem deixá-las queimar.
Retire do fogo e acrescente a pitada de sal. Transfira as sementes para um recipiente pequeno.
Sirva as sementes ao lado da xícara de chá, deixando a bebida atingir uma temperatura confortável antes de beber.
DICAS PARA DAR CERTO:
Mexa as sementes constantemente: elas podem passar do ponto rapidamente. Se a camomila for de sachê ou de folhas, siga também as orientações do fabricante para o preparo e o tempo de infusão.
INFORMAÇÕES DE SEGURANÇA:
Confira a origem, a validade e possíveis alergênicos das sementes de abóbora e da camomila; produtos embalados podem ter alertas de contato cruzado. Não consuma sementes com cheiro de ranço ou sinais de deterioração.
$r01$),
    ('0261ba4b-5564-4a74-ab1f-01018cb9e3dc'::uuid,'Frutas vermelhas com creme de coco',$r02$
Lave e higienize as frutas escolhidas para a meia xícara da receita. Escorra e seque delicadamente; se usar morangos, retire as folhas e corte-os apenas se necessário.
Use o leite de coco que ficou refrigerado por 12 horas, conforme a lista de ingredientes. Abra a lata e retire somente 3 colheres (sopa) da parte sólida, sem misturá-la à parte líquida.
Coloque a parte sólida em uma tigela e bata com um fouet ou mixer por cerca de 1 minuto, até formar um creme uniforme. Não acrescente açúcar ou outros ingredientes.
Distribua as frutas em uma taça ou tigela e coloque o creme de coco sobre elas.
Finalize com 1 colher (sopa) de coco ralado sem açúcar e a pitada de canela. Sirva logo após montar.
DICAS PARA DAR CERTO:
Se o produto não separar uma parte sólida depois de gelado, sua composição pode não ser adequada para produzir esse creme; verifique o tipo de leite de coco utilizado. Frutas bem secas evitam que a apresentação fique aguada.
INFORMAÇÕES DE SEGURANÇA:
Higienize as frutas antes de consumir e mantenha o leite de coco refrigerado após aberto, seguindo o rótulo. Confira os ingredientes e os avisos de alergênicos e contato cruzado do leite de coco e do coco ralado.
$r02$),
    ('74567ace-5a81-4c43-8a07-9ddaeba73728'::uuid,'Gazpacho verde de pepino e abacate',$r03$
Lave e higienize o pepino e a hortelã. Corte o pepino em pedaços menores; retire a polpa do meio abacate e separe o meio dente de alho.
Esprema o limão e meça a meia xícara de água gelada. Reserve uma pequena parte da colher (sopa) de azeite para finalizar o prato.
Coloque no liquidificador o pepino, o abacate, a hortelã, o alho, o suco de limão, a água gelada e o restante do azeite já medido.
Bata até obter um creme homogêneo. Prove e ajuste o sal e o equilíbrio do limão, usando apenas os ingredientes da receita.
Transfira para um recipiente limpo, tampe e leve à geladeira por aproximadamente 30 minutos para servir bem gelado.
Distribua em uma tigela e finalize com o azeite reservado, sem acrescentar outra porção de óleo.
DICAS PARA DAR CERTO:
Para um gazpacho mais liso, bata por mais alguns segundos e raspe as laterais do copo do liquidificador com o aparelho desligado. A água deve estar gelada para preservar a textura fresca.
INFORMAÇÕES DE SEGURANÇA:
Como os vegetais são consumidos crus, higienize-os adequadamente e mantenha o preparo refrigerado até servir. Verifique ingredientes e riscos de contato cruzado quando houver alergias declaradas.
$r03$),
    ('afe055d7-d537-4feb-b071-9751b0a8670e'::uuid,'Guacamole com palitos de pepino e cenoura',$r04$
Lave e higienize o pepino, a cenoura, o coentro e o limão antes do preparo. Corte meio pepino e meia cenoura em palitos apropriados para mergulhar.
Retire a polpa do meio abacate maduro e coloque em uma tigela. Amasse com um garfo até obter a textura desejada, lisa ou com pequenos pedaços.
Regue a polpa com o suco de meio limão e misture para distribuir o sabor.
Acrescente 1 colher (sopa) de cebola picada, 1 colher (sopa) de coentro, a pitada de pimenta chili e sal. Mexa delicadamente e prove o tempero.
Transfira o guacamole para um recipiente de servir e organize os palitos de pepino e cenoura ao lado. Consuma em seguida.
DICAS PARA DAR CERTO:
Escolha um abacate maduro, que ceda levemente à pressão. Evite bater no liquidificador: o garfo ajuda a manter a textura característica do guacamole.
INFORMAÇÕES DE SEGURANÇA:
Higienize os vegetais consumidos crus. Se não servir imediatamente, cubra o guacamole em contato com a superfície e mantenha-o refrigerado; o limão não substitui a refrigeração. Confira restrições e alergias individuais.
$r04$),
    ('2b6d7bc9-458c-4aa5-ae4f-2a30d12df152'::uuid,'Molho cremoso de abacate e ervas',$r05$
Lave e higienize o abacate, o limão e a erva escolhida (coentro ou salsinha). Retire a polpa de meio abacate maduro e esprema o limão.
Coloque no liquidificador a polpa do abacate, o suco de 1 limão, 1 colher (sopa) da erva escolhida e 2 colheres (sopa) de azeite.
Acrescente a pitada de pimenta chili e o sal. Comece a bater em velocidade baixa.
Adicione a água aos poucos, usando de 3 a 4 colheres (sopa), até que o molho fique liso e tenha a consistência desejada. Interrompa o aparelho antes de raspar as laterais.
Prove, ajuste o sal se necessário e transfira para um recipiente limpo. Sirva como acompanhamento de outra receita.
DICAS PARA DAR CERTO:
Coloque a água gradualmente, pois a umidade do abacate varia. Para diminuir o escurecimento, cubra o molho com filme próprio para alimentos em contato com a superfície; guardar a semente junto não garante a conservação da cor.
INFORMAÇÕES DE SEGURANÇA:
Utilize utensílios limpos e refrigere o molho imediatamente se não for consumi-lo na hora. Não deixe molhos com ingredientes frescos por longos períodos em temperatura ambiente. Verifique a adequação dos ingredientes às alergias declaradas.
$r05$),
    ('7814b8b7-917b-4f1f-acf9-b8563b7e0678'::uuid,'Ovos cozidos com páprica e azeitonas',$r06$
Coloque os 2 ovos cuidadosamente em uma panela e cubra com água. Leve ao fogo até iniciar fervura moderada.
Cozinhe por aproximadamente 9 minutos, conforme a receita original; ajuste o tempo se necessário para que a clara e a gema fiquem completamente firmes.
Transfira os ovos para água gelada para interromper o cozimento. Aguarde esfriarem o suficiente para manusear e retire as cascas.
Corte cada ovo ao meio e disponha no prato. Regue com a colher (chá) de azeite.
Tempere com a pitada de páprica, sal e pimenta e acrescente as 6 azeitonas ao lado. Sirva em seguida.
DICAS PARA DAR CERTO:
Depois do resfriamento, dê leves batidas na casca e descasque sob um fio de água potável, se necessário. A intensidade da páprica varia conforme a variedade; distribua-a aos poucos.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: OVO. Para reduzir o risco microbiológico, cozinhe até clara e gema ficarem firmes. Verifique o rótulo das azeitonas e da páprica para ingredientes adicionais ou contato cruzado quando houver alergias.
$r06$),
    ('5d2eea2f-12f7-433b-8918-7ffc9b819629'::uuid,'Ovos mexidos com cogumelos',$r07$
Separe os 2 ovos, meia xícara de cogumelos fatiados, a colher (sopa) de manteiga, o sal e a xícara de chá verde.
Quebre os ovos em uma tigela e bata com um garfo até clara e gema se misturarem. Reserve.
Aqueça uma frigideira em fogo médio-baixo, derreta a manteiga sem deixá-la queimar e acrescente os cogumelos.
Salteie os cogumelos por cerca de 3 minutos, mexendo até amolecerem e perderem parte da umidade.
Reduza o fogo, despeje os ovos batidos e mexa delicadamente com uma espátula. Cozinhe até não restar parte líquida e os ovos estarem completamente cozidos, ajustando o tempo conforme a frigideira.
Transfira para o prato e sirva com a xícara de chá verde preparada de acordo com as instruções do produto.
DICAS PARA DAR CERTO:
O fogo baixo ajuda a evitar que os ovos ressequem antes de cozinhar por completo. Use cogumelos próprios para consumo e mantenha a frigideira em movimento suave.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICOS: OVO E LEITE (MANTEIGA). Não sirva ovos crus ou parcialmente líquidos. Verifique o tipo de cogumelo, os rótulos dos produtos e eventuais alertas de contato cruzado.
$r07$),
    ('7f5d0d41-ae6c-42d1-8a00-6a0bae25f5eb'::uuid,'Pão de linhaça com ovo e abacate',$r08$
Coloque 1 ovo em uma panela pequena com água e leve ao fogo. Após a fervura, cozinhe por cerca de 8 minutos, como indicado na receita original; prolongue se necessário até a gema ficar firme.
Retire o ovo da água quente, resfrie cuidadosamente e descasque. Corte-o em rodelas ou fatias.
Retire a polpa de um quarto de abacate, coloque em uma tigela e amasse com um garfo. Adicione o suco de limão e o sal previstos na receita, misturando até ficar cremoso.
Separe 1 fatia de pão de linhaça. Se desejar, aqueça ou torre levemente a fatia, sem deixá-la queimar.
Espalhe o abacate sobre o pão, distribua as fatias de ovo cozido por cima e sirva com o café preto preparado conforme sua preferência, sem acrescentar ingredientes à receita.
DICAS PARA DAR CERTO:
Monte perto da hora de servir para preservar a textura do pão. Um abacate maduro é mais fácil de amassar e espalhar.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: OVO. Pães de linhaça podem conter trigo/glúten, leite, soja, gergelim ou outros ingredientes conforme a marca; confira o rótulo e não presuma que sejam livres de alergênicos. Cozinhe o ovo completamente.
$r08$),
    ('c63ea450-5618-476e-9bc6-e1bf2f010667'::uuid,'Peru grelhado com abobrinha e cogumelos',$r09$
Separe os 150 g de peito de peru em filé, a abobrinha em cubos, meia xícara de cogumelos, 2 dentes de alho, o azeite, o sal e a pimenta.
Seque a superfície do filé com papel próprio para cozinha e tempere com parte do sal e da pimenta, evitando tocar em outros alimentos com utensílios que tiveram contato com a carne crua.
Aqueça uma frigideira e grelhe o peru por aproximadamente 4 a 5 minutos de cada lado, como referência inicial. Ajuste o tempo à espessura do filé até o centro atingir 74 °C, aferidos com termômetro culinário.
Em outra área da frigideira ou após retirar a carne e higienizar o necessário, aqueça a colher (sopa) de azeite e salteie o alho, os cogumelos e os cubos de abobrinha por cerca de 6 minutos, mexendo até ficarem macios.
Ajuste sal e pimenta nos vegetais, disponha ao lado do peru e sirva quente.
DICAS PARA DAR CERTO:
Cubos de abobrinha de tamanhos semelhantes cozinham mais uniformemente. O tempo de grelha é uma estimativa; o ponto seguro do peru deve ser conferido pela temperatura interna, não apenas pela aparência.
INFORMAÇÕES DE SEGURANÇA:
AVE CRUA: cozinhe o filé até pelo menos 74 °C no centro e evite contaminação cruzada entre carne, tábuas, facas e verduras. Confira rótulos e ingredientes adicionais se o peito de peru for um produto industrializado.
$r09$),
    ('bba18d0e-d597-4383-be80-355fe3ed47c1'::uuid,'Rodelas de pepino com sardinha',$r10$
Lave e higienize o pepino médio e corte-o em rodelas grossas, estáveis o bastante para receber o recheio.
Abra a lata de sardinha em água ou azeite e escorra o líquido. Transfira a sardinha para uma tigela limpa e retire eventuais partes que não deseje usar.
Amasse levemente com um garfo, sem transformar em pasta muito lisa.
Adicione o suco de meio limão, 1 colher (sopa) de cebolinha picada, pimenta e sal; misture até temperar de maneira uniforme.
Coloque uma porção de sardinha temperada sobre cada rodela de pepino e disponha as unidades em um prato. Sirva logo após montar.
DICAS PARA DAR CERTO:
Rodelas mais espessas e sardinha bem escorrida deixam a apresentação firme. Prove antes de colocar mais sal, pois a sardinha enlatada já pode ser salgada.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: PEIXE (SARDINHA). Confira o rótulo da conserva, inclusive ingredientes e possíveis alergênicos adicionais. Não use latas estufadas, vazando ou danificadas; higienize o pepino antes do consumo cru.
$r10$),
    ('517393b6-8aaa-4f5e-bd3f-3c429b40d370'::uuid,'Rolinhos de peru com abacate e rúcula',$r11$
Lave e higienize a rúcula, o limão e o abacate. Escorra e seque as folhas de rúcula para que os rolinhos não fiquem molhados.
Confira se as 4 fatias de peito de peru estão próprias para consumo imediato: elas devem estar cozidas em casa ou ser um produto pronto para consumo, conforme o rótulo.
Corte um quarto de abacate em fatias finas, suficientes para distribuir pelos quatro rolinhos.
Abra uma fatia de peito de peru sobre uma superfície limpa. Coloque uma fatia de abacate e algumas folhas de rúcula no centro.
Pingue um pouco de limão, tempere com pimenta e enrole com cuidado. Repita com as demais fatias.
Organize os quatro rolinhos no prato e sirva imediatamente, ou mantenha-os refrigerados até a hora de servir.
DICAS PARA DAR CERTO:
Seque bem a rúcula para ajudar a manter o rolinho fechado. Evite fatias muito grossas de abacate, que dificultam enrolar.
INFORMAÇÕES DE SEGURANÇA:
Se usar peru preparado em casa, confirme que foi completamente cozido antes de fatiar; peru cru precisa atingir 74 °C no centro. Produtos fatiados prontos podem conter leite, soja ou outros alergênicos e exigem conferência do rótulo. Conserve sob refrigeração.
$r11$),
    ('4b28dc48-7f23-41da-bf3b-2c93f3cb4710'::uuid,'Salada de ovos com rúcula e tomate-cereja',$r12$
Se os 2 ovos ainda não estiverem cozidos, coloque-os em água fervente e cozinhe por cerca de 9 minutos, ajustando o tempo para que a gema e a clara fiquem firmes.
Passe os ovos para água gelada, espere esfriarem, descasque e corte cada um em quatro partes.
Lave e higienize a rúcula e os 6 tomates-cereja; escorra bem as folhas e corte os tomates ao meio.
Distribua a rúcula em uma saladeira e acrescente os tomates-cereja e as 4 azeitonas.
Coloque os quartos de ovo sobre a salada. Regue com 1 colher (sopa) de azeite e o suco de meio limão; finalize com sal e pimenta.
Misture delicadamente apenas na hora de servir para manter os ovos inteiros.
DICAS PARA DAR CERTO:
Folhas bem secas recebem melhor o tempero. Para uma montagem mais bonita, coloque os ovos por último, com o lado cortado para cima.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: OVO. Cozinhe completamente os ovos e higienize os vegetais crus. Mantenha a salada refrigerada até servir, principalmente se os ovos foram preparados com antecedência.
$r12$),
    ('1e8f36c2-f2a7-422b-bd74-6fec687207f2'::uuid,'Salmão assado com abobrinha e aspargos',$r13$
Preaqueça o forno a 200 °C. Separe a posta de salmão de 150 g, a abobrinha, os 6 aspargos e a colher (sopa) de azeite.
Lave a abobrinha e os aspargos; corte a abobrinha em rodelas e apare as extremidades mais duras dos aspargos, se necessário.
Disponha o salmão e os vegetais em uma assadeira, sem amontoá-los. Regue com o azeite medido e tempere com sal e pimenta.
Leve ao forno preaquecido e asse por aproximadamente 15 a 18 minutos, conforme a receita original. Observe o tamanho dos ingredientes e confirme que o centro do peixe atingiu pelo menos 63 °C.
Retire a assadeira com cuidado, finalize com o limão e sirva ainda quente.
DICAS PARA DAR CERTO:
Rodelas de abobrinha de espessura semelhante assam mais por igual. O tempo de forno é uma estimativa, não substitui a verificação do ponto do peixe.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: PEIXE (SALMÃO). Mantenha o pescado refrigerado até o preparo, evite contato de utensílios com outros alimentos e cozinhe o peixe até temperatura interna segura de 63 °C. Confira outros ingredientes e contato cruzado quando houver alergias.
$r13$),
    ('cfdc9987-4fb7-4510-bc60-8532398faa53'::uuid,'Smoothie de coco e framboesa + ovo cozido',$r14$
Separe 1 ovo e coloque em uma panela com água. Após iniciar a fervura, cozinhe por cerca de 8 minutos, conforme a receita original, prolongando o tempo se a gema não estiver firme.
Resfrie o ovo com cuidado, descasque e reserve para servir ao lado da bebida.
Lave e higienize as framboesas frescas. Meça três quartos de xícara de leite de coco, meia xícara de framboesas, 1 colher (sopa) de chia e 1 colher (chá) de óleo de coco.
Coloque o leite de coco, as framboesas, a chia e o óleo de coco no liquidificador.
Bata até obter uma bebida homogênea, sem grumos grandes. Distribua em um copo e sirva acompanhado do ovo cozido, não misturado ao smoothie.
DICAS PARA DAR CERTO:
Se as framboesas estiverem congeladas, use-as conforme as instruções da embalagem. A chia pode engrossar o smoothie depois de algum tempo; sirva logo após bater para manter a consistência planejada.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: OVO. Cozinhe o ovo até clara e gema firmes. Verifique ingredientes e avisos de alergênicos do leite e óleo de coco industrializados, e higienize as frutas frescas antes de bater.
$r14$),
    ('8d1960f4-f931-454a-9a23-370c8b0ec179'::uuid,'Sobrecoxa assada com alecrim e couve-flor assada',$r15$
Preaqueça o forno a 200 °C. Separe as 2 sobrecoxas sem pele, o ramo de alecrim, os 2 dentes de alho, a xícara de buquês de couve-flor, o azeite, o sal e a pimenta.
Pique ou amasse o alho e tempere as sobrecoxas com ele, o alecrim, sal e pimenta. Use uma superfície separada para a ave crua.
Lave e higienize a couve-flor, escorra os buquês e espalhe-os em uma assadeira junto das sobrecoxas, deixando espaço para o ar quente circular.
Regue a couve-flor com 1 colher (sopa) de azeite e leve a assadeira ao forno por aproximadamente 35 a 40 minutos, conforme a receita original.
Na metade do tempo, vire as sobrecoxas e, se necessário, mexa delicadamente os buquês de couve-flor com utensílio limpo.
Antes de servir, confirme com termômetro culinário que o centro da parte mais espessa das sobrecoxas atingiu pelo menos 74 °C, sem encostar o sensor no osso. Ajuste o tempo de forno se necessário.
DICAS PARA DAR CERTO:
Evite amontoar os buquês: isso ajuda a assá-los em vez de cozinhá-los no vapor. O tamanho das sobrecoxas pode mudar bastante o tempo real no forno.
INFORMAÇÕES DE SEGURANÇA:
AVE CRUA: cozinhe a pelo menos 74 °C no centro. Evite que o líquido da carne crua contamine a couve-flor, bancadas e utensílios; lave as mãos e higienize as superfícies após manipular o frango.
$r15$),
    ('10799401-1faa-4697-b1bb-647afa49f2c8'::uuid,'Tilápia grelhada com salada de alface, pepino e cenoura',$r16$
Lave e higienize as 4 folhas de alface, meio pepino, meia cenoura e o limão. Escorra bem as folhas, corte o pepino e rale a cenoura.
Separe o filé de tilápia de 150 g e tempere-o com limão e sal, mantendo separados os utensílios usados para o peixe cru.
Aqueça uma frigideira em fogo médio e coloque 1 colher (chá) de azeite, reservada especificamente para grelhar o peixe.
Grelhe a tilápia por aproximadamente 3 a 4 minutos de cada lado, conforme a espessura. Verifique que a parte mais grossa chegou a 63 °C antes de retirar da frigideira.
Em uma tigela limpa, misture as folhas, o pepino e a cenoura ralada. Tempere a salada com 1 colher (sopa) de azeite, limão e sal, sem confundir essa medida com o azeite da grelha.
Sirva a tilápia quente ao lado da salada preparada na hora.
DICAS PARA DAR CERTO:
Filés de espessuras diferentes podem precisar de tempos diferentes de grelha. Seque levemente o peixe antes de colocá-lo na frigideira para reduzir respingos, sempre com utensílios próprios para peixe cru.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: PEIXE (TILÁPIA). Cozinhe até temperatura interna segura de 63 °C, evite contaminação cruzada e higienize os vegetais consumidos crus. Confira ingredientes adicionais e rótulos conforme as alergias declaradas.
$r16$)
  )
  UPDATE public.recipes AS r
  SET instructions = e.preparo_revisado
  FROM revisoes AS e
  JOIN public.cc_official_recipe_source_records AS s
    ON s.recipe_id = e.recipe_id
   AND s.use_stage = 'personal_pilot'
   AND s.original_preparation IS NOT NULL
  WHERE r.id = e.recipe_id
    AND r.title = e.titulo
    AND r.instructions = s.original_preparation
    AND r.published = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 16 THEN
    RAISE EXCEPTION 'Revisão cancelada: % de 16 fichas ainda coincidiam com a fonte; nenhuma alteração aplicada.',v_updated;
  END IF;
END;
$cc$;
