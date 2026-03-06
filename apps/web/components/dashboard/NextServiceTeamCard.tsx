import Link from "next/link";
import Badge from "../ui/Badge";


export type TeamRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

export default function NextServiceTeamCard({ items }: { items: TeamRow[] }) {
  return (
    <div className="border rounded bg-white p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium text-[var(--ink)]">Next Service Team</h2>
        <Link href="/volunteers">
          <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">View full schedule</span>
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <span className="text-[var(--muted)]">No assignments yet. Generate this week's schedule to see your team.</span>
          <Link href="/volunteers">
            <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs mt-2">Generate schedule</span>
          </Link>
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
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
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

function statusVariant(status: string) {
  if (status === "CONFIRMED") return "success";
  if (status === "ASSIGNED") return "warning";
  return "neutral";
}
