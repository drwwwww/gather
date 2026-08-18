import { Users, Shield, Wrench, UserPlus } from "lucide-react";

export default function TeamOverviewCard({
  admins, serviceTeam, members, onManageMembers, onInviteMembers,
}: {
  admins: number; serviceTeam: number; members: number;
  onManageMembers: () => void;
  onInviteMembers?: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Team overview</h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Active members by role.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Shield,  label: "Admins",        value: admins,      color: "text-purple-700 bg-purple-50" },
          { icon: Wrench,  label: "Service Team",  value: serviceTeam, color: "text-blue-700 bg-blue-50"    },
          { icon: Users,   label: "Members",       value: members,     color: "text-slate-600 bg-slate-100" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t border-[var(--border)] pt-4">
        <button type="button" onClick={onManageMembers} className="btn btn-secondary btn-sm flex-1">
          Manage members
        </button>
        {onInviteMembers && (
          <button type="button" onClick={onInviteMembers} className="btn btn-primary-gradient btn-sm flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </button>
        )}
      </div>
    </div>
  );
}
