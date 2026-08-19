"use client";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import { getCurrentContext } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import AnnouncementComposer from "../../../components/announcements/AnnouncementComposer";
import RecentAnnouncementsList from "../../../components/announcements/RecentAnnouncementsList";
import type { AnnouncementTemplate } from "../../../components/announcements/AnnouncementTemplates";
import { PageGrid, PageGridFull } from "../../../components/layout/PageGrid";
import type { Database } from "@gather/lib";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

async function fetchAnnouncementsForChurch(churchId: string): Promise<Announcement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("church_id", churchId)
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function mergeAnnouncementRow(prev: Announcement[], row: Announcement): Announcement[] {
  const without = prev.filter((a) => a.id !== row.id);
  return [row, ...without];
}

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audience, setAudience] = useState("ALL");
  const [publishMode, setPublishMode] = useState<"NOW" | "SCHEDULE">("NOW");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"EDIT" | "PREVIEW">("EDIT");
  const [churchId, setChurchId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Which composer action is in flight (for accurate spinners). */
  const [submitVariant, setSubmitVariant] = useState<"publish" | "draft" | null>(null);
  const [listMutationPending, setListMutationPending] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [timezoneLabel, setTimezoneLabel] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Published");
  const [composerOpen, setComposerOpen] = useState(false);
  const router = useRouter();

  const pushToast = (message: string, tone: "success" | "error") => {
    setToast({ message, tone });
    window.clearTimeout((window as any).__gatherToastTimer);
    (window as any).__gatherToastTimer = window.setTimeout(() => setToast(null), 3200);
  };

  const loadAnnouncements = useCallback(async (cid: string, subtle: boolean) => {
    if (!supabase) return;
    if (subtle) setListRefreshing(true);
    try {
      const rows = await fetchAnnouncementsForChurch(cid);
      setAnnouncements(rows);
    } catch (e) {
      console.error(e);
      pushToast("Couldn't load announcements. Try again.", "error");
    } finally {
      if (subtle) setListRefreshing(false);
    }
  }, []);

  const initialLoad = useCallback(async () => {
    if (!supabase) return;
    setInitialLoading(true);
    try {
      const context = await getCurrentContext();
      if (!context) {
        router.push("/login");
        return;
      }
      const cid = context.profile.church_id;
      setChurchId(cid);
      setTimezoneLabel(context.church.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      const rows = await fetchAnnouncementsForChurch(cid);
      setAnnouncements(rows);
    } catch (e) {
      console.error(e);
      pushToast("Couldn't load announcements. Try again.", "error");
    } finally {
      setInitialLoading(false);
    }
  }, [router]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setImageUrl(null);
    setPublishMode("NOW");
    setScheduleDate("");
    setScheduleTime("");
    setEditingId(null);
    setPreviewMode("EDIT");
  };

  const handleSubmit = async (statusOverride?: AnnouncementStatus) => {
    if (!supabase) return;
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody) return;

    flushSync(() => {
      setSubmitVariant(statusOverride === "DRAFT" ? "draft" : "publish");
      setIsSubmitting(true);
    });
    try {
      let cid = churchId;
      if (!cid) {
        const context = await getCurrentContext();
        if (!context) {
          router.push("/login");
          return;
        }
        cid = context.profile.church_id;
        setChurchId(cid);
      }

      const publishAt = getPublishAt(statusOverride, publishMode, scheduleDate, scheduleTime);

      if (editingId) {
        const { data: updated, error: updateError } = await supabase
          .from("announcements")
          .update({
            title: trimmedTitle,
            body: trimmedBody,
            audience: audience as Announcement["audience"],
            publish_at: publishAt,
            ...(imageUrl ? { image_url: imageUrl } as any : {})
          })
          .eq("id", editingId)
          .select("*")
          .single();

        if (updateError || !updated) {
          console.error(updateError);
          pushToast("Couldn't save announcement. Try again.", "error");
          return;
        }
        setAnnouncements((prev) => mergeAnnouncementRow(prev, updated as Announcement));
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("announcements")
          .insert({
            church_id: cid,
            title: trimmedTitle,
            body: trimmedBody,
            audience: audience as Announcement["audience"],
            publish_at: publishAt,
            ...(imageUrl ? { image_url: imageUrl } as any : {})
          })
          .select("*")
          .single();

        if (insertError || !inserted) {
          console.error(insertError);
          pushToast("Couldn't save announcement. Try again.", "error");
          return;
        }
        setAnnouncements((prev) => mergeAnnouncementRow(prev, inserted as Announcement));
      }

      pushToast(
        statusOverride === "DRAFT"
          ? "Draft saved"
          : publishMode === "NOW"
            ? "Announcement published"
            : "Announcement scheduled",
        "success"
      );
      resetForm();

      void loadAnnouncements(cid, true);
    } finally {
      setIsSubmitting(false);
      setSubmitVariant(null);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setBody(announcement.body ?? "");
    setImageUrl((announcement as any).image_url ?? null);
    setAudience(announcement.audience);
    if (announcement.publish_at && new Date(announcement.publish_at) > new Date()) {
      setPublishMode("SCHEDULE");
      setScheduleDate(toDateInput(announcement.publish_at));
      setScheduleTime(toTimeInput(announcement.publish_at));
    } else {
      setPublishMode("NOW");
      setScheduleDate("");
      setScheduleTime("");
    }
    setPreviewMode("EDIT");
  };

  const handleDuplicate = (announcement: Announcement) => {
    setEditingId(null);
    setTitle(`${announcement.title} (copy)`);
    setBody(announcement.body ?? "");
    setImageUrl((announcement as any).image_url ?? null);
    setAudience(announcement.audience);
    setPublishMode("NOW");
    setScheduleDate("");
    setScheduleTime("");
    setPreviewMode("EDIT");
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (!supabase) return;
    const status = deriveStatus(announcement.publish_at);
    if (status !== "DRAFT") {
      const ok = window.confirm(
        "Delete this announcement? It will be removed for everyone. This cannot be undone."
      );
      if (!ok) return;
    }
    let cid = churchId;
    if (!cid) {
      const context = await getCurrentContext();
      if (!context) {
        router.push("/login");
        return;
      }
      cid = context.profile.church_id;
      setChurchId(cid);
    }
    setListMutationPending(true);
    try {
      const { error: deleteError } = await supabase.from("announcements").delete().eq("id", announcement.id);
      if (deleteError) {
        console.error(deleteError);
        pushToast("Couldn't delete announcement. Try again.", "error");
        return;
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcement.id));
      if (editingId === announcement.id) {
        resetForm();
      }
      pushToast(status === "DRAFT" ? "Draft deleted" : "Announcement deleted", "success");
      void loadAnnouncements(cid, true);
    } finally {
      setListMutationPending(false);
    }
  };

  const handleCancelScheduled = async (announcement: Announcement) => {
    if (!supabase) return;
    let cid = churchId;
    if (!cid) {
      const context = await getCurrentContext();
      if (!context) {
        router.push("/login");
        return;
      }
      cid = context.profile.church_id;
      setChurchId(cid);
    }
    setListMutationPending(true);
    try {
      const { data: updated, error: updateError } = await supabase
        .from("announcements")
        .update({ publish_at: null })
        .eq("id", announcement.id)
        .select("*")
        .single();
      if (updateError || !updated) {
        console.error(updateError);
        pushToast("Couldn't cancel schedule. Try again.", "error");
      } else {
        setAnnouncements((prev) => mergeAnnouncementRow(prev, updated as Announcement));
        pushToast("Schedule canceled", "success");
        void loadAnnouncements(cid, true);
      }
    } finally {
      setListMutationPending(false);
    }
  };

  const handleTemplateSelect = (template: AnnouncementTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    setPreviewMode("EDIT");
  };

  const showComposerSkeleton = initialLoading && announcements.length === 0;

  const published = announcements.filter((a) => deriveStatus(a.publish_at) === "PUBLISHED");
  const scheduled = announcements.filter((a) => deriveStatus(a.publish_at) === "SCHEDULED");
  const drafts = announcements.filter((a) => deriveStatus(a.publish_at) === "DRAFT");

  const tabLists: Record<string, Announcement[]> = { Published: published, Scheduled: scheduled, Drafts: drafts };

  const openComposer = () => {
    resetForm();
    setComposerOpen(true);
  };

  const openEdit = (a: Announcement) => {
    handleEdit(a);
    setComposerOpen(true);
  };

  return (
    <PageGrid>
      {/* Page header */}
      <PageGridFull className="animate-fade-in-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <AdminHeader
            size="large"
            title="Announcements"
            subtitle="Share news, updates, and encouragement with your church community."
          />
          <button
            type="button"
            className="btn btn-primary-gradient flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            onClick={openComposer}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Announcement
          </button>
        </div>
      </PageGridFull>

      {/* Stats row */}
      <PageGridFull className="animate-fade-in-up [animation-delay:50ms]">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="stitch-section-card space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Published</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{published.length}</span>
              <span className="text-sm text-[var(--text-muted)]">total</span>
            </div>
          </div>
          <div className="stitch-section-card space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Scheduled</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{scheduled.length}</span>
              <span className="text-sm text-[var(--text-muted)]">this week</span>
            </div>
          </div>
          <div className="stitch-section-card space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Drafts</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{drafts.length}</span>
              <span className="text-sm text-[var(--text-muted)]">in progress</span>
            </div>
          </div>
        </div>
      </PageGridFull>

      {/* Tabbed list */}
      <PageGridFull className="animate-fade-in-up [animation-delay:100ms]">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-[var(--border)]">
            {Object.keys(tabLists).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-base font-semibold transition-colors ${
                  activeTab === tab
                    ? "text-[var(--nav-active-foreground)] after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:rounded-full after:bg-[var(--nav-active-foreground)] after:content-['']"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {tab}
                <span className="ml-1.5 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium">
                  {tabLists[tab]?.length ?? 0}
                </span>
              </button>
            ))}
          </div>

          {initialLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="stitch-section-card h-28 animate-pulse-subtle bg-[var(--surface)]" />
              ))}
            </div>
          ) : (tabLists[activeTab] ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-20 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--nav-active-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-[var(--text-primary)]">
                {activeTab === "Published" ? "Nothing published yet" : activeTab === "Scheduled" ? "No scheduled posts" : "No drafts"}
              </h4>
              <p className="mt-1 max-w-xs text-sm text-[var(--text-muted)]">
                {activeTab === "Drafts" ? "Start writing — your drafts will appear here." : 'Use "New Announcement" to get started.'}
              </p>
            </div>
          ) : (
            <RecentAnnouncementsList
              announcements={tabLists[activeTab] ?? []}
              loading={false}
              listRefreshing={listRefreshing || listMutationPending}
              onSelect={openEdit}
              onEdit={openEdit}
              onDuplicate={(a) => { handleDuplicate(a); setComposerOpen(true); }}
              onDelete={handleDeleteAnnouncement}
              onCancelSchedule={handleCancelScheduled}
              onTemplateSelect={(t) => { handleTemplateSelect(t); setComposerOpen(true); }}
            />
          )}
        </div>
      </PageGridFull>

      {/* Composer modal */}
      {composerOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--text-primary)]/40 backdrop-blur-sm">
          <div className="relative mx-4 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[var(--surface-container-lowest)] shadow-2xl" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-8 py-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                onClick={() => setComposerOpen(false)}
                aria-label="Close composer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {showComposerSkeleton ? (
              <div className="h-[480px] animate-pulse-subtle bg-[var(--surface)]" />
            ) : (
              <AnnouncementComposer
                title={title}
                body={body}
                audience={audience}
                publishMode={publishMode}
                scheduleDate={scheduleDate}
                scheduleTime={scheduleTime}
                timezoneLabel={timezoneLabel}
                previewMode={previewMode}
                isEditing={!!editingId}
                isSubmitting={isSubmitting}
                submitVariant={submitVariant}
                imageUrl={imageUrl}
                churchId={churchId ?? ""}
                onTitleChange={setTitle}
                onBodyChange={setBody}
                onAudienceChange={setAudience}
                onPublishModeChange={setPublishMode}
                onScheduleDateChange={setScheduleDate}
                onScheduleTimeChange={setScheduleTime}
                onPreviewModeChange={setPreviewMode}
                onImageUrlChange={setImageUrl}
                onPrimary={() => { void handleSubmit(); setComposerOpen(false); }}
                onSaveDraft={() => { void handleSubmit("DRAFT"); setComposerOpen(false); }}
                onCancelEdit={() => { resetForm(); setComposerOpen(false); }}
                onTemplateSelect={handleTemplateSelect}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <div className="fixed right-6 top-6 z-[70] rounded-xl border border-[var(--border)] bg-[var(--surface-container-lowest)] px-4 py-3 text-sm shadow-lg">
          <p className={toast.tone === "error" ? "text-[var(--danger)]" : "text-[var(--success)]"}>{toast.message}</p>
        </div>
      ) : null}
    </PageGrid>
  );
}

function getPublishAt(
  statusOverride: AnnouncementStatus | undefined,
  publishMode: "NOW" | "SCHEDULE",
  scheduleDate: string,
  scheduleTime: string
) {
  if (statusOverride === "DRAFT") return null;
  if (publishMode === "NOW") return new Date().toISOString();
  if (!scheduleDate || !scheduleTime) return null;
  const parsed = new Date(`${scheduleDate}T${scheduleTime}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function deriveStatus(publishAt: string | null) {
  if (!publishAt) return "DRAFT";
  const parsed = new Date(publishAt);
  return parsed > new Date() ? "SCHEDULED" : "PUBLISHED";
}

function toDateInput(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

function toTimeInput(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}
