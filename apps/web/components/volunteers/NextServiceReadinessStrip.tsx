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
    <div className="card bg-base-100 shadow-md p-4 rounded-xl font-sans">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] font-sans">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-sans text-base-content/60">Next service readiness</p>
          <p className="mt-2 text-xl font-semibold font-sans text-base-content">{serviceLabel}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 font-sans">
            <div>
              <p className="text-xs font-sans text-base-content/60">Total slots</p>
              <p className="text-lg font-semibold font-sans text-base-content">{totalSlots}</p>
            </div>
            <div>
              <p className="text-xs font-sans text-base-content/60">Open</p>
              <p className="text-lg font-semibold font-sans text-warning">{openSlots}</p>
            </div>
            <div>
              <p className="text-xs font-sans text-base-content/60">Pending</p>
              <p className="text-lg font-semibold font-sans text-base-content">{pendingConfirmations}</p>
            </div>
            <div>
              <p className="text-xs font-sans text-base-content/60">Confirmed</p>
              <p className="text-lg font-semibold font-sans text-success">{confirmedCount}</p>
            </div>
            <div>
              <p className="text-xs font-sans text-base-content/60">Declined</p>
              <p className="text-lg font-semibold font-sans text-error">{declinedCount}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end font-sans">
          <Button size="sm" variant="primary" onClick={onGenerate}>Generate schedule</Button>
          <Button size="sm" variant="secondary" onClick={onCopyLast}>Copy last service</Button>
          <Button size="sm" variant="secondary" onClick={onSendReminders}>Send reminders</Button>
        </div>
      </div>
    </div>
  );
}
