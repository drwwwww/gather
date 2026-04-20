"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "@gather/lib";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["volunteer_assignments"]["Row"];
type PlanItemRow = Database["public"]["Tables"]["service_plan_items"]["Row"];
type PlanRoleSlotRow = Database["public"]["Tables"]["service_plan_role_slots"]["Row"];

function nameOf(p: ProfileRow | undefined): string {
  if (!p) return "—";
  return p.full_name?.trim() || p.email || "—";
}

export default function ServiceTeamBulletinSummary({
  churchId,
  serviceTimeId,
  serviceDate,
  profiles,
  roles,
  assignmentsForDate
}: {
  churchId: string;
  serviceTimeId: string;
  serviceDate: string;
  profiles: ProfileRow[];
  roles: RoleRow[];
  assignmentsForDate: AssignmentRow[];
}) {
  const [planId, setPlanId] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState<string | null>(null);
  const [planItems, setPlanItems] = useState<PlanItemRow[]>([]);
  const [roleSlots, setRoleSlots] = useState<PlanRoleSlotRow[]>([]);
  const [loading, setLoading] = useState(false);

  const profilesById = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const roleName = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of roles) m.set(r.id, r.name);
    return (id: string) => m.get(id) ?? "Role";
  }, [roles]);

  const serviceTeam = useMemo(
    () =>
      profiles
        .filter((p) => p.role === "SERVICE" && !p.disabled)
        .sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")),
    [profiles]
  );

  useEffect(() => {
    if (!supabase || !churchId || !serviceTimeId || !serviceDate) {
      setPlanId(null);
      setPlanTitle(null);
      setPlanItems([]);
      setRoleSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: plan } = await supabase
        .from("service_plans")
        .select("id, title")
        .eq("church_id", churchId)
        .eq("service_time_id", serviceTimeId)
        .eq("service_date", serviceDate)
        .maybeSingle();
      if (cancelled) return;
      if (!plan?.id) {
        setPlanId(null);
        setPlanTitle(null);
        setPlanItems([]);
        setRoleSlots([]);
        setLoading(false);
        return;
      }
      setPlanId(plan.id);
      setPlanTitle(plan.title?.trim() || null);
      const [itemsRes, slotsRes] = await Promise.all([
        supabase.from("service_plan_items").select("*").eq("plan_id", plan.id).order("position"),
        supabase.from("service_plan_role_slots").select("*").eq("plan_id", plan.id).order("sort_order")
      ]);
      if (cancelled) return;
      setPlanItems((itemsRes.data ?? []) as PlanItemRow[]);
      setRoleSlots((slotsRes.data ?? []) as PlanRoleSlotRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [churchId, serviceTimeId, serviceDate]);

  /** Everyone with a primary or backup on the bulletin plan, with what they’re doing */
  const bulletinPeople = useMemo(() => {
    type Entry = { userId: string; displayName: string; duties: string[] };
    const byId = new Map<string, Entry>();

    const addDuty = (userId: string | null, duty: string) => {
      if (!userId) return;
      const p = profilesById.get(userId);
      const displayName = nameOf(p);
      const existing = byId.get(userId);
      if (existing) {
        if (!existing.duties.includes(duty)) existing.duties.push(duty);
      } else {
        byId.set(userId, { userId, displayName, duties: [duty] });
      }
    };

    for (const slot of roleSlots) {
      const r = roleName(slot.role_id);
      addDuty(slot.assigned_user_id, `${r} (bulletin role — primary)`);
      addDuty(slot.backup_user_id, `${r} (bulletin role — backup)`);
    }
    for (const item of planItems) {
      if (!item.assigned_user_id) continue;
      const title = item.title?.trim() || "Step";
      addDuty(item.assigned_user_id, `${title} (run of show)`);
    }

    return Array.from(byId.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [roleSlots, planItems, profilesById, roleName]);

  const planPartsWithAssignee = useMemo(
    () => planItems.filter((i) => i.assigned_user_id),
    [planItems]
  );

  const scheduleRows = useMemo(
    () =>
      assignmentsForDate.map((a) => ({
        what: roleName(a.role_id),
        primary: nameOf(a.assigned_user_id ? profilesById.get(a.assigned_user_id) : undefined),
        backup: nameOf(a.backup_user_id ? profilesById.get(a.backup_user_id) : undefined),
        status: a.status
      })),
    [assignmentsForDate, profilesById, roleName]
  );

  const hasBulletin = Boolean(planId);
  const hasSchedule = assignmentsForDate.length > 0;

  return (
    <div
      className="card shadow-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
      style={{ color: "var(--text-primary)" }}
    >
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Who’s serving this date</p>
        <p className="text-xs mt-1 text-[var(--text-muted)]">
          Everyone named on the <strong>service plan bulletin</strong> (role slots and run-of-show parts), plus people on the <strong>volunteer schedule</strong> for other roles.
        </p>
      </div>

      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">Service team roster (profile role)</p>
        {serviceTeam.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No profiles marked as service team (SERVICE).</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {serviceTeam.map((p) => (
              <li key={p.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{nameOf(p)}</span>
                {p.email ? <span className="text-[var(--text-muted)]">{p.email}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* —— Bulletin plan —— */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Service plan bulletin</p>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
          {loading && planId ? "Loading…" : hasBulletin ? planTitle || "Plan for this date" : "No bulletin for this date"}
        </p>

        {!hasBulletin && !loading ? (
          <p className="text-sm text-[var(--text-muted)]">
            Create a service plan for this service time and date to assign people on the bulletin.
          </p>
        ) : null}

        {hasBulletin ? (
          <>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Everyone on this plan</p>
            {bulletinPeople.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] mb-4">No one assigned on the bulletin yet (add people to role slots or run-of-show parts).</p>
            ) : (
              <ul className="space-y-3 text-sm mb-4">
                {bulletinPeople.map((person) => (
                  <li key={person.userId} className="border-t border-[var(--border)] pt-2 first:border-t-0 first:pt-0">
                    <span className="font-medium">{person.displayName}</span>
                    <ul className="mt-1 ml-3 list-disc text-[var(--text-muted)] space-y-0.5">
                      {person.duties.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Role slots on plan</p>
            {roleSlots.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] mb-4">No bulletin role slots. Add roles and counts on the service plan.</p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="table table-sm w-full text-sm">
                  <thead>
                    <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
                      <th className="font-medium">Role</th>
                      <th className="font-medium">Assigned</th>
                      <th className="font-medium">Backup</th>
                      <th className="font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleSlots.map((slot) => (
                      <tr key={slot.id} className="border-t border-[var(--border)]">
                        <td>{roleName(slot.role_id)}</td>
                        <td>{nameOf(slot.assigned_user_id ? profilesById.get(slot.assigned_user_id) : undefined)}</td>
                        <td>{nameOf(slot.backup_user_id ? profilesById.get(slot.backup_user_id) : undefined)}</td>
                        <td>{slot.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Run of show — assigned parts</p>
            {planPartsWithAssignee.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No parts have a named person yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full text-sm">
                  <thead>
                    <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
                      <th className="font-medium">Part</th>
                      <th className="font-medium">Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planPartsWithAssignee.map((item) => (
                      <tr key={item.id} className="border-t border-[var(--border)]">
                        <td>{item.title?.trim() || "Step"}</td>
                        <td>{nameOf(item.assigned_user_id ? profilesById.get(item.assigned_user_id) : undefined)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* —— Volunteer schedule (other roles) —— */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Volunteer schedule</p>
        <p className="text-sm text-[var(--text-muted)] mb-2">Other roles generated from the schedule builder (not the bulletin).</p>
        {!hasSchedule ? (
          <p className="text-sm text-[var(--text-muted)]">No schedule rows for this service time and date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full text-sm">
              <thead>
                <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  <th className="font-medium">Role</th>
                  <th className="font-medium">Assigned</th>
                  <th className="font-medium">Backup</th>
                  <th className="font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td>{row.what}</td>
                    <td>{row.primary}</td>
                    <td>{row.backup}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
