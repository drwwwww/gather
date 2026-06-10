


export default function KpiRow({ members, volunteers }: { members: number; volunteers: number; rsvpsThisWeek: number }) {
  const items = [
    { label: "Members", value: members.toString() },
    { label: "Volunteers", value: volunteers.toString() }
  ];
  return (
    <>
      {items.map((item) => (
        <div key={item.label} className="card card-elevated px-4 py-3 flex flex-col justify-center min-h-0 cursor-pointer">
          <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{item.label}</div>
          <div className="mt-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{item.value}</div>
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
