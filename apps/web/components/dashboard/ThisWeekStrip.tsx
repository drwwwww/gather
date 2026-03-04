

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
          className="card bg-base-100 border border-base-300 rounded-2xl shadow-sm p-5 flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <span className="text-xs uppercase tracking-wide text-base-content/60">{item.label}</span>
          <span className="mt-2 text-2xl font-semibold text-base-content">{item.value}</span>
        </div>
      ))}
    </>
  );
}
