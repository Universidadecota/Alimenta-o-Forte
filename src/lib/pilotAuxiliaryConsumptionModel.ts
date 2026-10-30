import type {PreparationPartition,PreparationBlock} from "./pilotRecipePreparationPartition";

/**
 * Modelo de hipótese — não é um cálculo de compras, nutrição, conservação,
 * segurança alimentar ou autorização de publicação. Não há escrita em banco.
 */
export type AuxiliaryMeasureUnit="g"|"ml"|"unidade"|"porcao";
export type AuxiliaryQuantity={amount:number;unit:AuxiliaryMeasureUnit};
export type AuxiliaryConsumptionLink={
 mealRecipeId:string;
 mainBlockKey:string;
 auxiliaryBlockKey:string;
 sourceDeclaredYield:string|null;
 sourceDeclaredUse:string|null;
 referenceIngredientId:string|null;
 referenceIngredientPosition:number|null;
 referenceIngredientText:string|null;
 batchYield:AuxiliaryQuantity|null;
 usedAmount:AuxiliaryQuantity|null;
 leftover:AuxiliaryQuantity|null;
 readiness:"pending_measurement";
 shoppingStatus:"blocked";
 nutritionStatus:"blocked";
 /**
  * Quando há referência ao molho pronto na receita principal, ela não pode
  * ser somada aos componentes do preparo auxiliar como segunda compra.
  */
 duplicatePurchaseRisk:boolean;
};
export type AuxiliarySimulationStatus=
 "missing_yield"|"missing_use"|"invalid_measurement"|"unit_mismatch"|
 "used_exceeds_yield"|"simulated";
export type AuxiliarySimulation={
 status:AuxiliarySimulationStatus;
 leftover:AuxiliaryQuantity|null;
 hypotheticalOnly:true;
 shoppingStatus:"blocked";
 nutritionStatus:"blocked";
};

/** A relação é criada exclusivamente a partir de uma divisão já auditada;
 * não supõe valores numéricos a partir de expressões como "½ xícara".
 */
export function buildProposedAuxiliaryLink(
 recipeId:string,
 partition:PreparationPartition
):AuxiliaryConsumptionLink|null{
 if(!recipeId.trim()||
  partition.shoppingCalculationAllowed!==false||
  partition.nutritionCalculationAllowed!==false)return null;
 const mains=partition.blocks.filter(block=>block.kind==="main");
 const sauces=partition.blocks.filter(block=>block.kind==="sauce");
 if(mains.length!==1||sauces.length!==1)return null;
 const main=mains[0],sauce=sauces[0];
 if(!main.key||!sauce.key||!main.ingredients.length||!sauce.ingredients.length)return null;
 const references=partition.blocks
  .filter(block=>block.referencedAtPosition!==null);
 if(references.length>1||references.some(block=>block.key!==main.key))return null;
 const refPos=main.referencedAtPosition;
 const ref=refPos===null?null:main.ingredients.find(row=>row.position===refPos);
 if(refPos!==null&&(!ref||!ref.id||!ref.name.toLocaleLowerCase("pt-BR").includes("maionese caseira")))return null;
 if((ref!==null)!==(sauce.usedInMeal!==null))return null;
 const allIds=partition.blocks.flatMap(block=>block.ingredients.map(item=>item.id));
 if(new Set(allIds).size!==allIds.length)return null;
 return {
  mealRecipeId:recipeId,mainBlockKey:main.key,auxiliaryBlockKey:sauce.key,
  sourceDeclaredYield:sauce.declaredYield,sourceDeclaredUse:sauce.usedInMeal,
  referenceIngredientId:ref?.id??null,
  referenceIngredientPosition:refPos,
  referenceIngredientText:ref?.name??null,
  batchYield:null,usedAmount:null,leftover:null,
  readiness:"pending_measurement",shoppingStatus:"blocked",
  nutritionStatus:"blocked",duplicatePurchaseRisk:ref!==null
 };
}

function valid(quantity:AuxiliaryQuantity):boolean{
 return typeof quantity.amount==="number"&&
  Number.isFinite(quantity.amount)&&
  quantity.amount>0&&quantity.amount<=1000000&&
  ["g","ml","unidade","porcao"].includes(quantity.unit)&&
  (quantity.unit!=="unidade"||Number.isInteger(quantity.amount));
}

/** Simulação matemática *somente com dados explicitamente fornecidos*.
 * Não converte unidades nem infere validação, segurança de sobras ou compras.
 * A diferença indica quantidade física hipotética, nunca sobra reaproveitável.
 */
export function simulateAuxiliaryConsumption(
 link:AuxiliaryConsumptionLink,
 scenario:{batchYield:AuxiliaryQuantity|null;usedAmount:AuxiliaryQuantity|null}
):AuxiliarySimulation{
 const base={leftover:null,hypotheticalOnly:true,shoppingStatus:"blocked",nutritionStatus:"blocked"} as const;
 if(link.readiness!=="pending_measurement"||
  link.shoppingStatus!=="blocked"||link.nutritionStatus!=="blocked"){
  return {...base,status:"invalid_measurement"};
 }
 if(scenario.batchYield!==null&&!valid(scenario.batchYield))return {...base,status:"invalid_measurement"};
 if(scenario.usedAmount!==null&&!valid(scenario.usedAmount))return {...base,status:"invalid_measurement"};
 if(scenario.batchYield===null)return {...base,status:"missing_yield"};
 if(scenario.usedAmount===null)return {...base,status:"missing_use"};
 if(scenario.batchYield.unit!==scenario.usedAmount.unit)return {...base,status:"unit_mismatch"};
 if(scenario.usedAmount.amount>scenario.batchYield.amount)return {...base,status:"used_exceeds_yield"};
 const amount=Math.round((scenario.batchYield.amount-scenario.usedAmount.amount)*1000000)/1000000;
 return {...base,status:"simulated",
  leftover:{amount,unit:scenario.batchYield.unit}};
}
