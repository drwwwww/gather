"use client";

import { Card, CardTitle } from "../ui/card";

type DeclinedItem = {
  id: string;
  role: string;
  detail: string;
};

type DeclinedCardProps = {
  items: DeclinedItem[];
};

export default function DeclinedCard({ items }: DeclinedCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Declined</CardTitle>
        <span className="text-xs text-[var(--gather-muted)]">{items.length} declined</span>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {items.length === 0 ? (
          <p className="text-[var(--gather-muted)]">No declined assignments.</p>
        ) : (
          items.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-xl p-3" style={{ background: 'var(--gather-surface)' }}>
              <p className="font-medium" style={{ color: 'var(--ink)' }}>{item.role}</p>
              <p style={{ color: 'var(--muted)' }}>{item.detail}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
