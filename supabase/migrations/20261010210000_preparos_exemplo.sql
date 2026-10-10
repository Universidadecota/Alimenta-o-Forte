-- Conteúdo culinário demonstrativo. Deve passar por revisão editorial/nutricional antes do lançamento.
update public.recipes set instructions =
case
 when title='[Exemplo] Omelete de tomate' then 'Lave e corte o tomate em pedaços pequenos.\nBata os ovos e misture o tomate.\nAqueça uma frigideira antiaderente e cozinhe a mistura até os ovos ficarem totalmente firmes.'
 when title='[Exemplo] Iogurte com banana e aveia' then 'Descasque e fatie a banana.\nColoque o iogurte em um recipiente limpo.\nAcrescente a banana e a aveia, misture e sirva.'
 when title='[Exemplo] Frango com arroz, feijão e salada' then 'Prepare o arroz e o feijão segundo o método habitual, utilizando água potável.\nCozinhe completamente o peito de frango, garantindo que não reste carne crua.\nLave adequadamente a alface e monte o prato com os demais ingredientes.'
 when title='[Exemplo] Peixe assado e legumes' then 'Lave e corte batata e cenoura em pedaços.\nDistribua os legumes e o filé de peixe em uma assadeira.\nAsse até que os legumes estejam macios e o peixe completamente cozido, ajustando o tempo ao tamanho das porções.'
 when title='[Exemplo] Sopa de legumes com frango' then 'Corte a cenoura e a abobrinha em cubos.\nCozinhe o peito de frango completamente e desfie.\nCozinhe os legumes em água potável até amolecerem; acrescente o frango cozido e aqueça antes de servir.'
 when title='[Exemplo] Salada de grão-de-bico e ovos' then 'Utilize grão-de-bico previamente cozido.\nCozinhe completamente os ovos, deixe esfriar e corte.\nLave o tomate, corte em pedaços e misture com o grão-de-bico e os ovos.'
 else instructions end,
description='Receita de demonstração para testes do aplicativo. Preparo ilustrativo sujeito a revisão editorial e nutricional.'
where title like '[Exemplo] %' and instructions is null;
