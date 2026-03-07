import type { Database } from "@gather/lib";
import type { ReactNode } from "react";
// ...existing code...
// ...existing code...
import { formatServiceTimeLabel } from "../../lib/format";

const statusTone: Record<string, "default" | "success" | "warning" | "neutral"> = {
  "NOT CREATED": "neutral",
  DRAFT: "warning",
  READY: "success",
  COMPLETED: "default"
};

type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];

type ServicePlanHeaderProps = {
  serviceTimes: ServiceTime[];
  serviceTimeId: string;
  serviceDate: string;
  statusLabel: string;
  onServiceTimeChange: (value: string) => void;
  onServiceDateChange: (value: string) => void;
  actions?: ReactNode;
};

export default function ServicePlanHeader({
  serviceTimes,
  serviceTimeId,
  serviceDate,
  statusLabel,
  onServiceTimeChange,
  onServiceDateChange,
  actions
}: ServicePlanHeaderProps) {
  return (
    <div
      className="card shadow-sm p-4"
      // DaisyUI/Tailwind only; remove legacy CSS vars if not needed
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="card-title">Service plan</div>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--gather-muted)' }}
          >
            Keep the run of show and readiness in one place.
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.8fr_0.8fr]">
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--gather-muted)' }}
          >
            Service time
          </label>
          <select
            className="select select-bordered w-full mt-2"
            style={{
              background: 'var(--gather-surface)',
              borderColor: 'var(--gather-border)',
              color: 'var(--gather-ink)'
            }}
            value={serviceTimeId}
            onChange={(event) => onServiceTimeChange(event.target.value)}
          >
            {serviceTimes.map((time) => (
              <option key={time.id} value={time.id}>
                {formatServiceTimeLabel(time)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--gather-muted)' }}
          >
            Service date
          </label>
          <input
            type="date"
            value={serviceDate}
            onChange={(event) => onServiceDateChange(event.target.value)}
            className="input input-bordered w-full mt-2"
          />
        </div>
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--gather-muted)' }}
          >
            Plan status
          </label>
          <div className="mt-3">
            <span className={
              `badge ${
                statusTone[statusLabel] === 'success' ? 'badge-success' :
                statusTone[statusLabel] === 'warning' ? 'badge-warning' :
                statusTone[statusLabel] === 'neutral' ? 'badge-neutral' :
                'badge-ghost'
              }`
            }>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
