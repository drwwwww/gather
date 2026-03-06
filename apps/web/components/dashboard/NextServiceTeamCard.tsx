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
    <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)" }}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>Next Service Team</h2>
        <Link href="/volunteers" className="btn btn-secondary btn-sm">View full schedule</Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <span style={{ color: "var(--text-muted)" }}>No assignments yet. Generate this week's schedule to see your team.</span>
          <Link href="/volunteers" className="btn btn-secondary btn-sm mt-2 inline-flex">Generate schedule</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Role</th>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Assigned</th>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
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
