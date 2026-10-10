import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase = url && anon && !anon.startsWith("SUBSTITUA_") ? createClient(url, anon, {
 auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
}) : null;
