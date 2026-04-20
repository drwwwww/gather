import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@gather/lib";
import { getSupabaseAnonKey, getSupabaseUrl } from "./client";

/** Server Components, Route Handlers, Server Actions. */
export function createServerSupabaseClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_* fallbacks).");
  }

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components that cannot set cookies (e.g. static render)
        }
      },
    },
  });
}
