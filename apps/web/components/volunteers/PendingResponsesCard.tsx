"use client";

import Link from "next/link";
import type { PendingRow } from "../dashboard/PendingConfirmationsCard";
import Badge from "../ui/Badge";

type PendingResponsesCardProps = {
  items: PendingRow[];
  onFollowUp: () => void;
};

export default function PendingResponsesCard({ items, onFollowUp }: PendingResponsesCardProps) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="border rounded bg-white p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium text-[var(--ink)]">Pending Responses</h2>
        <div className="flex items-center gap-3">
          {safeItems.length > 0 ? (
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={onFollowUp}
            >
              Send reminders
            </button>
          ) : null}
          <Link href="/volunteers">
            <Badge variant="neutral">View all volunteers</Badge>
          </Link>
        </div>
      </div>
      {safeItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <span className="text-[var(--muted)]">
            No pending responses. All assignments confirmed.
          </span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">
                  Role
                </th>
                <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">
                  Assigned
                </th>
                <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {safeItems.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td>{row.role}</td>
                  <td>{row.assignee}</td>
                  <td>
                    <Badge variant={row.status === "DECLINED" ? "danger" : row.status === "CONFIRMED" ? "success" : "neutral"}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

