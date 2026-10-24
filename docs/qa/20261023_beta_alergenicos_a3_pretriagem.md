# Costa&Costa Beta — A3: pré-triagem assistida de alergênicos
Data: 23/10/2026. Branch `feat/revisao-alergenos-fase1-12out2026`. PR #16 permanece **draft, sem merge**; não alterar `main`.

## Resultado da primeira varredura (somente leitura)
- 114 receitas `personal_pilot` com `is_plannable=true` e texto original presente.
- Regras iniciais de pistas textuais sinalizaram **62** receitas; **52** não exibem palavras reconhecidas. **As 52 não foram liberadas**, nem devem ser tratadas como livres de alergênicos.
- Contagens de pistas (não exclusivas): ovos 39; leite/derivados 19; peixes 14; crustáceos 5; trigo 2. Nenhuma menção coberta pelas regras iniciais de soja; **isso não demonstra ausência de soja, derivados ou contato cruzado**.
- A primeira revisão da receita `Abacate recheado com ovo assado` continua `in_review`/`unknown`; não há avaliações `verified`.
- O inventário completo de ingredientes não deve ser revisado manualmente um a um. Esta pré-triagem dá prioridade editorial **por receita**, com pistas literais e sem falsas aprovações.

## Interface A3 implantada na branch
1. Painel administrativo lê os textos de origem via Supabase com lotes de até 30 IDs e políticas RLS já existentes. Falha nessa leitura deixa a fila original disponível, sem classificação.
2. Contadores e filtros: `Com pistas para investigar`, `Sem termos encontrados (não liberadas)`, `Sem origem textual`; nenhum filtro equivale a aprovação.
3. A receita aberta mostra possíveis grupos/termos e ingredientes compostos para investigação. O administrador pode clicar em `Copiar pistas para o rascunho (sem salvar)`, o que apenas preenche o campo local e preserva hipóteses prévias.
4. `Salvar triagem pendente` mantém confirmação explícita, `status=in_review`, contato `unknown` e bloqueio automático de sugestões. A pré-triagem nunca modifica receitas, ingredientes, direitos de uso ou parâmetros de segurança.

## Alcance e limitações
- Regras iniciais são heurísticas auditáveis sobre **texto de ingredientes**; podem falhar diante de marcas, mudanças de insumo, temperos compostos, derivados inesperados, contaminação cruzada ou informação fora do texto.
- Casos deliberadamente tratados como pista incerta: `tofu` e `shoyu` sugerem soja, `maionese` sugere ovos, `pão` sugere trigo. A leitura de rótulos e fornecedores continua obrigatória.
- Exceções textuais de qualidade: `leite de coco` isolado não é indicação direta de leite animal; `manteiga de amendoim` isolada não é evidência direta de leite; `noz-moscada` não é classificada como nozes.
- A lista inicial toma como orientação a [Anvisa, Rotulagem de Alimentos Alergênicos, RDC 727/2022 e perguntas e respostas](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/rotulagem-de-alergenicos.pdf). Ela não esgota alergias individuais nem substitui avaliação clínica ou técnico-editorial.
- Não há modelo de confirmação explícita de ausência de alergênicos, rastreabilidade de revisão por versão de ingredientes, liberação por risco de contato cruzado e endpoint seguro de elegibilidade a usuários comuns. Portanto, `proposeWeek` ainda bloqueia qualquer perfil com alergias.

## Gate para próxima fase A3B/A4
1. Especialista editorial define a taxonomia de alergênicos/derivados e códigos canônicos, incluindo perfis fora da lista obrigatória de rotulagem; revisar falsos positivos e negativos representativos da amostra Beta.
2. Rótulos, fornecedores e preparo devem ser avaliados e ligados a uma versão inequívoca dos ingredientes. Qualquer mudança revoga a liberação correspondente.
3. Estruturar a revisão com cobertura explícita por alergênico e por contato cruzado, decisão, evidências e responsável qualificado. Preparar migração versionada e revisão de RLS, **sem aplicar automaticamente ao banco em uso**.
4. Só depois de conjunto-piloto homologado por categoria, expor no servidor IDs elegíveis à geração das 21 refeições. Erro, falta de dados ou falta de receitas para uma categoria preserva o cardápio existente.
5. Continuar sem repetir testes já concluídos de login, recuperação de senha, persistência de compras e isolamento de usuários.

## Validação A3
- `node scripts/test-allergen-a3-text-hints.mjs` deve passar.
- `node scripts/test-allergen-triage-guard.mjs` e `node scripts/test-allergen-eligibility.mjs` devem continuar passando.
- Sem escrita automática no Supabase; somente 1 revisão `in_review`, 0 `verified` no momento da verificação.
- Testes end-to-end administrativos com a nova interface ainda requerem confirmação visual do usuário ou sessão de homologação; sucesso no build não substitui esse teste.
