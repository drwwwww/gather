import Link from "next/link";
import { Megaphone } from "lucide-react";
import Badge from "../ui/Badge";

export type AnnouncementPreview = {
  id: string;
  title: string;
  status: string;
  publishAt: string | null;
};

export default function LatestAnnouncementsCard({ items }: { items: AnnouncementPreview[] }) {
  return (
    <div className="card shadow-sm p-6">
      {/* Header */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>
        Latest Announcements
      </h2>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => {
            const isPublished = item.status.toLowerCase() === "published";
            const dateLabel =
              !item.publishAt && item.status.toLowerCase() === "draft"
                ? "Draft"
                : item.publishAt ?? "Draft";

            return (
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
                    {item.title}
                  </p>
                  <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, marginBottom: 0 }}>
                    {dateLabel}
                  </p>
                </div>
                <Badge variant={isPublished ? "success" : "neutral"}>
                  {item.status}
                </Badge>
              </div>
            );
          })}
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
        <Megaphone style={{ width: 20, height: 20, color: "#9ca3af" }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0 }}>No announcements</p>
        <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4, marginBottom: 0 }}>
          Keep everyone in sync.
        </p>
      </div>
      <Link href="/announcements" style={ctaStyle}>Post announcement</Link>
    </div>
  );
}

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
