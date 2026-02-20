import { Card } from "../ui/card";

export type KpiRowData = {
  members: number;
  volunteers: number;
  rsvpsThisWeek: number;
};

export default function KpiRow({ members, volunteers, rsvpsThisWeek }: KpiRowData) {
  const items = [
    { label: "Members", value: members.toString() },
    { label: "Volunteers", value: volunteers.toString() },
    { label: "RSVPs this week", value: rsvpsThisWeek.toString() }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">{item.label}</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--gather-ink)]">{item.value}</div>
        </Card>
      ))}
    </div>
  );
}
