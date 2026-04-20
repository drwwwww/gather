"use client";



import { XCircle } from "lucide-react";

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
    <div className="card shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="card-title">Declined</div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{safeItems.length} declined</span>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {safeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <XCircle className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No declined assignments</p>
            </div>
          </div>
        ) : (
          safeItems.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-xl p-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>{item.role}</p>
              <p style={{ color: "var(--text-muted)" }}>{item.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
