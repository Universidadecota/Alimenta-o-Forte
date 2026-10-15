/**
 * Costa&Costa: medidas culinárias sem converter colheres em gramas.
 * Colher de chá/sopa, pitada e lata são medidas de referência; o volume real
 * pode variar de receita para receita e não deve ser inferido.
 */
export const ingredientUnits = [
  ["g", "grama (g)"], ["kg", "quilograma (kg)"],
  ["ml", "mililitro (ml)"], ["l", "litro (l)"],
  ["un", "unidade"], ["cm", "centímetro (cm)"],
  ["lata", "lata"], ["colher_cha", "colher de chá"],
  ["colher_sopa", "colher de sopa"], ["fatia", "fatia"],
  ["pitada", "pitada"],
] as const;

export type MeasureMode = "measured" | "taste" | "unspecified";
export type IngredientMeasure = {
  name: string;
  quantity: number | null;
  unit: string;
  measureMode?: MeasureMode;
  optional?: boolean;
};

const words: Record<string, [string, string]> = {
  un: ["un", "un"], g: ["g", "g"], kg: ["kg", "kg"],
  ml: ["ml", "ml"], l: ["l", "l"], cm: ["cm", "cm"],
  lata: ["lata", "latas"], colher_cha: ["colher de chá", "colheres de chá"],
  colher_sopa: ["colher de sopa", "colheres de sopa"],
  fatia: ["fatia", "fatias"], pitada: ["pitada", "pitadas"],
};

export function formatUnit(unit: string, quantity = 1): string {
  const names = words[unit];
  return names ? names[quantity === 1 ? 0 : 1] : unit;
}
export function formatIngredientAmount(quantity: number | null, unit: string): string {
  if (quantity === null || !Number.isFinite(quantity)) return "quantidade não informada";
  const rounded = Math.round(quantity * 1000) / 1000;
  return rounded.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) +
    " " + formatUnit(unit, rounded);
}
export function formatRecipeIngredient(
  ingredient: IngredientMeasure, multiplier = 1,
): string {
  const mode = ingredient.measureMode ?? "measured";
  const content = mode === "taste" ? "a gosto"
    : mode === "unspecified" || ingredient.quantity == null
      ? "quantidade não informada"
      : formatIngredientAmount(ingredient.quantity * multiplier, ingredient.unit);
  return ingredient.optional ? content + " · opcional" : content;
}
