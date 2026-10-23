/**
 * Where a church came from. A visit with `?ref=` (an outreach rep's code, e.g.
 * /?ref=jane) or `utm_*` params is remembered in this browser, and sign-up saves
 * it to the new account's user_metadata.signup_source — so you can count trials
 * and paid churches per rep or campaign (query in docs/launch/church-outreach-playbook.md).
 * A visit without those params never overwrites an earlier one.
 */
const KEY = "gather:attribution";
const PARAMS = ["ref", "utm_source", "utm_medium", "utm_campaign"] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number] | "referrer" | "landing" | "at", string>>;

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const found: Attribution = {};
    for (const p of PARAMS) {
      const v = url.searchParams.get(p);
      if (v) found[p] = v.slice(0, 80);
    }
    const external = document.referrer && !document.referrer.startsWith(window.location.origin);
    if (Object.keys(found).length === 0) {
      // First visit from another site (Google, Facebook…) still counts if nothing better is known.
      if (!external || window.localStorage.getItem(KEY)) return;
    }
    if (external) found.referrer = new URL(document.referrer).hostname;
    found.landing = url.pathname;
    found.at = new Date().toISOString();
    window.localStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // Private mode or blocked storage: attribution is a nice-to-have.
  }
}

export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}
