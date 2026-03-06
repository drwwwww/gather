


export default function RecentActivityCard({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)" }}>
      <div className="mb-8">
        <h2 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <span className="text-center" style={{ color: "var(--text-muted)" }}>No recent activity yet. Actions will show here as your team responds.</span>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-xl p-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
