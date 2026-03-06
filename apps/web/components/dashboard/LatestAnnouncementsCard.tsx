import Link from "next/link";
import Badge from "../ui/Badge";


export type AnnouncementPreview = {
  id: string;
  title: string;
  status: string;
  publishAt: string | null;
};

export default function LatestAnnouncementsCard({ items }: { items: AnnouncementPreview[] }) {
  return (
    <div className="rounded-2xl border p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)" }}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>Latest Announcements</h2>
        <Link href="/announcements" className="btn btn-primary">Create announcement</Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6 border rounded-xl" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <span style={{ color: "var(--text-muted)" }}>No announcements yet. Post your first announcement to keep everyone in sync.</span>
          <Link href="/announcements" className="btn btn-secondary mt-2 w-full inline-flex justify-center">Post announcement</Link>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl p-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.publishAt || "Draft"}</p>
              </div>
              <Badge variant={item.status === "Published" ? "success" : "neutral"}>
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
