
import Link from "next/link";
import { Button } from "../ui/Button";

export type PendingRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

export default function PendingConfirmationsCard({ items }: { items: PendingRow[] }) {
  return (
    <div className="card bg-base-100 border border-base-300 rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium text-base-content">Pending Responses</h2>
        <Button asChild variant="secondary" className="h-10 px-4">
          <Link href="/volunteers">Resolve assignments</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="alert alert-info flex flex-col items-center gap-2 p-6">
          <span className="text-base-content/60">Everyone is caught up for this service.</span>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl p-3 bg-base-100">
              <div>
                <p className="font-medium text-base-content">{item.role}</p>
                <p className="text-xs text-base-content/60">{item.assignee}</p>
              </div>
              <span className={
                item.status === "DECLINED"
                  ? "badge badge-warning"
                  : "badge bg-[var(--muted)] text-white"
              }>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
