
import { Card } from "../ui/Card";

export default function RecentActivityCard({ items }: { items: string[] }) {
  return (
    <Card>
      <div className="mb-8">
        <h2 className="section-title">Recent Activity</h2>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <span className="meta-text text-center">No recent activity yet. Actions will show here as your team responds.</span>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-xl bg-white p-3 border border-[var(--border)]">
              <p className="font-medium text-[14px] text-[var(--ink)]">{item}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
