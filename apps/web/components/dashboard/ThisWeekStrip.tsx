import { Card } from "../ui/card";

export type ThisWeekStripData = {
  nextServiceLabel: string;
  openSlots: number;
  pendingConfirmations: number;
  scheduledAnnouncements: number;
  eventsThisWeek: number;
};

export default function ThisWeekStrip({
  nextServiceLabel,
  openSlots,
  pendingConfirmations,
  scheduledAnnouncements,
  eventsThisWeek
}: ThisWeekStripData) {
  const items = [
    { label: "Next service", value: nextServiceLabel },
    { label: "Open volunteer slots", value: openSlots.toString() },
    { label: "Pending confirmations", value: pendingConfirmations.toString() },
    { label: "Announcements scheduled", value: scheduledAnnouncements.toString() },
    { label: "Events this week", value: eventsThisWeek.toString() }
  ];

  return (
    <Card className="rounded-2xl">
      <div className="grid gap-4 md:grid-cols-5">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`flex flex-col gap-1 ${index === 0 ? "" : "md:border-l md:border-[var(--gather-divider)] md:pl-4"}`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">{item.label}</p>
            <p className="text-sm font-semibold text-[var(--gather-ink)]">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
