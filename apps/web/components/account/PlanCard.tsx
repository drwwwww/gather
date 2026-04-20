
export default function PlanCard() {
  return (
    <div className="card shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="card-title font-bold">Plan</h2>
          <p className="text-sm text-[var(--text-muted)]">Starter - $79/month</p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          disabled
        >
          Manage subscription (Coming soon)
        </button>
      </div>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Your subscription tools will appear here.</p>
    </div>
  );
}
