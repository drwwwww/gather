"use client";

import Link from "next/link";
import type { Role } from "@gather/lib";
import Badge from "../ui/Badge";

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
    <div className="card bg-base-100 shadow-md p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="card-title text-lg font-semibold">Members</div>
        <span className="text-xs text-base-content/60">{members.length} total</span>
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
                      <button className="btn btn-sm btn-primary" onClick={onGenerateSchedule}>Generate schedule</button>
                      <button className="btn btn-sm btn-outline" onClick={onCopyLast}>Copy last service</button>
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
                      className="text-left font-medium text-base-content hover:underline"
                      onClick={() => onViewDetails(member.id)}
                    >
                      {member.name || "(No name)"}
                    </button>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    {member.source === "invite" ? (
                      <span className="text-xs text-base-content/60">{member.role}</span>
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
                    <div className="dropdown dropdown-end">
                      <button tabIndex={0} className="btn btn-sm btn-outline">&#x22EF;</button>
                      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[1]">
                        <li>
                          <button onClick={() => onViewDetails(member.id)}>View</button>
                        </li>
                        {member.source === "invite" ? (
                          <li>
                            <button onClick={() => onCopyInvite(member.id)}>Copy invite</button>
                          </li>
                        ) : (
                          <li>
                            <button onClick={() => onToggleStatus(member.id, !member.disabled)} disabled={member.isCurrentUser}>
                              {member.disabled ? "Activate" : "Deactivate"}
                            </button>
                          </li>
                        )}
                        <li>
                          <button onClick={() => window.location.href = "/volunteers"}>Scheduling</button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
