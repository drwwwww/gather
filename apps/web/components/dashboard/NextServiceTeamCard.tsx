import Badge from "../ui/Badge";


export type TeamRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

export default function NextServiceTeamCard({ items }: { items: TeamRow[] }) {
  return (
    <div className="card shadow-sm p-6">
      <h2 className="card-title mb-4">Next Service Team</h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <span style={{ color: "var(--text-muted)" }}>No assignments yet. Go to Volunteers to generate this week&apos;s schedule.</span>
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
