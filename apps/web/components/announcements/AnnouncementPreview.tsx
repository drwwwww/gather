"use client";


type AnnouncementPreviewProps = {
  title: string;
  body: string;
  audience: string;
};

export default function AnnouncementPreview({ title, body, audience }: AnnouncementPreviewProps) {
  const hasContent = title.trim() || body.trim();

  return (
    <div className="card card-elevated p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Preview</p>
          <span className="badge badge-outline">{audience}</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {title.trim() || "Announcement title"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-muted)]">
            {body.trim() || "Write your announcement to see a live preview."}
          </p>
        </div>
        {!hasContent ? (
          <p className="text-xs text-[var(--text-muted)]">Tip: keep announcements concise for mobile.</p>
        ) : null}
      </div>
    </div>
  );
}
