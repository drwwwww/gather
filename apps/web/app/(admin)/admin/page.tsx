"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Users, UserRound, TicketCheck, TrendingUp } from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import { getNextServiceDateTime } from "../../../lib/nextServiceDatetime";
import type { Database } from "@gather/lib";
import { formatShortDateTime, formatWeekdayDateTime, formatCountdown } from "../../../lib/format";
import type { TeamRow } from "../../../components/dashboard/NextServiceTeamCard";
import PendingConfirmationsCard, { type PendingRow } from "../../../components/dashboard/PendingConfirmationsCard";
import LatestAnnouncementsCard, { type AnnouncementPreview } from "../../../components/dashboard/LatestAnnouncementsCard";
import UpcomingEventsCard, { type EventRow } from "../../../components/dashboard/UpcomingEventsCard";
import RecentActivityCard from "../../../components/dashboard/RecentActivityCard";
import RosterDonutCard from "../../../components/dashboard/RosterDonutCard";
import type { RosterMix } from "../../../components/dashboard/RosterDonutCard";

type EventItem = Database["public"]["Tables"]["events"]["Row"];
type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];
type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EventRsvp = Database["public"]["Tables"]["event_rsvps"]["Row"];

type NextPlanSummary = { id: string; service_date: string; title: string };

function firstName(displayName: string) {
  const t = displayName.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? "there";
}

