"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import AdminHeader from "../../../components/admin/AdminHeader";
import Avatar from "../../../components/ui/avatar";
import { getCurrentContext, listProfilesByChurch } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import { formatTimeString, localDateString } from "../../../lib/format";

/**
 * Volunteers = every upcoming service at a glance; changing who serves happens
 * only on each plan's Service Board. Two views of the same data:
 * - List (default): one row per service — Linear's project list / Stripe's tables.
 * - Grid: roles × services with who's in each spot — Planning Center's Matrix.
 * No per-row action buttons: problems show as a word, and one filter line
 * narrows the list to services that need attention.
 */

const WEEKS = 8;
const ATTENTION_DAYS = 14;
const VIEW_KEY = "gather.volunteers.view";

type ServiceTimeRow = { id: string; name: string; day_of_week: number; start_time: string | null };
type PlanRow = { id: string; title: string | null; service_date: string; start_time: string | null; service_time_id: string | null };
type Person = { id: string; name: string; email: string; avatarUrl: string | null };
type Counts = { confirmed: number; waiting: number; declined: number; open: number; total: number };
type Spot = { personId: string | null; status: string };
type ServiceRow = {
  key: string;
  date: string;
  serviceName: string;
  time: string | null;
  /** "HH:MM" for ordering same-day services. */
  sortTime: string;
  plan: PlanRow | null;
  counts: Counts;
  team: string[];
  /** Team spots by role id (Grid view). */
  spots: Record<string, Spot[]>;
};

const addDays = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return localDateString(new Date(y, m - 1, d + days));
};
const dayOfWeek = (ymd: string) => new Date(`${ymd}T12:00:00`).getDay();
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const emptyCounts = (): Counts => ({ confirmed: 0, waiting: 0, declined: 0, open: 0, total: 0 });
const firstName = (name: string) => name.split(/\s+/)[0] ?? name;
const needsAttention = (r: ServiceRow) => !r.plan || r.counts.declined > 0 || r.counts.open > 0;

const SPOT_STYLE: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-800",
  DECLINED: "bg-red-50 text-red-800 line-through decoration-red-300",
  WAITING: "bg-amber-50 text-amber-900",
};

