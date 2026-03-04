import type { Database } from "@gather/lib";
// ...existing code...
import { formatServiceTimeLabel } from "../../lib/format";

type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];

export default function ServiceTimeSelector({
  serviceTimes,
  selectedServiceTimeId,
  onChange
}: {
  serviceTimes: ServiceTime[];
  selectedServiceTimeId: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-[220px] flex-1">
      <div className="font-bold text-lg mb-2">Service time</div>
      <select
        className="select select-bordered w-full mt-2"
        value={selectedServiceTimeId}
        onChange={(event) => onChange(event.target.value)}
      >
        {serviceTimes.map((time) => (
          <option key={time.id} value={time.id}>
            {formatServiceTimeLabel(time)}
          </option>
        ))}
      </select>
    </div>
  );
}
