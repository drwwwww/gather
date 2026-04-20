import Link from "next/link";
import { UserCheck } from "lucide-react";
import Badge from "../ui/Badge";

export type PendingRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

export default function PendingConfirmationsCard({ items }: { items: PendingRow[] }) {
  return (
    <div className="card shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
          Pending Responses
        </h2>
        {items.length > 0 && (
          <Link href="/volunteers" style={resolveButtonStyle}>
            Resolve assignments
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#F4F3F1",
                padding: 12,
              }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0 }}>
                  {item.role}
                </p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, marginBottom: 0 }}>
                  {item.assignee}
                </p>
              </div>
              <Badge variant={item.status === "DECLINED" ? "danger" : "neutral"}>
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      borderRadius: 16,
      border: "2px dashed #e5e7eb",
      background: "#F4F3F1",
      padding: "32px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "#ECEAE6",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <UserCheck style={{ width: 20, height: 20, color: "#9ca3af" }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0 }}>All caught up</p>
        <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4, marginBottom: 0 }}>
          No pending responses for this service.
        </p>
      </div>
    </div>
  );
}

const resolveButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  background: "#F59E0B",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};
