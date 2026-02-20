import type { Database } from "@gather/lib";
import { formatDurationMinutes } from "../../lib/format";

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PlanItem = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  status: string;
};

export default function PrintablePlan({
  churchName,
  serviceLabel,
  serviceDate,
  items,
  roles
}: {
  churchName: string;
  serviceLabel: string;
  serviceDate: string;
  items: PlanItem[];
  roles: RoleRow[];
}) {
  const roleMap = new Map(roles.map((role) => [role.id, role.name]));

  return (
    <div
      className="max-w-3xl mx-auto px-6 py-10"
      style={{ color: 'var(--gather-ink)', background: 'var(--gather-bg)' }}
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{churchName}</h1>
        <p className="text-sm" style={{ color: 'var(--gather-muted)' }}>{serviceLabel}</p>
        <p className="text-sm" style={{ color: 'var(--gather-muted)' }}>{serviceDate}</p>
      </div>
      <div className="mt-6 space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-lg border p-4"
            style={{
              borderColor: 'var(--gather-border)',
              background: 'var(--gather-surface)',
              color: 'var(--gather-ink)'
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{index + 1}. {item.title}</p>
                <p className="text-xs" style={{ color: 'var(--gather-muted)' }}>
                  {item.duration_minutes ? formatDurationMinutes(item.duration_minutes) : ""}
                  {item.owner_role_id ? ` • ${roleMap.get(item.owner_role_id) ?? ""}` : ""}
                </p>
              </div>
              <span
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: 'var(--gather-muted)' }}
              >
                {item.status}
              </span>
            </div>
            {item.notes ? (
              <p className="mt-2 text-xs" style={{ color: 'var(--gather-muted)' }}>{item.notes}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
