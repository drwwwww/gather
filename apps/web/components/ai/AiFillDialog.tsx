"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { proposeSchedule, type AutofillProposal, type AutofillSlot, type AutofillStep } from "../../lib/ai/autofill";
import { AiBadge } from "./AiBrand";

const addDays = (ymd: string, d: number) => {
  const t = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) + d * 86_400_000);
  return t.toISOString().slice(0, 10);
};

export default function AiFillDialog({
  open,
  onClose,
  planId,
  planDate,
  churchId,
  slots,
  steps = [],
  roleNameById,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  planId: string;
  planDate: string;
  churchId: string;
  slots: AutofillSlot[];
  steps?: AutofillStep[];
  roleNameById: Record<string, string>;
  onApply: (picks: AutofillProposal[]) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<AutofillProposal[]>([]);
  const [unfilled, setUnfilled] = useState(0);
  const [total, setTotal] = useState(0);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !supabase) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setSkipped(new Set());
    (async () => {
      const db = supabase as any;
      const [peopleRes, plansRes, awayRes] = await Promise.all([
        db.from("profiles").select("id, full_name, email, role, disabled, ministry_interests").eq("church_id", churchId),
        db.from("service_plans").select("id, service_date").eq("church_id", churchId)
          .gte("service_date", addDays(planDate, -182)).lte("service_date", addDays(planDate, 28)).neq("id", planId),
        db.from("volunteer_unavailability").select("user_id").eq("church_id", churchId)
          .lte("start_date", planDate).gte("end_date", planDate),
      ]);
      if (peopleRes.error || plansRes.error) {
        if (alive) { setError("Couldn't read your serving history. Try again."); setLoading(false); }
        return;
      }
      const dateByPlan = new Map<string, string>((plansRes.data ?? []).map((p: any) => [p.id, p.service_date]));
      const planIds = [...dateByPlan.keys()];
      let history: { user_id: string; role_id: string; service_date: string; status: string }[] = [];
      for (let i = 0; i < planIds.length; i += 150) {
        const { data } = await db.from("service_plan_role_slots")
          .select("plan_id, role_id, assigned_user_id, status")
          .in("plan_id", planIds.slice(i, i + 150))
          .not("assigned_user_id", "is", null);
        history = history.concat((data ?? []).map((r: any) => ({
          user_id: r.assigned_user_id, role_id: r.role_id, status: r.status, service_date: dateByPlan.get(r.plan_id) ?? planDate,
        })));
      }
      const people = (peopleRes.data ?? [])
        .filter((p: any) => !p.disabled)
        .map((p: any) => ({
          id: p.id,
          name: p.full_name?.trim() || p.email || "Member",
          role: p.role,
          interests: Array.isArray(p.ministry_interests) ? p.ministry_interests : [],
        }));
      const result = proposeSchedule({
        planDate,
        slots,
        steps,
        roleNameById,
        people,
        history,
        awayIds: new Set((awayRes.data ?? []).map((a: any) => a.user_id)),
      });
      if (!alive) return;
      setProposals(result.proposals);
      setUnfilled(result.unfilled);
      setTotal(result.total);
      setLoading(false);
    })();
    return () => { alive = false; };
    // A snapshot when the dialog opens — re-read only if the plan finishes loading after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slots.length + steps.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const accepted = proposals.filter((p) => !skipped.has(p.slotId));

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-fill-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="ai-fill-title" className="text-base font-semibold text-[var(--text-primary)]">Fill open spots</h2>
              <AiBadge />
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Suggests people who know the role, haven&apos;t served lately, and aren&apos;t away. Check the list, then assign.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-[160px] flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading serving history…
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-700">{error}</p>
          ) : proposals.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--text-muted)]">
              {total === 0
                ? "This service has no team spots or steps yet. Add a role first, then try again."
                : unfilled > 0
                  ? "We couldn’t find a good match. Everyone who fits is away or already serving."
                  : "Everyone’s already scheduled for this service."}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--divider)]">
              {proposals.map((p) => {
                const isSkipped = skipped.has(p.slotId);
                return (
                  <li key={p.slotId} className={`flex items-center gap-3 py-2.5 transition-opacity ${isSkipped ? "opacity-45" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {p.name} <span className="font-normal text-[var(--text-muted)]">→ {p.roleName}{p.kind === "step" ? " (step)" : ""}</span>
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{p.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSkipped((s) => { const n = new Set(s); n.has(p.slotId) ? n.delete(p.slotId) : n.add(p.slotId); return n; })}
                      className="shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {isSkipped ? "Include" : "Skip"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && unfilled > 0 && proposals.length > 0 && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">{unfilled} {unfilled === 1 ? "spot still needs" : "spots still need"} someone. Pick them yourself on the plan.</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-3">
          <p className="text-[11px] text-[var(--text-muted)]">Each person still confirms in the app.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost h-9 px-3 text-sm">Cancel</button>
            <button
              type="button"
              disabled={loading || accepted.length === 0}
              onClick={() => { onApply(accepted); onClose(); }}
              className="btn btn-primary inline-flex h-9 items-center gap-1.5 px-3 text-sm"
            >
              <Check className="h-4 w-4" /> Assign {accepted.length}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
