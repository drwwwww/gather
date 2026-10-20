"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { buildServingStats, type AutofillPerson, type ServingStats } from "../../lib/ai/autofill";

export type BoardPerson = AutofillPerson & { email: string | null; avatarUrl: string | null };
export type Ministry = { id: string; name: string };

const addDays = (ymd: string, d: number) =>
  new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) + d * 86_400_000).toISOString().slice(0, 10);

/**
 * Everything the board needs beyond the plan itself: the church's people
 * (with photos), serving history for ranking, who's away on this date, and
 * ministries for grouping roles. Loaded once per plan.
 */
export function useBoardData(churchId: string | null, planId: string | null, planDate: string | null) {
  const [people, setPeople] = useState<BoardPerson[]>([]);
  const [stats, setStats] = useState<ServingStats | null>(null);
  const [awayIds, setAwayIds] = useState<Set<string>>(new Set());
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !churchId || !planId || !planDate) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const db = supabase as any;
      const [peopleRes, plansRes, awayRes, ministriesRes] = await Promise.all([
        db.from("profiles").select("id, full_name, email, role, disabled, ministry_interests, avatar_url").eq("church_id", churchId),
        db.from("service_plans").select("id, service_date").eq("church_id", churchId)
          .gte("service_date", addDays(planDate, -182)).lte("service_date", addDays(planDate, 28)).neq("id", planId),
        db.from("volunteer_unavailability").select("user_id").eq("church_id", churchId)
          .lte("start_date", planDate).gte("end_date", planDate),
        db.from("ministries").select("id, name").eq("church_id", churchId).order("name"),
      ]);
      const dateByPlan = new Map<string, string>((plansRes.data ?? []).map((p: any) => [p.id, p.service_date]));
      const ids = [...dateByPlan.keys()];
      const history: { user_id: string; role_id: string; service_date: string; status: string }[] = [];
      for (let i = 0; i < ids.length; i += 150) {
        const { data } = await db.from("service_plan_role_slots")
          .select("plan_id, role_id, assigned_user_id, status")
          .in("plan_id", ids.slice(i, i + 150))
          .not("assigned_user_id", "is", null);
        for (const r of data ?? []) history.push({ user_id: r.assigned_user_id, role_id: r.role_id, status: r.status, service_date: dateByPlan.get(r.plan_id) ?? planDate });
      }
      if (!alive) return;
      setPeople(
        (peopleRes.data ?? [])
          .filter((p: any) => !p.disabled)
          .map((p: any) => ({
            id: p.id,
            name: p.full_name?.trim() || p.email || "Member",
            role: p.role,
            interests: Array.isArray(p.ministry_interests) ? p.ministry_interests : [],
            email: p.email ?? null,
            avatarUrl: p.avatar_url ?? null,
          }))
          .sort((a: BoardPerson, b: BoardPerson) => a.name.localeCompare(b.name))
      );
      setStats(buildServingStats(planDate, history));
      setAwayIds(new Set((awayRes.data ?? []).map((a: any) => a.user_id)));
      setMinistries((ministriesRes.data ?? []) as Ministry[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [churchId, planId, planDate]);

  return { people, stats, awayIds, ministries, loading };
}
