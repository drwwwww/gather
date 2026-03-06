"use client";

import type { Database } from "@gather/lib";
import { Button } from "../ui/button";

type ServiceTimeRow = Database["public"]["Tables"]["service_times"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type StoredScheduleSlot = {
  id: string;
  roleId: string;
  count: number;
};

type ScheduleBuilderProps = {
  serviceDate: string;
  serviceTimeId: string;
  serviceTimes: ServiceTimeRow[];
  roles: RoleRow[];
  slotRoleId: string;
  slotCount: number;
  slots: StoredScheduleSlot[];
  onServiceDateChange: (value: string) => void;
  onServiceTimeChange: (value: string) => void;
  onSlotRoleChange: (value: string) => void;
  onSlotCountChange: (value: number) => void;
  onAddSlot: () => void;
  onRemoveSlot: (slotId: string) => void;
  onGenerateSchedule: () => void;
  onCopyLast: () => void;
  serviceTimeLabel: (service: ServiceTimeRow) => string;
};

export default function ScheduleBuilder({
  serviceDate,
  serviceTimeId,
  serviceTimes,
  roles,
  slotRoleId,
  slotCount,
  slots,
  onServiceDateChange,
  onServiceTimeChange,
  onSlotRoleChange,
  onSlotCountChange,
  onAddSlot,
  onRemoveSlot,
  onGenerateSchedule,
  onCopyLast,
  serviceTimeLabel
}: ScheduleBuilderProps) {
  return (
    <div className="card bg-base-100 shadow-md rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="card-title text-lg font-semibold">Schedule builder</div>
        <span className="text-xs text-[var(--gather-muted)]">Add role slots</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_1.1fr_1fr_0.6fr]">
        <div className="space-y-2">
          <label className="text-xs text-[var(--gather-muted)]">Service date</label>
          <input type="date" className="input input-bordered w-full" value={serviceDate} onChange={(event) => onServiceDateChange(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--gather-muted)]">Service time</label>
          <select
            className="select select-bordered w-full"
            value={serviceTimeId}
            onChange={(event) => onServiceTimeChange(event.target.value)}
          >
            {(Array.isArray(serviceTimes) ? serviceTimes : []).length === 0 ? (
              <option value="">Add service times in Create Church</option>
            ) : (
              (Array.isArray(serviceTimes) ? serviceTimes : []).map((service) => (
                <option key={service.id} value={service.id}>
                  {serviceTimeLabel(service)}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--gather-muted)]">Role</label>
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
          <label className="text-xs text-[var(--gather-muted)]">Quantity</label>
          <input
            type="number"
            min={1}
            className="input input-bordered w-full"
            value={slotCount}
            onChange={(event) => onSlotCountChange(Number(event.target.value))}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onAddSlot}>Add role slots</Button>
        <Button variant="primary" onClick={onGenerateSchedule} disabled={!Array.isArray(slots) || !slots.length || !serviceTimeId}>Generate schedule</Button>
        <Button variant="secondary" onClick={onCopyLast}>Copy last service</Button>
      </div>
      <div className="mt-4 space-y-2">
        {Array.isArray(slots) && slots.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-base-content/60">
            No slots queued yet. Add role slots or copy last service.
          </div>
        ) : (
          Array.isArray(slots) && slots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-2xl p-3 text-sm bg-base-100">
              <div>
                <p className="font-medium text-base-content">
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
