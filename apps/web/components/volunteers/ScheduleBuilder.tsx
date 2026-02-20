"use client";

import type { Database } from "@gather/lib";
import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

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
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Schedule builder</CardTitle>
        <span className="text-xs text-[var(--gather-muted)]">Add role slots</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_1.1fr_1fr_0.6fr]">
        <div className="space-y-2">
          <label className="text-xs text-[var(--gather-muted)]">Service date</label>
          <Input type="date" value={serviceDate} onChange={(event) => onServiceDateChange(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--gather-muted)]">Service time</label>
          <select
            className="select select-bordered w-full"
            value={serviceTimeId}
            onChange={(event) => onServiceTimeChange(event.target.value)}
          >
            {serviceTimes.length === 0 ? (
              <option value="">Add service times in Create Church</option>
            ) : (
              serviceTimes.map((service) => (
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
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--gather-muted)]">Quantity</label>
          <Input
            type="number"
            min={1}
            value={slotCount}
            onChange={(event) => onSlotCountChange(Number(event.target.value))}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onAddSlot}>Add role slots</Button>
        <Button onClick={onGenerateSchedule} disabled={!slots.length || !serviceTimeId}>Generate schedule</Button>
        <Button variant="outline" onClick={onCopyLast}>Copy last service</Button>
      </div>
      <div className="mt-4 space-y-2">
        {slots.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            No slots queued yet. Add role slots or copy last service.
          </div>
        ) : (
          slots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-2xl p-3 text-sm" style={{ background: 'var(--gather-surface)' }}>
              <div>
                <p className="font-medium">
                  {roles.find((role) => role.id === slot.roleId)?.name ?? "Role"}
                </p>
                <p style={{ color: 'var(--muted)' }}>{slot.count} slots</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onRemoveSlot(slot.id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
