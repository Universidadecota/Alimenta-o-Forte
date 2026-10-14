import { supabase } from "./supabase";
import type { ShoppingItem } from "./shopping";

// A identidade do item e estavel mesmo quando a quantidade necessaria muda.
const normalizedName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    .toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
const normalizedUnit = (unit: string) => unit.trim().toLowerCase();
const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const purchaseKey = (item: Pick<ShoppingItem, "name" | "unit">): string =>
  normalizedName(item.name) + "|" + normalizedUnit(item.unit);

export type PurchaseStatus = "none" | "partial" | "complete";
export function purchaseBalance(requiredQuantity: number, boughtQuantity: number) {
  const needed = Math.max(0, round2(requiredQuantity));
  const bought = Math.max(0, round2(boughtQuantity));
  const remaining = Math.max(0, round2(needed - bought));
  const status: PurchaseStatus = bought <= 0 ? "none" : remaining > 0 ? "partial" : "complete";
  return { needed, bought, remaining, status };
}

async function findWeeklyListId(userId: string, weekStart: string): Promise<string | null> {
  if (!supabase) throw new Error("Supabase indisponível");
  const { data, error } = await supabase.from("shopping_lists")
    .select("id").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// shopping_list_items.quantity armazena a quantidade COMPRADA, nao a demanda.
// Os registros legados ja representam compras reais; nao devem ser descartados.
export async function loadPurchasedQuantities(userId: string, weekStart: string):
  Promise<Record<string, number>> {
  if (!supabase) return {};
  const listId = await findWeeklyListId(userId, weekStart);
  if (!listId) return {};
  const quantities: Record<string, number> = {};
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("shopping_list_items")
      .select("name,unit,quantity").eq("user_id", userId)
      .eq("shopping_list_id", listId).eq("completed", true)
      .order("id").range(offset, offset + 499);
    if (error) throw error;
    for (const item of data ?? []) {
      const n = Number(item.quantity);
      if (Number.isFinite(n) && n > 0) quantities[purchaseKey(item)] = round2(n);
    }
    if ((data ?? []).length < 500) break;
  }
  return quantities;
}

// A soma e atomica no PostgreSQL, evitando sobrescrever compras de outra aba.
export async function addPurchasedQuantity(weekStart: string, item: ShoppingItem, amount: number):
  Promise<number> {
  if (!supabase) throw new Error("Supabase indisponível");
  const name = normalizedName(item.name);
  const unit = normalizedUnit(item.unit);
  const added = round2(amount);
  if (!name || !unit || !Number.isFinite(added) || added <= 0 || added > 1000000)
    throw new Error("Informe uma quantidade válida maior que zero.");
  const { data, error } = await supabase.rpc("cc_add_shopping_purchase", {
    p_week_start: weekStart,
    p_name: name,
    p_unit: unit,
    p_quantity: added,
  });
  if (error) throw error;
  const total = Number(data);
  if (!Number.isFinite(total) || total <= 0)
    throw new Error("O Supabase não confirmou a quantidade comprada.");
  return round2(total);
}

// Correcao intencional: zera apenas o item do usuario, sem afetar a receita.
export async function clearPurchasedQuantity(
  userId: string, weekStart: string, item: ShoppingItem,
): Promise<void> {
  if (!supabase) throw new Error("Supabase indisponível");
  const listId = await findWeeklyListId(userId, weekStart);
  if (!listId) return;
  const { error } = await supabase.from("shopping_list_items").delete()
    .eq("user_id", userId).eq("shopping_list_id", listId)
    .eq("name", normalizedName(item.name)).eq("unit", normalizedUnit(item.unit));
  if (error) throw error;
}
