"use client";

import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { captureAttribution } from "../../lib/attribution";

/**
 * Public-site measurement: Vercel Web Analytics (cookieless page views,
 * referrers, countries — no cookie banner needed) plus first-party sign-up
 * attribution from `?ref=` / `utm_*` links.
 */
export default function SiteAnalytics() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return <Analytics />;
}