export default function VolunteersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");
  const [onlyAttention, setOnlyAttention] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {
      /* private window — default view */
    }
  }, []);
  const chooseView = (v: "list" | "grid") => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ }
  };

  const load = useCallback(async () => {
    if (!supabase) return;
    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return;
    }
    const churchId = context.profile.church_id;
    const today = localDateString();
    const end = addDays(today, WEEKS * 7);
    const db = supabase as any;

    const [plansRes, rolesRes, profiles] = await Promise.all([
      db.from("service_plans").select("id, title, service_date, start_time, service_time_id")
        .eq("church_id", churchId).gte("service_date", today).lte("service_date", end).order("service_date"),
      db.from("volunteer_roles").select("id, name").eq("church_id", churchId).order("name"),
      listProfilesByChurch(churchId),
    ]);
    if (plansRes.error) {
      setError("We couldn't load your upcoming services. Refresh to try again.");
      setLoading(false);
      return;
    }
    const plans = (plansRes.data ?? []) as PlanRow[];
    const planIds = plans.map((p) => p.id);
    const [slotsRes, itemsRes] = planIds.length
      ? await Promise.all([
          db.from("service_plan_role_slots").select("plan_id, role_id, assigned_user_id, status, sort_order").in("plan_id", planIds).order("sort_order"),
          db.from("service_plan_items").select("plan_id, assigned_user_id, assignment_status").in("plan_id", planIds).not("assigned_user_id", "is", null),
        ])
      : [{ data: [] }, { data: [] }];

    setRoles((rolesRes.data ?? []) as { id: string; name: string }[]);
    const byId: Record<string, Person> = {};
    for (const p of profiles ?? []) {
      byId[p.id] = { id: p.id, name: p.full_name?.trim() || p.email || "Member", email: p.email ?? "", avatarUrl: (p as { avatar_url?: string | null }).avatar_url ?? null };
    }
    setPeople(byId);

    const perPlan = new Map<string, { counts: Counts; team: Set<string>; spots: Record<string, Spot[]> }>();
    const bucket = (planId: string) => {
      let b = perPlan.get(planId);
      if (!b) {
        b = { counts: emptyCounts(), team: new Set(), spots: {} };
        perPlan.set(planId, b);
      }
      return b;
    };
    const normalize = (status: string | null, personId: string | null) =>
      !personId || status === "OPEN" ? "OPEN" : status === "CONFIRMED" || status === "DECLINED" ? status : "WAITING";
    const tally = (planId: string, status: string | null, personId: string | null) => {
      const b = bucket(planId);
      const st = normalize(status, personId);
      b.counts.total += 1;
      if (st === "OPEN") b.counts.open += 1;
      else if (st === "CONFIRMED") b.counts.confirmed += 1;
      else if (st === "DECLINED") b.counts.declined += 1;
      else b.counts.waiting += 1;
      if (personId && st !== "DECLINED") b.team.add(personId);
      return st;
    };
    for (const s of (slotsRes.data ?? []) as { plan_id: string; role_id: string; assigned_user_id: string | null; status: string | null }[]) {
      const st = tally(s.plan_id, s.status, s.assigned_user_id);
      const b = bucket(s.plan_id);
      (b.spots[s.role_id] ??= []).push({ personId: s.assigned_user_id, status: st });
    }
    for (const i of (itemsRes.data ?? []) as { plan_id: string; assigned_user_id: string | null; assignment_status: string | null }[]) {
      tally(i.plan_id, i.assignment_status, i.assigned_user_id);
    }

    // Every regular service in the window, matched to its plan (or shown as not planned yet).
    const serviceTimes = context.serviceTimes as ServiceTimeRow[];
    const timeById = new Map(serviceTimes.map((t) => [t.id, t]));
    const used = new Set<string>();
    const out: ServiceRow[] = [];
    const makeRow = (date: string, plan: PlanRow | null, st: ServiceTimeRow | undefined): ServiceRow => {
      const b = plan ? perPlan.get(plan.id) : undefined;
      const start = plan?.start_time || st?.start_time || null;
      return {
        key: plan?.id ?? `${date}-${st?.id ?? "none"}`,
        date,
        serviceName: st?.name || plan?.title || "Service",
        time: start ? formatTimeString(start) : null,
        sortTime: (start ?? "").slice(0, 5).padStart(5, "0"),
        plan,
        counts: b?.counts ?? emptyCounts(),
        team: b ? [...b.team] : [],
        spots: b?.spots ?? {},
      };
    };
    for (let d = today; d <= end; d = addDays(d, 1)) {
      const dow = dayOfWeek(d);
      const onDay = serviceTimes
        .filter((t) => t.day_of_week === dow)
        .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
      for (const st of onDay) {
        const plan = plans.find((p) => !used.has(p.id) && p.service_date === d && p.service_time_id === st.id)
          ?? plans.find((p) => !used.has(p.id) && p.service_date === d && !p.service_time_id)
          ?? null;
        if (plan) used.add(plan.id);
        out.push(makeRow(d, plan, st));
      }
    }
    for (const p of plans) {
      if (!used.has(p.id)) out.push(makeRow(p.service_date, p, p.service_time_id ? timeById.get(p.service_time_id) : undefined));
    }
    out.sort((a, b) => a.date.localeCompare(b.date) || a.sortTime.localeCompare(b.sortTime));
    setRows(out);
    setError(null);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const soonNeeding = useMemo(() => {
    const cutoff = addDays(localDateString(), ATTENTION_DAYS);
    return rows.filter((r) => r.date <= cutoff && needsAttention(r));
  }, [rows]);

  const visibleRows = useMemo(() => (onlyAttention ? soonNeeding : rows), [onlyAttention, soonNeeding, rows]);

  const totals = useMemo(() => {
    const planned = rows.filter((r) => r.plan);
    const confirmed = planned.reduce((n, r) => n + r.counts.confirmed, 0);
    const total = planned.reduce((n, r) => n + r.counts.total, 0);
    return { services: rows.length, pct: total ? Math.round((confirmed / total) * 100) : null };
  }, [rows]);

  // Grid: planned services as columns, roles that appear in them as rows.
  const gridColumns = useMemo(() => visibleRows.filter((r) => r.plan), [visibleRows]);
  const gridRoles = useMemo(() => {
    const used = new Set(gridColumns.flatMap((r) => Object.keys(r.spots)));
    return roles.filter((r) => used.has(r.id));
  }, [roles, gridColumns]);

  const planHref = (r: ServiceRow) => (r.plan ? `/admin/service-plans/${r.plan.id}` : `/admin/service-plans?date=${r.date}`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminHeader
          size="large"
          title="Volunteers"
          subtitle={
            loading
              ? "Every upcoming service at a glance."
              : `Next ${WEEKS} weeks: ${plural(totals.services, "service", "services")}${totals.pct != null ? `, ${totals.pct}% of spots confirmed` : ""}. Open a service to change who's serving.`
          }
        />
        <div role="tablist" aria-label="View" className="flex rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          {([["list", "List", List], ["grid", "Grid", LayoutGrid]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => chooseView(key)}
              className={`flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium transition-colors ${
                view === key ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {/* One quiet line instead of an action list. */}
      {!loading ? (
        soonNeeding.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
            <span className="text-[var(--text-secondary)]">
              {plural(soonNeeding.length, "service", "services")} in the next two weeks {soonNeeding.length === 1 ? "needs" : "need"} attention
            </span>
            <button
              type="button"
              onClick={() => setOnlyAttention((v) => !v)}
              aria-pressed={onlyAttention}
              className="rounded-lg px-2 py-1 font-medium text-amber-800 transition-colors hover:bg-amber-50"
            >
              {onlyAttention ? "Show all services" : "Show only those"}
            </button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden /> Everything&apos;s covered for the next two weeks.
          </p>
        )
      ) : null}

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--surface-2)]" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-10 text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">No services in the next {WEEKS} weeks</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Add your regular service times in Settings, or start a plan for any date.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/account" className="btn btn-secondary h-9 px-3 text-sm no-underline">Service times</Link>
            <Link href="/admin/service-plans" className="btn btn-primary h-9 px-3 text-sm no-underline">Start a plan</Link>
          </div>
        </div>
      ) : view === "list" ? (
        <ListView rows={visibleRows} people={people} planHref={planHref} />
      ) : (
        <GridView columns={gridColumns} roles={gridRoles} people={people} planHref={planHref} unplanned={visibleRows.length - gridColumns.length} />
      )}
    </div>
  );
}

function NeedsCell({ r }: { r: ServiceRow }) {
  if (!r.plan) return <span className="text-[var(--text-muted)]">Not planned yet</span>;
  const c = r.counts;
  if (c.total === 0) return <span className="text-[var(--text-muted)]">No team spots</span>;
  if (c.declined) return <span className="font-medium text-red-700">{c.declined} can&apos;t make it</span>;
  if (c.open) return <span className="text-[var(--text-secondary)]">{plural(c.open, "open spot", "open spots")}</span>;
  if (c.waiting) return <span className="text-[var(--text-secondary)]">{c.waiting} waiting</span>;
  return <span className="font-medium text-green-700">All set</span>;
}

function ListView({ rows, people, planHref }: { rows: ServiceRow[]; people: Record<string, Person>; planHref: (r: ServiceRow) => string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="hidden grid-cols-[96px_minmax(0,1.4fr)_minmax(180px,1fr)_150px_128px_20px] gap-4 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] md:grid">
        <span>Date</span><span>Service</span><span>Confirmed</span><span>Needs</span><span>Team</span><span />
      </div>
      <ul className="m-0 list-none divide-y divide-[var(--divider)] p-0">
        {rows.map((r) => {
          const c = r.counts;
          const share = (n: number) => (c.total ? `${(n / c.total) * 100}%` : "0%");
          const d = new Date(`${r.date}T12:00:00`);
          return (
            <li key={r.key} className="list-none">
              <Link
                href={planHref(r)}
                className="group grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 px-4 py-3 no-underline transition-colors hover:bg-[var(--surface-2)] md:grid-cols-[96px_minmax(0,1.4fr)_minmax(180px,1fr)_150px_128px_20px]"
              >
                <span className="text-sm tabular-nums text-[var(--text-secondary)]">
                  {d.toLocaleDateString([], { weekday: "short" })} {d.toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                    {r.serviceName}
                    {r.time ? <span className="font-normal text-[var(--text-muted)]"> · {r.time}</span> : null}
                  </span>
                  {r.plan?.title && r.plan.title !== r.serviceName ? (
                    <span className="block truncate text-xs text-[var(--text-muted)]">{r.plan.title}</span>
                  ) : null}
                </span>
                <span className="col-span-2 md:col-span-1">
                  {r.plan && c.total > 0 ? (
                    <span className="flex items-center gap-2">
                      <span className="flex h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden>
                        <span className="bg-green-500" style={{ width: share(c.confirmed) }} />
                        <span className="bg-amber-300" style={{ width: share(c.waiting) }} />
                        <span className="bg-red-400" style={{ width: share(c.declined) }} />
                      </span>
                      <span className="text-xs tabular-nums text-[var(--text-secondary)]">{c.confirmed} of {c.total}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  )}
                </span>
                <span className="col-span-2 text-sm md:col-span-1"><NeedsCell r={r} /></span>
                <span className="hidden -space-x-2 md:flex">
                  {r.team.slice(0, 4).map((id) => (
                    <span key={id} className="rounded-full ring-2 ring-[var(--surface)]">
                      <Avatar name={people[id]?.name ?? "Member"} email={people[id]?.email ?? ""} imageUrl={people[id]?.avatarUrl ?? null} size={26} className="bg-amber-100 text-[9px] font-semibold text-amber-800" />
                    </span>
                  ))}
                  {r.team.length > 4 ? (
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--surface-2)] text-[9px] font-semibold text-[var(--text-secondary)] ring-2 ring-[var(--surface)]">+{r.team.length - 4}</span>
                  ) : null}
                </span>
                <ChevronRight className="hidden h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 md:block" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GridView({
  columns,
  roles,
  people,
  planHref,
  unplanned,
}: {
  columns: ServiceRow[];
  roles: { id: string; name: string }[];
  people: Record<string, Person>;
  planHref: (r: ServiceRow) => string;
  unplanned: number;
}) {
  if (columns.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-10 text-center text-sm text-[var(--text-muted)]">No planned services to show yet.</p>;
  }
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 min-w-[150px] border-b border-r border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Role</th>
              {columns.map((r) => {
                const d = new Date(`${r.date}T12:00:00`);
                return (
                  <th key={r.key} scope="col" className="min-w-[130px] border-b border-[var(--border)] px-3 py-2 text-left align-bottom font-normal">
                    <Link href={planHref(r)} className="block rounded-lg px-1 py-0.5 no-underline transition-colors hover:bg-[var(--surface-2)]">
                      <span className="block text-xs font-semibold text-[var(--text-primary)]">
                        {d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--text-muted)]">{r.serviceName}{r.time ? ` · ${r.time}` : ""}</span>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="group/row">
                <th scope="row" className="sticky left-0 z-10 border-b border-r border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-left text-sm font-medium text-[var(--text-primary)]">
                  {role.name}
                </th>
                {columns.map((r) => {
                  const spots = r.spots[role.id] ?? [];
                  return (
                    <td key={r.key} className="border-b border-[var(--divider)] px-3 py-1.5 align-top">
                      <Link href={planHref(r)} className="flex min-h-[28px] flex-wrap items-center gap-1 no-underline" aria-label={`${role.name}, ${r.serviceName} ${r.date}`}>
                        {spots.length === 0 ? (
                          <span className="text-xs text-[var(--text-muted)]">·</span>
                        ) : (
                          spots.map((s, i) =>
                            s.personId ? (
                              <span key={i} className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${SPOT_STYLE[s.status] ?? SPOT_STYLE.WAITING}`} title={people[s.personId]?.name}>
                                {firstName(people[s.personId]?.name ?? "Member")}
                              </span>
                            ) : (
                              <span key={i} className="rounded-md border border-dashed border-[var(--border)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]">Open</span>
                            )
                          )
                        )}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-100 ring-1 ring-green-300" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-300" /> Waiting</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-red-300" /> Can&apos;t make it</span>
        {unplanned > 0 ? <span>{plural(unplanned, "service isn't", "services aren't")} planned yet, so not shown here.</span> : null}
      </p>
    </div>
  );
}
