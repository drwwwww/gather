import Link from "next/link";
import { Card, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export type TeamRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

export default function NextServiceTeamCard({ items }: { items: TeamRow[] }) {
  return (
    <Card className="font-sans">
      <div className="flex items-center justify-between font-sans">
        <CardTitle>Next Service Team</CardTitle>
        <Link href="/volunteers" className="btn btn-outline btn-sm font-sans">
          View full schedule
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm font-sans"
          style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)', color: 'var(--gather-ink)' }}
        >
          <p className="font-semibold" style={{ color: 'var(--gather-ink)' }}>No assignments yet</p>
          <p className="mt-2" style={{ color: 'var(--gather-muted)' }}>Generate this week's schedule to see your team.</p>
          <Link href="/volunteers" className="btn btn-outline btn-sm mt-4 font-sans">
            Generate schedule
          </Link>
        </div>
      ) : (
        <div
          className="mt-4 overflow-hidden rounded-xl border font-sans"
          style={{ borderColor: 'var(--gather-border)', background: 'var(--gather-surface)' }}
        >
          <table className="table font-sans" style={{ color: 'var(--gather-ink)' }}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Assigned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{row.role}</td>
                  <td>{row.assignee}</td>
                  <td>
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function statusVariant(status: string) {
  if (status === "CONFIRMED") return "success";
  if (status === "ASSIGNED") return "warning";
  return "neutral";
}
