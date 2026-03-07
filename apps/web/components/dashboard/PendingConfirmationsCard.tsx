import Link from "next/link";
import Badge from "../ui/Badge";


export type PendingRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

export default function PendingConfirmationsCard({ items }: { items: PendingRow[] }) {
  return (
    <div className="card shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title">Pending Responses</h2>
        {items.length > 0 && (
          <Link href="/volunteers" className="btn btn-primary btn-sm">Resolve assignments</Link>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6 border rounded-xl" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <span style={{ color: "var(--text-muted)" }}>Everyone is caught up for this service.</span>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl p-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{item.role}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.assignee}</p>
              </div>
              <Badge variant={item.status === "DECLINED" ? "danger" : "neutral"}>
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
