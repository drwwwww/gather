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
    <div className="border rounded-2xl bg-white shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium text-gray-900">Latest Announcements</h2>
        <Link href="/announcements" className="inline-block h-10 px-4 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">Create announcement</Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6 border rounded bg-blue-50">
          <span className="text-gray-500">No announcements yet. Post your first announcement to keep everyone in sync.</span>
          <Link href="/announcements" className="inline-block h-10 px-4 mt-2 w-full rounded bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200 transition">Post announcement</Link>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl p-3 bg-white border">
              <div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.publishAt || "Draft"}</p>
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
