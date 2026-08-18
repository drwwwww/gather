import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Small device-local persistence for "have I already shown this to this user"
 * state — one-time welcome cards and the "what's new since you left" digest
 * marker. Scoped per-user so a shared/reset device doesn't leak state between
 * accounts. Not synced across devices; that's an acceptable tradeoff for
 * one-time onboarding nudges.
 */

const ns = (key: string, userId: string) => `gather:${userId}:${key}`;

export async function hasSeenFlag(key: string, userId: string): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(ns(key, userId));
    return v === "1";
  } catch {
    return false;
  }
}

export async function setSeenFlag(key: string, userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ns(key, userId), "1");
  } catch {
    // best-effort — worst case a one-time card shows again
  }
}

export async function getLastSeenAt(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ns("lastSeenUpdatesAt", userId));
  } catch {
    return null;
  }
}

export async function setLastSeenAt(userId: string, iso: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ns("lastSeenUpdatesAt", userId), iso);
  } catch {
    // best-effort
  }
}
