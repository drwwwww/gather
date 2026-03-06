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
    <div className="rounded-2xl border p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)" }}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>Pending Responses</h2>
        <Link href="/volunteers" className="btn btn-primary">Resolve assignments</Link>
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
