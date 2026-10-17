import { supabase } from "./supabase";
import type { ShoppingItem } from "./shopping";

// Chave estavel, independente de maiusculas, acentos ou espacos duplicados.
const normalizedName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    .toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");

const normalizedUnit = (unit: string) => unit.trim().toLowerCase();
export const purchaseKey = (item: Pick<ShoppingItem, "name" | "unit">): string =>
  normalizedName(item.name) + "|" + normalizedUnit(item.unit);

async function findWeeklyListId(userId: string, weekStart: string): Promise<string | null> {
  if (!supabase) throw new Error("Supabase indisponivel");
  const { data, error } = await supabase.from("shopping_lists")
    .select("id").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// Somente os itens efetivamente marcados ficam persistidos.
// O cardapio permanece como fonte de verdade das quantidades.
export async function loadPurchasedKeys(userId: string, weekStart: string): Promise<string[]> {
  if (!supabase) return [];
  const listId = await findWeeklyListId(userId, weekStart);
  if (!listId) return [];
  const keys: string[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("shopping_list_items")
      .select("name,unit").eq("user_id", userId).eq("shopping_list_id", listId)
      .eq("completed", true).range(offset, offset + 499);
    if (error) throw error;
    keys.push(...(data ?? []).map(purchaseKey));
    if ((data ?? []).length < 500) break;
  }
  return keys;
}

export async function savePurchasedItem(
  userId: string, weekStart: string, item: ShoppingItem, completed: boolean,
): Promise<void> {
  if (!supabase) throw new Error("Supabase indisponivel");
  const name = normalizedName(item.name);
  const unit = normalizedUnit(item.unit);
  if (!name || !unit || !Number.isFinite(item.quantity) || item.quantity <= 0)
    throw new Error("Ingrediente invalido.");

  if (!completed) {
    const listId = await findWeeklyListId(userId, weekStart);
    if (!listId) return;
    const { error } = await supabase.from("shopping_list_items").delete()
      .eq("user_id", userId).eq("shopping_list_id", listId)
      .eq("name", name).eq("unit", unit);
    if (error) throw error;
    return;
  }

  const { data: list, error: listError } = await supabase.from("shopping_lists")
    .upsert({ user_id: userId, week_start: weekStart }, { onConflict: "user_id,week_start" })
    .select("id").single();
  if (listError) throw listError;
  const { error } = await supabase.from("shopping_list_items").upsert({
    user_id: userId, shopping_list_id: list.id,
    name, unit, quantity: item.quantity, completed: true,
  }, { onConflict: "shopping_list_id,name,unit" });
  if (error) throw error;
}
