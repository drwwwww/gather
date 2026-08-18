import { KeyRound, LogOut } from "lucide-react";

export default function SecurityCard({
  onChangePassword, onSignOut,
}: {
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Security</h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Manage your login and access.</p>
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onChangePassword}
          className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-container-low)]"
        >
          <KeyRound className="h-4 w-4 text-[var(--text-muted)]" />
          Change password
          <span className="ml-auto text-xs text-[var(--text-muted)]">Email link →</span>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
