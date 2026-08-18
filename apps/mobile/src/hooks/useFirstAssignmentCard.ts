import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { hasSeenFlag, setSeenFlag } from "../lib/localFlags";

export type FirstAssignmentCardData = { roleLabel: string; dateLabel: string | null };

function formatServiceDate(ymd: string | null): string | null {
  if (!ymd) return null;
  try {
    const d = new Date(ymd + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  } catch {
    return null;
  }
}

/**
 * Detects a member's very first-ever serving assignment (role slot or bulletin
 * item) and surfaces it once via a center card. "First" is determined by an
 * actual count query, not just "a new one arrived" — so it only fires for a
 * genuine first assignment, not a second or third. Only SERVICE/ADMIN can be
 * assigned at all, so MEMBER profiles skip this entirely.
 */
export function useFirstAssignmentCard() {
  const { user, profile } = useAuth();
  const [card, setCard] = useState<FirstAssignmentCardData | null>(null);

  const maybeShow = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) return;
    if (profile.role === "MEMBER") return;

    const alreadyShown = await hasSeenFlag("firstAssignmentShown", user.id);
    if (alreadyShown) return;

    const [slotsCount, itemsCount] = await Promise.all([
      supabase.from("service_plan_role_slots").select("id", { count: "exact", head: true }).eq("assigned_user_id", user.id),
      supabase.from("service_plan_items").select("id", { count: "exact", head: true }).eq("assigned_user_id", user.id),
    ]);
    const total = (slotsCount.count ?? 0) + (itemsCount.count ?? 0);
    if (total === 0) return;

    // More than one already — we missed the actual "first" moment (e.g. reinstalled
    // the app). Showing the intro card for their 3rd assignment would read as wrong.
    if (total > 1) {
      await setSeenFlag("firstAssignmentShown", user.id);
      return;
    }

    type ItemRow = { id: string; title: string; plan_id: string };
    type SlotRow = { id: string; role_id: string; plan_id: string };

    const [itemRes, slotRes] = await Promise.all([
      supabase.from("service_plan_items").select("id, title, plan_id").eq("assigned_user_id", user.id).limit(1).maybeSingle(),
      supabase.from("service_plan_role_slots").select("id, role_id, plan_id").eq("assigned_user_id", user.id).limit(1).maybeSingle(),
    ]);
    const item = itemRes.data as ItemRow | null;
    const slot = slotRes.data as SlotRow | null;

    let roleLabel = "the team";
    let planId: string | null = null;

    if (item) {
      roleLabel = item.title;
      planId = item.plan_id;
    } else if (slot) {
      planId = slot.plan_id;
      const roleRes = await supabase.from("volunteer_roles").select("name").eq("id", slot.role_id).maybeSingle();
      roleLabel = (roleRes.data as { name: string } | null)?.name ?? "a role";
    }

    let dateLabel: string | null = null;
    if (planId) {
      const planRes = await supabase.from("service_plans").select("service_date").eq("id", planId).maybeSingle();
      dateLabel = formatServiceDate((planRes.data as { service_date: string } | null)?.service_date ?? null);
    }

    setCard({ roleLabel, dateLabel });
    await setSeenFlag("firstAssignmentShown", user.id);
  }, [user?.id, profile?.church_id, profile?.role]);

  useEffect(() => {
    maybeShow();
    if (!supabase || !user?.id || !profile?.church_id || profile.role === "MEMBER") return;
    const client = supabase;
    const channel = client
      .channel(`first-assignment-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_plan_role_slots", filter: `assigned_user_id=eq.${user.id}` }, () => maybeShow())
      .on("postgres_changes", { event: "*", schema: "public", table: "service_plan_items", filter: `assigned_user_id=eq.${user.id}` }, () => maybeShow())
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, [maybeShow, user?.id, profile?.church_id, profile?.role]);

  return { card, dismiss: () => setCard(null) };
}
