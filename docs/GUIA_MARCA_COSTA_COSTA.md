# Costa&Costa — Identidade visual e experiência (v1)

## Posicionamento
**Sua alimentação. Seu ritmo. Sua evolução.**

Promessa de interface: planejamento alimentar prático, acolhedor e sem radicalismo. Evitar promessas de emagrecimento garantido ou afirmações médicas.

## Sistema visual
- Verde profundo: `#153F35`
- Verde sálvia: `#AFC4B0`
- Off-white: `#F5F2EA`
- Bege: `#E9E2D4`
- Texto secundário: `#6B736A`
- Terracota de destaque: `#C98E62`
- Títulos: Playfair Display (fallback Georgia)
- Texto/interface: DM Sans (fallback Inter e sistema)

## Imagens de IA
Criar fotografias ilustrativas de pratos individualmente para cada receita, sem copiar fotografias do livro. Direção: fotografia gastronômica natural, luz diurna lateral suave, composição realista, louça cerâmica neutra, fundo areia/linho, sem texto embutido na imagem. Proporção 4:3 para cartões, 16:9 na página inicial. Guardar descrição e proveniência por arquivo.

Sinalização sugerida na interface: **Imagem ilustrativa gerada por IA**. Não atribuir às imagens geradas a propriedade de mostrar exatamente o prato real sem validação dos ingredientes. Usar arquivos hospedados sob controle do projeto e verificar políticas de uso antes da publicação.

## Estrutura de experiência
- Home: promessa objetiva, acesso a cardápio, receitas, lista de compras e coleção EDV.
- Receitas: distinguir receitas demonstrativas, coleção licenciada em preparação e receitas particulares.
- Receita: imagem (quando disponível), ingredientes, porções e preparo em etapas.
- Cardápio: preservar operações e sincronização Supabase já homologadas.
- Onboarding: objetivo, preferências, exclusões, alergias e rotina; não sugerir alimentos com alegação de segurança para alergias antes de testes clínicos e de dados confiáveis.
- Comercialização: manter pré-visualização até conclusão de privacidade, direitos de conteúdo, testes multiusuário e aviso do Chrome.

## Implantação
Mudanças isoladas em `feat/branding-premium-costa-costa-10out2026` para evitar quebrar a branch funcional. Compilar e validar preview antes de mesclar.
