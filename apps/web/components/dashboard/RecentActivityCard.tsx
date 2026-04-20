


import { Activity } from "lucide-react";

export default function RecentActivityCard({ items }: { items: string[] }) {
  return (
    <div className="card shadow-sm p-6 h-full flex flex-col min-h-0">
      <h2 className="card-title mb-4 shrink-0">Recent Activity</h2>
      <div className="flex-1 flex flex-col min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center min-h-[12rem]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Activity className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No recent activity</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Actions will show here as your team responds.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm overflow-y-auto min-h-0">
            {items.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl p-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
