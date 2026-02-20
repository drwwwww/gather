"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Database } from "@gather/lib";
import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

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

const statusStyles: Record<AssignmentStatus, { label: string; className: string }> = {
  OPEN: { label: "OPEN", className: "badge badge-warning" },
  ASSIGNED: { label: "PENDING", className: "badge badge-ghost" },
  CONFIRMED: { label: "CONFIRMED", className: "badge badge-success" },
  DECLINED: { label: "DECLINED", className: "badge badge-error" }
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
    () => profiles.filter((profile) => profile.role === "SERVICE"),
    [profiles]
  );

  const roleById = useMemo(() => {
    return roles.reduce<Record<string, RoleRow>>((acc, role) => {
      acc[role.id] = role;
      return acc;
    }, {});
  }, [roles]);

  const filteredAssignments = useMemo(() => {
    const filters: AssignmentStatus[] = [];
    if (showOpenOnly) filters.push("OPEN");
    if (showPendingOnly) filters.push("ASSIGNED");
    if (showDeclinedOnly) filters.push("DECLINED");

    return assignments.filter((assignment) => {
      if (filters.length && !filters.includes(assignment.status as AssignmentStatus)) {
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
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Assignments</CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--gather-muted)]">
          <span>OPEN</span>
          <span>ASSIGNED</span>
          <span>CONFIRMED</span>
          <span>DECLINED</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showOpenOnly}
            onChange={(event) => onToggleOpenOnly(event.target.checked)}
          />
          Open only
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showPendingOnly}
            onChange={(event) => onTogglePendingOnly(event.target.checked)}
          />
          Pending only
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showDeclinedOnly}
            onChange={(event) => onToggleDeclinedOnly(event.target.checked)}
          />
          Declined only
        </label>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search by role or volunteer"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      {serviceProfiles.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-base-300 p-4 text-sm">
          <p className="text-[var(--gather-muted)]">No service team members yet.</p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link href="/people">Add volunteers</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Assigned to</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-sm text-[var(--gather-muted)]">
                  <div className="space-y-2">
                    <p>No schedule yet for this date.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button size="sm" onClick={onGenerateSchedule}>Generate schedule</Button>
                      <Button size="sm" variant="outline" onClick={onCopyLast}>Copy last service</Button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAssignments.map((assignment) => {
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
                        className="select select-bordered select-sm"
                        value={assignedValue}
                        onChange={(event) => onAssign(assignment.id, event.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {serviceProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.full_name || profile.email || profile.id}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={status.className}>{status.label}</span>
                    </td>
                    <td>
                      <Input
                        className="input-sm"
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
                        <Button size="sm" variant="outline" onClick={() => onStatusChange(assignment.id, "CONFIRMED")}>
                          Confirm
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onStatusChange(assignment.id, "DECLINED")}>
                          Decline
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onUnassign(assignment.id)}>
                          Clear
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
