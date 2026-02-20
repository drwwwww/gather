"use client";

import { Button } from "../ui/button";
import { Card } from "../ui/card";

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
    <Card className="font-sans" style={{ background: 'var(--gather-surface)', color: 'var(--gather-ink)' }}>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] font-sans">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-sans" style={{ color: 'var(--gather-muted)' }}>Next service readiness</p>
          <p className="mt-2 text-xl font-semibold font-sans" style={{ color: 'var(--gather-ink)' }}>{serviceLabel}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 font-sans">
            <div>
              <p className="text-xs font-sans" style={{ color: 'var(--gather-muted)' }}>Total slots</p>
              <p className="text-lg font-semibold font-sans" style={{ color: 'var(--gather-ink)' }}>{totalSlots}</p>
            </div>
            <div>
              <p className="text-xs font-sans" style={{ color: 'var(--gather-muted)' }}>Open</p>
              <p className="text-lg font-semibold font-sans" style={{ color: 'var(--gather-accent-warning)' }}>{openSlots}</p>
            </div>
            <div>
              <p className="text-xs font-sans" style={{ color: 'var(--gather-muted)' }}>Pending</p>
              <p className="text-lg font-semibold font-sans" style={{ color: 'var(--gather-ink)' }}>{pendingConfirmations}</p>
            </div>
            <div>
              <p className="text-xs font-sans" style={{ color: 'var(--gather-muted)' }}>Confirmed</p>
              <p className="text-lg font-semibold font-sans" style={{ color: 'var(--gather-accent-success)' }}>{confirmedCount}</p>
            </div>
            <div>
              <p className="text-xs font-sans" style={{ color: 'var(--gather-muted)' }}>Declined</p>
              <p className="text-lg font-semibold font-sans" style={{ color: 'var(--gather-accent-error)' }}>{declinedCount}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end font-sans">
          <Button size="sm" onClick={onGenerate}>Generate schedule</Button>
          <Button size="sm" variant="outline" onClick={onCopyLast}>Copy last service</Button>
          <Button size="sm" variant="outline" onClick={onSendReminders}>Send reminders</Button>
        </div>
      </div>
    </Card>
  );
}
