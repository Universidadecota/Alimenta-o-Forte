import type {OfficialPilotSource} from "./pilotSourceEvidence";

/**
 * Propostas editoriais: não substituem a receita, a fonte oficial nem a
 * homologação técnica de segurança e alergênicos.
 */
export type SauceSafetyProposal={
 recipeId:string;
 sourceHash:string;
 title:string;
 expectedCurrentInstructions:string;
 proposedIngredientNote:string;
 proposedPreparation:string;
 reviewChecklist:readonly string[];
};
export type CurrentSauceRecipeSnapshot={
 id:string;
 instructions:string|null;
 published:boolean;
};

export const SAUCE_SAFETY_PROPOSALS:readonly SauceSafetyProposal[]=[
 {
  recipeId:"bc72828c-22ad-4201-9672-86e754eabe9c",
  sourceHash:"e18d1b485ac6c29971c98ca02f1f53d4",
  title:"Bolinhos de salmão com maionese caseira e salada de pepino",
  expectedCurrentInstructions:"Misture o salmão com o ovo, a linhaça, o endro, o limão, o sal e a pimenta. Modele 4 bolinhos e doure no azeite por 3 a 4 minutos de cada lado. Para a maionese, bata a gema com o limão e o sal e acrescente o óleo em fio fino até emulsionar. Tempere o pepino e sirva tudo junto. Guarde a maionese na geladeira por até 2 dias.",
  proposedIngredientNote:"Para a maionese, substituir apenas a expressão ‘1 gema’ por ‘1 gema de ovo pasteurizada, própria para preparações sem cocção’. A substituição depende de revisão editorial da composição e dos alergênicos; os demais ingredientes e quantidades ficam preservados nesta proposta.",
  proposedPreparation:"Misture o salmão já cozido com o ovo, a linhaça, o endro ou a cebolinha, o suco de meio limão, sal e pimenta. Modele quatro bolinhos e doure no azeite até que a mistura com ovo esteja completamente cozida, inclusive no centro; o tempo varia com o tamanho dos bolinhos. Para a maionese, use somente gema pasteurizada indicada pelo fabricante para consumo sem cocção. Em recipiente e com utensílios higienizados, bata essa gema com o suco da outra metade de limão e uma pitada de sal. Acrescente o óleo de abacate aos poucos, em fio, até emulsionar. Mantenha o molho refrigerado até servir, respeitando as condições de uso e conservação do fabricante. Tempere o pepino fatiado com vinagre, azeite e sal e sirva junto dos bolinhos. Se não houver gema pasteurizada apropriada, não prepare a maionese com gema crua comum; qualquer alternativa exige nova revisão dos ingredientes.",
  reviewChecklist:["Confirmar procedência e indicação de uso sem cocção da gema pasteurizada.","Revisar alergênicos: ovo e peixe estão presentes; conferir outras fontes e possível contato cruzado.","Revisar conservação, consumo e descarte do molho segundo fabricante e boas práticas, sem preservar automaticamente a instrução ‘até 2 dias’.","Conferir tempo e cocção integral dos bolinhos, porções e possível impacto nutricional antes de publicar."]
 },
 {
  recipeId:"ccea2f76-a9b0-477a-a5b7-2e4594d2cac7",
  sourceHash:"6538873f59c212a1ac6f7b8e080965f1",
  title:"Caesar sem queijo, com frango",
  expectedCurrentInstructions:"Prepare Molho Caesar sem queijo: Amasse as anchovas com o alho até virar pasta. Bata com a gema e o limão. Acrescente o óleo em fio fino, batendo até emulsionar. Ajuste a consistência com a água e tempere com pimenta. Prove antes de salgar.\nTempere o frango com sal e pimenta e grelhe no azeite por 5 a 6 minutos de cada lado. Deixe descansar 5 minutos e corte em tiras. Misture a alface com o molho, cubra com o frango, o ovo em quartos, o bacon picado e o gergelim torrado.",
  proposedIngredientNote:"No molho Caesar, a expressão ‘1 gema’ deve especificar ‘1 gema de ovo pasteurizada, própria para uso sem cocção’. Preservar as anchovas, o alho, o suco de limão, o óleo, a água opcional e a pimenta; não inventar novas quantidades.",
  proposedPreparation:"Para o molho Caesar sem queijo, amasse as anchovas com o alho até obter uma pasta. Incorpore uma gema de ovo pasteurizada adequada ao consumo sem cocção e o suco do limão. Adicione o óleo de abacate ou azeite suave aos poucos, batendo até emulsionar; ajuste com a água se necessário e tempere com pimenta. Prove antes de acrescentar sal. Mantenha refrigerado até servir, seguindo as condições do fabricante para o ovoproduto. Tempere o peito de frango com sal e pimenta e grelhe em azeite até estar totalmente cozido, verificando o centro com termômetro culinário (74 °C como referência para aves). Deixe descansar, corte em tiras e misture com a alface romana. Finalize com o ovo já cozido, bacon crocante e gergelim torrado. Se não houver gema pasteurizada apropriada, não prepare o molho com gema crua comum; outras versões exigem revisão editorial.",
  reviewChecklist:["Conferir origem, rotulagem e adequação da gema pasteurizada para o molho sem cocção.","Checar segurança do frango cozido e do bacon; não depender apenas de minutos de grelha.","Revisar alergênicos da receita, incluindo ovo, peixe (anchovas) e gergelim, e eventual contato cruzado.","Verificar rendimento separado do molho, conservação e valor nutricional antes de publicação."]
 },
 {
  recipeId:"fd9d66ab-d656-4bac-8ac6-2607ffad8cc4",
  sourceHash:"f3babecdf97e8f272d3110824817556d",
  title:"Salada de ovos em canoas de endívia",
  expectedCurrentInstructions:"Faça a maionese: em um copo alto, bata a gema com o suco de limão e o sal usando um mixer ou um fouet. Sem parar de bater, acrescente o óleo em fio bem fino, por 1 a 2 minutos, até a mistura ficar firme e cremosa. Se desandar, comece de novo com outra gema e vá juntando a mistura talhada aos poucos. Guarde na geladeira, pois leva ovo cru.\nCozinhe os ovos por 9 minutos e esfrie em água gelada. Amasse com um garfo e misture com a maionese, o aipo, o endro, o limão, o sal e a pimenta. Recheie as folhas de endivia e polvilhe páprica.",
  proposedIngredientNote:"Na receita da maionese, substituir a expressão ‘1 gema em temperatura ambiente’ por ‘1 gema de ovo pasteurizada própria para preparo sem cocção, mantida conforme as orientações de temperatura do fabricante’. Manter como ingredientes distintos o suco de meio limão da salada e o suco de outro meio limão da maionese; não somar ou eliminar nenhuma das ocorrências.",
  proposedPreparation:"Para a maionese, use exclusivamente gema pasteurizada rotulada como adequada para preparação sem cocção e mantenha o produto segundo as orientações do fabricante. Em recipiente e com utensílios higienizados, bata essa gema com o suco de meio limão e uma pitada de sal; acrescente o óleo de abacate ou azeite suave aos poucos até emulsionar. Se a emulsão não se formar, não acrescente outra gema crua comum. Refrigere o molho imediatamente até servir e respeite as orientações de conservação e descarte do produto usado, sem presumir validade de dois dias. Cozinhe completamente os três ovos da salada, resfrie-os de modo seguro, descasque e amasse. Misture com a quantidade indicada de maionese, aipo, endro ou cebolinha, o suco da outra metade de limão, sal e pimenta. Recheie as folhas de endívia ou alface romana e polvilhe páprica. Sirva sem demora e mantenha sob refrigeração até o consumo.",
  reviewChecklist:["Revisar a validade da indicação de rendimento de meia xícara e o uso de apenas uma colher de sopa na salada.","Conferir gema pasteurizada para o molho sem cocção; não usar como solução a simples refrigeração de gema crua.","Preservar dois usos distintos de suco de meio limão e confirmar que não haja duplicidade indevida na lista de compras.","Revisar alergênicos de ovo e outras fontes, segurança de conservação, porções e nutrição antes de publicar."]
 }
];

/**
 * Falha fechada: a prévia só aparece quando a fonte E as instruções atuais
 * continuam idênticas à fotografia auditada e a receita está não publicada.
 */
export function getVerifiedSauceProposal(
 source:Pick<OfficialPilotSource,"recipe_id"|"reference_hash"|"use_stage"|"original_ingredients">,
 current:CurrentSauceRecipeSnapshot|null
):SauceSafetyProposal|null{
 const proposal=SAUCE_SAFETY_PROPOSALS.find(item=>item.recipeId===source.recipe_id);
 if(!proposal||source.use_stage!=="personal_pilot"||
  source.reference_hash!==proposal.sourceHash||
  !source.original_ingredients?.trim()||
  !current||current.id!==proposal.recipeId||current.published!==false||
  current.instructions!==proposal.expectedCurrentInstructions)return null;
 return proposal;
}
