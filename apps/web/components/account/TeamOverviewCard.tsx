
export default function TeamOverviewCard({
  admins,
  serviceTeam,
  members,
  onManageMembers,
  onInviteMembers
}: {
  admins: number;
  serviceTeam: number;
  members: number;
  onManageMembers: () => void;
  onInviteMembers?: () => void;
}) {
  return (
    <div className="card shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="card-title">Team Overview</div>
          <p className="text-sm text-[var(--text-muted)]">Quick view of who is serving your church.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">
          <p className="font-medium">Admins</p>
          <p className="text-[var(--text-muted)]">{admins} active</p>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">
          <p className="font-medium">Service Team</p>
          <p className="text-[var(--text-muted)]">{serviceTeam} active</p>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">
          <p className="font-medium">Members</p>
          <p className="text-[var(--text-muted)]">{members} active</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onManageMembers}
        >
          Manage members
        </button>
        {onInviteMembers ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={onInviteMembers}
          >
            Invite members
          </button>
        ) : null}
      </div>
    </div>
  );
}
