"use client";


type AnnouncementPreviewProps = {
  title: string;
  body: string;
  audience: string;
};

export default function AnnouncementPreview({ title, body, audience }: AnnouncementPreviewProps) {
  const hasContent = title.trim() || body.trim();

  return (
    <div className="card bg-base-100 shadow-md p-4 rounded-xl">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Preview</p>
          <span className="badge badge-outline">{audience}</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--gather-ink)]">
            {title.trim() || "Announcement title"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--gather-muted)]">
            {body.trim() || "Write your announcement to see a live preview."}
          </p>
        </div>
        {!hasContent ? (
          <p className="text-xs text-[var(--gather-muted)]">Tip: keep announcements concise for mobile.</p>
        ) : null}
      </div>
    </div>
  );
}
