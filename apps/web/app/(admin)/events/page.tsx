"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import Loader from "../../../components/ui/Loader";
import { getCurrentContext, indexProfilesById, listProfilesByChurch } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import EventForm, { type EventFormValues } from "../../../components/events/EventForm";
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
    audience: "ALL",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    imageUrl: null,
  });
  const [churchId, setChurchId] = useState<string>("");
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

  const handleCreateOrUpdate = async () => {
    if (!supabase) return;
    setError(null);
    const trimmedTitle = formValues.title.trim();
    if (!trimmedTitle || !formValues.startDate || (!formValues.allDay && !formValues.startTime)) return;

    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return;
    }

    const startAtValue = buildDateTime(formValues.startDate, formValues.allDay ? "00:00" : formValues.startTime);
    if (!startAtValue) {
      setError("Start date/time is required.");
      return;
    }
    if (formValues.endDate && !formValues.allDay && !formValues.endTime) {
      setError("End time is required when an end date is set.");
      return;
    }
    const rawEndAt = formValues.endDate
      ? buildDateTime(formValues.endDate, formValues.allDay ? "23:59" : formValues.endTime)
      : "";
    const endAtValue = rawEndAt || null;

    if (endAtValue && new Date(endAtValue) < new Date(startAtValue)) {
      setError("End time must be after start time.");
      return;
    }

    const payload = {
      church_id: context.profile.church_id,
      title: trimmedTitle,
      start_at: startAtValue,
      end_at: endAtValue,
      audience: formValues.audience as EventItem["audience"],
      location: formValues.location.trim() || null,
      description: formValues.description.trim() || null,
      ...(formValues.imageUrl ? { image_url: formValues.imageUrl } as any : {}),
    };

    if (selectedEventId) {
      const { error: updateError } = await supabase
        .from("events")
        .update(payload)
        .eq("id", selectedEventId);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("events")
        .insert(payload);
      if (insertError) {
        setError(insertError.message);
        return;
      }
    }
    resetForm();
    refresh();
  };

  const handleSelectEvent = (event: EventItem) => {
    setSelectedEventId(event.id);
    setFormValues({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      audience: event.audience,
      startDate: toDateInput(event.start_at),
      startTime: toTimeInput(event.start_at),
      endDate: event.end_at ? toDateInput(event.end_at) : "",
      endTime: event.end_at ? toTimeInput(event.end_at) : "",
      allDay: false,
      imageUrl: (event as any).image_url ?? null,
    });
  };

  const handleDuplicate = (event: EventItem) => {
    setSelectedEventId(null);
    setFormValues({
      title: `${event.title} (copy)`,
      description: event.description || "",
      location: event.location || "",
      audience: event.audience,
      startDate: toDateInput(event.start_at),
      startTime: toTimeInput(event.start_at),
      endDate: event.end_at ? toDateInput(event.end_at) : "",
      endTime: event.end_at ? toTimeInput(event.end_at) : "",
      allDay: false,
      imageUrl: (event as any).image_url ?? null,
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
      audience: "ALL",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      allDay: false,
      imageUrl: null,
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
                <span className="text-4xl font-bold text-[var(--text-primary)]">{value}</span>
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
              onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
              onSubmit={() => { void handleCreateOrUpdate(); setComposerOpen(false); }}
              onCancelEdit={() => { setComposerOpen(false); resetForm(); }}
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
