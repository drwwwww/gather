

import Link from "next/link";
import { Button } from "../ui/Button";

export type AnnouncementPreview = {
  id: string;
  title: string;
  status: string;
  publishAt: string | null;
};

export default function LatestAnnouncementsCard({ items }: { items: AnnouncementPreview[] }) {
  return (
    <div className="card bg-base-100 border border-base-300 rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium text-base-content">Latest Announcements</h2>
        <Button asChild variant="primary" className="h-10 px-4">
          <Link href="/announcements">Create announcement</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="alert alert-info flex flex-col items-center gap-2 p-6">
          <span className="text-base-content/60">No announcements yet. Post your first announcement to keep everyone in sync.</span>
          <Button asChild variant="ghost" className="h-10 px-4 mt-2 w-full">
            <Link href="/announcements">Post announcement</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl p-3 bg-base-100">
              <div>
                <p className="font-medium text-base-content">{item.title}</p>
                <p className="text-xs text-base-content/60">{item.publishAt || "Draft"}</p>
              </div>
              <span className={
                item.status === "Published"
                  ? "badge badge-success"
                  : "badge bg-[var(--muted)] text-white"
              }>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
