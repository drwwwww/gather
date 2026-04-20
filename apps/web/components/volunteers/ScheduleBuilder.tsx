"use client";

import type { Database } from "@gather/lib";
import { PlusCircle } from "lucide-react";
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
  onCopyLast
}: ScheduleBuilderProps) {
  return (
    <div className="card shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="card-title">Schedule builder</div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Add role slots</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.5fr_auto]">
        <div className="space-y-2">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>Role</label>
          <select
            className="select select-bordered w-full"
            value={slotRoleId}
            onChange={(event) => onSlotRoleChange(event.target.value)}
          >
            {Array.isArray(roles) && roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>Qty</label>
          <input
            type="number"
            min={1}
            className="input input-bordered w-full"
            value={slotCount}
            onChange={(event) => onSlotCountChange(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs invisible">Add</label>
          <Button variant="secondary" onClick={onAddSlot} className="w-full">Add</Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={onGenerateSchedule} disabled={!Array.isArray(slots) || !slots.length}>Generate schedule</Button>
        <Button variant="secondary" onClick={onCopyLast}>Copy last service</Button>
      </div>
      <div className="mt-4 space-y-2">
        {Array.isArray(slots) && slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <PlusCircle className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No slots queued</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add role slots or copy the last service to get started.</p>
            </div>
          </div>
        ) : (
          Array.isArray(slots) && slots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-2xl p-3 text-sm bg-[var(--surface)]">
              <div>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {roles.find((role) => role.id === slot.roleId)?.name ?? "Role"}
                </p>
                <p className="text-base-content/60">{slot.count} slots</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onRemoveSlot(slot.id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
