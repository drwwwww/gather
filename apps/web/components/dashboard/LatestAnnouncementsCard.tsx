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
    <div className="card shadow-sm p-6">
      <h2 className="card-title mb-4">Latest Announcements</h2>
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
