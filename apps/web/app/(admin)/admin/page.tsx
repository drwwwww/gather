"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "../../../components/ui/button";
import PageLoader from "../../../components/ui/PageLoader";
import AppShell from "../../../components/layout/AppShell";

import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "@gather/lib";
import { formatShortDateTime, formatWeekdayDateTime, formatCountdown } from "../../../lib/format";
import { type ThisWeekStripData } from "../../../components/dashboard/ThisWeekStrip";
import { type KpiRowData } from "../../../components/dashboard/KpiRow";
import NextServiceTeamCard, { type TeamRow } from "../../../components/dashboard/NextServiceTeamCard";
import PendingConfirmationsCard, { type PendingRow } from "../../../components/dashboard/PendingConfirmationsCard";
import LatestAnnouncementsCard, { type AnnouncementPreview } from "../../../components/dashboard/LatestAnnouncementsCard";
import UpcomingEventsCard, { type EventPreview } from "../../../components/dashboard/UpcomingEventsCard";
import RecentActivityCard from "../../../components/dashboard/RecentActivityCard";

type EventItem = Database["public"]["Tables"]["events"]["Row"];
type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["volunteer_assignments"]["Row"];
type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EventRsvp = Database["public"]["Tables"]["event_rsvps"]["Row"];

type DashboardCounts = {
  openRolesCount: number;
  pendingConfirmationsCount: number;
  upcomingEventsCount: number;
  scheduledAnnouncementsCount: number;
};

