"use client";

import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";

type PendingItem = {
  id: string;
  role: string;
  assignee: string;
};

type PendingResponsesCardProps = {
  items: PendingItem[];
  onFollowUp: () => void;
};

export default function PendingResponsesCard({ items, onFollowUp }: PendingResponsesCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Pending confirmations</CardTitle>
        <span className="text-xs text-[var(--gather-muted)]">{items.length} pending</span>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {items.length === 0 ? (
          <p className="text-[var(--gather-muted)]">No pending confirmations.</p>
        ) : (
          items.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-xl p-3" style={{ background: 'var(--gather-surface)' }}>
              <p className="font-medium" style={{ color: 'var(--ink)' }}>{item.role}</p>
              <p style={{ color: 'var(--muted)' }}>{item.assignee}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-4">
        <Button size="sm" variant="outline" onClick={onFollowUp}>Resend request</Button>
      </div>
    </Card>
  );
}
