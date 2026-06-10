"use client";

import type { Database } from "@gather/lib";
import { CalendarDays, PlusCircle } from "lucide-react";
import { Button } from "../ui/button";

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

export default function ScheduleBuilder({
  roles,
  slotRoleId,
  slotCount,
  slots,
  onSlotRoleChange,
  onSlotCountChange,
  onAddSlot,
  onRemoveSlot,
  onGenerateSchedule,
  onCopyLast,
}: ScheduleBuilderProps) {
  return (
    <section className="stitch-section-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="stitch-icon-well" aria-hidden>
            <CalendarDays className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Schedule builder</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Add role slots, then generate or copy the last service.</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-[#f59e0b]">Queue slots</span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_0.5fr_auto]">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Role</label>
          <select
            className="select select-bordered w-full rounded-xl border-[var(--border)] bg-[var(--surface-container-lowest)]"
            value={slotRoleId}
            onChange={(event) => onSlotRoleChange(event.target.value)}
          >
            {Array.isArray(roles) &&
              roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Qty</label>
          <input
            type="number"
            min={1}
            className="input input-bordered w-full rounded-xl border-[var(--border)] bg-[var(--surface-container-lowest)]"
            value={slotCount}
            onChange={(event) => onSlotCountChange(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <label className="invisible text-[11px] font-bold uppercase tracking-wider">Add</label>
          <Button variant="secondary" onClick={onAddSlot} className="w-full rounded-xl">
            Add
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="primaryGradient" onClick={onGenerateSchedule} disabled={!Array.isArray(slots) || !slots.length}>
          Generate schedule
        </Button>
        <Button variant="secondary" onClick={onCopyLast}>
          Copy last service
        </Button>
      </div>

      <div className="space-y-3">
        {Array.isArray(slots) && slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--outline-variant)]/40 bg-[var(--surface-container-low)] px-6 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-container-high)]">
              <PlusCircle className="h-5 w-5 text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">No slots queued</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Add role slots or copy the last service to get started.</p>
            </div>
          </div>
        ) : (
          Array.isArray(slots) &&
          slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-container-low)] p-4 text-sm"
            >
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{roles.find((role) => role.id === slot.roleId)?.name ?? "Role"}</p>
                <p className="text-xs text-[var(--text-muted)]">{slot.count} slots</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onRemoveSlot(slot.id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onAddSlot}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--surface-container-high)] py-4 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-container-highest)]"
      >
        <PlusCircle className="h-5 w-5 shrink-0" />
        <span>Add new slot</span>
      </button>
    </section>
  );
}
