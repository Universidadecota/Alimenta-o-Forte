export function parsePilotIngredientDisplay(source: string | null | undefined): string[] | null;
export function parsePilotIngredientGroups(source: string | null | undefined): Array<{
  title: string | null;
  text: string;
  items: string[] | null;
}> | null;
