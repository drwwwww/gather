import { Card, CardTitle } from "../ui/card";

export default function RecentActivityCard({ items }: { items: string[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-base-200 bg-base-100 p-6 text-center text-sm">
          <p className="font-semibold text-[var(--gather-ink)]">No recent activity yet</p>
          <p className="mt-2 text-[var(--gather-muted)]">Actions will show here as your team responds.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-xl bg-base-100 p-3">
              <p className="font-semibold text-[var(--gather-ink)]">{item}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
