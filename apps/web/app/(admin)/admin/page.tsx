"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PageLoader from "../../../components/ui/PageLoader";
import { PageGrid, PageGridFull, PageGridRowTwoOne } from "../../../components/layout/PageGrid";

import { supabase } from "../../../lib/supabaseClient";
import { getNextServiceDateTime } from "../../../lib/nextServiceDatetime";
import type { Database } from "@gather/lib";
import { formatShortDateTime, formatWeekdayDateTime, formatCountdown } from "../../../lib/format";
import { Clock, MapPin } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import { type ThisWeekStripData } from "../../../components/dashboard/ThisWeekStrip";
import NextServiceTeamCard, { type TeamRow } from "../../../components/dashboard/NextServiceTeamCard";
import PendingConfirmationsCard, { type PendingRow } from "../../../components/dashboard/PendingConfirmationsCard";
import LatestAnnouncementsCard, { type AnnouncementPreview } from "../../../components/dashboard/LatestAnnouncementsCard";
import UpcomingEventsCard, { type EventRow } from "../../../components/dashboard/UpcomingEventsCard";
import RecentActivityCard from "../../../components/dashboard/RecentActivityCard";
import RosterDonutCard from "../../../components/dashboard/RosterDonutCard";
import type { RosterMix } from "../../../components/dashboard/RosterDonutCard";
import VenusAccentStrip from "../../../components/dashboard/VenusAccentStrip";

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
  const [teamRows, setTeamRows] = useState<TeamRow[]>([]);
  const [nextServiceDateLabel, setNextServiceDateLabel] = useState<string | null>(null);
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [announcementPreviews, setAnnouncementPreviews] = useState<AnnouncementPreview[]>([]);
  const [eventPreviews, setEventPreviews] = useState<EventRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [rosterMix, setRosterMix] = useState<RosterMix>({
    open: 0,
    assigned: 0,
    confirmed: 0,
    declined: 0
  });
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

    const todayDateStr = new Date().toISOString().slice(0, 10);

    const [assignmentsResult, eventsResult, announcementsResult, serviceTimesResult, rolesResult, profilesResult, churchResult, nextPlanResult] = await Promise.all([
      supabase.from("volunteer_assignments").select("*").eq("church_id", profile.church_id),
      supabase.from("events").select("*").eq("church_id", profile.church_id).order("start_at", { ascending: true }),
      supabase.from("announcements").select("*").eq("church_id", profile.church_id),
      supabase.from("service_times").select("*").eq("church_id", profile.church_id).order("day_of_week", { ascending: true }),
      supabase.from("volunteer_roles").select("id, name").eq("church_id", profile.church_id),
      supabase.from("profiles").select("id, full_name, email, role, created_at").eq("church_id", profile.church_id),
      supabase.from("churches").select("address").eq("id", profile.church_id).maybeSingle(),
      // Use actual next service plan as ground truth for "Next Service Team"
      supabase.from("service_plans").select("id, service_date, title").eq("church_id", profile.church_id).gte("service_date", todayDateStr).order("service_date", { ascending: true }).limit(1).maybeSingle(),
    ]);

    const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
    const events = (eventsResult.data ?? []) as EventItem[];
    const announcements = (announcementsResult.data ?? []) as AnnouncementRow[];
    const serviceTimes = (serviceTimesResult.data ?? []) as ServiceTime[];
    const roles = (rolesResult.data ?? []) as RoleRow[];
    const profiles = (profilesResult.data ?? []) as ProfileRow[];
    const nextPlan = nextPlanResult.data as { id: string; service_date: string; title: string } | null;

    const rolesById = new Map(roles.map((role) => [role.id, role.name]));
    const profilesById = new Map(
      profiles.map((p) => [p.id, p.full_name || p.email || "Member"])
    );

    // Use actual next plan date first; fall back to computed service-time date
    const nextService = getNextServiceDateTime(serviceTimes);
    const nextServiceDateOnly = nextPlan?.service_date ?? (nextService ? nextService.toISOString().slice(0, 10) : null);

    // Fetch role slots and assigned run-of-show items for the next plan
    type SlotTeamRow = { id: string; role_id: string; assigned_user_id: string | null; backup_user_id: string | null; status: string };
    type ItemTeamRow = { id: string; title: string; assigned_user_id: string | null; assignment_status: string | null };
    let planSlots: SlotTeamRow[] = [];
    let planItems: ItemTeamRow[] = [];
    if (nextPlan?.id) {
      const [slotsRes, itemsRes] = await Promise.all([
        supabase.from("service_plan_role_slots").select("id, role_id, assigned_user_id, backup_user_id, status").eq("plan_id", nextPlan.id),
        // Fetch ALL items so we can count open slots too
        supabase.from("service_plan_items").select("id, title, assigned_user_id, assignment_status").eq("plan_id", nextPlan.id),
      ]);
      planSlots = (slotsRes.data ?? []) as SlotTeamRow[];
      planItems = (itemsRes.data ?? []) as ItemTeamRow[];
    }

    // Normalise plan item status: has assignee but status is still "OPEN" → treat as "ASSIGNED"
    const normItemStatus = (i: ItemTeamRow) => {
      if (!i.assigned_user_id) return "OPEN";
      if (!i.assignment_status || i.assignment_status === "OPEN") return "ASSIGNED";
      return i.assignment_status;
    };

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
    const confirmedAssignments = assignmentsForNextService.filter((assignment) => assignment.status === "CONFIRMED");

    // Tally role slots and run-of-show items for the next service plan
    const slotOpen = planSlots.filter((s) => !s.assigned_user_id || s.status === "OPEN").length;
    const slotAssigned = planSlots.filter((s) => s.status === "ASSIGNED" && s.assigned_user_id).length;
    const slotConfirmed = planSlots.filter((s) => s.status === "CONFIRMED").length;
    const slotDeclined = planSlots.filter((s) => s.status === "DECLINED").length;

    const itemOpen = planItems.filter((i) => normItemStatus(i) === "OPEN").length;
    const itemAssigned = planItems.filter((i) => normItemStatus(i) === "ASSIGNED").length;
    const itemConfirmed = planItems.filter((i) => normItemStatus(i) === "CONFIRMED").length;
    const itemDeclined = planItems.filter((i) => normItemStatus(i) === "DECLINED").length;

    setRosterMix({
      open: openAssignments.length + slotOpen + itemOpen,
      assigned: pendingAssignments.length + slotAssigned + itemAssigned,
      confirmed: confirmedAssignments.length + slotConfirmed + itemConfirmed,
      declined: declinedAssignments.length + slotDeclined + itemDeclined,
    });

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

    setNextServiceDateLabel(nextServiceDateOnly ?? null);

    const combinedTeamRows: TeamRow[] = [
      // 1. Traditional volunteer schedule assignments
      ...assignmentsForNextService.map((a) => ({
        id: `s-${a.id}`,
        role: rolesById.get(a.role_id) || "Role",
        assignee: a.assigned_user_id ? (profilesById.get(a.assigned_user_id) || "Assigned") : "Open",
        status: a.status,
      })),
      // 2. Service plan role slots (ushers, greeters, etc.)
      ...planSlots.map((s) => ({
        id: `r-${s.id}`,
        role: rolesById.get(s.role_id) || "Role",
        assignee: s.assigned_user_id ? (profilesById.get(s.assigned_user_id) || "Assigned") : "Open",
        status: s.status,
      })),
      // 3. Run-of-show steps with an assigned person (skip truly open steps)
      ...planItems
        .filter((i) => !!i.assigned_user_id)
        .map((i) => ({
          id: `i-${i.id}`,
          role: i.title,
          assignee: profilesById.get(i.assigned_user_id!) || "Assigned",
          status: normItemStatus(i),
        })),
    ];
    setTeamRows(combinedTeamRows);

    const pendingSlots = planSlots.filter((s) => s.status === "ASSIGNED" || s.status === "DECLINED");
    const pendingItems = planItems.filter((i) => {
      const s = normItemStatus(i);
      return s === "ASSIGNED" || s === "DECLINED";
    });

    setPendingRows(
      [
        ...[...pendingAssignments, ...declinedAssignments].map((a) => ({
          id: `s-${a.id}`,
          role: rolesById.get(a.role_id) || "Role",
          assignee: a.assigned_user_id ? profilesById.get(a.assigned_user_id) || "Member" : "Unassigned",
          status: a.status,
        })),
        ...pendingSlots.map((s) => ({
          id: `r-${s.id}`,
          role: rolesById.get(s.role_id) || "Role",
          assignee: s.assigned_user_id ? profilesById.get(s.assigned_user_id) || "Member" : "Unassigned",
          status: s.status,
        })),
        ...pendingItems.map((i) => ({
          id: `i-${i.id}`,
          role: i.title,
          assignee: i.assigned_user_id ? profilesById.get(i.assigned_user_id) || "Member" : "Unassigned",
          status: normItemStatus(i),
        })),
      ].slice(0, 6)
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
        name: event.title,
        date: event.start_at,
        status: `${rsvpCounts[event.id] || 0} RSVP`
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

  useEffect(() => {
    if (status === "restricted") {
      router.replace("/member");
    }
  }, [status, router]);

  if (status === "checking") {
    return <DashboardSkeleton />;
  }

  if (status === "restricted") {
    return <DashboardSkeleton />;
  }

  return (
    <PageGrid className="gap-y-4 md:gap-y-5">
      <PageGridFull className="space-y-4 animate-fade-in-up">
        <header className="flex flex-col gap-2">
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
      <section>
        <div className="card shadow-sm !overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                  Next service
                </div>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {thisWeekStrip.nextServiceLabel}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {nextServiceAt && formatCountdown(nextServiceAt) && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{formatCountdown(nextServiceAt)}</span>
                    </div>
                  )}
                  {nextServiceAt && formatCountdown(nextServiceAt) && churchAddress && <span>&middot;</span>}
                  {churchAddress && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{churchAddress}</span>
                    </div>
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
              <div className="flex flex-wrap gap-2 sm:justify-end flex-shrink-0">
                <Link href="/admin/service-plans" className="btn btn-secondary btn-sm">
                  View plan
                </Link>
                <Link href="/volunteers" className="btn btn-primary btn-sm">
                  Volunteers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <VenusAccentStrip />
      </PageGridFull>

      <PageGridRowTwoOne
        className="animate-fade-in-up [animation-delay:100ms] opacity-0"
        main={
          <>
            <NextServiceTeamCard items={teamRows} serviceDate={nextServiceDateLabel} />
            <PendingConfirmationsCard items={pendingRows} />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch min-h-0 animate-fade-in-up [animation-delay:200ms] opacity-0">
              <RecentActivityCard items={recentActivity} />
              <UpcomingEventsCard items={eventPreviews} />
            </div>
          </>
        }
        side={
          <>
            <RosterDonutCard mix={rosterMix} />
            <LatestAnnouncementsCard items={announcementPreviews} />
          </>
        }
      />
    </PageGrid>
  );
}

function formatDateTime(value: string) {
  if (!value || value === "Not scheduled") return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function DashboardSkeleton() {
  return (
    <PageGrid className="gap-y-4 md:gap-y-5 animate-pulse-subtle">
      <PageGridFull className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 rounded-md bg-[var(--surface-2)]" />
          <div className="h-4 w-32 rounded-md bg-[var(--surface-2)] mt-0.5" />
        </div>

        {/* Hero Skeleton */}
        <div className="card shadow-sm h-[140px] bg-[var(--surface)]" />

        {/* Venus Strip Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card h-[240px] bg-[var(--surface)]" />
          <div className="card h-[240px] bg-[var(--surface)] hidden md:block" />
          <div className="card h-[240px] bg-[var(--surface)] hidden md:block" />
        </div>
      </PageGridFull>

      <PageGridRowTwoOne
        main={
          <div className="space-y-6">
            <div className="card h-[300px] bg-[var(--surface)]" />
            <div className="card h-[200px] bg-[var(--surface)]" />
          </div>
        }
        side={
          <div className="space-y-6">
            <div className="card h-[250px] bg-[var(--surface)]" />
            <div className="card h-[200px] bg-[var(--surface)]" />
          </div>
        }
      />
    </PageGrid>
  );
}
