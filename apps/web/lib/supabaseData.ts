import { supabase } from "./supabaseClient";
import type { Database } from "@gather/lib";

type Church = Database["public"]["Tables"]["churches"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];

/** Profile row guaranteed to belong to a church (matches getCurrentContext return shape). */
export type ProfileWithChurch = Profile & { church_id: string };

type ProfilesById = Record<string, Profile>;

type CurrentContext = {
  userId: string;
  profile: ProfileWithChurch;
  church: Church;
  serviceTimes: ServiceTime[];
};

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase client unavailable. Check env vars.");
  }
  return supabase;
}

let contextInFlight: Promise<CurrentContext | null> | null = null;
let contextCache: { at: number; value: CurrentContext | null } | null = null;
const CONTEXT_TTL_MS = 5_000;

/**
 * Who's signed in, their profile, church and service times. Pages and buttons
 * call this a lot, so concurrent calls share one request and a result is
 * reused for a few seconds. Data is still protected by RLS on every query.
 */
export function getCurrentContext(): Promise<CurrentContext | null> {
  if (contextCache && Date.now() - contextCache.at < CONTEXT_TTL_MS) return Promise.resolve(contextCache.value);
  if (contextInFlight) return contextInFlight;
  contextInFlight = loadCurrentContext()
    .then((value) => {
      contextCache = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      contextInFlight = null;
    });
  return contextInFlight;
}

/** Call after changing the church or its service times so the next read is fresh. */
export function invalidateCurrentContext() {
  contextCache = null;
}

async function loadCurrentContext(): Promise<CurrentContext | null> {
  const client = requireSupabase();
  // The session is read locally; the middleware has already verified it for
  // this page, and every query below is checked by RLS on the server.
  const { data: sessionData, error: authError } = await client.auth.getSession();
  if (authError) throw authError;
  const authUser = sessionData.session?.user;
  if (!authUser) return null;
  const authData = { user: authUser };

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  if (!profile.church_id) {
    return null;
  }

  const churchId = profile.church_id;

  const [{ data: church, error: churchError }, { data: serviceTimes, error: serviceError }] = await Promise.all([
    client.from("churches").select("*").eq("id", churchId).single(),
    client.from("service_times").select("*").eq("church_id", churchId).order("day_of_week", { ascending: true }),
  ]);

  if (churchError || !church) {
    return null;
  }

  if (serviceError) throw serviceError;

  const profileWithChurch: ProfileWithChurch = { ...profile, church_id: churchId };

  return {
    userId: authData.user.id,
    profile: profileWithChurch,
    church,
    serviceTimes: serviceTimes ?? []
  };
}

export async function listProfilesByChurch(churchId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function indexProfilesById(profiles: Profile[]): ProfilesById {
  return profiles.reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {} as ProfilesById);
}
