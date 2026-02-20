import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

export function createSupabaseClient(options?: { requireEnv?: boolean }): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const requireEnv = options?.requireEnv ?? false;

  if (!url || !anonKey) {
    if (requireEnv) {
      throw new Error("Supabase URL/Anon key missing in environment.");
    }
    return null;
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
