import crypto from "node:crypto";
import type { ChurchPlan } from "@gather/lib";

/**
 * Price IDs live in env so one build works against test and live keys. The
 * smallest plan is called Community (internal key "parish"); its variables are
 * STRIPE_PRICE_COMMUNITY_*, with the older STRIPE_PRICE_PARISH_* still accepted.
 */
export const PRICE_ENV: Record<string, string> = {
  "parish:monthly": "STRIPE_PRICE_COMMUNITY_MONTHLY",
  "parish:annual": "STRIPE_PRICE_COMMUNITY_ANNUAL",
  "congregation:monthly": "STRIPE_PRICE_CONGREGATION_MONTHLY",
  "congregation:annual": "STRIPE_PRICE_CONGREGATION_ANNUAL",
  "network:monthly": "STRIPE_PRICE_NETWORK_MONTHLY",
  "network:annual": "STRIPE_PRICE_NETWORK_ANNUAL",
};

const LEGACY_ENV: Record<string, string> = {
  "parish:monthly": "STRIPE_PRICE_PARISH_MONTHLY",
  "parish:annual": "STRIPE_PRICE_PARISH_ANNUAL",
};

/** The Stripe price ID for a plan + cycle, or undefined when it isn't configured. */
export function priceIdFor(plan: string, cycle: string): string | undefined {
  const key = `${plan}:${cycle}`;
  const env = PRICE_ENV[key];
  const legacy = LEGACY_ENV[key];
  return (env && process.env[env]) || (legacy && process.env[legacy]) || undefined;
}

export function planForPrice(priceId: string | null | undefined): ChurchPlan | null {
  if (!priceId) return null;
  for (const key of Object.keys(PRICE_ENV)) {
    const [plan, cycle] = key.split(":");
    if (priceIdFor(plan, cycle) === priceId) return plan as ChurchPlan;
  }
  return null;
}

/** Calls Stripe's form-encoded REST API directly (no SDK in the bundle). */
export async function stripeApi<T = any>(
  path: string,
  params?: URLSearchParams,
  method: "GET" | "POST" = params ? "POST" : "GET"
): Promise<{ ok: boolean; data: T & { error?: { message?: string } } }> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { ok: false, data: { error: { message: "Stripe is not configured." } } as any };
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "POST" ? params?.toString() : undefined,
  });
  return { ok: res.ok, data: (await res.json()) as any };
}

/**
 * Verifies a `Stripe-Signature` header: HMAC-SHA256 of `${t}.${body}` with the
 * endpoint secret, constant-time compared, within a 5-minute tolerance.
 */
export function verifyStripeSignature(body: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  ) as Record<string, string>;
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  const signatures = header
    .split(",")
    .filter((kv) => kv.trim().startsWith("v1="))
    .map((kv) => kv.trim().slice(3));
  return signatures.some((sig) => {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

/** Maps a Stripe subscription onto the church row's billing columns. */
export function billingFromSubscription(sub: any) {
  const priceId = sub?.items?.data?.[0]?.price?.id ?? null;
  const status: string = sub?.status ?? "incomplete";
  const live = status === "active" || status === "trialing" || status === "past_due";
  const periodEnd = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end ?? null;
  return {
    plan: (live ? planForPrice(priceId) : null) ?? "parish",
    plan_status: status,
    stripe_subscription_id: sub?.id ?? null,
    stripe_customer_id: typeof sub?.customer === "string" ? sub.customer : sub?.customer?.id ?? null,
    plan_renews_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  };
}
