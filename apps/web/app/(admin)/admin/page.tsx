"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";

import { Card } from "../../../components/ui/card";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "@gather/lib";
import { formatShortDateTime, formatWeekdayDateTime } from "../../../lib/format";
import ThisWeekStrip, { type ThisWeekStripData } from "../../../components/dashboard/ThisWeekStrip";
import KpiRow, { type KpiRowData } from "../../../components/dashboard/KpiRow";
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

    const [assignmentsResult, eventsResult, announcementsResult, serviceTimesResult, rolesResult, profilesResult] = await Promise.all([
      supabase.from("volunteer_assignments").select("*").eq("church_id", profile.church_id),
      supabase.from("events").select("*").eq("church_id", profile.church_id).order("start_at", { ascending: true }),
      supabase.from("announcements").select("*").eq("church_id", profile.church_id),
      supabase.from("service_times").select("*").eq("church_id", profile.church_id).order("day_of_week", { ascending: true }),
      supabase.from("volunteer_roles").select("id, name").eq("church_id", profile.church_id),
      supabase.from("profiles").select("id, full_name, email, role, created_at").eq("church_id", profile.church_id)
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
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6">
        <p className="text-sm text-base-content/70">Finishing setup...</p>
      </main>
    );
  }

  if (status === "restricted") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 bg-base-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-base-content/70">Your account is not an admin. Request access from your church admin.</p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await supabase?.auth.signOut();
            router.push("/login");
          }}
        >
          Sign out
        </button>
      </main>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title={`Welcome back, ${displayName}`}
          subtitle="Weekly operations overview."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href="/announcements" className="btn btn-primary btn-sm">Create announcement</Link>
              <Link href="/events" className="btn btn-outline btn-sm">Create event</Link>
              <Link href="/volunteers" className="btn btn-ghost btn-sm">Generate schedule</Link>
            </div>
          }
        />

        <ThisWeekStrip
          nextServiceLabel={thisWeekStrip.nextServiceLabel}
          openSlots={thisWeekStrip.openSlots}
          pendingConfirmations={thisWeekStrip.pendingConfirmations}
          scheduledAnnouncements={thisWeekStrip.scheduledAnnouncements}
          eventsThisWeek={thisWeekStrip.eventsThisWeek}
        />

        <KpiRow
          members={kpis.members}
          volunteers={kpis.volunteers}
          rsvpsThisWeek={kpis.rsvpsThisWeek}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-8">
              <NextServiceTeamCard items={teamRows} />
              <PendingConfirmationsCard items={pendingRows} />
              <LatestAnnouncementsCard items={announcementPreviews} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-8">
              <UpcomingEventsCard items={eventPreviews} />
              <RecentActivityCard items={recentActivity} />
              <section className="rounded-xl p-5" style={{ background: 'var(--gather-surface)' }}>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>Verse of the day</p>
                <blockquote className="mt-3 text-sm italic" style={{ color: 'var(--ink)' }}>
                  "Let us not love with words or speech but with actions and in truth."
                </blockquote>
                <cite className="mt-2 block text-xs" style={{ color: 'var(--muted)' }}>- 1 John 3:18</cite>
              </section>
            </div>
          </div>
        </div>
      </div>
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
