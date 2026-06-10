"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
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
  onRemoveFromChurch: (memberId: string) => void;
  onRemoveInvite: (memberId: string) => void;
  error?: string | null;
};

const statusVariant: Record<MemberStatus, "default" | "success" | "warning" | "neutral"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  INVITED: "neutral"
};

function memberRowInitials(name: string, email: string) {
  const n = name.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0];
      const b = parts[parts.length - 1][0];
      if (a && b) return `${a}${b}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = (email.split("@")[0] ?? "?").trim();
  return local.slice(0, 2).toUpperCase() || "?";
}

export default function MembersTable({
  members,
  roleOptions,
  onRoleChange,
  onToggleStatus,
  onViewDetails,
  onCopyInvite,
  onRemoveFromChurch,
  onRemoveInvite,
  error
}: MembersTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-members-role-menu]")) setOpenRoleMenuId(null);
      if (!target.closest("[data-members-actions-menu]")) setOpenMenuId(null);
    };
    if (openMenuId || openRoleMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId, openRoleMenuId]);

  const confirmRemoveFromChurch = (memberId: string, label: string) => {
    if (
      typeof window !== "undefined" &&
      window.confirm(`Remove ${label} from this church? They can rejoin later with your church code.`)
    ) {
      onRemoveFromChurch(memberId);
    }
    setOpenMenuId(null);
  };

  const confirmRemoveInvite = (memberId: string, label: string) => {
    if (typeof window !== "undefined" && window.confirm(`Remove the invite for ${label}?`)) {
      onRemoveInvite(memberId);
    }
    setOpenMenuId(null);
  };

  return (
    <div className="card card-elevated p-5 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="card-title shrink-0">Members</div>
        <span className="text-xs text-base-content/60 shrink-0">{members.length} total</span>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <div className="mt-5 min-w-0 rounded-xl">
        <table className="table table-fixed w-full min-w-0">
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="min-w-0">Name</th>
              <th className="min-w-0">Email</th>
              <th className="min-w-0">Role</th>
              <th className="min-w-0">Status</th>
              <th className="min-w-0 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0 border-0">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-b-xl border-t-0 bg-[var(--surface)] px-6 py-12 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
                      <Users className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No members found</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Invite people to join your church.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className={`group transition-colors duration-200 hover:bg-[rgb(255,247,230,0.35)] ${member.disabled ? "opacity-60" : ""}`}
                >
                  <td className="min-w-0 align-middle">
                    <button
                      type="button"
                      className="flex max-w-full items-center gap-3 truncate text-left"
                      title={member.name || "(No name)"}
                      onClick={() => onViewDetails(member.id)}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--surface-container-low)] bg-[var(--surface-container-low)] text-xs font-bold text-[var(--nav-active-foreground)]"
                        aria-hidden
                      >
                        {memberRowInitials(member.name || "", member.email)}
                      </span>
                      <span className="min-w-0 truncate font-medium text-base-content group-hover:text-[var(--nav-active-foreground)] group-hover:underline">
                        {member.name || "(No name)"}
                      </span>
                    </button>
                  </td>
                  <td className="min-w-0 align-middle">
                    <span className="block max-w-full truncate text-sm" title={member.email}>
                      {member.email}
                    </span>
                  </td>
                  <td className="relative min-w-0 align-middle">
                    {member.source === "invite" ? (
                      <span
                        className="inline-flex h-7 min-w-[7.5rem] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-semibold leading-none whitespace-nowrap text-[var(--text-primary)]"
                      >
                        {member.role}
                      </span>
                    ) : (
                      <div data-members-role-menu className="relative inline-block shrink-0">
                        <button
                          type="button"
                          className="inline-flex h-7 min-w-[7.5rem] items-center justify-between gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-semibold leading-none whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!member.isCurrentUser) setOpenRoleMenuId((id) => (id === member.id ? null : member.id));
                          }}
                          disabled={member.isCurrentUser}
                          aria-expanded={openRoleMenuId === member.id}
                          aria-haspopup="listbox"
                        >
                          <span>{member.role}</span>
                          <svg className="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openRoleMenuId === member.id ? (
                          <ul
                            className="dropdown-menu absolute left-0 top-full z-50 mt-2 flex min-w-[100px] flex-col gap-0.5 p-2"
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
                  <td className="min-w-0 align-middle">
                    <Badge variant={statusVariant[member.status]}>{member.status}</Badge>
                  </td>
                  <td className="relative min-w-0 align-middle text-right">
                    <div data-members-actions-menu className="relative inline-flex justify-end">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square shrink-0"
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
                        <ul
                          className="dropdown-menu absolute right-0 top-full z-50 mt-2 flex w-52 flex-col gap-0.5 p-2"
                          role="menu"
                        >
                          <li role="none" className="list-none">
                            <button
                              type="button"
                              role="menuitem"
                              className="dropdown-menu-item"
                              onClick={() => {
                                onViewDetails(member.id);
                                setOpenMenuId(null);
                              }}
                            >
                              View
                            </button>
                          </li>
                          {member.source === "invite" ? (
                            <>
                              <li role="none" className="list-none">
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="dropdown-menu-item"
                                  onClick={() => {
                                    onCopyInvite(member.id);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  Copy invite
                                </button>
                              </li>
                              <li role="none" className="list-none">
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="dropdown-menu-item text-error"
                                  onClick={() => confirmRemoveInvite(member.id, member.email)}
                                >
                                  Remove invite
                                </button>
                              </li>
                            </>
                          ) : (
                            <>
                              <li role="none" className="list-none">
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="dropdown-menu-item disabled:opacity-50 disabled:hover:bg-transparent"
                                  onClick={() => {
                                    onToggleStatus(member.id, !member.disabled);
                                    setOpenMenuId(null);
                                  }}
                                  disabled={member.isCurrentUser}
                                >
                                  {member.disabled ? "Activate" : "Deactivate"}
                                </button>
                              </li>
                              <li role="none" className="list-none">
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="dropdown-menu-item disabled:opacity-50 disabled:hover:bg-transparent"
                                  onClick={() =>
                                    confirmRemoveFromChurch(member.id, member.name || member.email)
                                  }
                                  disabled={member.isCurrentUser}
                                >
                                  Remove from church
                                </button>
                              </li>
                            </>
                          )}
                          <li role="none" className="list-none">
                            <button
                              type="button"
                              role="menuitem"
                              className="dropdown-menu-item"
                              onClick={() => {
                                setOpenMenuId(null);
                                window.location.href = "/volunteers";
                              }}
                            >
                              Scheduling
                            </button>
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
