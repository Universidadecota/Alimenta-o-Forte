import { supabase } from "./supabase";

export const foodCategories = [
  { id: "verduras", label: "Folhas e verduras" },
  { id: "legumes", label: "Legumes" },
  { id: "frutas", label: "Frutas" },
  { id: "cereais_tuberculos", label: "Cereais e tubérculos" },
  { id: "leguminosas", label: "Leguminosas" },
  { id: "ovos", label: "Ovos" },
  { id: "carnes_aves", label: "Carnes e aves" },
  { id: "peixes", label: "Peixes" },
  { id: "laticinios", label: "Laticínios" },
  { id: "oleaginosas", label: "Oleaginosas" },
  { id: "oleos_gorduras", label: "Óleos e gorduras" },
  { id: "bebidas", label: "Bebidas" },
  { id: "outros", label: "Outros" },
] as const;
export type FoodCategory = (typeof foodCategories)[number]["id"];
export type FoodItem = {
  id: string;
  name: string;
  category: FoodCategory;
  description: string | null;
  reference_portion_quantity: number | null;
  reference_portion_unit: string | null;
  nutrition_per_100g: Record<string, unknown> | null;
  nutrition_source: string | null;
  nutrition_reviewed_at: string | null;
  editorial_status: "preliminary" | "verified";
  published: boolean;
};
export const FOOD_PAGE_SIZE = 18;
export const foodCategoryLabel = (category: string) =>
  foodCategories.find(item => item.id === category)?.label ?? "Outros";

/**
 * Pesquisa real e paginada no banco; nao reproduzir catalogo ficticio em memoria.
 * Os dados do banco permanecem somente de leitura no frontend.
 */
export async function fetchFoodItems(
  category: FoodCategory | "all",
  search: string,
  page: number,
  signal?: AbortSignal,
): Promise<{ items: FoodItem[]; total: number }> {
  if (!supabase) throw new Error("Biblioteca indisponível: configure a conexão com o Supabase.");
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const normalizedSearch = search.trim().slice(0, 80).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const {data:adminFlag,error:adminError}=await supabase.rpc("cc_is_admin");
  // Falha na verificação nunca abre itens preliminares a usuários comuns.
  const isAdmin = !adminError && adminFlag === true;
  let query = supabase
    .from("food_items")
    .select("id,name,category,description,reference_portion_quantity,reference_portion_unit,nutrition_per_100g,nutrition_source,nutrition_reviewed_at,editorial_status,published", { count: "exact" });
  if (!isAdmin) query = query.eq("published", true);
  if (category !== "all") {
    if (!foodCategories.some(item => item.id === category)) throw new Error("Categoria de alimento inválida.");
    query = query.eq("category", category);
  }
  if (normalizedSearch) {
    // \\ protege o filtro de caracteres com significado no LIKE.
    const escaped = normalizedSearch.replace(/[\\%_]/g, character => "\\" + character);
    query = query.ilike("search_name", "%" + escaped + "%");
  }
  query = query.order("name", { ascending: true })
    .range((safePage - 1) * FOOD_PAGE_SIZE, safePage * FOOD_PAGE_SIZE - 1);
  if (signal) query = query.abortSignal(signal);
  const { data, count, error } = await query;
  if (error) throw error;
  return { items: (data ?? []) as FoodItem[], total: count ?? 0 };
}
