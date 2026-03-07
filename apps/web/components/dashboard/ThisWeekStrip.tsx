

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
          className="card shadow-sm px-4 py-3 flex flex-col justify-center min-h-0"
        >
          <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{item.label}</span>
          <span className="mt-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{item.value}</span>
        </div>
      ))}
    </>
  );
}
