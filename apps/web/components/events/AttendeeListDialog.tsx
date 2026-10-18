"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Users, X } from "lucide-react";
import Avatar from "../ui/avatar";
import { downloadCsv } from "../../lib/csv";

type Attendee = {
  id: string;
  name: string;
  email: string;
  status: string;
  avatarUrl?: string | null;
};

type AttendeeListDialogProps = {
  open: boolean;
  attendees: Attendee[];
  eventTitle?: string | null;
  onClose: () => void;
};

const TABS = [
  { key: "GOING", label: "Going" },
  { key: "MAYBE", label: "Maybe" },
  { key: "NO", label: "Not going" },
] as const;

export default function AttendeeListDialog({ open, attendees, eventTitle, onClose }: AttendeeListDialogProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("GOING");

  useEffect(() => {
    if (!open) return;
    setTab("GOING");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const byStatus = useMemo(() => {
    const m: Record<string, Attendee[]> = { GOING: [], MAYBE: [], NO: [] };
    for (const a of attendees) (m[a.status] ??= []).push(a);
    for (const list of Object.values(m)) list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    return m;
  }, [attendees]);

  if (!open || typeof document === "undefined") return null;
  const list = byStatus[tab] ?? [];

  const exportCsv = () => {
    const slug = (eventTitle || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    downloadCsv(`${slug}-rsvps.csv`, [
      ["Name", "Email", "Response"],
      ...TABS.flatMap((t) => (byStatus[t.key] ?? []).map((a) => [a.name || "Member", a.email, t.label])),
    ]);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendees-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            <h2 id="attendees-title" className="text-base font-semibold text-[var(--text-primary)]">RSVPs</h2>
            {eventTitle && <p className="truncate text-xs text-[var(--text-muted)]">{eventTitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={exportCsv}
              disabled={attendees.length === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div role="tablist" aria-label="Response" className="flex gap-1 border-b border-[var(--border)] px-4 py-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${tab === t.key ? "bg-amber-50 text-amber-800" : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
            >
              {t.label} <span className="tabular-nums text-[var(--text-muted)]">{byStatus[t.key]?.length ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[180px] flex-1 overflow-y-auto px-3 py-2">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Users className="h-5 w-5 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">No one yet.</p>
            </div>
          ) : (
            <ul>
              {list.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--surface-2)]">
                  <Avatar name={a.name} email={a.email} imageUrl={a.avatarUrl ?? null} size={32} className="bg-amber-100 text-[10px] font-bold text-amber-700" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{a.name || "Member"}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{a.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
