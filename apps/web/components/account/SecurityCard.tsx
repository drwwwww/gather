
export default function SecurityCard({
  onChangePassword,
  onSignOut
}: {
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="card shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="card-title font-bold">Security</h2>
          <p className="text-sm text-[var(--text-muted)]">Manage your login settings.</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onChangePassword}
        >
          Change password
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
