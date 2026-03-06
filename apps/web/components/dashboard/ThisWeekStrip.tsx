

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
    <>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border p-5 flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)" }}
        >
          <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{item.label}</span>
          <span className="mt-2 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{item.value}</span>
        </div>
      ))}
    </>
  );
}
