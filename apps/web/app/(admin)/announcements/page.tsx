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
import { PageGrid, PageGridFull, PageGridRowTwoOne } from "../../../components/layout/PageGrid";
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
            publish_at: publishAt
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
            publish_at: publishAt
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

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <AdminHeader
          title="Announcements"
          subtitle="Compose and publish messages to the right audience."
        />
      </PageGridFull>

      <PageGridRowTwoOne
        className="animate-fade-in-up [animation-delay:100ms] opacity-0"
        main={
          showComposerSkeleton ? (
            <div className="card h-[600px] bg-[var(--surface)] animate-pulse-subtle" />
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
              onTitleChange={setTitle}
              onBodyChange={setBody}
              onAudienceChange={setAudience}
              onPublishModeChange={setPublishMode}
              onScheduleDateChange={setScheduleDate}
              onScheduleTimeChange={setScheduleTime}
              onPreviewModeChange={setPreviewMode}
              onPrimary={() => void handleSubmit()}
              onSaveDraft={() => void handleSubmit("DRAFT")}
              onCancelEdit={resetForm}
              onTemplateSelect={handleTemplateSelect}
            />
          )
        }
        side={
          initialLoading && announcements.length === 0 ? (
            <div className="card h-[400px] bg-[var(--surface)] animate-pulse-subtle" />
          ) : (
            <RecentAnnouncementsList
              announcements={announcements}
              loading={false}
              listRefreshing={listRefreshing || listMutationPending}
              onSelect={handleEdit}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDeleteAnnouncement}
              onCancelSchedule={handleCancelScheduled}
              onTemplateSelect={handleTemplateSelect}
            />
          )
        }
      />

      {toast ? (
        <PageGridFull>
          <div className="fixed right-6 top-6 z-50 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm shadow">
            <p className={toast.tone === "error" ? "text-error" : "text-base-content"}>{toast.message}</p>
          </div>
        </PageGridFull>
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
