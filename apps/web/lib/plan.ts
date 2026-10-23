"use client";

import { useEffect, useState } from "react";
import type { ChurchPlan } from "@gather/lib";
import { supabase } from "./supabaseClient";

/** Gather AI ships with Congregation and Network — never Parish. */
export const AI_PLANS: ChurchPlan[] = ["congregation", "network"];

export const planHasAi = (plan: ChurchPlan | null | undefined) => !!plan && AI_PLANS.includes(plan);

/**
 * Where the church stands (migration 0053):
 *  - "paid": a Stripe subscription (or a church set active by support) is live
 *  - "trial": no subscription yet, inside the 14-day trial (on Congregation)
 *  - "expired": the trial ended without a plan — read-only (migration 0054), data stays
 *  - "lapsed": a subscription was cancelled or unpaid
 */
export type PlanAccess = "paid" | "trial" | "expired" | "lapsed";

const LIVE_STATUSES = ["active", "trialing", "past_due"];

export function accessFor(b: Pick<ChurchBilling, "planStatus" | "hasSubscription" | "trialEndsAt">): PlanAccess {
  if (b.hasSubscription) return LIVE_STATUSES.includes(b.planStatus) ? "paid" : "lapsed";
  if (b.planStatus === "active") return "paid";
  if (b.trialEndsAt && new Date(b.trialEndsAt) > new Date()) return "trial";
  return b.planStatus === "trialing" ? "expired" : "lapsed";
}

export function trialDaysLeft(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000));
}

export const PLAN_LABEL: Record<ChurchPlan, string> = {
  parish: "Parish",
  congregation: "Congregation",
  network: "Network",
};

export type ChurchBilling = {
  churchId: string;
  plan: ChurchPlan;
  planStatus: string;
  renewsAt: string | null;
  hasStripeCustomer: boolean;
  hasSubscription: boolean;
  trialEndsAt: string | null;
};

let cached: Promise<ChurchBilling | null> | null = null;
// A different account signing in on the same tab must not see the previous church's plan.
supabase?.auth.onAuthStateChange(() => {
  cached = null;
});

async function loadBilling(): Promise<ChurchBilling | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase.from("profiles").select("church_id").eq("id", auth.user.id).maybeSingle();
  if (!profile?.church_id) return null;
  const { data } = await (supabase as any)
    .from("churches")
    .select("id, plan, plan_status, plan_renews_at, stripe_customer_id, stripe_subscription_id, trial_ends_at")
    .eq("id", profile.church_id)
    .maybeSingle();
  if (!data) return null;
  return {
    churchId: data.id,
    plan: (data.plan ?? "parish") as ChurchPlan,
    planStatus: data.plan_status ?? "trialing",
    renewsAt: data.plan_renews_at ?? null,
    hasStripeCustomer: !!data.stripe_customer_id,
    hasSubscription: !!data.stripe_subscription_id,
    trialEndsAt: data.trial_ends_at ?? null,
  };
}

/** The signed-in admin's church plan. Cached for the page session. */
export function useChurchPlan() {
  const [billing, setBilling] = useState<ChurchBilling | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    cached ??= loadBilling();
    cached.then((b) => {
      if (!alive) return;
      setBilling(b);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);
  const access = billing ? accessFor(billing) : null;
  // Gather AI needs an AI plan that's paid for or still in its trial.
  const aiEnabled = planHasAi(billing?.plan) && (access === "paid" || access === "trial");
  return { billing, plan: billing?.plan ?? null, access, aiEnabled, loading };
}

/** Call after a plan change so the next read refetches. */
export function invalidateChurchPlan() {
  cached = null;
}
