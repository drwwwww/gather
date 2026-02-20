"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import { MotionContainer, MotionItem } from "../../../components/ui/motion";
import { getCurrentContext, indexProfilesById, listProfilesByChurch } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import EventForm, { type EventFormValues } from "../../../components/events/EventForm";
import EventsList, { type EventListTab } from "../../../components/events/EventsList";
import RsvpPanel from "../../../components/events/RsvpPanel";
import AttendeeListDialog from "../../../components/events/AttendeeListDialog";
import type { EventTemplate } from "../../../components/events/EventTemplates";
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
    allDay: false
  });
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
    return events.filter((event) => event.start_at < now);
  }, [events]);

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
      description: formValues.description.trim() || null
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
      allDay: false
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
      allDay: false
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
    if (selectedEventId === event.id) {
      resetForm();
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
      allDay: false
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

  return (
    <MotionContainer className="space-y-8">
      <MotionItem>
        <AdminHeader
          title="Events"
          subtitle="Create events and track RSVP counts."
        />
      </MotionItem>
      <MotionItem>
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <EventForm
            values={formValues}
            timezoneLabel={timezoneLabel}
            isEditing={!!selectedEventId}
            onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
            onSubmit={handleCreateOrUpdate}
            onCancelEdit={resetForm}
            onTemplateSelect={handleTemplateSelect}
            error={error}
          />

          <div className="space-y-6">
            <EventsList
              upcoming={upcomingEvents}
              past={pastEvents}
              selectedEventId={selectedEventId}
              activeTab={activeTab}
              rsvpCounts={rsvpGoingCounts}
              onTabChange={setActiveTab}
              onSelect={handleSelectEvent}
              onEdit={handleSelectEvent}
              onDuplicate={handleDuplicate}
              onCancel={handleCancelEvent}
              onTemplateSelect={handleTemplateSelect}
            />
            <RsvpPanel
              selectedEventTitle={selectedEvent?.title ?? null}
              going={selectedCounts.GOING}
              maybe={selectedCounts.MAYBE}
              no={selectedCounts.NO}
              onViewAttendees={() => setViewAttendees(true)}
            />
          </div>
        </section>
      </MotionItem>

      <AttendeeListDialog
        open={viewAttendees}
        attendees={attendees}
        onClose={() => setViewAttendees(false)}
      />

      {loading ? (
        <div className="text-sm text-base-content/60">Loading events...</div>
      ) : null}
    </MotionContainer>
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
