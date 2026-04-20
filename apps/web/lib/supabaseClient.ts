"use client";

import { createBrowserSupabaseClient } from "./supabase/client";

/**
 * Cookie-backed Supabase client for Client Components (via @supabase/ssr).
 * Keeps the same `import { supabase } from "../lib/supabaseClient"` shape site-wide.
 * Cast matches previous createClient typing where some generated DB narrowings were loosened.
 */
export const supabase = createBrowserSupabaseClient() as any;
