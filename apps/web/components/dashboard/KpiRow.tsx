


export default function KpiRow({ members, volunteers, rsvpsThisWeek }: { members: number; volunteers: number; rsvpsThisWeek: number }) {
  const items = [
    { label: "Members", value: members.toString() },
    { label: "Volunteers", value: volunteers.toString() },
    { label: "RSVPs this week", value: rsvpsThisWeek.toString() }
  ];
  return (
    <>
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-start p-6 border rounded-xl transition-all duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] cursor-pointer" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-2 text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{item.label}</div>
          <div className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{item.value}</div>
        </div>
      ))}
    </>
  );
}
export type KpiRowData = {
  members: number;
  volunteers: number;
  rsvpsThisWeek: number;
};
