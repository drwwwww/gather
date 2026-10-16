import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase/client";

/**
 * Resolves the caller of an API route. The mobile app sends its access token
 * as `Authorization: Bearer …`; the web app is identified by its session
 * cookies. Returns a client that acts *as that user* (RLS applies), or null.
 */
export async function getRequestUser(
  req: Request
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;

  if (token) {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();
    if (!url || !anonKey) return null;
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { user: data.user, supabase };
  }

  const supabase = createServerSupabaseClient() as unknown as SupabaseClient;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}
