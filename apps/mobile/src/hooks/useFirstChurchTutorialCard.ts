import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { hasSeenFlag, setSeenFlag } from "../lib/localFlags";

/**
 * Fires exactly once per user/device, the first time they land in the main app
 * with a church attached — i.e. right after signing up and joining/creating
 * their first church. RootNavigator only mounts the authenticated app once
 * `profile.church_id` is set, so this hook's first mount *is* that moment.
 */
export function useFirstChurchTutorialCard() {
  const { user, profile } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id || !profile?.church_id) return;
    let cancelled = false;
    (async () => {
      const alreadyShown = await hasSeenFlag("tutorialOffered", user.id);
      if (!cancelled && !alreadyShown) {
        setShow(true);
        await setSeenFlag("tutorialOffered", user.id);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, profile?.church_id]);

  return { show, dismiss: () => setShow(false) };
}
