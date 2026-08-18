export default function ProfileCard({
  name, email, roleLabel, onNameChange, onSave, saveDisabled,
}: {
  name: string; email: string; roleLabel: string;
  onNameChange: (v: string) => void; onSave: () => void; saveDisabled: boolean;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">My Profile</h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Update your name and view your role.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Display name</label>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Email address</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-container-low)] px-4 py-2.5 text-sm text-[var(--text-muted)] cursor-not-allowed"
          />
          <p className="text-xs text-[var(--text-muted)]">Email cannot be changed here.</p>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            {roleLabel}
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="btn btn-primary-gradient btn-sm"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
