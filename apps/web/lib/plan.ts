"use client";

import { useEffect, useState } from "react";
import type { ChurchPlan } from "@gather/lib";
import { supabase } from "./supabaseClient";

/** Gather AI ships with Congregation and Network — never Parish. */
export const AI_PLANS: ChurchPlan[] = ["congregation", "network"];

export const planHasAi = (plan: ChurchPlan | null | undefined) => !!plan && AI_PLANS.includes(plan);

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
    .select("id, plan, plan_status, plan_renews_at, stripe_customer_id")
    .eq("id", profile.church_id)
    .maybeSingle();
  if (!data) return null;
  return {
    churchId: data.id,
    plan: (data.plan ?? "parish") as ChurchPlan,
    planStatus: data.plan_status ?? "trialing",
    renewsAt: data.plan_renews_at ?? null,
    hasStripeCustomer: !!data.stripe_customer_id,
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
  return { billing, plan: billing?.plan ?? null, aiEnabled: planHasAi(billing?.plan), loading };
}

/** Call after a plan change so the next read refetches. */
export function invalidateChurchPlan() {
  cached = null;
}
