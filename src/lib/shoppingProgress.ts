import { supabase } from "./supabase";
import type { ShoppingItem } from "./shopping";

// Chave estavel, independente de maiusculas, acentos ou espacos duplicados.
const normalizedName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    .toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");

const normalizedUnit = (unit: string) => unit.trim().toLowerCase();
// A marcação só corresponde à quantidade efetivamente comprada.
// Um novo total na semana não herda indevidamente o estado anterior.
export const purchaseKey = (item: Pick<ShoppingItem, "name" | "unit" | "quantity">): string =>
  normalizedName(item.name) + "|" + normalizedUnit(item.unit) + "|" + Number(item.quantity.toFixed(6));


// Detecta itens cujo total ou identidade mudou após editar o cardápio.
// Não considera itens inalterados; nunca inventa ou escala ingredientes.
export function changedPurchasedItems(before: ShoppingItem[], after: ShoppingItem[]): ShoppingItem[] {
  const next = new Map(after.map(item => [normalizedName(item.name) + "|" + normalizedUnit(item.unit), item.quantity]));
  return before.filter(item => {
    const key = normalizedName(item.name) + "|" + normalizedUnit(item.unit);
    return next.get(key) !== item.quantity;
  });
}

async function findWeeklyListId(userId: string, weekStart: string): Promise<string | null> {
  if (!supabase) throw new Error("Supabase indisponivel");
  const { data, error } = await supabase.from("shopping_lists")
    .select("id").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// Somente os itens efetivamente marcados ficam persistidos.
// O cardapio permanece como fonte de verdade das quantidades.
export async function loadPurchasedKeys(userId: string, weekStart: string, currentItems?: ShoppingItem[]): Promise<string[]> {
  if (!supabase) return [];
  const listId = await findWeeklyListId(userId, weekStart);
  if (!listId) return [];
  const keys: string[] = [];
  const valid = currentItems ? new Set(currentItems.map(purchaseKey)) : null;
  const stale: Array<{name:string;unit:string}> = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("shopping_list_items")
      .select("name,unit,quantity").eq("user_id", userId).eq("shopping_list_id", listId)
      .eq("completed", true).order("name", {ascending:true})
      .order("unit", {ascending:true}).range(offset, offset + 499);
    if (error) throw error;
    for (const row of data ?? []) {
      const key = purchaseKey(row);
      if (valid && !valid.has(key)) stale.push({name:row.name,unit:row.unit});
      else keys.push(key);
    }
    if ((data ?? []).length < 500) break;
  }
  // A reconciliação é reexecutada ao abrir Compras: se a conexão falhou
  // durante a mudança do cardápio, a marcação antiga não reaparece.
  for (const row of stale) {
    const {error} = await supabase.from("shopping_list_items").delete()
      .eq("user_id", userId).eq("shopping_list_id", listId)
      .eq("name", row.name).eq("unit", row.unit);
    if (error) throw error;
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
