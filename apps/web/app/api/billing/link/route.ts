import { NextResponse } from "next/server";
import { getRequestUser } from "../../../../lib/apiAuth";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { billingFromSubscription, stripeApi } from "../../../../lib/stripeServer";

export const dynamic = "force-dynamic";

/**
 * Someone paid on /pricing before they had a church. After onboarding creates
 * it, the new admin claims that checkout here. A subscription can be claimed once.
 */
export async function POST(request: Request) {
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { sessionId } = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return NextResponse.json({ error: "Missing checkout." }, { status: 400 });

  const { data: me } = await caller.supabase.from("profiles").select("church_id, role").eq("id", caller.user.id).maybeSingle();
  const profile = me as { church_id: string | null; role: string } | null;
  if (!profile?.church_id || profile.role !== "ADMIN") return NextResponse.json({ error: "Only church admins can link billing." }, { status: 403 });

  const { ok, data: session } = await stripeApi(`checkout/sessions/${sessionId}?expand[]=subscription`);
  if (!ok || session.status !== "complete" || !session.subscription) {
    return NextResponse.json({ error: "That checkout isn't complete." }, { status: 400 });
  }
  if (session.metadata?.church_id) return NextResponse.json({ error: "That checkout already belongs to a church." }, { status: 409 });

  const db = createSupabaseAdminClient() as any;
  const billing = billingFromSubscription(session.subscription);
  const { data: taken } = await db.from("churches").select("id").eq("stripe_subscription_id", billing.stripe_subscription_id).maybeSingle();
  if (taken && taken.id !== profile.church_id) return NextResponse.json({ error: "That subscription is already linked." }, { status: 409 });

  await db.from("churches").update(billing).eq("id", profile.church_id);
  // Future subscription events carry the church id.
  await stripeApi(`subscriptions/${billing.stripe_subscription_id}`, new URLSearchParams({ "metadata[church_id]": profile.church_id }));
  return NextResponse.json({ plan: billing.plan });
}
