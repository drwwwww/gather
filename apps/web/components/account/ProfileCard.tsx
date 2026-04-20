
export default function ProfileCard({
  name,
  email,
  roleLabel,
  onNameChange,
  onSave,
  saveDisabled
}: {
  name: string;
  email: string;
  roleLabel: string;
  onNameChange: (value: string) => void;
  onSave: () => void;
  saveDisabled: boolean;
}) {
  return (
    <div className="card shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="card-title font-bold">My Profile</h2>
          <p className="text-sm text-[var(--text-muted)]">Update your name and view your role.</p>
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
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Name</p>
          <input
            type="text"
            placeholder="Full name"
            className="input input-bordered w-full"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Email</p>
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered w-full bg-[var(--surface-2)]/60 text-[var(--text-muted)]"
            value={email}
            readOnly
          />
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[var(--text-muted)]">
        <span className="badge w-fit">Role: {roleLabel}</span>
        <p>Your role determines what you can manage in this church.</p>
      </div>
    </div>
  );
}
