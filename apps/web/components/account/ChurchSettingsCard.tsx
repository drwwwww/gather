
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
    <div className="card shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="card-title font-bold">Church Settings</h2>
          <p className="text-sm text-[var(--gather-muted)]">Update the basics for your church.</p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={onSave}
          disabled={saveDisabled}
        >
          Save
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Church name</p>
          <input
            type="text"
            placeholder="Church name"
            className="input input-bordered w-full"
            value={churchName}
            onChange={(event) => onChurchNameChange(event.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Church Join Code</p>
          <input
            type="text"
            placeholder="Join code"
            className="input input-bordered w-full bg-[var(--surface-2)]/60 text-[var(--gather-muted)]"
            value={joinCode}
            readOnly
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
    </div>
  );
}
