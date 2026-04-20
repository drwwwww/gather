import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@gather/lib";

export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

export function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
}

/** Browser / Client Component client — uses cookies (with @supabase/ssr) so middleware can see the session. */
export function createBrowserSupabaseClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;
  return createBrowserClient<Database>(url, anonKey);
}
