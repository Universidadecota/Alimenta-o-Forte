-- Costa&Costa Beta | Revisão editorial controlada: lote de seis receitas, 27/10/2026.
-- ESTADO: EXECUTADO E VERIFICADO no Supabase Alimentação Forte.
-- Histórico auditável: NÃO executar novamente, pois a guarda original (instructions = original_preparation)
-- intencionalmente impedirá reaplicação; cada UPDATE só altera recipes.instructions.
-- preservados: cc_official_recipe_source_records, ingredientes, porções, tempos, status de alergênicos,
-- receitas pessoais, autenticação, RLS, favorite recipes, planejamento, cardápios e compras.
-- Pré-condições: seis receitas oficiais e privadas (published=false), em piloto e plannable.
-- Segurança alimentar: FoodSafety.gov e FDA; avisos orientativos, sem homologação clínica.

DO $cc$
DECLARE v_updated integer;
BEGIN
 WITH revisions(id,title,improved_instructions) AS (VALUES
('233276a4-ecdd-46cf-aea4-6cf09fc6a043'::uuid,'Atum selado com salada de rúcula','Lave e higienize a rúcula e o tomate. Escorra e seque as folhas, corte meio tomate em pedaços e separe as 4 azeitonas.
Seque a superfície da posta de atum de 150 g com papel de cozinha. Tempere com sal e distribua a colher (chá) de gergelim sobre a superfície do peixe.
Aqueça bem uma frigideira limpa e sele a posta dos dois lados. Continue o cozimento, ajustando o fogo e o tempo à espessura, até a parte mais grossa atingir 63 °C, aferidos com termômetro culinário. O centro rosado descrito na receita original não garante cozimento seguro.
Disponha a rúcula, o tomate e as azeitonas em um prato limpo. Tempere a salada com o azeite e o limão já previstos na lista de ingredientes.
Fatie o atum com utensílio limpo, coloque sobre a salada e sirva logo após o preparo.
DICAS PARA DAR CERTO:
Seque as folhas e o peixe antes de montar. Selar a superfície não substitui verificar o cozimento do centro; postas mais espessas exigem tempo adicional.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICOS: PEIXE (ATUM) E GERGELIM. Peixe cru ou malpassado apresenta risco de doenças transmitidas por alimentos, especialmente para gestantes, crianças pequenas, idosos e pessoas imunocomprometidas. Verifique rótulos e risco de contato cruzado. A espécie de atum também exige atenção às orientações sobre mercúrio para grupos sensíveis.'),
('9400f344-51fb-4a16-9c91-0b0a6b806a1f'::uuid,'Camarão ao alho com espaguete de abobrinha','Lave e higienize a abobrinha. Usando um espiralizador ou descascador, faça tiras longas semelhantes a espaguete e reserve em um recipiente limpo.
Separe os 150 g de camarão limpo, os 2 dentes de alho, a colher (sopa) de ghee, sal, pimenta e salsinha. Confirme que o camarão está adequadamente limpo e mantido refrigerado até o preparo.
Aqueça uma frigideira em fogo médio, adicione o ghee e salteie o alho picado sem deixá-lo queimar.
Acrescente os camarões e cozinhe, virando-os, até a carne ficar firme, perolada e opaca. Os 3 minutos indicados na fonte são apenas uma referência: o tempo varia conforme o tamanho dos camarões.
Adicione as tiras de abobrinha e misture por aproximadamente 1 a 2 minutos, até aquecer e amaciar levemente, preservando a textura. Tempere com sal e pimenta.
Finalize com salsinha e sirva imediatamente, usando utensílios limpos que não tiveram contato com o camarão cru.
DICAS PARA DAR CERTO:
Evite cozinhar demais a abobrinha, que libera água. Se os camarões forem de tamanhos diferentes, observe o cozimento de todos antes de servir.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICOS: CRUSTÁCEOS (CAMARÃO) E POSSÍVEL DERIVADO DE LEITE (GHEE). O ghee é obtido da manteiga e não deve ser presumido seguro para alergia a proteínas do leite. Confira os rótulos, mantenha o camarão sob refrigeração e evite contato cruzado com outros alimentos.'),
('d79088e0-63b7-4dff-a554-6731deb3b83a'::uuid,'Lula refogada com alho e pimenta','Mantenha os 150 g de anéis de lula refrigerados até a hora de cozinhar. Separe os 2 dentes de alho, a pitada de pimenta, a colher (sopa) de azeite, a salsinha, o limão e a salada verde.
Lave e higienize os ingredientes da salada e deixe-os escorrer. Reserve em um prato limpo, separado dos utensílios usados para o pescado cru.
Pique ou fatie o alho. Aqueça o azeite em uma frigideira e refogue o alho com a pimenta brevemente, sem queimar.
Acrescente os anéis de lula e refogue em fogo alto, mexendo. Os 3 a 4 minutos citados na fonte são apenas referência; cozinhe até a lula ficar opaca e totalmente cozida, ajustando o tempo à espessura.
Desligue o fogo, finalize com salsinha e limão e sirva ao lado da salada verde higienizada.
DICAS PARA DAR CERTO:
Prepare todos os ingredientes antes de levar a lula ao fogo, pois o cozimento é rápido. A alternativa “mariscos” mencionada na lista original pode exigir método e tempo diferentes: não substitua automaticamente pela mesma técnica.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: MOLUSCOS (LULA OU OUTROS MARISCOS). Confirme espécie, procedência e condições de conservação. Produtos crus e cozidos não devem compartilhar utensílios sem higienização. Não presuma que o tempo da lula seja adequado a outras espécies de mariscos; confira o preparo seguro específico.'),
('450f0396-fc85-439b-b932-08b6e2f269e0'::uuid,'Ovos mexidos com bacon e tomate + café com manteiga','Separe 2 ovos, 2 fatias de bacon, meio tomate picado, 1 xícara de café e 1 colher (chá) de manteiga.
Aqueça uma frigideira e frite o bacon até ficar bem cozido e dourado, sem queimar. Retire, deixe escorrer e pique em pedaços pequenos.
Na mesma frigideira, aproveitando a gordura do bacon conforme a receita original, adicione o tomate e refogue brevemente.
Quebre os ovos em uma tigela limpa, misture e despeje na frigideira. Mexa em fogo baixo até a mistura ficar firme e completamente cozida, sem partes líquidas; acrescente o bacon picado.
Prepare o café e deixe-o amornar antes de misturá-lo à colher (chá) de manteiga. Misture com colher ou utensílio apropriado para líquidos mornos, respeitando as orientações do fabricante. Sirva a bebida junto dos ovos.
DICAS PARA DAR CERTO:
Os ovos mexidos ficam mais uniformes em fogo baixo; mexa continuamente para cozinhar sem ressecar. Não é necessário acrescentar outra gordura além da indicada na receita.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICOS: OVO E LEITE (MANTEIGA). Cozinhe os ovos até ficarem firmes. Não bata café muito quente em liquidificador fechado, pois o vapor pode causar respingos e queimaduras. Confira rótulos do bacon e possíveis contatos cruzados.'),
('c4b2d737-cb31-4c97-8df6-2fb156d915ac'::uuid,'Peixe assado com brócolis e beterraba','Separe 1 filé de merluza ou 3 sardinhas, 1 xícara de brócolis, 1 beterraba pequena, as 2 colheres (sopa) de azeite, limão e sal. Reserve parte do azeite medido para finalizar; não dobre a quantidade total.
Lave e higienize a beterraba e o brócolis. Cozinhe a beterraba em água por aproximadamente 20 minutos, ou até ficar macia; deixe esfriar o suficiente para manusear e corte em cubos.
Preaqueça o forno a 200 °C. Coloque o peixe em uma assadeira limpa, tempere com limão e sal e regue com parte das 2 colheres (sopa) de azeite.
Asse por aproximadamente 15 minutos, como referência inicial da fonte, ajustando à espécie e à espessura. Antes de servir, confirme com termômetro culinário que a parte mais grossa do peixe atingiu 63 °C.
Cozinhe o brócolis no vapor por cerca de 5 minutos, até ficar macio sem desmanchar.
Distribua peixe, brócolis e beterraba no prato e finalize com o azeite reservado das mesmas 2 colheres (sopa).
DICAS PARA DAR CERTO:
O tempo de forno pode variar entre merluza e sardinhas; confira o ponto seguro em vez de usar apenas o relógio. Cozinhe a beterraba primeiro para organizar as etapas.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: PEIXE (MERLUZA OU SARDINHA). Mantenha o peixe refrigerado até o preparo, cozinhe a 63 °C no centro e evite que utensílios usados no peixe cru toquem vegetais prontos para consumo. Verifique rótulos e possíveis contatos cruzados.'),
('c61be973-d624-4794-8b0c-c48864e0d59b'::uuid,'Sardinha grelhada com vinagrete','Separe 4 sardinhas limpas, limão, sal e 1 colher (sopa) de azeite para o peixe. Para o vinagrete, separe 1 tomate, um quarto de cebola, meio pepino, 1 colher (sopa) de vinagre, outras 2 colheres (sopa) de azeite e coentro.
Lave e higienize tomate, pepino e coentro. Pique o tomate e a cebola, corte o pepino em cubos e misture-os em uma tigela limpa com o vinagre, as 2 colheres (sopa) de azeite reservadas ao vinagrete e o coentro. Mantenha separado do peixe cru.
Tempere as sardinhas com sal e limão. Aqueça uma frigideira ou prepare o forno bem quente e use a colher (sopa) de azeite destinada ao peixe.
Grelhe ou asse as sardinhas, virando com cuidado quando necessário. Os 4 minutos de cada lado da fonte são referência inicial; confira que a região mais espessa do peixe atinja 63 °C antes de servir.
Transfira as sardinhas prontas para um prato limpo e distribua o vinagrete por cima ou ao lado. Sirva imediatamente.
DICAS PARA DAR CERTO:
O azeite do peixe (1 colher de sopa) e o azeite do vinagrete (2 colheres de sopa) são medidas diferentes já previstas nos ingredientes. O tempo de grelha depende do tamanho das sardinhas.
INFORMAÇÕES DE SEGURANÇA:
ALERGÊNICO: PEIXE (SARDINHA). Cozinhe completamente e use utensílios separados para peixe cru e vinagrete. Higienize os vegetais crus e confira procedência, armazenamento e eventuais contatos cruzados.')
 )
 UPDATE public.recipes r
 SET instructions = e.improved_instructions
 FROM revisions e
 JOIN public.cc_official_recipe_source_records s ON s.recipe_id = e.id AND s.use_stage = 'personal_pilot'
 WHERE r.id = e.id
   AND r.title = e.title
   AND r.owner_user_id IS NULL
   AND r.published IS FALSE
   AND s.is_plannable IS TRUE
   AND r.instructions = s.original_preparation;
 GET DIAGNOSTICS v_updated = ROW_COUNT;
 IF v_updated <> 6 THEN
  RAISE EXCEPTION 'Revisão cancelada: atualizadas % de 6 fichas; transação integralmente revertida',v_updated;
 END IF;
END;
$cc$;

-- Validação efetuada após aplicação:
-- 119 registros oficiais de piloto; 114 elegíveis a cardápio;
-- 28 fichas com cabeçalhos de dicas e segurança (22 antes + 6 agora);
-- 6/6 revistas com original_preparation preservado; classificação needs_structuring mantida.
-- Reversão (somente após nova avaliação/autorização) é possível a partir de original_preparation
-- do documento-fonte íntegro, delimitando por IDs, fonte, published=false e título correspondente.
