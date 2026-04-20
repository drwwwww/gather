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
};

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

    const loadProfile = async (userId: string) => {
      const { data } = await client
        .from("profiles")
        .select("id, church_id, full_name, email, role, disabled")
        .eq("id", userId)
        .maybeSingle();
      return data as Profile | null;
    };

    const init = async () => {
      const { data: authUser } = await client.auth.getUser();
      const u = authUser?.user ?? null;
      const { data: sessionData } = await client.auth.getSession();
      setUser(u);
      setSession(sessionData.session ?? null);
      if (u) {
        const p = await loadProfile(u.id);
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
          const p = await loadProfile(u.id);
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
      .select("id, church_id, full_name, email, role, disabled")
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
