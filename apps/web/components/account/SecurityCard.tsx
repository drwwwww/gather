
export default function SecurityCard({
  onChangePassword,
  onSignOut
}: {
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="card bg-base-100 shadow-md p-4 rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="card-title text-lg font-bold">Security</h2>
          <p className="text-sm text-[var(--gather-muted)]">Manage your login settings.</p>
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
