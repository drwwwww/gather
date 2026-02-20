import Link from "next/link";
import { Card, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export type AnnouncementPreview = {
  id: string;
  title: string;
  status: string;
  publishAt: string | null;
};

export default function LatestAnnouncementsCard({ items }: { items: AnnouncementPreview[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Latest Announcements</CardTitle>
        <Button asChild variant="primary" size="md">
          <Link href="/announcements">Create announcement</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm" style={{ background: 'var(--gather-surface)', borderColor: 'var(--border)' }}>
          <p className="font-semibold" style={{ color: 'var(--ink)' }}>No announcements yet</p>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>Post your first announcement to keep everyone in sync.</p>
          <Button
            asChild
            variant="ghost"
            size="md"
            className="mt-4 btn-gray"
          >
            <Link href="/announcements">Post announcement</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--gather-surface)' }}>
              <div>
                <p className="font-semibold" style={{ color: 'var(--ink)' }}>{item.title}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.publishAt || "Draft"}</p>
              </div>
              <Badge variant={item.status === "Published" ? "success" : "neutral"}>{item.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
