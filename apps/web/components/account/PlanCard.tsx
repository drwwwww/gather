
export default function PlanCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Subscription</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Billing and plan management coming soon.</p>
        </div>
        <span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
          Coming soon
        </span>
      </div>
    </div>
  );
}
