"use client";

import { useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import AnnouncementPreview from "./AnnouncementPreview";
import AnnouncementTemplates, { type AnnouncementTemplate } from "./AnnouncementTemplates";
import { formatShortWeekdayDateTime } from "../../lib/format";

type PublishMode = "NOW" | "SCHEDULE";

type AnnouncementComposerProps = {
  title: string;
  body: string;
  audience: string;
  publishMode: PublishMode;
  scheduleDate: string;
  scheduleTime: string;
  timezoneLabel: string;
  previewMode: "EDIT" | "PREVIEW";
  isEditing: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
  onPublishModeChange: (mode: PublishMode) => void;
  onScheduleDateChange: (value: string) => void;
  onScheduleTimeChange: (value: string) => void;
  onPreviewModeChange: (value: "EDIT" | "PREVIEW") => void;
  onPrimary: () => void;
  onSaveDraft: () => void;
  onCancelEdit: () => void;
  onTemplateSelect: (template: AnnouncementTemplate) => void;
};

const audienceHelp: Record<string, string> = {
  ALL: "Everyone in the church",
  MEMBER: "Members + service team",
  SERVICE: "Service team + admins",
  ADMIN: "Admins only"
};

export default function AnnouncementComposer({
  title,
  body,
  audience,
  publishMode,
  scheduleDate,
  scheduleTime,
  timezoneLabel,
  previewMode,
  isEditing,
  onTitleChange,
  onBodyChange,
  onAudienceChange,
  onPublishModeChange,
  onScheduleDateChange,
  onScheduleTimeChange,
  onPreviewModeChange,
  onPrimary,
  onSaveDraft,
  onCancelEdit,
  onTemplateSelect
}: AnnouncementComposerProps) {
  const hasContent = title.trim().length > 0 && body.trim().length > 0;
  const scheduleReady = scheduleDate && scheduleTime;
  const canPrimary = hasContent && (publishMode === "NOW" || scheduleReady);
  const bodyLength = body.trim().length;

  const scheduleLabel = useMemo(() => {
    if (!scheduleReady) return "";
    const date = new Date(`${scheduleDate}T${scheduleTime}`);
    if (Number.isNaN(date.getTime())) return "";
    return `Will publish on ${formatShortWeekdayDateTime(date)} ${timezoneLabel ? `(${timezoneLabel})` : ""}`;
  }, [scheduleDate, scheduleTime, timezoneLabel, scheduleReady]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{isEditing ? "Edit Announcement" : "Compose Announcement"}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={previewMode === "EDIT" ? "default" : "outline"}
            onClick={() => onPreviewModeChange("EDIT")}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={previewMode === "PREVIEW" ? "default" : "outline"}
            onClick={() => onPreviewModeChange("PREVIEW")}
          >
            Preview
          </Button>
        </div>
      </div>

      {previewMode === "PREVIEW" ? (
        <div className="mt-4 space-y-4">
          <AnnouncementPreview title={title} body={body} audience={audience} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Templates</p>
            <div className="mt-2">
              <AnnouncementTemplates onSelect={onTemplateSelect} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Input
            placeholder="Announcement title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
          <textarea
            className="textarea textarea-bordered min-h-[160px] w-full"
            placeholder="Write the announcement message..."
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
          />
          <div className="text-xs text-[var(--gather-muted)]">
            {bodyLength} characters
            {bodyLength > 320 ? " · Tip: keep announcements concise for mobile." : ""}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-[var(--gather-muted)]">Audience</label>
              <select
                className="select select-bordered w-full"
                value={audience}
                onChange={(event) => onAudienceChange(event.target.value)}
              >
                <option value="ALL">ALL</option>
                <option value="MEMBER">MEMBER</option>
                <option value="SERVICE">SERVICE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <p className="text-xs text-[var(--gather-muted)]">{audienceHelp[audience] ?? ""}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[var(--gather-muted)]">Publish</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${publishMode === "NOW" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => onPublishModeChange("NOW")}
                >
                  Publish now
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${publishMode === "SCHEDULE" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => onPublishModeChange("SCHEDULE")}
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>

          {publishMode === "SCHEDULE" ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-[var(--gather-muted)]">Date</label>
                  <Input type="date" value={scheduleDate} onChange={(event) => onScheduleDateChange(event.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[var(--gather-muted)]">Time</label>
                  <Input type="time" value={scheduleTime} onChange={(event) => onScheduleTimeChange(event.target.value)} />
                </div>
              </div>
              <p className="text-xs text-[var(--gather-muted)]">
                Timezone: {timezoneLabel || "Local"}
              </p>
              {scheduleLabel ? <p className="text-xs text-[var(--gather-muted)]">{scheduleLabel}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onPrimary} disabled={!canPrimary}>
              {publishMode === "NOW" ? "Publish now" : "Schedule announcement"}
            </Button>
            <Button variant="outline" onClick={onSaveDraft} disabled={!hasContent}>
              Save draft
            </Button>
            {isEditing ? (
              <Button variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}
