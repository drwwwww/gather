import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "../../../lib/apiAuth";
import { PRICE_ENV } from "../../../lib/stripeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["parish", "congregation", "network"]),
  cycle: z.enum(["monthly", "annual"]),
});

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

  // A signed-in admin is changing their church's plan: tie the subscription to
  // the church so the webhook can apply it, and come back to Account.
  type ChurchBillingRow = { id: string; stripe_customer_id: string | null; stripe_subscription_id: string | null };
  let church = null as ChurchBillingRow | null;
  let email: string | null = null;
  const caller = await getRequestUser(request).catch(() => null);
  if (caller) {
    const { data: me } = await caller.supabase.from("profiles").select("church_id, role, email").eq("id", caller.user.id).maybeSingle();
    const profile = me as { church_id: string | null; role: string; email: string | null } | null;
    if (profile?.church_id && profile.role === "ADMIN") {
      const { data } = await caller.supabase
        .from("churches")
        .select("id, stripe_customer_id, stripe_subscription_id")
        .eq("id", profile.church_id)
        .maybeSingle();
      church = data as ChurchBillingRow | null;
      email = profile.email;
    }
  }

  // Stripe's API is form-encoded. Calling it directly keeps the Stripe SDK out
  // of the bundle — this is the only endpoint we need.
  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  if (!church?.stripe_subscription_id) form.set("subscription_data[trial_period_days]", String(TRIAL_DAYS));
  if (church) {
    form.set("success_url", `${origin}/account?billing=success`);
    form.set("cancel_url", `${origin}/account?billing=cancelled`);
    form.set("metadata[church_id]", church.id);
    form.set("subscription_data[metadata][church_id]", church.id);
    if (church.stripe_customer_id) form.set("customer", church.stripe_customer_id);
    else if (email) form.set("customer_email", email);
  } else {
    form.set("success_url", `${origin}/onboarding/create-church?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/pricing?checkout=cancelled`);
  }
  form.set("allow_promotion_codes", "true");
  form.set("billing_address_collection", "auto");
  form.set("client_reference_id", church ? `church:${church.id}` : `${plan}:${cycle}`);
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
