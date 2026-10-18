import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { billingFromSubscription, stripeApi, verifyStripeSignature } from "../../../../lib/stripeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe → Gather. Keeps `churches.plan` in step with the subscription.
 * Events to enable in Stripe: checkout.session.completed,
 * customer.subscription.created / updated / deleted.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });

  const body = await request.text();
  if (!verifyStripeSignature(body, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  const event = JSON.parse(body) as { type: string; data: { object: any } };
  const db = createSupabaseAdminClient() as any;
  const obj = event.data.object;

  const apply = async (sub: any, churchId: string | null) => {
    const billing = billingFromSubscription(sub);
    let query = db.from("churches").update(billing);
    if (churchId) query = query.eq("id", churchId);
    else if (billing.stripe_subscription_id) query = query.eq("stripe_subscription_id", billing.stripe_subscription_id);
    else return;
    const { error } = await query;
    if (error) console.error("[stripe/webhook] church update failed", error.message);
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const churchId = obj?.metadata?.church_id ?? null;
      // No church yet (bought from /pricing before signing up): /api/billing/link claims it after onboarding.
      if (!churchId || !obj.subscription) break;
      const { ok, data: sub } = await stripeApi(`subscriptions/${obj.subscription}`);
      if (ok) await apply(sub, churchId);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await apply(obj, obj?.metadata?.church_id ?? null);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
