import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

type TimezoneOption = { value: string; label: string };

export default function ChurchSettingsCard({
  churchName,
  joinCode,
  timezone,
  timezoneOptions,
  onChurchNameChange,
  onTimezoneChange,
  onSave,
  saveDisabled
}: {
  churchName: string;
  joinCode: string;
  timezone: string;
  timezoneOptions: TimezoneOption[];
  onChurchNameChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onSave: () => void;
  saveDisabled: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Church Settings</CardTitle>
          <p className="text-sm text-[var(--gather-muted)]">Update the basics for your church.</p>
        </div>
        <Button size="sm" onClick={onSave} disabled={saveDisabled}>
          Save
        </Button>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Church name</p>
          <Input
            placeholder="Church name"
            value={churchName}
            onChange={(event) => onChurchNameChange(event.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Church Join Code</p>
          <Input
            placeholder="Join code"
            value={joinCode}
            readOnly
            className="bg-base-200/60 text-[var(--gather-muted)]"
          />
          <p className="text-sm text-[var(--gather-muted)]">
            Members use this code to join your church in the Gather app.
          </p>
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Timezone</p>
          <select
            className="select select-bordered w-full"
            value={timezone}
            onChange={(event) => onTimezoneChange(event.target.value)}
          >
            {timezoneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
