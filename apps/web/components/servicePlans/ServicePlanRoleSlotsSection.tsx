"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AssignmentStatus } from "@gather/lib";
import type { Database } from "@gather/lib";
import type { PlanRoleSlotDraft } from "../../lib/db/servicePlans";
import { Button } from "../ui/button";

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

export type ChurchMemberOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const statusOptions: AssignmentStatus[] = ["OPEN", "ASSIGNED", "CONFIRMED", "DECLINED"];

export default function ServicePlanRoleSlotsSection({
  slots,
  roles,
  members,
  onChange,
  onAdjustRoleCount,
  onRemoveSlot
}: {
  slots: PlanRoleSlotDraft[];
  roles: RoleRow[];
  members: ChurchMemberOption[];
  onChange: (id: string, patch: Partial<PlanRoleSlotDraft>) => void;
  onAdjustRoleCount: (roleId: string, delta: number) => void;
  onRemoveSlot: (id: string) => void;
}) {
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());

  const toggleCollapse = (roleId: string) => {
    setCollapsedRoles((prev) => {
      const next = new Set(prev);
      next.has(roleId) ? next.delete(roleId) : next.add(roleId);
      return next;
    });
  };

  const slotsByRole = (roleId: string) =>
    slots.filter((s) => s.role_id === roleId).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div
      className="card shadow-sm p-4 rounded-2xl"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text-primary)"
      }}
    >
      <div className="mb-4">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Roles for this service
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Set how many people you need per volunteer role (ushers, greeters, etc.), then assign each slot. Run-of-show steps below are only the ordered parts of the service.
        </p>
      </div>
      {!roles.length ? (
        <p className="text-sm text-base-content/60">Create volunteer roles under Volunteers first.</p>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => {
            const roleSlots = slotsByRole(role.id);
            const count = roleSlots.length;
            const isCollapsed = collapsedRoles.has(role.id);
            return (
              <div
                key={role.id}
                className="rounded-xl border"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              >
                {/* Role header — always visible */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer select-none"
                  onClick={() => toggleCollapse(role.id)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed
                      ? <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                      : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                    }
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {role.name}
                    </p>
                    {isCollapsed && count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                        {count} slot{count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>How many</span>
                    <div className="join">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="join-item"
                        disabled={count <= 0}
                        onClick={() => onAdjustRoleCount(role.id, -1)}
                      >
                        −
                      </Button>
                      <span
                        className="join-item px-3 py-1 text-sm tabular-nums border"
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
                      >
                        {count}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="join-item"
                        onClick={() => onAdjustRoleCount(role.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Slots — hidden when collapsed */}
                {!isCollapsed && (
                  <div className="px-4 pb-4">
                    {count === 0 ? (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>No slots for this role. Use + to add.</p>
                    ) : (
                      <div className="space-y-4">
                        {roleSlots.map((slot, index) => (
                          <div
                            key={slot.id}
                            className="rounded-lg border p-3"
                            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                Slot {index + 1}
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                onClick={() => onRemoveSlot(slot.id)}
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Status</label>
                                <select
                                  className="select select-bordered w-full mt-1"
                                  value={slot.status}
                                  onChange={(e) => onChange(slot.id, { status: e.target.value as AssignmentStatus })}
                                >
                                  {statusOptions.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div />
                              <div>
                                <label className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                  Assigned person
                                </label>
                                <select
                                  className="select select-bordered w-full mt-1"
                                  value={slot.assigned_user_id ?? ""}
                                  onChange={(e) => {
                                    const userId = e.target.value || null;
                                    onChange(slot.id, {
                                      assigned_user_id: userId,
                                      status: userId ? "ASSIGNED" : "OPEN",
                                    });
                                  }}
                                >
                                  <option value="">— Open —</option>
                                  {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.full_name?.trim() || m.email || m.id.slice(0, 8)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Backup</label>
                                <select
                                  className="select select-bordered w-full mt-1"
                                  value={slot.backup_user_id ?? ""}
                                  onChange={(e) => onChange(slot.id, { backup_user_id: e.target.value || null })}
                                >
                                  <option value="">— None —</option>
                                  {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.full_name?.trim() || m.email || m.id.slice(0, 8)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Notes</label>
                              <textarea
                                className="textarea textarea-bordered w-full mt-1"
                                rows={2}
                                value={slot.notes}
                                onChange={(e) => onChange(slot.id, { notes: e.target.value })}
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
