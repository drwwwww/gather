import { supabase } from "./supabaseClient";
import type { Database } from "@gather/lib";

type Church = Database["public"]["Tables"]["churches"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];

type ProfilesById = Record<string, Profile>;

type CurrentContext = {
  userId: string;
  profile: Profile;
  church: Church;
  serviceTimes: ServiceTime[];
};

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase client unavailable. Check env vars.");
  }
  return supabase;
}

export async function getCurrentContext(): Promise<CurrentContext | null> {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const { data: church, error: churchError } = await client
    .from("churches")
    .select("*")
    .eq("id", profile.church_id)
    .single();

  if (churchError || !church) {
    return null;
  }

  const { data: serviceTimes, error: serviceError } = await client
    .from("service_times")
    .select("*")
    .eq("church_id", profile.church_id)
    .order("day_of_week", { ascending: true });

  if (serviceError) throw serviceError;

  return {
    userId: authData.user.id,
    profile,
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
