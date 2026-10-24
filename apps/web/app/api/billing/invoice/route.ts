import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "../../../../lib/apiAuth";
import { priceIdFor, stripeApi } from "../../../../lib/stripeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["parish", "congregation", "network"]),
  cycle: z.enum(["monthly", "annual"]),
});

const DAYS_UNTIL_DUE = 30;

/**
 * "Pay by invoice": many churches pay bills by ACH or check, not a card. This
 * starts the subscription on invoice terms — Stripe emails an invoice due in 30
 * days that can be paid online (card or US bank account, whichever methods are
 * enabled in the Stripe dashboard), by bank transfer, or by mailed check, which
 * is then marked paid in the dashboard. A church still in its trial is first
 * invoiced when the trial ends. The webhook (customer.subscription.created,
 * metadata.church_id) updates the church row like any other subscription.
 */
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't configured yet. Email support@gatherministry.online and we'll invoice you." }, { status: 503 });
  }
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  const { plan, cycle } = parsed.data;
  const priceId = priceIdFor(plan, cycle);
  if (!priceId) return NextResponse.json({ error: "That plan isn't available yet. Email support@gatherministry.online." }, { status: 503 });

  const { data: me } = await caller.supabase.from("profiles").select("church_id, role, email").eq("id", caller.user.id).maybeSingle();
  const profile = me as { church_id: string | null; role: string; email: string | null } | null;
  if (!profile?.church_id || profile.role !== "ADMIN") return NextResponse.json({ error: "Only church admins can manage billing." }, { status: 403 });

  const { data } = await caller.supabase
    .from("churches")
    .select("id, name, stripe_customer_id, stripe_subscription_id, trial_ends_at")
    .eq("id", profile.church_id)
    .maybeSingle();
  const church = data as { id: string; name: string; stripe_customer_id: string | null; stripe_subscription_id: string | null; trial_ends_at: string | null } | null;
  if (!church) return NextResponse.json({ error: "Church not found." }, { status: 404 });
  if (church.stripe_subscription_id) {
    return NextResponse.json({ error: "You already have a plan. Use Manage billing to change it." }, { status: 409 });
  }

  let customer = church.stripe_customer_id;
  if (!customer) {
    const form = new URLSearchParams({ name: church.name, "metadata[church_id]": church.id });
    if (profile.email) form.set("email", profile.email);
    const { ok, data: created } = await stripeApi<{ id?: string }>("customers", form);
    if (!ok || !created.id) return NextResponse.json({ error: "We couldn't set up invoicing. Please try again." }, { status: 502 });
    customer = created.id;
  }

  const form = new URLSearchParams();
  form.set("customer", customer);
  form.set("items[0][price]", priceId);
  form.set("collection_method", "send_invoice");
  form.set("days_until_due", String(DAYS_UNTIL_DUE));
  form.set("metadata[church_id]", church.id);
  form.set("metadata[plan]", plan);
  form.set("metadata[cycle]", cycle);
  form.set("metadata[pay_by]", "invoice");
  const trialEnd = church.trial_ends_at ? Math.floor(new Date(church.trial_ends_at).getTime() / 1000) : null;
  if (trialEnd && trialEnd > Math.floor(Date.now() / 1000) + 2 * 86_400) form.set("trial_end", String(trialEnd));

  const { ok, data: sub } = await stripeApi<{ id?: string; error?: { message?: string } }>("subscriptions", form);
  if (!ok || !sub.id) {
    console.error("[billing/invoice] stripe error", sub.error?.message);
    return NextResponse.json({ error: "We couldn't start invoicing. Please try again or email us." }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    message: trialEnd && trialEnd > Date.now() / 1000
      ? "Done. Your first invoice is emailed when your trial ends, due in 30 days."
      : "Done. Your invoice is on its way by email, due in 30 days.",
  });
}
