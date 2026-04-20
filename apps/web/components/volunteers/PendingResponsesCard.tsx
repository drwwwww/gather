"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { PendingRow } from "../dashboard/PendingConfirmationsCard";
import Badge from "../ui/Badge";

type PendingResponsesCardProps = {
  items: PendingRow[];
  onFollowUp: () => void;
};

export default function PendingResponsesCard({ items, onFollowUp }: PendingResponsesCardProps) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="card shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title">Pending Responses</h2>
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
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <CheckCircle2 className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>All caught up</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>No pending responses. All assignments confirmed.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Role
                </th>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Assigned
                </th>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
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

