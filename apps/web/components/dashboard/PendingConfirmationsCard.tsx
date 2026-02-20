import Link from "next/link";
import { Card, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export type PendingRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

export default function PendingConfirmationsCard({ items }: { items: PendingRow[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Pending Responses</CardTitle>
        <Link href="/volunteers" className="btn btn-outline btn-sm">
          Resolve assignments
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm" style={{ background: 'var(--gather-surface)', borderColor: 'var(--border)' }}>
          <p className="font-semibold" style={{ color: 'var(--ink)' }}>No pending responses</p>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>Everyone is caught up for this service.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--gather-surface)' }}>
              <div>
                <p className="font-semibold" style={{ color: 'var(--ink)' }}>{item.role}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.assignee}</p>
              </div>
              <Badge variant={item.status === "DECLINED" ? "warning" : "neutral"}>{item.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
