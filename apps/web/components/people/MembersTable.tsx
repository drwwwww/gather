"use client";

import { useEffect, useState } from "react";
import { Users, MoreHorizontal, Copy, Trash2, UserMinus, Shield, Wrench, User } from "lucide-react";
import { formatRelativeTime } from "../../lib/format";
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
  createdAt?: string;
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
  loading?: boolean;
};

const STATUS_META: Record<MemberStatus, { label: string; cls: string }> = {
  ACTIVE:  { label: "Active",  cls: "bg-green-50 text-green-700 ring-green-200"   },
  INACTIVE: { label: "Inactive", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  INVITED:  { label: "Invited",  cls: "bg-amber-50 text-amber-700 ring-amber-200"  },
};

const ROLE_META: Record<string, { icon: typeof Shield; label: string; cls: string }> = {
  ADMIN:   { icon: Shield,  label: "Admin",        cls: "text-purple-700 bg-purple-50"  },
  SERVICE: { icon: Wrench,  label: "Service Team",  cls: "text-blue-700   bg-blue-50"   },
  MEMBER:  { icon: User,    label: "Member",        cls: "text-slate-600  bg-slate-100" },
};

function memberInitials(name: string, email: string) {
  const n = name.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  return (email.split("@")[0] ?? "?").slice(0, 2).toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--surface-2)]" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded-full bg-[var(--surface-2)]" />
            <div className="h-3 w-36 rounded-full bg-[var(--surface-2)]" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="h-6 w-20 rounded-full bg-[var(--surface-2)]" /></td>
      <td className="px-4 py-4"><div className="h-6 w-16 rounded-full bg-[var(--surface-2)]" /></td>
      <td className="px-4 py-4"><div className="h-3 w-20 rounded-full bg-[var(--surface-2)]" /></td>
      <td className="py-4 pl-4 pr-6"><div className="ml-auto h-7 w-7 rounded-lg bg-[var(--surface-2)]" /></td>
    </tr>
  );
}

export default function MembersTable({
  members, roleOptions, onRoleChange, onToggleStatus, onViewDetails,
  onCopyInvite, onRemoveFromChurch, onRemoveInvite, error, loading = false,
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
    if (typeof window !== "undefined" && window.confirm(`Remove ${label} from this church? They can rejoin later with your church code.`)) {
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
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col style={{ width: "36%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-container-low)]">
            {["Member", "Role", "Status", "Joined", ""].map((col, i) => (
              <th key={i} className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] ${i === 0 ? "pl-6" : ""} ${i === 4 ? "pr-6" : ""}`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-14 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)]">
                    <Users className="h-6 w-6 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">No members found</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Try adjusting your search or filters.</p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            members.map((member) => {
              const initials = memberInitials(member.name || "", member.email);
              const avatarCls = avatarColor(member.name || member.email);
              const statusMeta = STATUS_META[member.status];
              const roleMeta = ROLE_META[member.role] ?? ROLE_META.MEMBER;
              const RoleIcon = roleMeta.icon;
              const joinedLabel = member.createdAt ? formatRelativeTime(member.createdAt) : "—";
              const isMenuOpen = openMenuId === member.id;
              const isRoleMenuOpen = openRoleMenuId === member.id;

              return (
                <tr
                  key={member.id}
                  className={`group cursor-pointer transition-colors hover:bg-[var(--surface-container-low)] ${member.disabled ? "opacity-60" : ""}`}
                  onClick={() => onViewDetails(member.id)}
                >
                  {/* Member: avatar + name + email */}
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarCls}`}>
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--text-primary)] group-hover:text-amber-700 transition-colors">
                          {member.name || "(No name)"}
                          {member.isCurrentUser && (
                            <span className="ml-2 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">You</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="relative px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    {member.source === "invite" ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleMeta.cls}`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleMeta.label}
                      </span>
                    ) : (
                      <div data-members-role-menu className="relative inline-block">
                        <button
                          type="button"
                          disabled={member.isCurrentUser}
                          onClick={() => setOpenRoleMenuId(isRoleMenuOpen ? null : member.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${roleMeta.cls} ${member.isCurrentUser ? "cursor-not-allowed opacity-70" : "hover:ring-1 hover:ring-current/30 cursor-pointer"}`}
                          aria-expanded={isRoleMenuOpen}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleMeta.label}
                        </button>
                        {isRoleMenuOpen && (
                          <ul className="absolute left-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg" role="listbox">
                            {roleOptions.map((role) => {
                              const rm = ROLE_META[role] ?? ROLE_META.MEMBER;
                              const RI = rm.icon;
                              return (
                                <li key={role} role="option" className="list-none">
                                  <button
                                    type="button"
                                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-2)] ${member.role === role ? "font-semibold text-amber-700" : "text-[var(--text-primary)]"}`}
                                    onClick={() => { onRoleChange(member.id, role); setOpenRoleMenuId(null); }}
                                  >
                                    <RI className="h-3.5 w-3.5" />
                                    {rm.label}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.cls}`}>
                      {statusMeta.label}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-4">
                    <span className="text-xs text-[var(--text-muted)]">{joinedLabel}</span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 pl-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div data-members-actions-menu className="relative inline-flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : member.id); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                        aria-expanded={isMenuOpen}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {isMenuOpen && (
                        <ul className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg" role="menu">
                          <li className="list-none">
                            <button type="button" role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
                              onClick={() => { onViewDetails(member.id); setOpenMenuId(null); }}>
                              <User className="h-4 w-4 text-[var(--text-muted)]" />
                              View profile
                            </button>
                          </li>
                          {member.source === "invite" ? (
                            <>
                              <li className="list-none">
                                <button type="button" role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
                                  onClick={() => { onCopyInvite(member.id); setOpenMenuId(null); }}>
                                  <Copy className="h-4 w-4 text-[var(--text-muted)]" />
                                  Copy invite link
                                </button>
                              </li>
                              <li className="list-none">
                                <button type="button" role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                                  onClick={() => confirmRemoveInvite(member.id, member.email)}>
                                  <Trash2 className="h-4 w-4" />
                                  Remove invite
                                </button>
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="list-none">
                                <button type="button" role="menuitem" disabled={member.isCurrentUser}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
                                  onClick={() => { onToggleStatus(member.id, !member.disabled); setOpenMenuId(null); }}>
                                  <UserMinus className="h-4 w-4 text-[var(--text-muted)]" />
                                  {member.disabled ? "Activate member" : "Deactivate member"}
                                </button>
                              </li>
                              <li className="list-none">
                                <button type="button" role="menuitem" disabled={member.isCurrentUser}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  onClick={() => confirmRemoveFromChurch(member.id, member.name || member.email)}>
                                  <Trash2 className="h-4 w-4" />
                                  Remove from church
                                </button>
                              </li>
                            </>
                          )}
                        </ul>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Footer count */}
      {!loading && members.length > 0 && (
        <div className="border-t border-[var(--border)] px-6 py-3">
          <p className="text-xs text-[var(--text-muted)]">{members.length} {members.length === 1 ? "member" : "members"}</p>
        </div>
      )}
    </div>
  );
}
