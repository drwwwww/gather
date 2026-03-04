import Link from "next/link";

"use client";

// DaisyUI migration: use className markup for all UI


type PendingItem = {
  id: string;
  role: string;
  assignee: string;
};

type PendingResponsesCardProps = {
  items: PendingItem[];
  onFollowUp: () => void;
};

export default function PendingResponsesCard({ items, onFollowUp }: PendingResponsesCardProps) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
  export default function PendingResponsesCard({ items }: { items: PendingRow[] }) {
    return (
      <div className="border rounded bg-white p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-medium text-[var(--ink)]">Pending Responses</h2>
          <Link href="/volunteers">
            <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">View all volunteers</span>
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6">
            <span className="text-[var(--muted)]">No pending responses. All assignments confirmed.</span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Role</th>
                  <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Assigned</th>
                  <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td>{row.role}</td>
                    <td>{row.assignee}</td>
                    <td>
                      <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
