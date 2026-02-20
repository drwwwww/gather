"use client";

import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";

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
      <div className="h-full w-full max-w-md bg-[var(--gather-surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Member details</p>
            <p className="text-lg font-semibold text-[var(--gather-ink)]">{memberName}</p>
            <p className="text-sm text-[var(--gather-muted)]">{memberEmail}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="mt-4 space-y-4">
          <Card>
            <div className="space-y-2 text-sm">
              <p className="text-[var(--gather-muted)]">Role</p>
              <p className="font-medium text-[var(--gather-ink)]">{roleLabel}</p>
              <p className="text-[var(--gather-muted)]">Status</p>
              <p className="font-medium text-[var(--gather-ink)]">{statusLabel}</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming assignments</CardTitle>
              <span className="text-xs text-[var(--gather-muted)]">{assignments.length} next</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {assignments.length === 0 ? (
                <p className="text-[var(--gather-muted)]">No upcoming assignments.</p>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl bg-base-100 p-3">
                    <p className="font-medium text-[var(--gather-ink)]">{assignment.role}</p>
                    <p className="text-[var(--gather-muted)]">{assignment.serviceLabel}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {children}
        </div>
      </div>
    </div>
  );
}
