import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@gather/lib";
import { getSupabaseAnonKey, getSupabaseUrl } from "./client";

/**
 * Refreshes the Supabase session from cookies and returns a NextResponse that may
 * carry updated auth cookies. Call from root middleware on matched routes.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: { id: string } | null;
}> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // getClaims refreshes an expired session like getUser does, but verifies the
  // token against the cached signing keys instead of calling the Auth server
  // on every page change.
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;

  return { response: supabaseResponse, user: typeof sub === "string" ? { id: sub } : null };
}
