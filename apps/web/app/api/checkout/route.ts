import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["parish", "congregation", "network"]),
  cycle: z.enum(["monthly", "annual"]),
});

/**
 * Price IDs live in env rather than code so the same build works against test
 * and live Stripe keys. Create the products in Stripe, then set these.
 */
const PRICE_ENV: Record<string, string> = {
  "parish:monthly": "STRIPE_PRICE_PARISH_MONTHLY",
  "parish:annual": "STRIPE_PRICE_PARISH_ANNUAL",
  "congregation:monthly": "STRIPE_PRICE_CONGREGATION_MONTHLY",
  "congregation:annual": "STRIPE_PRICE_CONGREGATION_ANNUAL",
  "network:monthly": "STRIPE_PRICE_NETWORK_MONTHLY",
  "network:annual": "STRIPE_PRICE_NETWORK_ANNUAL",
};

const TRIAL_DAYS = 30;

function originOf(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host");
  if (host) return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  return "https://gatherministry.online";
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Please schedule a demo and we'll get you set up." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const { plan, cycle } = parsed.data;
  const envKey = PRICE_ENV[`${plan}:${cycle}`];
  const priceId = envKey ? process.env[envKey] : undefined;

  if (!priceId) {
    console.error(`[checkout] missing price id env var: ${envKey}`);
    return NextResponse.json(
      { error: "That plan isn't available for purchase yet. Please schedule a demo." },
      { status: 503 }
    );
  }

  const origin = originOf(request);

  // Stripe's API is form-encoded. Calling it directly keeps the Stripe SDK out
  // of the bundle — this is the only endpoint we need.
  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("subscription_data[trial_period_days]", String(TRIAL_DAYS));
  form.set("success_url", `${origin}/onboarding/create-church?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/pricing?checkout=cancelled`);
  form.set("allow_promotion_codes", "true");
  form.set("billing_address_collection", "auto");
  form.set("client_reference_id", `${plan}:${cycle}`);
  form.set("metadata[plan]", plan);
  form.set("metadata[cycle]", cycle);

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const data = (await res.json()) as { url?: string; error?: { message?: string } };

    if (!res.ok || !data.url) {
      console.error("[checkout] stripe error", data.error?.message ?? res.status);
      return NextResponse.json(
        { error: "We couldn't start checkout. Please try again or schedule a demo." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    console.error("[checkout] request failed", err);
    return NextResponse.json(
      { error: "We couldn't reach the payment service. Please try again." },
      { status: 502 }
    );
  }
}
