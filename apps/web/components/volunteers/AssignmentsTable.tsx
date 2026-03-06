"use client";


import { useMemo, useState } from "react";
import Link from "next/link";
import type { Database } from "@gather/lib";

import { Button } from "../ui/button";
import Badge from "../ui/Badge";

type AssignmentRow = Database["public"]["Tables"]["volunteer_assignments"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type AssignmentStatus = "OPEN" | "ASSIGNED" | "CONFIRMED" | "DECLINED";

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
  onStatusChange: (assignmentId: string, status: AssignmentStatus) => void;
  onNotesChange: (assignmentId: string, notes: string) => void;
  onGenerateSchedule: () => void;
  onCopyLast: () => void;
};

const statusStyles: Record<AssignmentStatus, { label: string; variant: "warning" | "neutral" | "success" | "danger" }> = {
  OPEN: { label: "OPEN", variant: "warning" },
  ASSIGNED: { label: "PENDING", variant: "neutral" },
  CONFIRMED: { label: "CONFIRMED", variant: "success" },
  DECLINED: { label: "DECLINED", variant: "danger" }
};

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
  onStatusChange,
  onNotesChange,
  onGenerateSchedule,
  onCopyLast
}: AssignmentsTableProps) {
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const serviceProfiles = useMemo(
    () => (Array.isArray(profiles) ? profiles : []).filter((profile) => profile.role === "SERVICE"),
    [profiles]
  );

  const roleById = useMemo(() => {
    return (Array.isArray(roles) ? roles : []).reduce<Record<string, RoleRow>>((acc, role) => {
      acc[role.id] = role;
      return acc;
    }, {});
  }, [roles]);

  const filteredAssignments = useMemo(() => {
    const filters: AssignmentStatus[] = [];
    if (showOpenOnly) filters.push("OPEN");
    if (showPendingOnly) filters.push("ASSIGNED");
    if (showDeclinedOnly) filters.push("DECLINED");

    return (Array.isArray(assignments) ? assignments : []).filter((assignment) => {
      if (Array.isArray(filters) && filters.length && !filters.includes(assignment.status as AssignmentStatus)) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const roleName = roleById[assignment.role_id]?.name ?? "";
      const profile = profiles.find((member) => member.id === assignment.assigned_user_id);
      const volunteerName = profile?.full_name || profile?.email || "";
      const haystack = `${roleName} ${volunteerName}`.toLowerCase();
      return haystack.includes(searchTerm.trim().toLowerCase());
    });
  }, [assignments, showOpenOnly, showPendingOnly, showDeclinedOnly, searchTerm, roleById, profiles]);

  return (
    <div className="border rounded bg-white p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="text-lg font-semibold text-[var(--ink)]">Assignments</div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <Badge variant="warning">OPEN</Badge>
          <Badge variant="neutral">PENDING</Badge>
          <Badge variant="success">CONFIRMED</Badge>
          <Badge variant="danger">DECLINED</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showOpenOnly}
            onChange={(event) => onToggleOpenOnly(event.target.checked)}
          />
          <span className="text-sm">Open only</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showPendingOnly}
            onChange={(event) => onTogglePendingOnly(event.target.checked)}
          />
          <span className="text-sm">Pending only</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showDeclinedOnly}
            onChange={(event) => onToggleDeclinedOnly(event.target.checked)}
          />
          <span className="text-sm">Declined only</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="Search by role or volunteer"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      {Array.isArray(serviceProfiles) && serviceProfiles.length === 0 && (
        <div className="flex flex-col items-center gap-2 p-6 mb-4">
          <span>No service team members yet.</span>
          <Link href="/people" className="w-full mt-2">
            <Button variant="secondary" size="sm" className="w-full">Add volunteers</Button>
          </Link>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="bg-[var(--surface-2)]">Role</th>
              <th className="bg-[var(--surface-2)]">Assigned to</th>
              <th className="bg-[var(--surface-2)]">Status</th>
              <th className="bg-[var(--surface-2)]">Notes</th>
              <th className="bg-[var(--surface-2)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredAssignments) && filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-[var(--muted)] text-sm py-8">
                  <div className="flex flex-col items-center gap-2">
                    <span>No schedule yet for this date.</span>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      <Button variant="primary" size="sm" onClick={onGenerateSchedule}>Generate schedule</Button>
                      <Button variant="secondary" size="sm" onClick={onCopyLast}>Copy last service</Button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              Array.isArray(filteredAssignments) && filteredAssignments.map((assignment) => {
                const roleName = roleById[assignment.role_id]?.name ?? "Role";
                const statusKey = assignment.status as AssignmentStatus;
                const status = statusStyles[statusKey];
                const assignedValue = assignment.assigned_user_id ?? "";
                const noteValue = notesDraft[assignment.id] ?? assignment.notes ?? "";
                return (
                  <tr key={assignment.id}>
                    <td>{roleName}</td>
                    <td>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={assignedValue}
                        onChange={(event) => onAssign(assignment.id, event.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {Array.isArray(serviceProfiles) && serviceProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.full_name || profile.email || profile.id}
                          </option>
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
                        onChange={(event) =>
                          setNotesDraft((prev) => ({ ...prev, [assignment.id]: event.target.value }))
                        }
                        onBlur={(event) => onNotesChange(assignment.id, event.target.value)}
                      />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => onStatusChange(assignment.id, "CONFIRMED")}>Confirm</Button>
                        <Button variant="secondary" size="sm" onClick={() => onStatusChange(assignment.id, "DECLINED")}>Decline</Button>
                        <Button variant="danger" size="sm" onClick={() => onUnassign(assignment.id)}>Unassign</Button>
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
