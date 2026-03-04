"use client";



type DeclinedItem = {
  id: string;
  role: string;
  detail: string;
};

type DeclinedCardProps = {
  items: DeclinedItem[];
};

export default function DeclinedCard({ items }: DeclinedCardProps) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <div className="card bg-base-100 shadow-md p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="card-title text-lg font-semibold">Declined</div>
        <span className="text-xs text-[var(--gather-muted)]">{safeItems.length} declined</span>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {safeItems.length === 0 ? (
          <p className="text-[var(--gather-muted)]">No declined assignments.</p>
        ) : (
          safeItems.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-xl p-3 bg-base-100">
              <p className="font-medium text-base-content">{item.role}</p>
              <p className="text-base-content/70">{item.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