export default function AdminEntryPage() {
  const [displayName, setDisplayName] = useState("Admin");
  const [thisWeekStrip, setThisWeekStrip] = useState<ThisWeekStripData>({
    nextServiceLabel: "Not scheduled",
    openSlots: 0,
    pendingConfirmations: 0,
    scheduledAnnouncements: 0,
    eventsThisWeek: 0
  });
  const [kpis, setKpis] = useState<KpiRowData>({ members: 0, volunteers: 0, rsvpsThisWeek: 0 });
  const [teamRows, setTeamRows] = useState<TeamRow[]>([]);
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [announcementPreviews, setAnnouncementPreviews] = useState<AnnouncementPreview[]>([]);
  const [eventPreviews, setEventPreviews] = useState<EventPreview[]>([]);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [churchAddress, setChurchAddress] = useState<string | null>(null);
  const [nextServiceAt, setNextServiceAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"checking" | "restricted" | "ready">("checking");
  const router = useRouter();

  const refreshStats = async () => {
    if (!supabase) return;
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      router.push("/login?next=/admin");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, church_id, role, full_name, email")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      setStatus("restricted");
      setLoading(false);
      return;
    }

    if (!profile?.church_id) {
      router.push("/onboarding/create-church");
      return;
    }

    if (profile.role !== "ADMIN") {
      setStatus("restricted");
      setLoading(false);
      return;
    }

    const name = profile.full_name?.trim() || profile.email?.trim() || "Admin";
    setDisplayName(name);

    const now = new Date();
    const thisWeekEnd = new Date(now);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

    const [assignmentsResult, eventsResult, announcementsResult, serviceTimesResult, rolesResult, profilesResult, churchResult] = await Promise.all([
      supabase.from("volunteer_assignments").select("*").eq("church_id", profile.church_id),
      supabase.from("events").select("*").eq("church_id", profile.church_id).order("start_at", { ascending: true }),
      supabase.from("announcements").select("*").eq("church_id", profile.church_id),
      supabase.from("service_times").select("*").eq("church_id", profile.church_id).order("day_of_week", { ascending: true }),
      supabase.from("volunteer_roles").select("id, name").eq("church_id", profile.church_id),
      supabase.from("profiles").select("id, full_name, email, role, created_at").eq("church_id", profile.church_id),
      supabase.from("churches").select("address").eq("id", profile.church_id).maybeSingle()
    ]);

    const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
    const events = (eventsResult.data ?? []) as EventItem[];
    const announcements = (announcementsResult.data ?? []) as AnnouncementRow[];
    const serviceTimes = (serviceTimesResult.data ?? []) as ServiceTime[];
    const roles = (rolesResult.data ?? []) as RoleRow[];
    const profiles = (profilesResult.data ?? []) as ProfileRow[];

    const rolesById = new Map(roles.map((role) => [role.id, role.name]));
    const profilesById = new Map(
      profiles.map((p) => [p.id, p.full_name || p.email || "Member"])
    );

    const nextService = getNextServiceDateTime(serviceTimes);
    const nextServiceDateOnly = nextService ? nextService.toISOString().slice(0, 10) : null;

    setChurchAddress(
      (churchResult.data as { address?: string | null } | null)?.address?.trim() || null
    );
    setNextServiceAt(nextService ?? null);
    const assignmentsForNextService = nextServiceDateOnly
      ? assignments.filter((assignment) => assignment.scheduled_date === nextServiceDateOnly)
      : [];

    const openAssignments = assignmentsForNextService.filter((assignment) => assignment.status === "OPEN");
    const pendingAssignments = assignmentsForNextService.filter((assignment) => assignment.status === "ASSIGNED");
    const declinedAssignments = assignmentsForNextService.filter((assignment) => assignment.status === "DECLINED");

    const eventsThisWeek = events.filter((event) => {
      const parsed = new Date(event.start_at);
      return parsed >= now && parsed <= thisWeekEnd;
    });

    const scheduledAnnouncements = announcements.filter((item) => {
      if (!item.publish_at) return false;
      const parsed = new Date(item.publish_at);
      return parsed > now && parsed <= thisWeekEnd;
    });

    const upcomingEventsList = events.filter((event) => new Date(event.start_at) >= now).slice(0, 3);

    const eventIds = Array.from(
      new Set([...eventsThisWeek, ...upcomingEventsList].map((event) => event.id))
    );

    let rsvps: EventRsvp[] = [];
    if (eventIds.length) {
      const { data: rsvpData } = await supabase
        .from("event_rsvps")
        .select("event_id")
        .in("event_id", eventIds);
      rsvps = (rsvpData ?? []) as EventRsvp[];
    }

    const rsvpCounts = rsvps.reduce<Record<string, number>>((acc, rsvp) => {
      acc[rsvp.event_id] = (acc[rsvp.event_id] || 0) + 1;
      return acc;
    }, {});

    setThisWeekStrip({
      nextServiceLabel: formatWeekdayDateTime(nextService),
      openSlots: openAssignments.length,
      pendingConfirmations: pendingAssignments.length,
      scheduledAnnouncements: scheduledAnnouncements.length,
      eventsThisWeek: eventsThisWeek.length
    });

    setKpis({
      members: profiles.filter((member) => member.role === "MEMBER").length,
      volunteers: profiles.filter((member) => member.role === "SERVICE").length,
      rsvpsThisWeek: rsvps.filter((rsvp) => eventsThisWeek.some((event) => event.id === rsvp.event_id)).length
    });

    setTeamRows(
      assignmentsForNextService.slice(0, 6).map((assignment) => ({
        id: assignment.id,
        role: rolesById.get(assignment.role_id) || "Role",
        assignee: assignment.assigned_user_id ? profilesById.get(assignment.assigned_user_id) || "Assigned" : "OPEN",
        status: assignment.status
      }))
    );

    setPendingRows(
      [...pendingAssignments, ...declinedAssignments].slice(0, 4).map((assignment) => ({
        id: assignment.id,
        role: rolesById.get(assignment.role_id) || "Role",
        assignee: assignment.assigned_user_id ? profilesById.get(assignment.assigned_user_id) || "Member" : "Unassigned",
        status: assignment.status
      }))
    );

    const announcementPreview = announcements
      .slice()
      .sort((a, b) => {
        const aDate = new Date(a.publish_at ?? a.created_at).getTime();
        const bDate = new Date(b.publish_at ?? b.created_at).getTime();
        return bDate - aDate;
      })
      .slice(0, 3)
      .map((item) => {
        const publishAt = item.publish_at ? formatShortDateTime(item.publish_at) : null;
        const status = item.publish_at
          ? new Date(item.publish_at) > now
            ? "Scheduled"
            : "Published"
          : "Draft";
        return {
          id: item.id,
          title: item.title,
          status,
          publishAt
        } as AnnouncementPreview;
      });

    setAnnouncementPreviews(announcementPreview);

    setEventPreviews(
      upcomingEventsList.map((event) => ({
        id: event.id,
        title: event.title,
        startAt: formatWeekdayDateTime(event.start_at),
        location: event.location,
        rsvpCount: rsvpCounts[event.id] || 0
      }))
    );

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const newMembers = profiles.filter((member) => new Date(member.created_at) >= weekStart).length;
    const activityItems: string[] = [];
    if (pendingAssignments.length) activityItems.push(`${pendingAssignments.length} volunteers pending confirmation`);
    if (declinedAssignments.length) activityItems.push(`${declinedAssignments.length} assignments declined`);
    if (scheduledAnnouncements.length) activityItems.push(`${scheduledAnnouncements.length} announcements scheduled this week`);
    if (newMembers) activityItems.push(`${newMembers} new members joined this week`);
    setRecentActivity(activityItems);

    setStatus("ready");
    setLoading(false);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  if (status === "checking") {
    return <PageLoader message="Finishing setup..." />;
  }

  if (status === "restricted") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6" style={{ background: "var(--bg)" }}>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Access restricted</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Your account is not an admin. Request access from your church admin.</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={async () => {
            await supabase?.auth.signOut();
            router.push("/login");
          }}
        >
          Sign out
        </Button>
      </main>
    );
  }

  return (
    <AppShell>
      {/* Top: page actions / simple navigation (dropdown + primary button) */}
      <header className="flex flex-col gap-2 mb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Welcome back, {displayName}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Weekly operations overview
          </p>
        </div>
      </header>

      {/* Hero: Next service (primary) with quick actions */}
      <section className="mb-6">
        <div className="card shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                  Next service
                </div>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {thisWeekStrip.nextServiceLabel}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {nextServiceAt && formatCountdown(nextServiceAt) && (
                    <span>{formatCountdown(nextServiceAt)}</span>
                  )}
                  {churchAddress && (
                    <span>{churchAddress}</span>
                  )}
                </div>
                {(thisWeekStrip.openSlots > 0 || thisWeekStrip.pendingConfirmations > 0) && (
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {thisWeekStrip.openSlots > 0 && (
                      <span>{thisWeekStrip.openSlots} open slot{thisWeekStrip.openSlots !== 1 ? "s" : ""}</span>
                    )}
                    {thisWeekStrip.openSlots > 0 && thisWeekStrip.pendingConfirmations > 0 && (
                      <span> · </span>
                    )}
                    {thisWeekStrip.pendingConfirmations > 0 && (
                      <span>{thisWeekStrip.pendingConfirmations} pending confirmation{thisWeekStrip.pendingConfirmations !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <Link href="/admin/service-plans" className="btn btn-secondary btn-sm">
                  View plan
                </Link>
                <Link href="/volunteers" className="btn btn-primary btn-sm">
                  Volunteers
                </Link>
              </div>
            </div>
            <div className="mt-6 pt-6 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <Link href="/announcements" className="btn btn-primary btn-sm">
                Create announcement
              </Link>
              <Link href="/events" className="btn btn-secondary btn-sm">
                Create event
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service readiness — one card with grid */}
      <section className="mb-6">
        <div className="card shadow-sm p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Open volunteer slots", value: thisWeekStrip.openSlots },
              { label: "Pending confirmations", value: thisWeekStrip.pendingConfirmations },
              { label: "Announcements scheduled", value: thisWeekStrip.scheduledAnnouncements },
              { label: "Events this week", value: thisWeekStrip.eventsThisWeek },
              { label: "Members", value: kpis.members },
              { label: "Volunteers", value: kpis.volunteers }
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {label}
                </span>
                <span className="mt-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main grid: service team + work queue vs communications + activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <NextServiceTeamCard items={teamRows} />
          <PendingConfirmationsCard items={pendingRows} />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <LatestAnnouncementsCard items={announcementPreviews} />
          <RecentActivityCard items={recentActivity} />
        </div>
      </section>

      {/* Optional: upcoming events */}
      <section className="mt-6">
        <UpcomingEventsCard items={eventPreviews} />
      </section>
    </AppShell>
  );
}

function getNextServiceDateTime(serviceTimes: ServiceTime[]) {
  if (!serviceTimes.length) return null;
  const now = new Date();
  const candidates = serviceTimes.map((service) => {
    const target = new Date(now);
    const currentDay = target.getDay();
    const dayOffset = (service.day_of_week + 7 - currentDay) % 7;
    target.setDate(target.getDate() + dayOffset);
    const [hours, minutes] = service.start_time.split(":").map(Number);
    target.setHours(hours || 0, minutes || 0, 0, 0);
    if (target < now) {
      target.setDate(target.getDate() + 7);
    }
    return target;
  });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] ?? null;
}

function formatDateTime(value: string) {
  if (!value || value === "Not scheduled") return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}
