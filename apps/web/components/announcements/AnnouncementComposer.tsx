"use client";

import { useMemo } from "react";
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
  isSubmitting?: boolean;
  /** When submitting, which button initiated the request (for spinners). */
  submitVariant?: "publish" | "draft" | null;
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

/** Compact spinner for buttons (global Loader is 200×60px and is clipped inside `.btn`). */
function ButtonSpinner() {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

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
  isSubmitting = false,
  submitVariant = null,
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
  const canPrimary = hasContent && (publishMode === "NOW" || scheduleReady) && !isSubmitting;
  const bodyLength = body.trim().length;

  const scheduleLabel = useMemo(() => {
    if (!scheduleReady) return "";
    const date = new Date(`${scheduleDate}T${scheduleTime}`);
    if (Number.isNaN(date.getTime())) return "";
    return `Will publish on ${formatShortWeekdayDateTime(date)} ${timezoneLabel ? `(${timezoneLabel})` : ""}`;
  }, [scheduleDate, scheduleTime, timezoneLabel, scheduleReady]);

  return (
    <>
      {/* Tab strip: Edit / Preview */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] px-8 pt-2">
        {(["EDIT", "PREVIEW"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onPreviewModeChange(mode)}
            className={`relative pb-3 pr-4 text-sm font-semibold transition-colors ${
              previewMode === mode
                ? "text-[var(--nav-active-foreground)] after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:rounded-full after:bg-[var(--nav-active-foreground)] after:content-['']"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {mode === "EDIT" ? "Compose" : "Preview"}
          </button>
        ))}
      </div>

      {/* Body */}
      {previewMode === "PREVIEW" ? (
        <div className="space-y-6 overflow-y-auto px-8 py-6">
          <AnnouncementPreview title={title} body={body} audience={audience} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Templates</p>
            <div className="mt-3">
              <AnnouncementTemplates onSelect={onTemplateSelect} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5 overflow-y-auto px-8 py-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Headline</label>
            <input
              type="text"
              placeholder="Something catchy..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={isSubmitting}
              className="input input-bordered w-full text-base font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Message body</label>
            <textarea
              className="textarea textarea-bordered min-h-[140px] w-full"
              placeholder="Share your message here..."
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-[var(--text-muted)]">
              {bodyLength} characters{bodyLength > 320 ? " · Keep it concise for mobile." : ""}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Audience</label>
              <select
                className="select select-bordered w-full"
                value={audience}
                onChange={(e) => onAudienceChange(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="ALL">All Members</option>
                <option value="MEMBER">Members</option>
                <option value="SERVICE">Service Team</option>
                <option value="ADMIN">Admins only</option>
              </select>
              <p className="text-xs text-[var(--text-muted)]">{audienceHelp[audience] ?? ""}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Publish date</label>
              {publishMode === "SCHEDULE" ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => onScheduleDateChange(e.target.value)}
                      disabled={isSubmitting}
                      className="input input-bordered w-full"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => onScheduleTimeChange(e.target.value)}
                      disabled={isSubmitting}
                      className="input input-bordered w-full"
                    />
                  </div>
                  {scheduleLabel ? <p className="text-xs text-[var(--text-muted)]">{scheduleLabel}</p> : null}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm w-fit text-xs"
                    onClick={() => onPublishModeChange("NOW")}
                    disabled={isSubmitting}
                  >
                    Publish immediately instead
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-fit text-xs"
                  onClick={() => onPublishModeChange("SCHEDULE")}
                  disabled={isSubmitting}
                >
                  Schedule for later →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-8 py-5">
        <button
          type="button"
          className="btn btn-ghost text-sm font-semibold text-[var(--text-secondary)]"
          onClick={onSaveDraft}
          disabled={!hasContent || isSubmitting}
        >
          {isSubmitting && submitVariant === "draft" ? <ButtonSpinner /> : null}
          Save Draft
        </button>
        <button
          type="button"
          className="btn btn-primary-gradient inline-flex items-center gap-2 rounded-full px-8 text-sm font-bold"
          onClick={onPrimary}
          disabled={!canPrimary}
        >
          {isSubmitting && submitVariant === "publish" ? <ButtonSpinner /> : null}
          {publishMode === "NOW" ? "Publish Now" : "Schedule Post"}
        </button>
      </div>
    </>
  );
}
