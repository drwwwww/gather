export const AUTH_TRANSITION_EVENT = "gather:auth-transition";

export type AuthTransitionDetail = {
  /** Called once the overlay fully covers the screen — safe to navigate. */
  onCovered: () => void;
};

/**
 * Raises the Dawn overlay over the whole app and resolves when it has finished
 * its entrance and is covering the screen — at which point the caller can
 * navigate without the route swap being visible.
 *
 * The overlay lives in the root layout so it outlives the auth page; it plays
 * its own exit once the destination has had a moment to render.
 */
export function coverForAuthTransition(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  // Reduced motion: no overlay, navigate immediately.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    // Failsafe: never strand the user on the auth page if the overlay
    // isn't mounted for any reason.
    const failsafe = window.setTimeout(done, 2500);

    window.dispatchEvent(
      new CustomEvent<AuthTransitionDetail>(AUTH_TRANSITION_EVENT, {
        detail: {
          onCovered: () => {
            window.clearTimeout(failsafe);
            done();
          },
        },
      })
    );
  });
}
