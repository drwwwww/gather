"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import { getCurrentContext } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import AnnouncementComposer from "../../../components/announcements/AnnouncementComposer";
import RecentAnnouncementsList from "../../../components/announcements/RecentAnnouncementsList";
import type { AnnouncementTemplate } from "../../../components/announcements/AnnouncementTemplates";
import type { Database } from "@gather/lib";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

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
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [timezoneLabel, setTimezoneLabel] = useState("");
  const router = useRouter();

  const refresh = async () => {
    if (!supabase) return;
    setLoading(true);
    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return;
    }

    setTimezoneLabel(context.church.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

    const { data, error: fetchError } = await supabase
      .from("announcements")
      .select("*")
      .eq("church_id", context.profile.church_id)
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error(fetchError);
      pushToast("Couldn't load announcements. Try again.", "error");
    } else {
      setAnnouncements(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

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

    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return;
    }

    const publishAt = getPublishAt(statusOverride, publishMode, scheduleDate, scheduleTime);

    if (editingId) {
      const { error: updateError } = await supabase
        .from("announcements")
        .update({
          title: trimmedTitle,
          body: trimmedBody,
          audience: audience as Announcement["audience"],
          publish_at: publishAt
        })
        .eq("id", editingId);

      if (updateError) {
        console.error(updateError);
        pushToast("Couldn't save announcement. Try again.", "error");
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("announcements")
        .insert({
          church_id: context.profile.church_id,
          title: trimmedTitle,
          body: trimmedBody,
          audience: audience as Announcement["audience"],
          publish_at: publishAt
        });

      if (insertError) {
        console.error(insertError);
        pushToast("Couldn't save announcement. Try again.", "error");
        return;
      }
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
    refresh();
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

  const handleDeleteDraft = async (announcement: Announcement) => {
    if (!supabase) return;
    const status = deriveStatus(announcement.publish_at);
    if (status !== "DRAFT") return;
    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);
    if (deleteError) {
      console.error(deleteError);
      pushToast("Couldn't delete draft. Try again.", "error");
      return;
    }
    pushToast("Draft deleted", "success");
    refresh();
  };

  const handleCancelScheduled = async (announcementId: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("announcements")
      .update({ publish_at: null })
      .eq("id", announcementId);
    if (updateError) {
      console.error(updateError);
      pushToast("Couldn't cancel schedule. Try again.", "error");
    } else {
      pushToast("Schedule canceled", "success");
      refresh();
    }
  };

  const handleTemplateSelect = (template: AnnouncementTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    setPreviewMode("EDIT");
  };

  const pushToast = (message: string, tone: "success" | "error") => {
    setToast({ message, tone });
    window.clearTimeout((window as any).__gatherToastTimer);
    (window as any).__gatherToastTimer = window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="space-y-8">
      <div>
        <AdminHeader
          title="Announcements"
          subtitle="Compose and publish messages to the right audience."
        />
      </div>
      <div>
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
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
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onAudienceChange={setAudience}
            onPublishModeChange={setPublishMode}
            onScheduleDateChange={setScheduleDate}
            onScheduleTimeChange={setScheduleTime}
            onPreviewModeChange={setPreviewMode}
            onPrimary={() => handleSubmit()}
            onSaveDraft={() => handleSubmit("DRAFT")}
            onCancelEdit={resetForm}
            onTemplateSelect={handleTemplateSelect}
          />

          <RecentAnnouncementsList
            announcements={announcements}
            loading={loading}
            onSelect={handleEdit}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDeleteDraft={handleDeleteDraft}
            onCancelSchedule={handleCancelScheduled}
            onTemplateSelect={handleTemplateSelect}
          />
        </section>
      </div>

      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-base-200 px-4 py-3 text-sm shadow">
          <p className={toast.tone === "error" ? "text-error" : "text-base-content"}>{toast.message}</p>
        </div>
      ) : null}
    </div>
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
