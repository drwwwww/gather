"use client";

import type { ReactNode } from "react";
// DaisyUI migration: use className markup for all UI

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
  assignments: MemberAssignment[];
  onClose: () => void;
  children?: ReactNode;
};

export default function MemberDetailsDrawer({
  open,
  memberName,
  memberEmail,
  roleLabel,
  statusLabel,
  assignments,
  onClose,
  children
}: MemberDetailsDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md bg-[var(--surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Member details</p>
            <p className="text-lg font-semibold text-base-content">{memberName}</p>
            <p className="text-sm text-base-content/60">{memberEmail}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
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
                <p className="text-base-content/60">No upcoming assignments.</p>
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

          {children}
        </div>
      </div>
    </div>
  );
}
