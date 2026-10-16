import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import { hasSeenFlag, setSeenFlag } from "../lib/localFlags";

/** Accounts older than this never get the offer — they've used Gather before. */
const NEW_ACCOUNT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Offers the tour once per *account*, on its first arrival in the main app
 * with a church attached. The flag lives in the user's auth metadata
 * (`tour_offered_at`), not just on the device — a device-only flag re-offered
 * the tour on every new phone, reinstall, and web preview. The local flag is
 * kept as a fast path so it can't flash while metadata loads.
 */
export function useFirstChurchTutorialCard() {
  const { user, profile } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id || !profile?.church_id) return;
    if (user.user_metadata?.tour_offered_at) return;
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > NEW_ACCOUNT_WINDOW_MS) return;

    let cancelled = false;
    (async () => {
      if (await hasSeenFlag("tutorialOffered", user.id)) return;
      if (cancelled) return;
      setShow(true);
      await setSeenFlag("tutorialOffered", user.id);
      await supabase?.auth.updateUser({ data: { tour_offered_at: new Date().toISOString() } }).catch(() => {});
    })();
    return () => { cancelled = true; };
  }, [user?.id, user?.created_at, user?.user_metadata?.tour_offered_at, profile?.church_id]);

  return { show, dismiss: () => setShow(false) };
}
