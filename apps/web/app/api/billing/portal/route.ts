import { NextResponse } from "next/server";
import { getRequestUser } from "../../../../lib/apiAuth";
import { stripeApi } from "../../../../lib/stripeServer";

export const dynamic = "force-dynamic";

/** Opens Stripe's customer portal (cards, invoices, plan changes, cancel) for the admin's church. */
export async function POST(request: Request) {
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { data: me } = await caller.supabase.from("profiles").select("church_id, role").eq("id", caller.user.id).maybeSingle();
  const profile = me as { church_id: string | null; role: string } | null;
  if (!profile?.church_id || profile.role !== "ADMIN") return NextResponse.json({ error: "Only church admins can manage billing." }, { status: 403 });

  const { data } = await caller.supabase.from("churches").select("stripe_customer_id").eq("id", profile.church_id).maybeSingle();
  const customer = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (!customer) return NextResponse.json({ error: "Choose a plan first." }, { status: 400 });

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://gatherministry.online";
  const form = new URLSearchParams({ customer, return_url: `${origin}/account` });
  const { ok, data: session } = await stripeApi<{ url?: string }>("billing_portal/sessions", form);
  if (!ok || !session.url) return NextResponse.json({ error: "Billing isn't available right now." }, { status: 502 });
  return NextResponse.json({ url: session.url });
}
