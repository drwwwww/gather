
export default function PlanCard() {
  return (
    <div className="card bg-base-100 shadow-md p-4 rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="card-title text-lg font-bold">Plan</h2>
          <p className="text-sm text-[var(--gather-muted)]">Starter - $79/month</p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          disabled
        >
          Manage subscription (Coming soon)
        </button>
      </div>
      <p className="mt-4 text-sm text-[var(--gather-muted)]">Your subscription tools will appear here.</p>
    </div>
  );
}
