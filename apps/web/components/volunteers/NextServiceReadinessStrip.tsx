"use client";

import { Button } from "../ui/button";

type NextServiceReadinessStripProps = {
  serviceLabel: string;
  totalSlots: number;
  openSlots: number;
  pendingConfirmations: number;
  confirmedCount: number;
  declinedCount: number;
  onGenerate: () => void;
  onCopyLast: () => void;
  onSendReminders: () => void;
};

export default function NextServiceReadinessStrip({
  serviceLabel,
  totalSlots,
  openSlots,
  pendingConfirmations,
  confirmedCount,
  declinedCount,
  onGenerate,
  onCopyLast,
  onSendReminders
}: NextServiceReadinessStripProps) {
  return (
    <div className="p-4 rounded-xl shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--sidebar-radius)" }}>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Next service readiness</p>
          <p className="mt-2 text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{serviceLabel}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total slots</p>
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{totalSlots}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Open</p>
              <p className="text-lg font-semibold" style={{ color: "var(--warning)" }}>{openSlots}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pending</p>
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{pendingConfirmations}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Confirmed</p>
              <p className="text-lg font-semibold" style={{ color: "var(--success)" }}>{confirmedCount}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Declined</p>
              <p className="text-lg font-semibold" style={{ color: "var(--danger)" }}>{declinedCount}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button size="sm" variant="primary" onClick={onGenerate}>Generate schedule</Button>
          <Button size="sm" variant="secondary" onClick={onCopyLast}>Copy last service</Button>
          <Button size="sm" variant="secondary" onClick={onSendReminders}>Send reminders</Button>
        </div>
      </div>
    </div>
  );
}
