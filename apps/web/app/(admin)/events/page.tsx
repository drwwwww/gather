"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import Loader from "../../../components/ui/Loader";
import { getCurrentContext, indexProfilesById, listProfilesByChurch } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import EventForm, { type EventFormValues, type RepeatRule } from "../../../components/events/EventForm";
import EventsList, { type EventListTab } from "../../../components/events/EventsList";
import RsvpPanel from "../../../components/events/RsvpPanel";
import AttendeeListDialog from "../../../components/events/AttendeeListDialog";
import type { EventTemplate } from "../../../components/events/EventTemplates";
import { PageGrid, PageGridFull } from "../../../components/layout/PageGrid";
import type { Database } from "@gather/lib";

type EventItem = Database["public"]["Tables"]["events"]["Row"];
type EventRsvp = Database["public"]["Tables"]["event_rsvps"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type RsvpCountsMap = Record<string, { GOING: number; MAYBE: number; NO: number }>;

export default function EventsPage() {
  const [formValues, setFormValues] = useState<EventFormValues>({
    title: "",
    description: "",
    location: "",
    address: "",
    audience: "ALL",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    imageUrl: null,
    repeat: "none",
    repeatCount: 4,
    announce: false,
  });
  const [churchId, setChurchId] = useState<string>("");
  const [churchAddress, setChurchAddress] = useState<string>("");
  const [activeTab, setActiveTab] = useState<EventListTab>("UPCOMING");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allRsvps, setAllRsvps] = useState<EventRsvp[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewAttendees, setViewAttendees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setChurchId(context.profile.church_id);
    setChurchAddress(context.church.address?.trim() || "");

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("church_id", context.profile.church_id)
      .order("start_at", { ascending: true });

    if (eventsError) {
      setError(eventsError.message);
      setLoading(false);
      return;
    }

    const profilesData = await listProfilesByChurch(context.profile.church_id);
    setProfiles(profilesData);

    const eventIds = ((eventsData ?? []) as EventItem[]).map((event) => event.id);
    if (eventIds.length) {
      const { data: rsvpsData, error: rsvpsError } = await supabase
        .from("event_rsvps")
        .select("*")
        .in("event_id", eventIds);

      if (rsvpsError) {
        setError(rsvpsError.message);
      } else {
        setAllRsvps(rsvpsData ?? []);
      }
    } else {
      setAllRsvps([]);
    }

    setEvents(eventsData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const profilesById = useMemo(() => indexProfilesById(profiles), [profiles]);

  const rsvpCountsByEvent = useMemo(() => {
    const map: RsvpCountsMap = {};
    allRsvps.forEach((rsvp) => {
      if (!map[rsvp.event_id]) {
        map[rsvp.event_id] = { GOING: 0, MAYBE: 0, NO: 0 };
      }
      map[rsvp.event_id][rsvp.status] += 1;
    });
    return map;
  }, [allRsvps]);

  const selectedCounts = useMemo(() => {
    if (!selectedEventId) return { GOING: 0, MAYBE: 0, NO: 0 };
    return rsvpCountsByEvent[selectedEventId] ?? { GOING: 0, MAYBE: 0, NO: 0 };
  }, [rsvpCountsByEvent, selectedEventId]);

  const attendees = useMemo(() => {
    if (!selectedEventId) return [];
    return allRsvps
      .filter((rsvp) => rsvp.event_id === selectedEventId)
      .map((rsvp) => ({
        id: rsvp.id,
        name: profilesById[rsvp.user_id]?.full_name || "",
        email: profilesById[rsvp.user_id]?.email || "",
        status: rsvp.status
      }));
  }, [allRsvps, profilesById, selectedEventId]);

  const upcomingEvents = useMemo(() => {
    const now = new Date().toISOString();
    return events.filter((event) => event.start_at >= now && !event.is_cancelled);
  }, [events]);

  const pastEvents = useMemo(() => {
    const now = new Date().toISOString();
    return events.filter((event) => event.start_at < now && !event.is_cancelled);
  }, [events]);

  const cancelledEvents = useMemo(() => events.filter((event) => event.is_cancelled), [events]);

  const rsvpGoingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(rsvpCountsByEvent).forEach((eventId) => {
      counts[eventId] = rsvpCountsByEvent[eventId].GOING;
    });
    return counts;
  }, [rsvpCountsByEvent]);

  const [saving, setSaving] = useState(false);

  /** Returns true when saved, so the modal only closes on success (it used to close on errors too, losing the form). */
  const handleCreateOrUpdate = async (): Promise<boolean> => {
    if (!supabase || saving) return false;
    setError(null);
    const trimmedTitle = formValues.title.trim();
    if (!trimmedTitle || !formValues.startDate || (!formValues.allDay && !formValues.startTime)) return false;

    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return false;
    }

    const startAtValue = buildDateTime(formValues.startDate, formValues.allDay ? "00:00" : formValues.startTime);
    if (!startAtValue) {
      setError("Start date/time is required.");
      return false;
    }
    if (formValues.endDate && !formValues.allDay && !formValues.endTime) {
      setError("Add an end time, or clear the end date.");
      return false;
    }
    // All-day with no end date still ends that same day.
    const endDateForSave = formValues.endDate || (formValues.allDay ? formValues.startDate : "");
    const rawEndAt = endDateForSave
      ? buildDateTime(endDateForSave, formValues.allDay ? "23:59" : formValues.endTime)
      : "";
    const endAtValue = rawEndAt || null;

    if (endAtValue && new Date(endAtValue) < new Date(startAtValue)) {
      setError("The end time is before the start time.");
      return false;
    }

    const base = {
      church_id: context.profile.church_id,
      title: trimmedTitle,
      audience: formValues.audience as EventItem["audience"],
      location: formValues.location.trim() || null,
      address: formValues.address.trim() || null,
      description: formValues.description.trim() || null,
      // Always sent, so removing an image actually removes it.
      image_url: formValues.imageUrl ?? null,
    };

    setSaving(true);
    try {
      if (selectedEventId) {
        const { error: updateError } = await supabase
          .from("events")
          .update({ ...base, start_at: startAtValue, end_at: endAtValue })
          .eq("id", selectedEventId);
        if (updateError) {
          setError(updateError.message);
          return false;
        }
      } else {
        const occurrences = expandRepeats(startAtValue, endAtValue, formValues.repeat, formValues.repeatCount);
        const { error: insertError } = await supabase
          .from("events")
          .insert(occurrences.map((o) => ({ ...base, start_at: o.start, end_at: o.end })));
        if (insertError) {
          setError(insertError.message);
          return false;
        }
        if (formValues.announce) {
          const when = new Date(startAtValue).toLocaleString(undefined, {
            weekday: "long", month: "long", day: "numeric",
            ...(formValues.allDay ? {} : { hour: "numeric", minute: "2-digit" }),
          });
          const where = [base.location, base.address || context.church.address].filter(Boolean).join(", ");
          const series = occurrences.length > 1 ? ` (repeats ${REPEAT_LABEL[formValues.repeat]}, ${occurrences.length} times)` : "";
          const body = [`${when}${series}`, where, base.description].filter(Boolean).join("\n\n");
          const { error: annError } = await supabase.from("announcements").insert({
            church_id: base.church_id,
            title: trimmedTitle,
            body,
            audience: base.audience,
            publish_at: new Date().toISOString(),
            ...(base.image_url ? { image_url: base.image_url } : {}),
          } as never);
          if (annError) {
            // The event itself saved — say so rather than failing the whole action.
            setError(`Event created, but the announcement couldn't be posted: ${annError.message}`);
            refresh();
            return false;
          }
        }
      }
      resetForm();
      refresh();
      return true;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!supabase || !selectedEventId) return;
    const event = events.find((e) => e.id === selectedEventId);
    const going = rsvpCountsByEvent[selectedEventId]?.GOING ?? 0;
    const warning = going > 0
      ? `Delete "${event?.title}"? ${going} ${going === 1 ? "person has" : "people have"} RSVP'd — their RSVPs will be removed too. To keep a record, cancel it instead.`
      : `Delete "${event?.title}"? This can't be undone.`;
    if (typeof window !== "undefined" && !window.confirm(warning)) return;
    setSaving(true);
    const { error: deleteError } = await supabase.from("events").delete().eq("id", selectedEventId);
    setSaving(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setComposerOpen(false);
    resetForm();
    refresh();
  };

  const handleSelectEvent = (event: EventItem) => {
    setSelectedEventId(event.id);
    setFormValues({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      address: event.address || "",
      audience: event.audience,
      startDate: toDateInput(event.start_at),
      startTime: toTimeInput(event.start_at),
      endDate: event.end_at ? toDateInput(event.end_at) : "",
      endTime: event.end_at ? toTimeInput(event.end_at) : "",
      allDay: isAllDay(event),
      imageUrl: event.image_url ?? null,
      repeat: "none",
      repeatCount: 4,
      announce: false,
    });
  };

  const handleDuplicate = (event: EventItem) => {
    setSelectedEventId(null);
    setFormValues({
      title: `${event.title} (copy)`,
      description: event.description || "",
      location: event.location || "",
      address: event.address || "",
      audience: event.audience,
      startDate: toDateInput(event.start_at),
      startTime: toTimeInput(event.start_at),
      endDate: event.end_at ? toDateInput(event.end_at) : "",
      endTime: event.end_at ? toTimeInput(event.end_at) : "",
      allDay: isAllDay(event),
      imageUrl: event.image_url ?? null,
      repeat: "none",
      repeatCount: 4,
      announce: false,
    });
  };

  const handleCancelEvent = async (event: EventItem) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("events")
      .update({ is_cancelled: true })
      .eq("id", event.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (selectedEventId === event.id) resetForm();
    refresh();
  };

  const handleRestoreEvent = async (event: EventItem) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("events")
      .update({ is_cancelled: false })
      .eq("id", event.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    refresh();
  };

  const resetForm = () => {
    setSelectedEventId(null);
    setFormValues({
      title: "",
      description: "",
      location: "",
      address: "",
      audience: "ALL",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      allDay: false,
      imageUrl: null,
      repeat: "none",
      repeatCount: 4,
      announce: false,
    });
  };

  const handleTemplateSelect = (template: EventTemplate) => {
    setFormValues((prev) => ({
      ...prev,
      title: template.title,
      description: template.description,
      location: template.location
    }));
  };

  const [composerOpen, setComposerOpen] = useState(false);
  const totalRsvps = useMemo(() => upcomingEvents.reduce((s, e) => {
    const c = rsvpCountsByEvent[e.id];
    return s + (c ? c.GOING + c.MAYBE + c.NO : 0);
  }, 0), [upcomingEvents, rsvpCountsByEvent]);
  const cancelledCount = useMemo(() => events.filter(e => e.is_cancelled).length, [events]);

  const openCreate = () => { resetForm(); setComposerOpen(true); };
  const openEdit = (event: EventItem) => { handleSelectEvent(event); setComposerOpen(true); };

  return (
    <PageGrid>
      {/* Header */}
      <PageGridFull className="animate-fade-in-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <AdminHeader title="Events" subtitle="Schedule gatherings, services, and activities for your community." />
          <button type="button" onClick={openCreate} className="btn btn-primary-gradient flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
            New Event
          </button>
        </div>
      </PageGridFull>

      {/* Stats */}
      <PageGridFull className="animate-fade-in-up [animation-delay:50ms]">
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: "Upcoming", value: upcomingEvents.length, sub: "events" },
            { label: "Upcoming RSVPs", value: totalRsvps, sub: "responses" },
            { label: "Cancelled", value: cancelledCount, sub: "events" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="stitch-section-card space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[var(--text-primary)]">{value}</span>
                <span className="text-sm text-[var(--text-muted)]">{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </PageGridFull>

      {/* Main: list + RSVP panel */}
      <PageGridFull className="animate-fade-in-up [animation-delay:100ms]">
        {loading && events.length === 0 ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />)}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <EventsList
              upcoming={upcomingEvents}
              past={pastEvents}
              cancelled={cancelledEvents}
              selectedEventId={selectedEventId}
              activeTab={activeTab}
              rsvpCounts={rsvpGoingCounts}
              onTabChange={setActiveTab}
              onSelect={handleSelectEvent}
              onEdit={openEdit}
              onDuplicate={(e) => { handleDuplicate(e); setComposerOpen(true); }}
              onCancel={handleCancelEvent}
              onRestore={handleRestoreEvent}
              onTemplateSelect={(t) => { handleTemplateSelect(t); setComposerOpen(true); }}
            />
            <RsvpPanel
              selectedEventTitle={selectedEvent?.title ?? null}
              selectedEventIsPast={selectedEvent ? new Date(selectedEvent.start_at) < new Date() : false}
              going={selectedCounts.GOING}
              maybe={selectedCounts.MAYBE}
              no={selectedCounts.NO}
              onViewAttendees={() => setViewAttendees(true)}
            />
          </div>
        )}
      </PageGridFull>

      {/* Create / Edit modal */}
      {composerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[var(--surface-container-lowest)] shadow-2xl" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedEventId ? "Edit Event" : "New Event"}</h2>
              <button type="button" onClick={() => { setComposerOpen(false); resetForm(); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <EventForm
              values={formValues}
              timezoneLabel={timezoneLabel}
              isEditing={!!selectedEventId}
              churchId={churchId}
              churchAddress={churchAddress}
              onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
              onSubmit={() => { void handleCreateOrUpdate().then((ok) => { if (ok) setComposerOpen(false); }); }}
              onCancelEdit={() => { setComposerOpen(false); resetForm(); }}
              onDelete={selectedEventId ? () => void handleDeleteEvent() : undefined}
              saving={saving}
              onTemplateSelect={handleTemplateSelect}
              error={error}
            />
          </div>
        </div>
      )}

      <PageGridFull>
        <AttendeeListDialog open={viewAttendees} attendees={attendees} onClose={() => setViewAttendees(false)} />
      </PageGridFull>
    </PageGrid>
  );
}

