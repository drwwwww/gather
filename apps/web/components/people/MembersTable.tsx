"use client";

import { useRef, useEffect, useState } from "react";
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setOpenMenuId(null);
      if (roleMenuRef.current && !roleMenuRef.current.contains(target)) setOpenRoleMenuId(null);
    };
    if (openMenuId || openRoleMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId, openRoleMenuId]);

  return (
    <div className="card shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div className="card-title">Members</div>
        <span className="text-xs text-base-content/60">{members.length} total</span>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <div className="mt-5 overflow-visible rounded-xl">
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
                  <td className="relative">
                    {member.source === "invite" ? (
                      <span className="text-xs text-base-content/60">{member.role}</span>
                    ) : (
                      <div ref={roleMenuRef} className="relative inline-block">
                        <button
                          type="button"
                          className="select select-bordered select-sm flex min-w-[100px] items-center justify-between gap-2"
                          style={{ borderRadius: "var(--radius-box)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!member.isCurrentUser) setOpenRoleMenuId((id) => (id === member.id ? null : member.id));
                          }}
                          disabled={member.isCurrentUser}
                          aria-expanded={openRoleMenuId === member.id}
                          aria-haspopup="listbox"
                        >
                          <span>{member.role}</span>
                          <svg className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openRoleMenuId === member.id ? (
                          <ul
                            className="dropdown-menu absolute left-0 top-full mt-2 flex min-w-[100px] flex-col gap-0.5 p-2"
                            role="listbox"
                          >
                            {roleOptions.map((role) => (
                              <li key={role} role="option" className="list-none">
                                <button
                                  type="button"
                                  className={`dropdown-menu-item ${member.role === role ? "font-semibold" : ""}`}
                                  onClick={() => {
                                    onRoleChange(member.id, role);
                                    setOpenRoleMenuId(null);
                                  }}
                                >
                                  {role}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge variant={statusVariant[member.status]}>{member.status}</Badge>
                  </td>
                  <td className="relative">
                    <div ref={menuRef} className="relative inline-block">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((id) => (id === member.id ? null : member.id));
                        }}
                        aria-expanded={openMenuId === member.id}
                        aria-haspopup="true"
                      >
                        &#x22EF;
                      </button>
                      {openMenuId === member.id ? (
                        <ul className="dropdown-menu absolute right-0 top-full mt-2 flex w-48 flex-col gap-0.5 p-2" role="menu">
                          <li role="none" className="list-none">
                            <button type="button" role="menuitem" className="dropdown-menu-item" onClick={() => { onViewDetails(member.id); setOpenMenuId(null); }}>View</button>
                          </li>
                          {member.source === "invite" ? (
                            <li role="none" className="list-none">
                              <button type="button" role="menuitem" className="dropdown-menu-item" onClick={() => { onCopyInvite(member.id); setOpenMenuId(null); }}>Copy invite</button>
                            </li>
                          ) : (
                            <li role="none" className="list-none">
                              <button type="button" role="menuitem" className="dropdown-menu-item disabled:opacity-50 disabled:hover:bg-transparent" onClick={() => { onToggleStatus(member.id, !member.disabled); setOpenMenuId(null); }} disabled={member.isCurrentUser}>
                                {member.disabled ? "Activate" : "Deactivate"}
                              </button>
                            </li>
                          )}
                          <li role="none" className="list-none">
                            <button type="button" role="menuitem" className="dropdown-menu-item" onClick={() => { setOpenMenuId(null); window.location.href = "/volunteers"; }}>Scheduling</button>
                          </li>
                        </ul>
                      ) : null}
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
