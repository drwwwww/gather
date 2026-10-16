"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Check, UserX } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  reporter_id: string | null;
  reported_user_id: string | null;
};

const REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE: "Inappropriate photo or profile",
  HARASSMENT: "Harassment or bullying",
  SPAM: "Spam or scam",
  IMPERSONATION: "Pretending to be someone else",
  OTHER: "Something else",
};

function timeAgo(iso: string) {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 36e5);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/**
 * Open member reports for this church (App Store guideline 1.2 expects reports
 * to be acted on within 24 hours). Renders nothing when there's nothing to
 * review, so the People page stays calm on a normal day.
 */
export default function ReportsCard({
  churchId,
  nameById,
  onDisable,
}: {
  churchId: string | null;
  nameById: Map<string, string>;
  onDisable: (userId: string) => Promise<void> | void;
}) {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !churchId) return;
    const { data } = await supabase
      .from("content_reports")
      .select("id, reason, details, created_at, reporter_id, reported_user_id")
      .eq("church_id", churchId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false });
    setReports((data ?? []) as ReportRow[]);
  }, [churchId]);

  useEffect(() => { void load(); }, [load]);

  const resolve = async (id: string) => {
    if (!supabase) return;
    setBusyId(id);
    const { data: auth } = await supabase.auth.getUser();
    await supabase
      .from("content_reports")
      .update({ resolved_at: new Date().toISOString(), resolved_by: auth.user?.id ?? null })
      .eq("id", id);
    setBusyId(null);
    void load();
  };

  const disableAndResolve = async (r: ReportRow) => {
    if (!r.reported_user_id) return;
    setBusyId(r.id);
    await onDisable(r.reported_user_id);
    await resolve(r.id);
  };

  if (reports.length === 0) return null;

  return (
    <section className="stitch-section-card border-amber-200" aria-labelledby="reports-h">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
          <Flag className="h-4 w-4 text-amber-700" aria-hidden />
        </div>
        <div>
          <h2 id="reports-h" className="text-sm font-semibold text-[var(--text-primary)]">
            {reports.length} {reports.length === 1 ? "report needs" : "reports need"} review
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Reported by members from the mobile directory. Reporters stay anonymous to the person reported.</p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-[var(--divider)]">
        {reports.map((r) => {
          const who = (r.reported_user_id && nameById.get(r.reported_user_id)) || "A former member";
          const by = (r.reporter_id && nameById.get(r.reporter_id)) || "a member";
          return (
            <li key={r.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-medium">{who}</span>
                  <span className="text-[var(--text-muted)]"> · {REASON_LABELS[r.reason] ?? r.reason}</span>
                </p>
                {r.details && <p className="mt-0.5 line-clamp-2 text-sm text-[var(--text-secondary)]">&ldquo;{r.details}&rdquo;</p>}
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">Reported by {by} {timeAgo(r.created_at)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {r.reported_user_id && (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => disableAndResolve(r)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" aria-hidden /> Disable account
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => resolve(r.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" aria-hidden /> No action needed
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
