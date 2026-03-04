
import { Card } from "../ui/Card";

export default function KpiRow({ members, volunteers, rsvpsThisWeek }: { members: number; volunteers: number; rsvpsThisWeek: number }) {
  const items = [
    { label: "Members", value: members.toString() },
    { label: "Volunteers", value: volunteers.toString() },
    { label: "RSVPs this week", value: rsvpsThisWeek.toString() }
  ];
  return (
    <>
      {items.map((item) => (
        <Card key={item.label} className="flex flex-col items-start p-6 transition-all duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] cursor-pointer">
          <div className="meta-text mb-2">{item.label}</div>
          <div className="stat-number">{item.value}</div>
        </Card>
      ))}
    </>
  );
}
export type KpiRowData = {
  members: number;
  volunteers: number;
  rsvpsThisWeek: number;
};
