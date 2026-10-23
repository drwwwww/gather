"use client";

import { useEffect } from "react";
import { captureAttribution } from "../../lib/attribution";

/**
 * First-party sign-up attribution from `?ref=` / `utm_*` links. Page views come
 * from Vercel Web Analytics (`<Analytics />` in the root layout).
 */
export default function SiteAnalytics() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
