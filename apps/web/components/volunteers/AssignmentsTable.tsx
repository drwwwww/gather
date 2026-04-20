"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Calendar, RefreshCw } from "lucide-react";
import type { Database } from "@gather/lib";

import { Button } from "../ui/button";
import Badge from "../ui/Badge";

type AssignmentRow = Database["public"]["Tables"]["volunteer_assignments"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type AssignmentStatus = "OPEN" | "ASSIGNED" | "CONFIRMED" | "DECLINED";

export type BulletinSlotRow = {
  id: string;
  role_id: string;
  role_name: string;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: AssignmentStatus;
  notes: string | null;
};

export type BulletinItemRow = {
  id: string;
  /** Step title used as the "role" label, e.g. "Closing Prayer" */
  title: string;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: AssignmentStatus;
  notes: string | null;
};

type AssignmentsTableProps = {
  assignments: AssignmentRow[];
  roles: RoleRow[];
  profiles: ProfileRow[];
  showOpenOnly: boolean;
  showPendingOnly: boolean;
  showDeclinedOnly: boolean;
  searchTerm: string;
  onToggleOpenOnly: (value: boolean) => void;
  onTogglePendingOnly: (value: boolean) => void;
  onToggleDeclinedOnly: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  onAssign: (assignmentId: string, userId: string) => void;
  onUnassign: (assignmentId: string) => void;
  onAssignBackup: (assignmentId: string, userId: string) => void;
  onUnassignBackup?: (assignmentId: string) => void;
  onStatusChange: (assignmentId: string, status: AssignmentStatus) => void;
  onNotesChange: (assignmentId: string, notes: string) => void;
  onDelete: (assignmentId: string) => void;
  onGenerateSchedule: () => void;
  onCopyLast: () => void;
  onRefresh?: () => void;
  // Bulletin role slots from the linked service plan
  bulletinPlanTitle?: string | null;
  bulletinSlots?: BulletinSlotRow[];
  onBulletinSlotUpdate?: (slotId: string, patch: {
    assigned_user_id?: string | null;
    backup_user_id?: string | null;
    status?: AssignmentStatus;
    notes?: string | null;
  }) => void;
  onBulletinSlotDelete?: (slotId: string) => void;
  // Run-of-show items with an assigned person
  bulletinItems?: BulletinItemRow[];
  onBulletinItemUpdate?: (itemId: string, patch: {
    assigned_user_id?: string | null;
    backup_user_id?: string | null;
    status?: AssignmentStatus;
    notes?: string | null;
  }) => void;
};

const statusStyles: Record<AssignmentStatus, { label: string; variant: "warning" | "neutral" | "success" | "danger" }> = {
  OPEN: { label: "OPEN", variant: "warning" },
  ASSIGNED: { label: "PENDING", variant: "neutral" },
  CONFIRMED: { label: "CONFIRMED", variant: "success" },
  DECLINED: { label: "DECLINED", variant: "danger" }
};

type UnifiedRow =
  | { kind: "schedule"; data: AssignmentRow; roleName: string }
  | { kind: "bulletin"; data: BulletinSlotRow }
  | { kind: "item"; data: BulletinItemRow };

export default function AssignmentsTable({
  assignments,
  roles,
  profiles,
  showOpenOnly,
  showPendingOnly,
  showDeclinedOnly,
  searchTerm,
  onToggleOpenOnly,
  onTogglePendingOnly,
  onToggleDeclinedOnly,
  onSearchChange,
  onAssign,
  onUnassign,
  onAssignBackup,
  onUnassignBackup,
  onStatusChange,
  onNotesChange,
  onDelete,
  onGenerateSchedule,
  onCopyLast,
  bulletinSlots = [],
  onBulletinSlotUpdate,
  onBulletinSlotDelete,
  bulletinItems = [],
  onBulletinItemUpdate,
  onRefresh,
}: AssignmentsTableProps) {
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const serviceProfiles = useMemo(
    () => (Array.isArray(profiles) ? profiles : []).filter((p) => p.role === "SERVICE" || p.role === "ADMIN"),
    [profiles]
  );

  const roleById = useMemo(() => {
    return (Array.isArray(roles) ? roles : []).reduce<Record<string, RoleRow>>((acc, role) => {
      acc[role.id] = role;
      return acc;
    }, {});
  }, [roles]);

  const statusFilters = useMemo<AssignmentStatus[]>(() => {
    const f: AssignmentStatus[] = [];
    if (showOpenOnly) f.push("OPEN");
    if (showPendingOnly) f.push("ASSIGNED");
    if (showDeclinedOnly) f.push("DECLINED");
    return f;
  }, [showOpenOnly, showPendingOnly, showDeclinedOnly]);

  const unified = useMemo<UnifiedRow[]>(() => {
    const term = searchTerm.trim().toLowerCase();

    const scheduleRows: UnifiedRow[] = (Array.isArray(assignments) ? assignments : [])
      .filter((a) => {
        if (statusFilters.length && !statusFilters.includes(a.status as AssignmentStatus)) return false;
        if (!term) return true;
        const roleName = roleById[a.role_id]?.name ?? "";
        const assignedProfile = profiles.find((p) => p.id === a.assigned_user_id);
        const backupProfile = profiles.find((p) => p.id === a.backup_user_id);
        const names = [assignedProfile, backupProfile].filter(Boolean).map((p) => p?.full_name || p?.email || "").join(" ");
        return `${roleName} ${names}`.toLowerCase().includes(term);
      })
      .map((a) => ({ kind: "schedule" as const, data: a, roleName: roleById[a.role_id]?.name ?? "Role" }));

    const bulletinRows: UnifiedRow[] = bulletinSlots
      .filter((s) => {
        if (statusFilters.length && !statusFilters.includes(s.status)) return false;
        if (!term) return true;
        const assignedProfile = profiles.find((p) => p.id === s.assigned_user_id);
        const backupProfile = profiles.find((p) => p.id === s.backup_user_id);
        const names = [assignedProfile, backupProfile].filter(Boolean).map((p) => p?.full_name || p?.email || "").join(" ");
        return `${s.role_name} ${names}`.toLowerCase().includes(term);
      })
      .map((s) => ({ kind: "bulletin" as const, data: s }));

    // Run-of-show items with an assigned person (only show those with someone assigned)
    const itemRows: UnifiedRow[] = bulletinItems
      .filter((item) => {
        if (statusFilters.length && !statusFilters.includes(item.status)) return false;
        if (!term) return true;
        const assignedProfile = profiles.find((p) => p.id === item.assigned_user_id);
        const backupProfile = profiles.find((p) => p.id === item.backup_user_id);
        const names = [assignedProfile, backupProfile].filter(Boolean).map((p) => p?.full_name || p?.email || "").join(" ");
        return `${item.title} ${names}`.toLowerCase().includes(term);
      })
      .map((item) => ({ kind: "item" as const, data: item }));

    return [...scheduleRows, ...bulletinRows, ...itemRows];
  }, [assignments, bulletinSlots, statusFilters, searchTerm, roleById, profiles]);

  const isEmpty = unified.length === 0;
  const hasNoData = assignments.length === 0 && bulletinSlots.length === 0 && bulletinItems.length === 0;

  return (
    <div className="card shadow-sm p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="card-title">Assignments</div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Badge variant="warning">OPEN</Badge>
            <Badge variant="neutral">PENDING</Badge>
            <Badge variant="success">CONFIRMED</Badge>
            <Badge variant="danger">DECLINED</Badge>
          </div>
          {onRefresh && (
            <button
              className="btn btn-ghost btn-sm gap-1"
              onClick={onRefresh}
              title="Refresh assignments"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-xs">Refresh</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showOpenOnly}
            onChange={(e) => onToggleOpenOnly(e.target.checked)}
          />
          <span className="text-sm">Open only</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showPendingOnly}
            onChange={(e) => onTogglePendingOnly(e.target.checked)}
          />
          <span className="text-sm">Pending only</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showDeclinedOnly}
            onChange={(e) => onToggleDeclinedOnly(e.target.checked)}
          />
          <span className="text-sm">Declined only</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="Search by role or volunteer"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {serviceProfiles.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <Users className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No service team members yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add volunteers to start scheduling.</p>
          </div>
          <Link href="/people" className="mt-2">
            <Button variant="secondary" size="sm">Add volunteers</Button>
          </Link>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
        <table className="table w-full text-sm">
          <thead>
            <tr>
              <th className="bg-[var(--surface-2)]">Role</th>
              <th className="bg-[var(--surface-2)]">Assigned to</th>
              <th className="bg-[var(--surface-2)]">Backup</th>
              <th className="bg-[var(--surface-2)]">Status</th>
              <th className="bg-[var(--surface-2)]">Notes</th>
              <th className="bg-[var(--surface-2)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={6} className="p-0 border-0">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-b-xl bg-[var(--surface)] px-6 py-10 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
                      <Calendar className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {hasNoData ? "No assignments yet" : "No results match your filters"}
                      </p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {hasNoData
                          ? "Generate a schedule or copy the last service to get started."
                          : "Try adjusting your search or filters."}
                      </p>
                    </div>
                    {hasNoData && (
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        <Button variant="primary" size="sm" onClick={onGenerateSchedule}>Generate schedule</Button>
                        <Button variant="secondary" size="sm" onClick={onCopyLast}>Copy last service</Button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              unified.map((row) => {
                if (row.kind === "schedule") {
                  const { data: a, roleName } = row;
                  const statusKey = a.status as AssignmentStatus;
                  const status = statusStyles[statusKey];
                  const assignedValue = a.assigned_user_id ?? "";
                  const backupValue = a.backup_user_id ?? "";
                  const noteValue = notesDraft[`s-${a.id}`] ?? a.notes ?? "";
                  return (
                    <tr key={`s-${a.id}`}>
                      <td>{roleName}</td>
                      <td>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={assignedValue}
                          onChange={(e) => onAssign(a.id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {serviceProfiles.map((p) => (
                            <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={backupValue}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v && onUnassignBackup) onUnassignBackup(a.id);
                            else onAssignBackup(a.id, v);
                          }}
                        >
                          <option value="">None</option>
                          {serviceProfiles
                            .filter((p) => p.id !== assignedValue)
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-sm w-full"
                          placeholder="Add notes"
                          value={noteValue}
                          onChange={(e) => setNotesDraft((prev) => ({ ...prev, [`s-${a.id}`]: e.target.value }))}
                          onBlur={(e) => onNotesChange(a.id, e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" size="sm" onClick={() => onStatusChange(a.id, "CONFIRMED")}>Confirm</Button>
                          <Button variant="secondary" size="sm" onClick={() => onStatusChange(a.id, "DECLINED")}>Decline</Button>
                          <Button variant="secondary" size="sm" onClick={() => onUnassign(a.id)}>Unassign</Button>
                          <Button variant="danger" size="sm" onClick={() => onDelete(a.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // run-of-show item row
                if (row.kind === "item") {
                  const { data: item } = row;
                  const status = statusStyles[item.status] ?? statusStyles.OPEN;
                  const assignedValue = item.assigned_user_id ?? "";
                  const backupValue = item.backup_user_id ?? "";
                  const noteValue = notesDraft[`i-${item.id}`] ?? item.notes ?? "";
                  return (
                    <tr key={`i-${item.id}`}>
                      <td>{item.title}</td>
                      <td>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={assignedValue}
                          onChange={(e) => onBulletinItemUpdate?.(item.id, { assigned_user_id: e.target.value || null })}
                        >
                          <option value="">Unassigned</option>
                          {serviceProfiles.map((p) => (
                            <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={backupValue}
                          onChange={(e) => onBulletinItemUpdate?.(item.id, { backup_user_id: e.target.value || null })}
                        >
                          <option value="">None</option>
                          {serviceProfiles
                            .filter((p) => p.id !== assignedValue)
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-sm"
                          value={item.status}
                          onChange={(e) => onBulletinItemUpdate?.(item.id, { status: e.target.value as AssignmentStatus })}
                        >
                          <option value="OPEN">Open</option>
                          <option value="ASSIGNED">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="DECLINED">Declined</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-sm w-full"
                          placeholder="Add notes"
                          value={noteValue}
                          onChange={(e) => setNotesDraft((prev) => ({ ...prev, [`i-${item.id}`]: e.target.value }))}
                          onBlur={(e) =>
                            onBulletinItemUpdate?.(item.id, { notes: e.target.value.trim() })
                          }
                        />
                      </td>
                      <td>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                }

                // bulletin slot row
                const { data: slot } = row;
                const status = statusStyles[slot.status] ?? statusStyles.OPEN;
                const assignedValue = slot.assigned_user_id ?? "";
                const backupValue = slot.backup_user_id ?? "";
                const noteValue = notesDraft[`b-${slot.id}`] ?? slot.notes ?? "";
                return (
                  <tr key={`b-${slot.id}`}>
                    <td>{slot.role_name}</td>
                    <td>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={assignedValue}
                        onChange={(e) => onBulletinSlotUpdate?.(slot.id, { assigned_user_id: e.target.value || null })}
                      >
                        <option value="">Unassigned</option>
                        {serviceProfiles.map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={backupValue}
                        onChange={(e) => onBulletinSlotUpdate?.(slot.id, { backup_user_id: e.target.value || null })}
                      >
                        <option value="">None</option>
                        {serviceProfiles
                          .filter((p) => p.id !== assignedValue)
                          .map((p) => (
                            <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select select-bordered select-sm"
                        value={slot.status}
                        onChange={(e) => onBulletinSlotUpdate?.(slot.id, { status: e.target.value as AssignmentStatus })}
                      >
                        <option value="OPEN">Open</option>
                        <option value="ASSIGNED">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="DECLINED">Declined</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-sm w-full"
                        placeholder="Add notes"
                        value={noteValue}
                        onChange={(e) => setNotesDraft((prev) => ({ ...prev, [`b-${slot.id}`]: e.target.value }))}
                        onBlur={(e) => onBulletinSlotUpdate?.(slot.id, { notes: e.target.value.trim() || null })}
                      />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Button variant="danger" size="sm" onClick={() => onBulletinSlotDelete?.(slot.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
