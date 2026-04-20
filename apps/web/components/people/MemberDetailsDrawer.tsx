"use client";

import type { ReactNode } from "react";
import { Calendar } from "lucide-react";
import { Button } from "../ui/button";

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
  onClose: () => void;
  onRemoveFromChurch?: () => void;
  onRemoveInvite?: () => void;
  removeFromChurchDisabled?: boolean;
  children?: ReactNode;
};

export default function MemberDetailsDrawer({
  open,
  memberName,
  memberEmail,
  roleLabel,
  statusLabel,
  source,
  assignments,
  onClose,
  onRemoveFromChurch,
  onRemoveInvite,
  removeFromChurchDisabled,
  children
}: MemberDetailsDrawerProps) {
  if (!open) return null;

  const handleRemoveFromChurchClick = () => {
    if (removeFromChurchDisabled || !onRemoveFromChurch) return;
    const label = memberName?.trim() || memberEmail || "this member";
    if (
      typeof window !== "undefined" &&
      window.confirm(`Remove ${label} from this church? They can rejoin later with your church code.`)
    ) {
      onRemoveFromChurch();
    }
  };

  const handleRemoveInviteClick = () => {
    if (!onRemoveInvite) return;
    const label = memberEmail || "this invite";
    if (typeof window !== "undefined" && window.confirm(`Remove the invite for ${label}?`)) {
      onRemoveInvite();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-[var(--surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Member details</p>
            <p className="truncate text-lg font-semibold text-base-content">{memberName}</p>
            <p className="break-words text-sm text-base-content/60">{memberEmail}</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="card shadow-sm p-4">
            <div className="space-y-2 text-sm">
              <p className="text-base-content/60">Role</p>
              <p className="font-medium text-base-content">{roleLabel}</p>
              <p className="text-base-content/60">Status</p>
              <p className="font-medium text-base-content">{statusLabel}</p>
            </div>
          </div>

          <div className="card shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="card-title">Upcoming assignments</div>
              <span className="text-xs text-base-content/60">{assignments.length} next</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
                    <Calendar className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No upcoming assignments</p>
                  </div>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl bg-[var(--surface)] p-3">
                    <p className="font-medium text-base-content">{assignment.role}</p>
                    <p className="text-base-content/60">{assignment.serviceLabel}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {source === "invite" && onRemoveInvite ? (
            <div className="border-t border-[var(--border)] pt-4">
              <Button type="button" variant="danger" className="w-full" onClick={handleRemoveInviteClick}>
                Remove invite
              </Button>
            </div>
          ) : null}

          {source === "member" && onRemoveFromChurch ? (
            <div className="border-t border-[var(--border)] pt-4">
              <Button
                type="button"
                variant="danger"
                className="w-full"
                disabled={!!removeFromChurchDisabled}
                title={
                  removeFromChurchDisabled
                    ? "You cannot remove the last administrator from the church."
                    : undefined
                }
                onClick={handleRemoveFromChurchClick}
              >
                Remove from church
              </Button>
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
}
