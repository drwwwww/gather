import Link from "next/link";
import { Users } from "lucide-react";
import Badge from "../ui/Badge";

export type TeamRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

function formatServiceDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function statusVariant(status: string) {
  if (status === "CONFIRMED") return "success" as const;
  if (status === "ASSIGNED")  return "warning" as const;
  return "neutral" as const;
}

function assigneeInitials(label: string) {
  const t = label.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export default function NextServiceTeamCard({
  items,
  serviceDate,
}: {
  items: TeamRow[];
  serviceDate?: string | null;
}) {
  return (
    <div className="card card-elevated p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
          Next Service Team
        </h2>
        {serviceDate && (
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#9ca3af",
            background: "#F4F3F1",
            padding: "4px 10px",
            borderRadius: 9999,
          }}>
            {formatServiceDate(serviceDate)}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Users style={{ width: 20, height: 20, color: "#9ca3af" }} />}
          title="No team assigned"
          subtitle="Generate this week's schedule."
          cta={
            <Link href="/volunteers" style={ctaStyle}>Schedule volunteers</Link>
          }
        />
      ) : (
        <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Role", "Assigned", "Status"].map((col) => (
                  <th key={col} style={thStyle}>{col.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: i < items.length - 1 ? "1px solid #f1f5f9" : "none",
                    transition: "background 160ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 247, 230, 0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td style={tdStyle}>{row.role}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 9999,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#d97706",
                          background: "var(--surface-container-low)",
                          border: "2px solid var(--nav-pill-active-bg)",
                        }}
                        aria-hidden
                      >
                        {assigneeInitials(row.assignee)}
                      </div>
                      <span>{row.assignee}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── shared sub-components ────────────────────────────────────────────────── */

function EmptyState({
  icon,
  title,
  subtitle,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta?: React.ReactNode;
}) {
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
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4, marginBottom: 0 }}>{subtitle}</p>
      </div>
      {cta}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#9ca3af",
  padding: "12px 16px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  background: "transparent",
};

const tdStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#111827",
  padding: "12px 16px",
};

const ctaStyle: React.CSSProperties = {
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
  marginTop: 8,
};
