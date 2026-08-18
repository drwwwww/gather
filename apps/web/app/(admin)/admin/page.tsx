"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock, Users, UserRound, TicketCheck, TrendingUp,
  ClipboardList, Megaphone, Calendar, Plus, Bell,
  Sun, Sunset, Moon, ChevronRight, CheckCircle2, AlertCircle
} from "lucide-react";
import { format } from "date-fns";

import { supabase } from "../../../lib/supabaseClient";
import { getNextWorshipDate } from "../../../lib/nextServiceDatetime";
import type { Database } from "@gather/lib";
import { formatRelativeTime, formatWeekdayDateTime, formatCountdown } from "../../../lib/format";
import type { TeamRow } from "../../../components/dashboard/NextServiceTeamCard";
import type { PendingRow } from "../../../components/dashboard/PendingConfirmationsCard";
import type { AnnouncementPreview } from "../../../components/dashboard/LatestAnnouncementsCard";
import type { EventRow } from "../../../components/dashboard/UpcomingEventsCard";
import type { RosterMix } from "../../../components/dashboard/RosterDonutCard";
import RosterDonutCard from "../../../components/dashboard/RosterDonutCard";
import UpcomingEventsCard from "../../../components/dashboard/UpcomingEventsCard";

type EventItem = Database["public"]["Tables"]["events"]["Row"];
type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EventRsvp = Database["public"]["Tables"]["event_rsvps"]["Row"];
type NextPlanSummary = { id: string; service_date: string; title: string; start_time: string | null };

function timeIcon(hour: number) {
  if (hour < 12) return <Sun className="h-4 w-4 text-amber-400" />;
  if (hour < 18) return <Sunset className="h-4 w-4 text-orange-400" />;
  return <Moon className="h-4 w-4 text-indigo-400" />;
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "there";
}

function assigneeInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AdminEntryPage() {
  const [displayName, setDisplayName] = useState("Admin");
  const [churchName, setChurchName] = useState("");
  const [churchAddress, setChurchAddress] = useState<string | null>(null);
  const [teamRows, setTeamRows] = useState<TeamRow[]>([]);
  const [nextPlan, setNextPlan] = useState<NextPlanSummary | null>(null);
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [announcementPreviews, setAnnouncementPreviews] = useState<AnnouncementPreview[]>([]);
  const [eventPreviews, setEventPreviews] = useState<EventRow[]>([]);
  const [rosterMix, setRosterMix] = useState<RosterMix>({ open: 0, assigned: 0, confirmed: 0, declined: 0 });
  const [nextServiceAt, setNextServiceAt] = useState<Date | null>(null);
  const [nextServiceDateLabel, setNextServiceDateLabel] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [volunteersEngaged, setVolunteersEngaged] = useState(0);
  const [totalRsvps, setTotalRsvps] = useState(0);
  const [newMembersThisMonth, setNewMembersThisMonth] = useState(0);
  const [newVolunteersThisMonth, setNewVolunteersThisMonth] = useState(0);
  const [rsvpEventCount, setRsvpEventCount] = useState(0);
  const [status, setStatus] = useState<"checking" | "restricted" | "ready">("checking");
  const router = useRouter();

  const refreshStats = async () => {
    if (!supabase) return;

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) { router.push("/login?next=/admin"); return; }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("id, church_id, role, full_name, email")
      .eq("id", authData.user.id).maybeSingle();

    if (profileError || !profile?.church_id) { router.push("/onboarding/create-church"); return; }
    if (profile.role !== "ADMIN") { setStatus("restricted"); return; }

    setDisplayName(profile.full_name?.trim() || profile.email?.trim() || "Admin");

    const now = new Date();
    const thisWeekEnd = new Date(now);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const todayDateStr = now.toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [eventsResult, announcementsResult, rolesResult, profilesResult, churchResult, allPlansResult] =
      await Promise.all([
        supabase.from("events").select("*").eq("church_id", profile.church_id).order("start_at", { ascending: true }),
        supabase.from("announcements").select("*").eq("church_id", profile.church_id),
        supabase.from("volunteer_roles").select("id, name").eq("church_id", profile.church_id),
        supabase.from("profiles").select("id, full_name, email, role, created_at").eq("church_id", profile.church_id),
        supabase.from("churches").select("address, name, worship_days").eq("id", profile.church_id).maybeSingle(),
        supabase.from("service_plans").select("id, service_date, title, start_time").eq("church_id", profile.church_id).order("service_date", { ascending: true }),
      ]);

    const events = (eventsResult.data ?? []) as EventItem[];
    const announcements = (announcementsResult.data ?? []) as AnnouncementRow[];
    const roles = (rolesResult.data ?? []) as RoleRow[];
    const profiles = (profilesResult.data ?? []) as ProfileRow[];
    const allPlanRows = (allPlansResult.data ?? []) as NextPlanSummary[];
    const nextPlanRow = allPlanRows.find((p) => p.service_date >= todayDateStr) ?? null;
    const allPlanIds = allPlanRows.map((p) => p.id);

    const church = churchResult.data as { address?: string | null; name?: string | null; worship_days?: number[] | null } | null;
    setChurchAddress(church?.address?.trim() || null);
    setChurchName(church?.name?.trim() || "");
    setNextPlan(nextPlanRow);
    setMemberCount(profiles.length);
    setNewMembersThisMonth(profiles.filter((p) => new Date(p.created_at) >= thirtyDaysAgo).length);

    const rolesById = new Map(roles.map((r) => [r.id, r.name]));
    const profilesById = new Map(profiles.map((p) => [p.id, p.full_name || p.email || "Member"]));

    // Prefer an actual scheduled plan's date; fall back to projecting the church's worship_days.
    const nextService = nextPlanRow ? null : getNextWorshipDate(church?.worship_days ?? [0]);
    setNextServiceAt(nextService ?? null);
    setNextServiceDateLabel(nextPlanRow?.service_date ?? nextService?.toISOString().slice(0, 10) ?? null);

    type SlotRow = { id: string; role_id: string; plan_id: string; assigned_user_id: string | null; backup_user_id: string | null; status: string; created_at: string };
    type ItemRow = { id: string; title: string; assigned_user_id: string | null; assignment_status: string | null };
    let allSlots: SlotRow[] = [];
    let planItems: ItemRow[] = [];
    if (allPlanIds.length > 0) {
      const [slotsRes, itemsRes] = await Promise.all([
        supabase.from("service_plan_role_slots").select("id, role_id, plan_id, assigned_user_id, backup_user_id, status, created_at").in("plan_id", allPlanIds),
        nextPlanRow?.id
          ? supabase.from("service_plan_items").select("id, title, assigned_user_id, assignment_status").eq("plan_id", nextPlanRow.id)
          : Promise.resolve({ data: [], error: null }),
      ]);
      allSlots = (slotsRes.data ?? []) as SlotRow[];
      planItems = (itemsRes.data ?? []) as ItemRow[];
    }

    const planSlots = allSlots.filter((s) => s.plan_id === nextPlanRow?.id);
    const engaged = new Set(allSlots.map((s) => s.assigned_user_id).filter(Boolean) as string[]);
    setVolunteersEngaged(engaged.size);
    setNewVolunteersThisMonth(new Set(allSlots.filter((s) => s.created_at && new Date(s.created_at) >= thirtyDaysAgo && s.assigned_user_id).map((s) => s.assigned_user_id as string)).size);

    const normItemStatus = (i: ItemRow) => {
      if (!i.assigned_user_id) return "OPEN";
      if (!i.assignment_status || i.assignment_status === "OPEN") return "ASSIGNED";
      return i.assignment_status;
    };

    const slotOpen = planSlots.filter((s) => !s.assigned_user_id || s.status === "OPEN").length;
    const slotAssigned = planSlots.filter((s) => s.status === "ASSIGNED" && s.assigned_user_id).length;
    const slotConfirmed = planSlots.filter((s) => s.status === "CONFIRMED").length;
    const slotDeclined = planSlots.filter((s) => s.status === "DECLINED").length;
    const itemOpen = planItems.filter((i) => normItemStatus(i) === "OPEN").length;
    const itemAssigned = planItems.filter((i) => normItemStatus(i) === "ASSIGNED").length;
    const itemConfirmed = planItems.filter((i) => normItemStatus(i) === "CONFIRMED").length;
    const itemDeclined = planItems.filter((i) => normItemStatus(i) === "DECLINED").length;

    setRosterMix({ open: slotOpen + itemOpen, assigned: slotAssigned + itemAssigned, confirmed: slotConfirmed + itemConfirmed, declined: slotDeclined + itemDeclined });

    setTeamRows([
      ...planSlots.map((s) => ({ id: `r-${s.id}`, role: rolesById.get(s.role_id) || "Role", assignee: s.assigned_user_id ? profilesById.get(s.assigned_user_id) || "Assigned" : "Open", status: s.status })),
      ...planItems.filter((i) => !!i.assigned_user_id).map((i) => ({ id: `i-${i.id}`, role: i.title, assignee: profilesById.get(i.assigned_user_id!) || "Assigned", status: normItemStatus(i) })),
    ]);

    setPendingRows([
      ...planSlots.filter((s) => s.status === "ASSIGNED" || s.status === "DECLINED").map((s) => ({
        id: `r-${s.id}`, role: rolesById.get(s.role_id) || "Role",
        assignee: s.assigned_user_id ? profilesById.get(s.assigned_user_id) || "Member" : "Unassigned", status: s.status,
      })),
      ...planItems.filter((i) => { const st = normItemStatus(i); return st === "ASSIGNED" || st === "DECLINED"; }).map((i) => ({
        id: `i-${i.id}`, role: i.title,
        assignee: i.assigned_user_id ? profilesById.get(i.assigned_user_id) || "Member" : "Unassigned", status: normItemStatus(i),
      })),
    ].slice(0, 5));

    const upcomingEventsList = events.filter((e) => new Date(e.start_at) >= now).slice(0, 3);
    const eventIds = upcomingEventsList.map((e) => e.id);
    let rsvps: EventRsvp[] = [];
    if (eventIds.length) {
      const { data: rsvpData } = await supabase.from("event_rsvps").select("event_id").in("event_id", eventIds);
      rsvps = (rsvpData ?? []) as EventRsvp[];
    }
    const rsvpCounts = rsvps.reduce<Record<string, number>>((acc, r) => { acc[r.event_id] = (acc[r.event_id] || 0) + 1; return acc; }, {});
    setTotalRsvps(Object.values(rsvpCounts).reduce((a, n) => a + n, 0));
    setRsvpEventCount(eventIds.length);
    setEventPreviews(upcomingEventsList.map((e) => ({ id: e.id, name: e.title, date: e.start_at, status: `${rsvpCounts[e.id] || 0} RSVP` })));

    setAnnouncementPreviews(
      announcements.slice().sort((a, b) => new Date(b.publish_at ?? b.created_at).getTime() - new Date(a.publish_at ?? a.created_at).getTime())
        .slice(0, 3).map((item) => ({
          id: item.id, title: item.title,
          status: item.publish_at ? (new Date(item.publish_at) > now ? "Scheduled" : "Published") : "Draft",
          publishAt: item.publish_at ? formatRelativeTime(item.publish_at) : null,
          excerpt: item.body.replace(/\s+/g, " ").trim().slice(0, 120) || undefined,
        }))
    );

    setStatus("ready");
  };

  useEffect(() => { refreshStats(); }, []);
  useEffect(() => { if (status === "restricted") router.replace("/member"); }, [status, router]);

  if (status === "checking" || status === "restricted") return <DashboardSkeleton />;

  const hour = new Date().getHours();
  const greet = firstName(displayName);
  const planHref = nextPlan?.id ? `/admin/service-plans/${nextPlan.id}` : "/admin/service-plans";
  const heroTitle = nextPlan?.title?.trim() || "Upcoming Service";

  // Prefer the plan's actual date (+ start_time, when set) over the worship_days projection —
  // the projection is only a fallback for when no plan has been scheduled yet.
  const heroDisplayDate = nextPlan?.service_date
    ? (() => {
        const [y, m, d] = nextPlan.service_date.split("-").map(Number);
        const date = new Date(y, (m ?? 1) - 1, d ?? 1);
        if (nextPlan.start_time) {
          const [h, min] = nextPlan.start_time.split(":").map(Number);
          date.setHours(h ?? 0, min ?? 0, 0, 0);
        }
        return date;
      })()
    : nextServiceAt;
  const serviceWhen = heroDisplayDate ? formatWeekdayDateTime(heroDisplayDate) : nextServiceDateLabel ?? "Not scheduled";
  const countdown = heroDisplayDate ? formatCountdown(heroDisplayDate) : null;
  const heroBlurb = churchAddress ?? "Main sanctuary service";

  const totalRoster = rosterMix.open + rosterMix.assigned + rosterMix.confirmed + rosterMix.declined;
  const confirmedPct = totalRoster > 0 ? Math.round((rosterMix.confirmed / totalRoster) * 100) : 0;
  const filledPct   = totalRoster > 0 ? Math.round(((totalRoster - rosterMix.open) / totalRoster) * 100) : 0;

  const avatarPeople = teamRows.filter((r) => r.assignee && r.assignee !== "Open");
  const avatarPreview = avatarPeople.slice(0, 5);
  const extraAvatars = Math.max(0, avatarPeople.length - 5);

  const isAllEmpty = pendingRows.length === 0 && eventPreviews.length === 0 && announcementPreviews.length === 0 && totalRoster === 0;

  return (
    <div className="space-y-8">

      {/* ── Greeting ─────────────────────────────────────────────── */}
      <section className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {timeIcon(hour)}
            <span className="text-sm font-medium text-[var(--text-muted)]">
              {format(new Date(), "EEEE, MMMM d")}
            </span>
            {churchName && (
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                {churchName}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            {greeting(hour)}, <span className="text-amber-500">{greet}</span>.
          </h1>
          <p className="mt-1.5 text-base text-[var(--text-muted)]">
            {hour < 12 ? "Here's what needs your attention today." : hour < 17 ? "Here's where things stand this afternoon." : "Here's a summary of your community."}
          </p>
        </div>
      </section>

      {/* ── Next service hero ─────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border border-amber-200">
        <div className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">

          {/* Date block */}
          {heroDisplayDate ? (
            <div className="flex flex-row items-center gap-5 sm:flex-col sm:items-center sm:gap-1 sm:min-w-[80px] sm:text-center">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 shadow-md sm:px-5 sm:py-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">
                  {format(heroDisplayDate ?? new Date(), "MMM")}
                </span>
                <span className="text-4xl font-black leading-none text-white sm:text-5xl">
                  {format(heroDisplayDate ?? new Date(), "d")}
                </span>
                <span className="text-[10px] font-bold uppercase text-amber-100">
                  {format(heroDisplayDate ?? new Date(), "EEE")}
                </span>
              </div>
              {countdown && (
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 sm:mt-2">
                  <Clock className="h-3.5 w-3.5" />
                  {countdown}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-amber-200">
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          )}

          {/* Service details */}
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-200/60 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-900">
                Upcoming Service
              </span>
              {heroBlurb && (
                <span className="text-xs text-amber-800/60">{heroBlurb}</span>
              )}
            </div>
            <h2 className="mb-1 text-2xl font-bold tracking-tight text-amber-950 sm:text-3xl">{heroTitle}</h2>
            <p className="mb-4 text-sm font-medium text-amber-800/70">{serviceWhen}</p>

            {/* Readiness bar */}
            {totalRoster > 0 && (
              <div className="mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-amber-800/70">
                  <span>{rosterMix.confirmed} of {totalRoster} confirmed</span>
                  <span className="font-bold text-amber-900">{confirmedPct}%</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-amber-200/60">
                  {/* Pending layer: assigned but not confirmed */}
                  <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400/50 transition-all duration-500" style={{ width: `${filledPct}%` }} />
                  {/* Confirmed layer: sits on top of pending */}
                  <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${confirmedPct}%` }} />
                </div>
                <p className="text-[10px] text-amber-700/60">
                  {rosterMix.open > 0 ? `${rosterMix.open} open slot${rosterMix.open !== 1 ? "s" : ""} · ` : ""}
                  {rosterMix.declined > 0 ? `${rosterMix.declined} declined · ` : ""}
                  {rosterMix.assigned > 0 ? `${rosterMix.assigned} awaiting reply` : "All assigned"}
                </p>
              </div>
            )}

            {/* Team avatars */}
            {avatarPreview.length > 0 && (
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex -space-x-2">
                  {avatarPreview.map((row) => (
                    <span key={row.id} title={row.assignee}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-100 text-[10px] font-bold ${avatarColor(row.assignee)}`}>
                      {assigneeInitials(row.assignee)}
                    </span>
                  ))}
                  {extraAvatars > 0 && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-100 bg-amber-200 text-[10px] font-bold text-amber-800">
                      +{extraAvatars}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-amber-800/70">
                  {avatarPeople.length} team {avatarPeople.length === 1 ? "member" : "members"} scheduled
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link href={planHref}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-amber-600 hover:-translate-y-px active:translate-y-0">
                View full plan
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/volunteers"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white/60 px-4 py-2 text-sm font-semibold text-amber-800 no-underline transition hover:bg-white hover:-translate-y-px active:translate-y-0">
                Volunteers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/announcements", icon: Megaphone,  label: "New announcement" },
            { href: "/events",        icon: Calendar,    label: "New event"         },
            { href: "/people/invite", icon: Users,       label: "Invite someone"    },
            { href: "/volunteers",    icon: Bell,        label: "Manage volunteers" },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] no-underline transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── KPI row ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { href: "/people",    icon: Users,       label: "Members",          value: memberCount,        trend: newMembersThisMonth > 0 ? `+${newMembersThisMonth} this month` : "No new this month",       positive: newMembersThisMonth > 0, accent: "border-l-violet-400 bg-violet-50/30" },
          { href: "/volunteers",icon: UserRound,   label: "Volunteers active", value: volunteersEngaged, trend: newVolunteersThisMonth > 0 ? `+${newVolunteersThisMonth} added` : "Same as last month",      positive: newVolunteersThisMonth > 0, accent: "border-l-blue-400 bg-blue-50/30" },
          { href: "/events",    icon: TicketCheck, label: "Upcoming RSVPs",   value: totalRsvps,         trend: rsvpEventCount > 0 ? `across ${rsvpEventCount} event${rsvpEventCount !== 1 ? "s" : ""}` : "No upcoming events", positive: false, accent: "border-l-emerald-400 bg-emerald-50/30" },
        ].map(({ href, icon: Icon, label, value, trend, positive, accent }) => (
          <Link key={href} href={href}
            className={`card card-elevated flex flex-col justify-between border-l-4 p-5 no-underline transition duration-200 motion-safe:hover:-translate-y-0.5 active:translate-y-0 ${accent}`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
              <Icon className="h-5 w-5 text-[var(--text-muted)]" />
            </div>
            <div className="mt-4">
              <p className="text-4xl font-black tabular-nums text-[var(--text-primary)]">{value.toLocaleString()}</p>
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${positive ? "bg-green-50 text-green-700" : "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
                {positive && <TrendingUp className="h-3 w-3" />}
                {trend}
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Main content ──────────────────────────────────────────── */}
      {isAllEmpty ? (
        <GettingStartedPanel />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* Left: Pending + Announcements */}
          <div className="space-y-6 lg:col-span-8">

            {/* Pending confirmations */}
            {pendingRows.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                      Pending confirmations
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">{pendingRows.length}</span>
                    </h2>
                  </div>
                  <Link href="/volunteers" className="text-xs font-semibold text-amber-600 transition-colors hover:text-amber-800 no-underline">
                    View all →
                  </Link>
                </div>
                <ul className="divide-y divide-[var(--border)]">
                  {pendingRows.map((row) => (
                    <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${row.status === "DECLINED" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                        {assigneeInitials(row.assignee)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{row.assignee}</p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{row.role}</p>
                      </div>
                      {row.status === "DECLINED" ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600 ring-1 ring-red-200">
                          <AlertCircle className="h-3 w-3" />Declined
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">Awaiting</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Latest announcements */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-[var(--text-muted)]" />
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Announcements</h2>
                </div>
                <Link href="/announcements" className="text-xs font-semibold text-amber-600 transition-colors hover:text-amber-800 no-underline">View all →</Link>
              </div>
              {announcementPreviews.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <Megaphone className="h-8 w-8 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">No announcements yet</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Share news with your congregation.</p>
                  </div>
                  <Link href="/announcements" className="btn btn-primary-gradient btn-sm">Write one →</Link>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {announcementPreviews.map((item) => (
                    <li key={item.id} className="flex items-start gap-4 px-5 py-4">
                      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.status === "Published" ? "bg-green-50" : item.status === "Scheduled" ? "bg-amber-50" : "bg-slate-100"}`}>
                        {item.status === "Published" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : item.status === "Scheduled" ? <Clock className="h-4 w-4 text-amber-600" /> : <Megaphone className="h-4 w-4 text-slate-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${item.status === "Published" ? "bg-green-50 text-green-700 ring-green-200" : item.status === "Scheduled" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>
                            {item.status}
                          </span>
                        </div>
                        {item.excerpt && <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">{item.excerpt}</p>}
                        {item.publishAt && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{item.publishAt}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: Events + Roster */}
          <div className="space-y-6 lg:col-span-4">
            <UpcomingEventsCard items={eventPreviews} variant="stitch" />
            <RosterDonutCard mix={rosterMix} variant="stitch" />
          </div>
        </div>
      )}
    </div>
  );
}

function GettingStartedPanel() {
  const steps = [
    { icon: ClipboardList, label: "Build a service plan", href: "/admin/service-plans", desc: "Set up roles and a run-of-show." },
    { icon: UserRound,     label: "Add volunteers",       href: "/volunteers",          desc: "Assign team members to roles."  },
    { icon: Megaphone,     label: "Write an announcement",href: "/announcements",       desc: "Share news with your church."   },
    { icon: Calendar,      label: "Create an event",      href: "/events",              desc: "Schedule a gathering."          },
  ];
  return (
    <section>
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Get started</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map(({ icon: Icon, label, href, desc }) => (
          <Link key={href} href={href}
            className="group flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 no-underline transition duration-150 hover:border-amber-200 hover:bg-amber-50 motion-safe:hover:-translate-y-0.5 active:translate-y-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-200">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-48 rounded-full bg-[var(--surface-2)]" />
        <div className="h-10 w-80 rounded-lg bg-[var(--surface-2)]" />
        <div className="h-4 w-64 rounded-full bg-[var(--surface-2)]" />
      </div>
      <div className="h-52 rounded-3xl bg-amber-100" />
      <div className="h-12 rounded-2xl bg-[var(--surface)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-[var(--surface)]" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="h-48 rounded-2xl bg-[var(--surface)]" />
          <div className="h-56 rounded-2xl bg-[var(--surface)]" />
        </div>
        <div className="space-y-6 lg:col-span-4">
          <div className="h-52 rounded-2xl bg-[var(--surface)]" />
          <div className="h-48 rounded-2xl bg-[var(--surface)]" />
        </div>
      </div>
    </div>
  );
}
