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
    <div className="border rounded-2xl bg-white shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium text-gray-900">Pending Responses</h2>
        <Link href="/volunteers" className="inline-flex items-center justify-center h-10 px-4 rounded-xl font-medium text-sm bg-[var(--primary)] text-white border-0 hover:bg-[var(--primary-hover)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2">Resolve assignments</Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6 border rounded bg-blue-50">
          <span className="text-gray-500">Everyone is caught up for this service.</span>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl p-3 bg-white border">
              <div>
                <p className="font-medium text-gray-900">{item.role}</p>
                <p className="text-xs text-gray-500">{item.assignee}</p>
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