function assigneeInitials(label: string) {
  const t = label.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export default function AdminEntryPage() {
  const [displayName, setDisplayName] = useState("Admin");
  const [teamRows, setTeamRows] = useState<TeamRow[]>([]);
  const [nextServiceDateLabel, setNextServiceDateLabel] = useState<string | null>(null);
  const [nextPlan, setNextPlan] = useState<NextPlanSummary | null>(null);
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [announcementPreviews, setAnnouncementPreviews] = useState<AnnouncementPreview[]>([]);
  const [eventPreviews, setEventPreviews] = useState<EventRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [rosterMix, setRosterMix] = useState<RosterMix>({
    open: 0,
    assigned: 0,
    confirmed: 0,
    declined: 0,
  });
  const [churchAddress, setChurchAddress] = useState<string | null>(null);
  const [nextServiceAt, setNextServiceAt] = useState<Date | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [volunteersEngaged, setVolunteersEngaged] = useState(0);
  const [totalRsvps, setTotalRsvps] = useState(0);
  const [openSlotsNext, setOpenSlotsNext] = useState(0);
  const [newMembersThisMonth, setNewMembersThisMonth] = useState(0);
  const [newVolunteersThisMonth, setNewVolunteersThisMonth] = useState(0);
  const [rsvpEventCount, setRsvpEventCount] = useState(0);
  const [status, setStatus] = useState<"checking" | "restricted" | "ready">("checking");
  const router = useRouter();

  const refreshStats = async () => {
    if (!supabase) return;

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
      return;
    }

    if (!profile?.church_id) {
      router.push("/onboarding/create-church");
      return;
    }

    if (profile.role !== "ADMIN") {
      setStatus("restricted");
      return;
    }

    const name = profile.full_name?.trim() || profile.email?.trim() || "Admin";
    setDisplayName(name);

    const now = new Date();
    const thisWeekEnd = new Date(now);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

    const todayDateStr = new Date().toISOString().slice(0, 10);

    const [eventsResult, announcementsResult, serviceTimesResult, rolesResult, profilesResult, churchResult, allPlansResult] =
      await Promise.all([
        supabase.from("events").select("*").eq("church_id", profile.church_id).order("start_at", { ascending: true }),
        supabase.from("announcements").select("*").eq("church_id", profile.church_id),
        supabase.from("service_times").select("*").eq("church_id", profile.church_id).order("day_of_week", { ascending: true }),
        supabase.from("volunteer_roles").select("id, name").eq("church_id", profile.church_id),
        supabase.from("profiles").select("id, full_name, email, role, created_at").eq("church_id", profile.church_id),
        supabase.from("churches").select("address").eq("id", profile.church_id).maybeSingle(),
        supabase
          .from("service_plans")
          .select("id, service_date, title")
          .eq("church_id", profile.church_id)
          .order("service_date", { ascending: true }),
      ]);

    const events = (eventsResult.data ?? []) as EventItem[];
    const announcements = (announcementsResult.data ?? []) as AnnouncementRow[];
    const serviceTimes = (serviceTimesResult.data ?? []) as ServiceTime[];
    const roles = (rolesResult.data ?? []) as RoleRow[];
    const profiles = (profilesResult.data ?? []) as ProfileRow[];
    const allPlanRows = (allPlansResult.data ?? []) as NextPlanSummary[];
    const nextPlanRow = allPlanRows.find((p) => p.service_date >= todayDateStr) ?? null;
    const allPlanIds = allPlanRows.map((p) => p.id);
    setNextPlan(nextPlanRow);

    setMemberCount(profiles.length);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setNewMembersThisMonth(profiles.filter((p) => new Date(p.created_at) >= thirtyDaysAgo).length);

    const rolesById = new Map(roles.map((role) => [role.id, role.name]));
    const profilesById = new Map(profiles.map((p) => [p.id, p.full_name || p.email || "Member"]));

    const nextService = getNextServiceDateTime(serviceTimes);
    const nextServiceDateOnly = nextPlanRow?.service_date ?? (nextService ? nextService.toISOString().slice(0, 10) : null);

    type SlotTeamRow = { id: string; role_id: string; plan_id: string; assigned_user_id: string | null; backup_user_id: string | null; status: string; created_at: string };
    type ItemTeamRow = { id: string; title: string; assigned_user_id: string | null; assignment_status: string | null };
    let allSlots: SlotTeamRow[] = [];
    let planItems: ItemTeamRow[] = [];
    if (allPlanIds.length > 0) {
      const [slotsRes, itemsRes] = await Promise.all([
        supabase.from("service_plan_role_slots").select("id, role_id, plan_id, assigned_user_id, backup_user_id, status, created_at").in("plan_id", allPlanIds),
        nextPlanRow?.id
          ? supabase.from("service_plan_items").select("id, title, assigned_user_id, assignment_status").eq("plan_id", nextPlanRow.id)
          : Promise.resolve({ data: [], error: null }),
      ]);
      allSlots = (slotsRes.data ?? []) as SlotTeamRow[];
      planItems = (itemsRes.data ?? []) as ItemTeamRow[];
    }

    // Slots belonging to the next upcoming plan (for team card display)
    const planSlots = allSlots.filter((s) => s.plan_id === nextPlanRow?.id);

    // KPI: unique volunteers engaged across all plans
    const engaged = new Set(allSlots.map((s) => s.assigned_user_id).filter(Boolean) as string[]);
    setVolunteersEngaged(engaged.size);

    setNewVolunteersThisMonth(
      new Set(
        allSlots
          .filter((s) => s.created_at && new Date(s.created_at) >= thirtyDaysAgo && s.assigned_user_id)
          .map((s) => s.assigned_user_id as string)
      ).size
    );

    const normItemStatus = (i: ItemTeamRow) => {
      if (!i.assigned_user_id) return "OPEN";
      if (!i.assignment_status || i.assignment_status === "OPEN") return "ASSIGNED";
      return i.assignment_status;
    };

    setChurchAddress((churchResult.data as { address?: string | null } | null)?.address?.trim() || null);
    setNextServiceAt(nextService ?? null);

    const slotOpen = planSlots.filter((s) => !s.assigned_user_id || s.status === "OPEN").length;
    const slotAssigned = planSlots.filter((s) => s.status === "ASSIGNED" && s.assigned_user_id).length;
    const slotConfirmed = planSlots.filter((s) => s.status === "CONFIRMED").length;
    const slotDeclined = planSlots.filter((s) => s.status === "DECLINED").length;

    const itemOpen = planItems.filter((i) => normItemStatus(i) === "OPEN").length;
    const itemAssigned = planItems.filter((i) => normItemStatus(i) === "ASSIGNED").length;
    const itemConfirmed = planItems.filter((i) => normItemStatus(i) === "CONFIRMED").length;
    const itemDeclined = planItems.filter((i) => normItemStatus(i) === "DECLINED").length;

    const openTotal = slotOpen + itemOpen;
    setOpenSlotsNext(openTotal);

    setRosterMix({
      open: openTotal,
      assigned: slotAssigned + itemAssigned,
      confirmed: slotConfirmed + itemConfirmed,
      declined: slotDeclined + itemDeclined,
    });

    const eventsThisWeek = events.filter((event) => {
      const parsed = new Date(event.start_at);
      return parsed >= now && parsed <= thisWeekEnd;
    });

    const scheduledAnnouncementsList = announcements.filter((item) => {
      if (!item.publish_at) return false;
      const parsed = new Date(item.publish_at);
      return parsed > now && parsed <= thisWeekEnd;
    });

    const upcomingEventsList = events.filter((event) => new Date(event.start_at) >= now).slice(0, 3);

    const eventIds = Array.from(new Set([...eventsThisWeek, ...upcomingEventsList].map((event) => event.id)));

    let rsvps: EventRsvp[] = [];
    if (eventIds.length) {
      const { data: rsvpData } = await supabase.from("event_rsvps").select("event_id").in("event_id", eventIds);
      rsvps = (rsvpData ?? []) as EventRsvp[];
    }

    const rsvpCounts = rsvps.reduce<Record<string, number>>((acc, rsvp) => {
      acc[rsvp.event_id] = (acc[rsvp.event_id] || 0) + 1;
      return acc;
    }, {});

    setTotalRsvps(Object.values(rsvpCounts).reduce((a, n) => a + n, 0));
    setRsvpEventCount(eventIds.length);

    setNextServiceDateLabel(nextServiceDateOnly ?? null);

    const combinedTeamRows: TeamRow[] = [
      ...planSlots.map((s) => ({
        id: `r-${s.id}`,
        role: rolesById.get(s.role_id) || "Role",
        assignee: s.assigned_user_id ? profilesById.get(s.assigned_user_id) || "Assigned" : "Open",
        status: s.status,
      })),
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
    const pendingPlanItems = planItems.filter((i) => {
      const s = normItemStatus(i);
      return s === "ASSIGNED" || s === "DECLINED";
    });

    setPendingRows(
      [
        ...pendingSlots.map((s) => ({
          id: `r-${s.id}`,
          role: rolesById.get(s.role_id) || "Role",
          assignee: s.assigned_user_id ? profilesById.get(s.assigned_user_id) || "Member" : "Unassigned",
          status: s.status,
        })),
        ...pendingPlanItems.map((i) => ({
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
        const status = item.publish_at ? (new Date(item.publish_at) > now ? "Scheduled" : "Published") : "Draft";
        const excerpt = item.body.replace(/\s+/g, " ").trim().slice(0, 160);
        return {
          id: item.id,
          title: item.title,
          status,
          publishAt,
          excerpt: excerpt || undefined,
        } as AnnouncementPreview;
      });

    setAnnouncementPreviews(announcementPreview);

    setEventPreviews(
      upcomingEventsList.map((event) => ({
        id: event.id,
        name: event.title,
        date: event.start_at,
        status: `${rsvpCounts[event.id] || 0} RSVP`,
      }))
    );

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const newMembers = profiles.filter((member) => new Date(member.created_at) >= weekStart).length;
    const activityItems: string[] = [];
    const pendingSlotCount = planSlots.filter((s) => s.status === "ASSIGNED").length;
    const declinedSlotCount = planSlots.filter((s) => s.status === "DECLINED").length;
    if (pendingSlotCount) activityItems.push(`${pendingSlotCount} volunteers pending confirmation`);
    if (declinedSlotCount) activityItems.push(`${declinedSlotCount} assignments declined`);
    if (scheduledAnnouncementsList.length)
      activityItems.push(`${scheduledAnnouncementsList.length} announcements scheduled this week`);
    if (newMembers) activityItems.push(`${newMembers} new members joined this week`);
    setRecentActivity(activityItems);

    setStatus("ready");
  };

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    if (status === "restricted") {
      router.replace("/member");
    }
  }, [status, router]);

  if (status === "checking" || status === "restricted") {
    return <DashboardSkeleton />;
  }

  const greeting = firstName(displayName);
  const serviceWhen = nextServiceAt ? formatWeekdayDateTime(nextServiceAt) : nextServiceDateLabel ?? "Next service";
  const heroTitle = nextPlan?.title?.trim() || "Upcoming service";
  const planHref = nextPlan?.id ? `/admin/service-plans/${nextPlan.id}` : "/admin/service-plans";
  const heroBlurb =
    churchAddress != null
      ? `Main sanctuary service — ${churchAddress}.`
      : "Main sanctuary service focused on community and worship. Fill roles early for a smooth Sunday.";

  const avatarPeople = teamRows.filter((r) => r.assignee && r.assignee !== "Open");
  const avatarPreview = avatarPeople.slice(0, 3);
  const extraAvatars = Math.max(0, avatarPeople.length - 3);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="m-0 text-4xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-[3.5rem]">
          Hello, <span className="text-[var(--nav-active-foreground)]">{greeting}</span>.
        </h1>
        <p className="mt-2 max-w-2xl text-lg leading-relaxed text-[var(--text-muted)] sm:text-xl">
          Welcome back to the sanctuary dashboard. Here is what is happening in your community today.
        </p>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-amber-200 border-l-4 border-l-amber-400 bg-[var(--primary-soft)] px-5 py-4 sm:px-6 sm:py-5">
        <div className="relative z-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-800 sm:text-xs sm:px-4 sm:py-1">
              Upcoming Service
            </span>
            <span className="text-xs text-[var(--text-secondary)] sm:text-sm">• {serviceWhen}</span>
          </div>
          <h2 className="mb-1.5 text-2xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-3xl">{heroTitle}</h2>
          <p className="mb-4 max-w-lg text-sm leading-snug text-[var(--text-secondary)] sm:text-base">{heroBlurb}</p>
          {avatarPreview.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-0">
              <div className="flex -space-x-2">
                {avatarPreview.map((row) => (
                  <div
                    key={row.id}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-[10px] font-bold text-amber-600 sm:h-10 sm:w-10 sm:text-xs"
                    title={row.assignee}
                  >
                    {assigneeInitials(row.assignee)}
                  </div>
                ))}
                {extraAvatars > 0 && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-[10px] font-bold text-amber-700 sm:h-10 sm:w-10 sm:text-xs">
                    +{extraAvatars}
                  </div>
                )}
              </div>
              <span className="pl-3 text-xs font-medium text-[var(--text-secondary)] sm:pl-4 sm:text-sm">Service team and roles</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              href={planHref}
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white no-underline transition-[filter] hover:bg-amber-600 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:px-6"
            >
              View Full Plan
            </Link>
            <Link
              href="/volunteers"
              className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-transparent px-4 py-2 text-sm font-semibold text-amber-700 no-underline transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:px-5"
            >
              Volunteers
            </Link>
          </div>
          {nextServiceAt && formatCountdown(nextServiceAt) ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-amber-200 pt-3 text-xs text-[var(--text-muted)] sm:text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" aria-hidden />
                <span>{formatCountdown(nextServiceAt)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link
          href="/people"
          className="card card-elevated flex min-h-[160px] flex-col justify-between p-6 transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:border-[var(--nav-active-foreground)]/35 active:translate-y-0"
        >
          <div>
            <Users className="mb-3 h-9 w-9 text-[var(--nav-active-foreground)]" aria-hidden />
            <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">Total Members</h3>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-4xl font-bold text-[var(--text-primary)]">{memberCount.toLocaleString()}</span>
            <TrendPill
              label={newMembersThisMonth > 0 ? `+${newMembersThisMonth} this month` : "No new this month"}
              variant={newMembersThisMonth > 0 ? "positive" : "neutral"}
            />
          </div>
        </Link>
        <Link
          href="/volunteers"
          className="card card-elevated flex min-h-[160px] flex-col justify-between p-6 transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:border-[var(--nav-active-foreground)]/35 active:translate-y-0"
        >
          <div>
            <UserRound className="mb-3 h-9 w-9 text-[var(--nav-active-foreground)]" aria-hidden />
            <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">Volunteers Active</h3>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-4xl font-bold text-[var(--text-primary)]">{volunteersEngaged.toLocaleString()}</span>
            <TrendPill
              label={newVolunteersThisMonth > 0 ? `+${newVolunteersThisMonth} added this month` : "Same as last month"}
              variant={newVolunteersThisMonth > 0 ? "positive" : "neutral"}
            />
          </div>
        </Link>
        <Link
          href="/events"
          className="card card-elevated flex min-h-[160px] flex-col justify-between p-6 transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:border-[var(--nav-active-foreground)]/35 active:translate-y-0"
        >
          <div>
            <TicketCheck className="mb-3 h-9 w-9 text-[var(--nav-active-foreground)]" aria-hidden />
            <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">Recent RSVPs</h3>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-4xl font-bold text-[var(--text-primary)]">{totalRsvps.toLocaleString()}</span>
            <TrendPill
              label={rsvpEventCount > 0 ? `across ${rsvpEventCount} event${rsvpEventCount === 1 ? "" : "s"}` : "No upcoming events"}
              variant="neutral"
            />
          </div>
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          <PendingConfirmationsCard items={pendingRows} />
          <div className="grid min-h-0 grid-cols-1 gap-8 md:grid-cols-2 md:items-stretch">
            {recentActivity.length > 0 && <RecentActivityCard items={recentActivity} />}
            <div className={recentActivity.length === 0 ? "md:col-span-2" : ""}>
              <UpcomingEventsCard items={eventPreviews} variant="stitch" />
            </div>
          </div>
        </div>
        <aside className="space-y-10 lg:col-span-4">
          <RosterDonutCard mix={rosterMix} variant="stitch" />
          <LatestAnnouncementsCard items={announcementPreviews} />
        </aside>
      </div>
    </div>
  );
}

function TrendPill({ label, variant }: { label: string; variant: "positive" | "neutral" }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
        (variant === "positive"
          ? "bg-green-50 text-green-700"
          : "bg-[var(--surface-2)] text-[var(--text-muted)]")
      }
    >
      {variant === "positive" && <TrendingUp className="h-3 w-3" aria-hidden />}
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div>
        <div className="h-12 w-full max-w-md rounded-lg bg-[var(--surface-2)]" />
        <div className="mt-3 h-5 w-full max-w-xl rounded-lg bg-[var(--surface)]" />
      </div>
      <div className="h-44 rounded-[var(--radius-box)] bg-[var(--primary-soft)] sm:h-48" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-[var(--radius-box)] bg-[var(--surface)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <div className="h-56 rounded-[var(--radius-box)] bg-[var(--surface)]" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="h-48 rounded-[var(--radius-box)] bg-[var(--surface)]" />
            <div className="h-48 rounded-[var(--radius-box)] bg-[var(--surface)]" />
          </div>
        </div>
        <div className="space-y-8 lg:col-span-4">
          <div className="h-72 rounded-[var(--radius-box)] bg-[var(--surface)]" />
          <div className="h-56 rounded-[var(--radius-box)] bg-[var(--surface-2)]" />
        </div>
      </div>
    </div>
  );
}
