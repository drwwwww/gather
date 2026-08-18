"use client";

import type { ReactNode } from "react";
import { X, Calendar, Shield, Wrench, User, Trash2, Copy, Mail } from "lucide-react";

type MemberAssignment = {
  id: string;
  role: string;
  serviceLabel: string;
};

type MemberDetailsDrawerProps = {
  open: boolean;
  memberName: string;
  memberEmail: string;
  roleLabel: string;
  statusLabel: string;
  source: "member" | "invite";
  assignments: MemberAssignment[];
  joinedAt?: string;
  onClose: () => void;
  onRemoveFromChurch?: () => void;
  onRemoveInvite?: () => void;
  onCopyInvite?: () => void;
  removeFromChurchDisabled?: boolean;
  children?: ReactNode;
};

const ROLE_META: Record<string, { icon: typeof Shield; label: string; color: string }> = {
  ADMIN:   { icon: Shield,  label: "Admin",       color: "text-purple-700 bg-purple-50 ring-purple-200" },
  SERVICE: { icon: Wrench,  label: "Service Team", color: "text-blue-700 bg-blue-50 ring-blue-200"       },
  MEMBER:  { icon: User,    label: "Member",       color: "text-slate-600 bg-slate-100 ring-slate-200"   },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: "Active",   color: "text-green-700 bg-green-50 ring-green-200"  },
  INACTIVE: { label: "Inactive", color: "text-slate-500 bg-slate-100 ring-slate-200" },
  INVITED:  { label: "Invited",  color: "text-amber-700 bg-amber-50 ring-amber-200"  },
};

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

function initials(name: string, email: string) {
  const n = name.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  return (email.split("@")[0] ?? "?").slice(0, 2).toUpperCase() || "?";
}

export default function MemberDetailsDrawer({
  open, memberName, memberEmail, roleLabel, statusLabel, source,
  assignments, joinedAt, onClose, onRemoveFromChurch, onRemoveInvite,
  onCopyInvite, removeFromChurchDisabled, children,
}: MemberDetailsDrawerProps) {
  if (!open) return null;

  const roleMeta   = ROLE_META[roleLabel]   ?? ROLE_META.MEMBER;
  const statusMeta = STATUS_META[statusLabel] ?? STATUS_META.ACTIVE;
  const RoleIcon   = roleMeta.icon;
  const avatarCls  = avatarColor(memberName || memberEmail);
  const memberInitials = initials(memberName, memberEmail);

  const confirmRemove = () => {
    if (removeFromChurchDisabled || !onRemoveFromChurch) return;
    const label = memberName?.trim() || memberEmail || "this member";
    if (typeof window !== "undefined" && window.confirm(`Remove ${label} from this church? They can rejoin later with your church code.`))
      onRemoveFromChurch();
  };

  const confirmRemoveInvite = () => {
    if (!onRemoveInvite) return;
    if (typeof window !== "undefined" && window.confirm(`Remove the invite for ${memberEmail}?`))
      onRemoveInvite();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[50] bg-black/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-[51] flex h-full w-full max-w-[400px] flex-col border-l border-[var(--border)] bg-[var(--surface-container-lowest)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {source === "invite" ? "Pending invite" : "Member profile"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Identity */}
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold ${avatarCls}`}>
                {memberInitials}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-[var(--text-primary)]">
                  {memberName || "(No name)"}
                </h2>
                <p className="truncate text-sm text-[var(--text-muted)]">{memberEmail}</p>
                {joinedAt && (
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Joined {new Date(joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            {/* Role + Status chips */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${roleMeta.color}`}>
                <RoleIcon className="h-3 w-3" />
                {roleMeta.label}
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <a
                href={`mailto:${memberEmail}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-container-low)]"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
              {source === "invite" && onCopyInvite && (
                <button
                  type="button"
                  onClick={onCopyInvite}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-container-low)]"
                >
                  <Copy className="h-4 w-4" />
                  Copy invite
                </button>
              )}
            </div>
          </div>

          {/* Upcoming assignments */}
          <div className="border-t border-[var(--border)] px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Upcoming assignments</h3>
              {assignments.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  {assignments.length}
                </span>
              )}
            </div>
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-[var(--border)] px-4 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
                  <Calendar className="h-5 w-5 text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">No upcoming assignments</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">This person has no scheduled roles.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
                      <Calendar className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{a.role}</p>
                      <p className="text-xs text-[var(--text-muted)]">{a.serviceLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {children}
        </div>

        {/* Footer danger actions */}
        {(onRemoveInvite || onRemoveFromChurch) && (
          <div className="border-t border-[var(--border)] px-6 py-5">
            {source === "invite" && onRemoveInvite && (
              <button
                type="button"
                onClick={confirmRemoveInvite}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Remove invite
              </button>
            )}
            {source === "member" && onRemoveFromChurch && (
              <button
                type="button"
                disabled={!!removeFromChurchDisabled}
                onClick={confirmRemove}
                title={removeFromChurchDisabled ? "Cannot remove the last administrator." : undefined}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Remove from church
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
