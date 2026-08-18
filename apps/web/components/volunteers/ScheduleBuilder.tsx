"use client";

import { useEffect, useRef, useState } from "react";
import type { Database } from "@gather/lib";
import { ChevronDown, Copy, Sparkles, X, Plus } from "lucide-react";

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type StoredScheduleSlot = {
  id: string;
  roleId: string;
  count: number;
};

type ScheduleBuilderProps = {
  roles: RoleRow[];
  slotRoleId: string;
  slotCount: number;
  slots: StoredScheduleSlot[];
  onSlotRoleChange: (value: string) => void;
  onSlotCountChange: (value: number) => void;
  onAddSlot: () => void;
  onRemoveSlot: (slotId: string) => void;
  onGenerateSchedule: () => void;
  onCopyLast: () => void;
};

function RoleDropdown({ roles, value, onChange }: { roles: RoleRow[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = roles.find((r) => r.id === value);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-container-low)] focus:outline-none"
      >
        <span>{selected?.name ?? "Select a role"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
          {roles.map((role) => (
            <li key={role.id} className="list-none">
              <button
                type="button"
                className={`flex w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-2)] ${role.id === value ? "font-semibold text-amber-700 bg-amber-50" : "text-[var(--text-primary)]"}`}
                onClick={() => { onChange(role.id); setOpen(false); }}
              >
                {role.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ScheduleBuilder({
  roles, slotRoleId, slotCount, slots,
  onSlotRoleChange, onSlotCountChange, onAddSlot, onRemoveSlot,
  onGenerateSchedule, onCopyLast,
}: ScheduleBuilderProps) {
  const hasSlots = slots.length > 0;
  const hasRoles = roles.length > 0;

  return (
    <section className="stitch-section-card space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Build this service</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Queue up role slots, then generate or copy the last plan.</p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCopyLast}
          className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left transition-colors hover:border-[var(--outline-variant)] hover:bg-[var(--surface-container-low)]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-container-low)]">
            <Copy className="h-4 w-4 text-[var(--text-secondary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Copy last service</p>
            <p className="text-xs text-[var(--text-muted)]">Duplicate roles from the previous plan</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onGenerateSchedule}
          disabled={!hasSlots}
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Generate schedule</p>
            <p className="text-xs text-amber-700">{hasSlots ? `${slots.reduce((s, sl) => s + sl.count, 0)} slots queued` : "Queue slots below first"}</p>
          </div>
        </button>
      </div>

      {/* Slot builder */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Add role slots</p>

        {hasRoles ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <RoleDropdown roles={roles} value={slotRoleId} onChange={onSlotRoleChange} />
            </div>
            {/* Qty stepper */}
            <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2">
              <button type="button" onClick={() => onSlotCountChange(Math.max(1, slotCount - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums text-[var(--text-primary)]">{slotCount}</span>
              <button type="button" onClick={() => onSlotCountChange(slotCount + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
                +
              </button>
            </div>
            <button type="button" onClick={onAddSlot}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition-colors hover:bg-amber-600 focus:outline-none">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            No roles configured yet. <a href="/admin/service-plans" className="font-medium text-amber-600 hover:underline">Add roles →</a>
          </p>
        )}

        {/* Queued slots */}
        {slots.length > 0 && (
          <div className="space-y-2 pt-1">
            {slots.map((slot) => {
              const role = roles.find((r) => r.id === slot.roleId);
              return (
                <div key={slot.id} className="flex items-center justify-between rounded-xl bg-[var(--surface-container-low)] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                      {slot.count}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{role?.name ?? "Role"}</span>
                  </div>
                  <button type="button" onClick={() => onRemoveSlot(slot.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
