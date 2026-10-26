import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import type { Database } from "@gather/lib";

const { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } = Constants.expoConfig?.extra || {};

// The session must be stored somewhere that survives the app closing. Without an
// explicit `storage`, supabase-js falls back to `localStorage`, which only exists in
// browsers — on a phone the session lived in memory and every cold start meant
// signing in again. AsyncStorage persists it on the device (and is localStorage on web).
export const supabase =
  EXPO_PUBLIC_SUPABASE_URL && EXPO_PUBLIC_SUPABASE_ANON_KEY
    ? createClient<Database>(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// Supabase's React Native guidance: only refresh the token while the app is in the
// foreground, so a backgrounded app doesn't try (and fail) to refresh and sign out.
if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state: string) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