const REPEAT_LABEL: Record<RepeatRule, string> = {
  none: "",
  weekly: "weekly",
  biweekly: "every 2 weeks",
  monthly: "monthly",
};

/** Start/end pairs for a repeating series; monthly keeps the same day of month (clamped). */
function expandRepeats(startIso: string, endIso: string | null, rule: RepeatRule, count: number) {
  const start = new Date(startIso);
  const duration = endIso ? new Date(endIso).getTime() - start.getTime() : null;
  const n = rule === "none" ? 1 : Math.max(1, Math.min(count, 52));
  return Array.from({ length: n }, (_, i) => {
    const s = new Date(start);
    if (rule === "weekly") s.setDate(start.getDate() + 7 * i);
    if (rule === "biweekly") s.setDate(start.getDate() + 14 * i);
    if (rule === "monthly") {
      const day = start.getDate();
      s.setDate(1);
      s.setMonth(start.getMonth() + i);
      const last = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
      s.setDate(Math.min(day, last));
    }
    return { start: s.toISOString(), end: duration != null ? new Date(s.getTime() + duration).toISOString() : null };
  });
}

/** Events saved as all-day run 00:00 → 23:59 local; recognise them when editing. */
function isAllDay(event: { start_at: string; end_at: string | null }) {
  const s = new Date(event.start_at);
  if (s.getHours() !== 0 || s.getMinutes() !== 0) return false;
  if (!event.end_at) return false;
  const e = new Date(event.end_at);
  return e.getHours() === 23 && e.getMinutes() === 59;
}

function buildDateTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return "";
  const parsed = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
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
