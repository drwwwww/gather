"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuItem } from "../ui/DropdownMenu";
import { Card, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import type { Role } from "@gather/lib";

export type MemberStatus = "ACTIVE" | "INACTIVE" | "INVITED";

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  disabled: boolean;
  source: "member" | "invite";
  isCurrentUser: boolean;
};

type MembersTableProps = {
  members: MemberRow[];
  roleOptions: Role[];
  onRoleChange: (memberId: string, role: Role) => void;
  onToggleStatus: (memberId: string, disabled: boolean) => void;
  onViewDetails: (memberId: string) => void;
  onCopyInvite: (memberId: string) => void;
  onGenerateSchedule: () => void;
  onCopyLast: () => void;
  error?: string | null;
};

const statusVariant: Record<MemberStatus, "default" | "success" | "warning" | "neutral"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  INVITED: "neutral"
};

export default function MembersTable({
  members,
  roleOptions,
  onRoleChange,
  onToggleStatus,
  onViewDetails,
  onCopyInvite,
  onGenerateSchedule,
  onCopyLast,
  error
}: MembersTableProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Members</CardTitle>
        <span className="text-xs text-[var(--gather-muted)]">{members.length} total</span>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <div className="mt-4 rounded-2xl bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-sm text-[var(--gather-muted)]">
                  <div className="space-y-2">
                    <p>No members found.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button size="sm" onClick={onGenerateSchedule}>Generate schedule</Button>
                      <Button size="sm" variant="outline" onClick={onCopyLast}>Copy last service</Button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className={member.disabled ? "opacity-60" : ""}>
                  <td>
                    <button
                      type="button"
                      className="text-left font-medium text-[var(--gather-ink)] hover:underline"
                      onClick={() => onViewDetails(member.id)}
                    >
                      {member.name || "(No name)"}
                    </button>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    {member.source === "invite" ? (
                      <span className="text-xs text-[var(--gather-muted)]">{member.role}</span>
                    ) : (
                      <select
                        className="select select-bordered select-sm"
                        value={member.role}
                        onChange={(event) => onRoleChange(member.id, event.target.value as Role)}
                        disabled={member.isCurrentUser}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <Badge variant={statusVariant[member.status]}>{member.status}</Badge>
                  </td>
                  <td>
                    <DropdownMenu
                      trigger={<Button size="sm" variant="outline">&#x22EF;</Button>}
                    >
                        <DropdownMenuItem onClick={() => onViewDetails(member.id)}>
                          View
                        </DropdownMenuItem>
                      {member.source === "invite" ? (
                        <DropdownMenuItem onClick={() => onCopyInvite(member.id)}>
                          Copy invite
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(member.id, !member.disabled)}
                          disabled={member.isCurrentUser}
                        >
                          {member.disabled ? "Activate" : "Deactivate"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => window.location.href = "/volunteers"}>
                        Scheduling
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
