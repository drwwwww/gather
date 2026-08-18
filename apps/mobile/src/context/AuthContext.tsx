import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";

type Profile = {
  id: string;
  church_id: string | null;
  full_name: string | null;
  email: string | null;
  role: string;
  disabled: boolean;
  avatar_url: string | null;
  favorite_verse: string | null;
  ministry_interests: string[] | null;
  profile_completed_at: string | null;
};

const PROFILE_COLUMNS = "id, church_id, full_name, email, role, disabled, avatar_url, favorite_verse, ministry_interests, profile_completed_at";

type AuthState = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  showServe: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  loading: true,
  user: null,
  session: null,
  profile: null,
  showServe: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    // On a user's very first sign-in there's no `profiles` row at all yet — create
    // a minimal one (church_id: null) immediately, before they see any screen.
    // This is what lets the profile-builder screens (Add a photo / Make it yours)
    // have something to write to, ahead of church selection. See
    // design-handoff/mobile/member-signup-profile-builder-idea.md.
    const loadOrCreateProfile = async (authUser: User) => {
      const { data } = await client
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", authUser.id)
        .maybeSingle();
      if (data) return data as Profile;

      const { data: created, error } = await client
        .from("profiles")
        .insert({
          id: authUser.id,
          email: authUser.email ?? null,
          full_name: (authUser.user_metadata?.full_name as string | undefined) ?? null,
          role: "MEMBER",
          disabled: false,
        } as any)
        .select(PROFILE_COLUMNS)
        .single();
      if (error) return null;
      return created as Profile;
    };

    const init = async () => {
      const { data: authUser } = await client.auth.getUser();
      const u = authUser?.user ?? null;
      const { data: sessionData } = await client.auth.getSession();
      setUser(u);
      setSession(sessionData.session ?? null);
      if (u) {
        const p = await loadOrCreateProfile(u);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        const u = s?.user ?? null;
        setUser(u);
        if (u) {
          const p = await loadOrCreateProfile(u);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const showServe =
    !profile?.disabled && (profile?.role === "SERVICE" || profile?.role === "ADMIN");

  const refreshProfile = async () => {
    if (!supabase) return;
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", uid)
      .maybeSingle();
    setProfile(data as Profile | null);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        session,
        profile,
        showServe,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
