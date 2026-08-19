"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AuthIntro from "./AuthIntro";
import { AUTH_TRANSITION_EVENT, type AuthTransitionDetail } from "../../lib/authTransition";

// Entrance choreography: bloom expands, mark lands, word rises. By this point
// the screen is fully covered and the route swap underneath is invisible.
const ENTER_MS = 1450;
// A beat after the destination route actually mounts, so it has painted
// before we uncover it.
const SETTLE_MS = 350;
// Reverse choreography plus the overlay lifting away.
const EXIT_MS = 1500;
// If navigation never lands, uncover anyway rather than trapping the user.
const NAV_FAILSAFE_MS = 6000;

type Phase = "idle" | "in" | "out";

/**
 * Mounted once in the root layout. Because the root layout does not remount
 * across route changes, the overlay persists through the navigation from the
 * auth page into the app — so sign-in reads as one continuous moment rather
 * than two pages swapping.
 */
export default function AuthTransition() {
  const [phase, setPhase] = useState<Phase>("idle");
  const pathname = usePathname();

  const timers = useRef<number[]>([]);
  const startPath = useRef<string | null>(null);
  const awaitingNav = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const beginExit = useCallback(() => {
    if (!awaitingNav.current) return;
    awaitingNav.current = false;
    clearTimers();
    timers.current.push(
      window.setTimeout(() => {
        setPhase("out");
        timers.current.push(window.setTimeout(() => setPhase("idle"), EXIT_MS));
      }, SETTLE_MS)
    );
  }, []);

  useEffect(() => {
    const onStart = (e: Event) => {
      const detail = (e as CustomEvent<AuthTransitionDetail>).detail;
      clearTimers();
      startPath.current = window.location.pathname;
      setPhase("in");

      timers.current.push(
        window.setTimeout(() => {
          // Covered — the caller can now navigate unseen.
          detail?.onCovered?.();
          awaitingNav.current = true;

          // Don't guess how long the destination takes; the pathname effect
          // below starts the exit the moment the new route mounts. This only
          // catches the case where navigation never happens at all.
          timers.current.push(window.setTimeout(beginExit, NAV_FAILSAFE_MS));
        }, ENTER_MS)
      );
    };

    window.addEventListener(AUTH_TRANSITION_EVENT, onStart);
    return () => {
      window.removeEventListener(AUTH_TRANSITION_EVENT, onStart);
      clearTimers();
    };
  }, [beginExit]);

  // The destination route has mounted — now it's safe to uncover.
  useEffect(() => {
    if (!awaitingNav.current) return;
    if (startPath.current === null || pathname === startPath.current) return;
    beginExit();
  }, [pathname, beginExit]);

  if (phase === "idle") return null;
  return <AuthIntro leaving={phase === "out"} />;
}
