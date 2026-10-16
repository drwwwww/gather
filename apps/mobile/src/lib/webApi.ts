import { supabase } from "../supabase";

/** The Gather web app, which hosts the legal pages and the server-only API
    routes (account deletion, reports) that need the service role. */
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || "https://gatherministry.online").replace(/\/$/, "");

export const LEGAL = {
  privacy: `${WEB_URL}/privacy`,
  terms: `${WEB_URL}/terms`,
  deleteAccount: `${WEB_URL}/delete-account`,
  supportEmail: "support@gatherministry.online",
};

/** POSTs JSON to a web API route as the signed-in user. */
export async function postWebApi<T = { ok?: boolean; error?: string }>(
  path: string,
  body: unknown
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const { data: sessionData } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const token = sessionData.session?.access_token;
  try {
    const res = await fetch(`${WEB_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Couldn't reach Gather. Check your connection and try again." } as T & { error?: string } };
  }
}
