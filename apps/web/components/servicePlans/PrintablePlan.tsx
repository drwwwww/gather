import { formatDurationMinutes } from "../../lib/format";

export type PrintablePlanItem = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  status: string;
  assigned_person_name: string | null;
  backup_person_name: string | null;
};

export type PrintableRoleSlot = {
  id: string;
  role_name: string;
  assignee_name: string | null;
  backup_name: string | null;
  status: string;
};

export default function PrintablePlan({
  churchName,
  serviceLabel,
  serviceDate,
  items,
  roleSlots
}: {
  churchName: string;
  serviceLabel: string;
  serviceDate: string;
  items: PrintablePlanItem[];
  roleSlots: PrintableRoleSlot[];
}) {
  return (
    <div
      className="max-w-3xl mx-auto px-6 py-10"
      style={{ color: "var(--text-primary)", background: "var(--bg)" }}
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{churchName}</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {serviceLabel}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {serviceDate}
        </p>
      </div>

      {roleSlots.length ? (
        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
            Roles
          </h2>
          <div className="space-y-2">
            {roleSlots.map((slot) => (
              <div
                key={slot.id}
                className="rounded-lg border p-3 text-sm"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-primary)"
                }}
              >
                <p className="font-medium">{slot.role_name}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {slot.assignee_name ? `Assigned: ${slot.assignee_name}` : "Assigned: —"}
                  {slot.backup_name ? ` • Backup: ${slot.backup_name}` : ""}
                  {` • ${slot.status}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
          Run of show
        </h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border p-4"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text-primary)"
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {index + 1}. {item.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {item.duration_minutes ? formatDurationMinutes(item.duration_minutes) : ""}
                    {item.assigned_person_name ? ` • ${item.assigned_person_name}` : ""}
                    {item.backup_person_name ? ` • Backup: ${item.backup_person_name}` : ""}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                  {item.status}
                </span>
              </div>
              {item.notes ? (
                <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
