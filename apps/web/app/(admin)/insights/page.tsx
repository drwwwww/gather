"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Download, Flame, Moon, Sparkles, Trash2, Users } from "lucide-react";
import AdminHeader from "../../../components/admin/AdminHeader";
import Avatar from "../../../components/ui/avatar";
import SelectMenu from "../../../components/ui/SelectMenu";
import { PageGrid, PageGridFull, PageGridRowTwoOne } from "../../../components/layout/PageGrid";
import { getCurrentContext } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import { localDateString } from "../../../lib/format";
import { downloadCsv } from "../../../lib/csv";
import { useToast } from "../../../lib/toast";

type Person = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; role: string; disabled: boolean; created_at: string };
type Health = "stretched" | "steady" | "resting" | "new";
type Row = {
  person: Person;
  weeks: number[]; // serves per week, oldest → newest (8 weeks)
  last: string | null;
  next: string | null;
  served90: number;
  declines90: number;
  roles: string[];
  health: Health;
};
type Away = { id: string; user_id: string; start_date: string; end_date: string; note: string | null };
type ServeRequest = { id: string; user_id: string; role_names: string[]; note: string | null; created_at: string };

const DAY = 86_400_000;
const addDays = (ymd: string, d: number) => {
  const t = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) + d * DAY);
  return t.toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) =>
  Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / DAY);
const shortDate = (ymd: string) => new Date(`${ymd}T12:00:00`).toLocaleDateString([], { month: "short", day: "numeric" });

const HEALTH_META: Record<Health, { label: string; cls: string; hint: string }> = {
  stretched: { label: "Stretched", cls: "bg-red-50 text-red-700", hint: "Served 3+ of the last 4 weeks" },
  steady: { label: "Steady", cls: "bg-emerald-50 text-emerald-700", hint: "Serving at a sustainable pace" },
  resting: { label: "Resting", cls: "bg-[var(--surface-2)] text-[var(--text-secondary)]", hint: "Hasn't served in 60+ days" },
  new: { label: "New", cls: "bg-amber-50 text-amber-800", hint: "Joined the team, not scheduled yet" },
};

export default function InsightsPage() {
  const router = useRouter();
  const { toast, pushToast } = useToast();
  const [churchId, setChurchId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [away, setAway] = useState<Away[]>([]);
  const [requests, setRequests] = useState<ServeRequest[]>([]);
  const [upcomingDates, setUpcomingDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Health | "all">("all");
  const [awayUser, setAwayUser] = useState("");
  const [awayDate, setAwayDate] = useState("");
  const today = localDateString();

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const ctx = await getCurrentContext();
      if (!ctx) { router.push("/login"); return; }
      const cid = ctx.profile.church_id;
      setChurchId(cid);
      const db = supabase as any;
      const from = addDays(today, -90);
      const [profRes, plansRes, rolesRes, awayRes, reqRes] = await Promise.all([
        db.from("profiles").select("id, full_name, email, avatar_url, role, disabled, created_at").eq("church_id", cid),
        db.from("service_plans").select("id, service_date").eq("church_id", cid).gte("service_date", from).lte("service_date", addDays(today, 84)),
        db.from("volunteer_roles").select("id, name").eq("church_id", cid),
        db.from("volunteer_unavailability").select("id, user_id, start_date, end_date, note").eq("church_id", cid).gte("end_date", today).order("start_date"),
        db.from("serve_requests").select("id, user_id, role_names, note, created_at").eq("church_id", cid).order("created_at", { ascending: false }).limit(20),
      ]);
      const plans = (plansRes.data ?? []) as { id: string; service_date: string }[];
      const dateByPlan = new Map(plans.map((p) => [p.id, p.service_date]));
      const roleName = new Map(((rolesRes.data ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name]));
      const ids = plans.map((p) => p.id);
      const assignments: { uid: string; date: string; status: string; job: string }[] = [];
      for (let i = 0; i < ids.length; i += 150) {
        const chunk = ids.slice(i, i + 150);
        const [s, it] = await Promise.all([
          db.from("service_plan_role_slots").select("plan_id, role_id, assigned_user_id, status").in("plan_id", chunk).not("assigned_user_id", "is", null),
          db.from("service_plan_items").select("plan_id, title, assigned_user_id, assignment_status").in("plan_id", chunk).not("assigned_user_id", "is", null),
        ]);
        for (const r of s.data ?? []) assignments.push({ uid: r.assigned_user_id, date: dateByPlan.get(r.plan_id)!, status: r.status, job: roleName.get(r.role_id) ?? "Role" });
        for (const r of it.data ?? []) assignments.push({ uid: r.assigned_user_id, date: dateByPlan.get(r.plan_id)!, status: r.assignment_status ?? "ASSIGNED", job: r.title || "Service part" });
      }

      const everyone = ((profRes.data ?? []) as Person[]).filter((p) => !p.disabled);
      setPeople(everyone);
      const team = everyone.filter((p) => p.role !== "MEMBER" || assignments.some((a) => a.uid === p.id));
      const built: Row[] = team.map((person) => {
        const mine = assignments.filter((a) => a.uid === person.id);
        const servedDates = [...new Set(mine.filter((a) => a.status !== "DECLINED" && a.date <= today).map((a) => a.date))].sort();
        const weeks = Array.from({ length: 8 }, (_, w) => {
          const end = addDays(today, -7 * (7 - w));
          const start = addDays(end, -6);
          return servedDates.filter((d) => d >= start && d <= end).length;
        });
        const last = servedDates[servedDates.length - 1] ?? null;
        const next = mine.filter((a) => a.date > today && a.status !== "DECLINED").map((a) => a.date).sort()[0] ?? null;
        const recent4 = weeks.slice(4).filter((n) => n > 0).length;
        const health: Health =
          servedDates.length === 0 && !next ? (daysBetween(person.created_at.slice(0, 10), today) <= 60 ? "new" : "resting")
          : recent4 >= 3 ? "stretched"
          : last && daysBetween(last, today) > 60 && !next ? "resting"
          : "steady";
        return {
          person,
          weeks,
          last,
          next,
          served90: servedDates.length,
          declines90: mine.filter((a) => a.status === "DECLINED").length,
          roles: [...new Set(mine.map((a) => a.job))].slice(0, 3),
          health,
        };
      });
      const order: Record<Health, number> = { stretched: 0, new: 1, resting: 2, steady: 3 };
      built.sort((a, b) => order[a.health] - order[b.health] || b.served90 - a.served90);
      setRows(built);
      setAway((awayRes.data ?? []) as Away[]);
      setRequests((reqRes.data ?? []) as ServeRequest[]);

      // Upcoming service days for marking someone away: planned dates plus regular service days.
      const days = new Set<string>(plans.filter((p) => p.service_date >= today).map((p) => p.service_date));
      const dows = new Set(ctx.serviceTimes.map((t) => t.day_of_week));
      for (let i = 0; i < 84; i++) {
        const d = addDays(today, i);
        if (dows.has(new Date(`${d}T12:00:00`).getDay())) days.add(d);
      }
      setUpcomingDates([...days].sort().slice(0, 16));
      setLoading(false);
    })();
  }, [router, today]);

  const counts = useMemo(() => {
    const c = { stretched: 0, steady: 0, resting: 0, new: 0 } as Record<Health, number>;
    for (const r of rows) c[r.health]++;
    return c;
  }, [rows]);
  const visible = filter === "all" ? rows : rows.filter((r) => r.health === filter);
  const nameOf = (uid: string) => {
    const p = people.find((x) => x.id === uid);
    return p?.full_name?.trim() || p?.email || "Member";
  };

  const exportCsv = () =>
    downloadCsv(`team-health-${today}.csv`, [
      ["Name", "Email", "Health", "Served (90 days)", "Declined (90 days)", "Last served", "Next scheduled", "Roles"],
      ...rows.map((r) => [r.person.full_name ?? "", r.person.email ?? "", HEALTH_META[r.health].label, r.served90, r.declines90, r.last ?? "", r.next ?? "", r.roles.join("; ")]),
    ]);

  const addAway = async () => {
    if (!supabase || !churchId || !awayUser || !awayDate) return;
    const { data, error } = await (supabase as any)
      .from("volunteer_unavailability")
      .insert({ church_id: churchId, user_id: awayUser, start_date: awayDate, end_date: awayDate })
      .select("id, user_id, start_date, end_date, note")
      .single();
    if (error) {
      pushToast(error.code === "23505" ? "They're already marked away that day." : "Couldn't save that.", "error");
      return;
    }
    setAway((list) => [...list, data as Away].sort((a, b) => a.start_date.localeCompare(b.start_date)));
    setAwayDate("");
    pushToast(`${nameOf(awayUser)} marked away ${shortDate(awayDate)}.`, "success");
  };

  const removeAway = async (a: Away) => {
    if (!supabase) return;
    const { error } = await (supabase as any).from("volunteer_unavailability").delete().eq("id", a.id);
    if (error) { pushToast("Couldn't remove that.", "error"); return; }
    setAway((list) => list.filter((x) => x.id !== a.id));
  };

  const totalTeam = rows.length;

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <AdminHeader
          title="Team health"
          subtitle="Who's carrying the load, who's resting, and who's ready to start — over the last 90 days."
          actions={
            <button type="button" onClick={exportCsv} disabled={loading} className="btn btn-secondary inline-flex h-9 items-center gap-1.5 px-3 text-sm">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          }
        />
      </PageGridFull>

      <PageGridFull>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {([
            ["stretched", Flame, "may need a break"],
            ["steady", Users, "at a healthy pace"],
            ["resting", Moon, "ready to invite back"],
            ["new", Sparkles, "waiting for a first spot"],
          ] as const).map(([key, Icon, ctx]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter((f) => (f === key ? "all" : key))}
              aria-pressed={filter === key}
              className={`card-elevated rounded-2xl border bg-[var(--surface)] p-4 text-left transition hover:-translate-y-0.5 ${filter === key ? "border-amber-300 ring-2 ring-amber-100" : "border-[var(--border)]"}`}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                <Icon className="h-3.5 w-3.5" aria-hidden /> {HEALTH_META[key].label}
              </div>
              {loading ? (
                <div className="mt-2 h-7 w-12 animate-pulse rounded-md bg-[var(--surface-2)]" />
              ) : (
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{counts[key]}</p>
              )}
              <p className="mt-0.5 text-pretty text-xs text-[var(--text-muted)]">
                {loading ? " " : `of ${totalTeam} · ${ctx}`}
              </p>
            </button>
          ))}
        </div>
      </PageGridFull>

      <PageGridRowTwoOne
        main={
          <section className="stitch-section-card overflow-hidden p-0 sm:p-0">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {filter === "all" ? "Everyone on the team" : HEALTH_META[filter].label}
                <span className="ml-1.5 font-normal text-[var(--text-muted)]">· {visible.length}</span>
              </h2>
              <span className="text-[11px] text-[var(--text-muted)]">Last 8 weeks</span>
            </div>
            {loading ? (
              <div className="space-y-2 p-4">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-[var(--surface-2)]" />)}</div>
            ) : visible.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">No one here right now.</p>
            ) : (
              <ul className="divide-y divide-[var(--divider)]">
                {visible.map((r) => (
                  <li key={r.person.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-2)] sm:px-5">
                    <Avatar name={r.person.full_name} email={r.person.email} imageUrl={r.person.avatar_url} size={32} className="bg-amber-100 text-[10px] font-bold text-amber-700" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{r.person.full_name?.trim() || r.person.email}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {[r.roles.join(", ") || "No roles yet", r.last ? `last served ${shortDate(r.last)}` : null, r.next ? `next ${shortDate(r.next)}` : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="hidden items-end gap-0.5 sm:flex" aria-label={`Served ${r.weeks.reduce((a, b) => a + b, 0)} times in 8 weeks`}>
                      {r.weeks.map((n, i) => (
                        <span key={i} className={`w-1.5 rounded-sm ${n > 0 ? "bg-amber-400" : "bg-[var(--surface-2)]"}`} style={{ height: n > 0 ? 8 + Math.min(n, 3) * 5 : 6 }} />
                      ))}
                    </div>
                    <span className="hidden w-14 text-right text-xs tabular-nums text-[var(--text-muted)] md:block" title="Declines in 90 days">
                      {r.declines90 > 0 ? `${r.declines90} declined` : ""}
                    </span>
                    <span title={HEALTH_META[r.health].hint} className={`w-[74px] shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold ${HEALTH_META[r.health].cls}`}>
                      {HEALTH_META[r.health].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        }
        side={
          <div className="space-y-4">
            <section className="stitch-section-card">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Away dates</h2>
              <p className="mb-3 mt-0.5 text-xs text-[var(--text-muted)]">Volunteers set these in the app. Scheduling flags them, and AI fill skips them.</p>
              <div className="mb-3 space-y-2">
                <SelectMenu
                  value={awayUser}
                  onChange={setAwayUser}
                  searchable
                  ariaLabel="Person"
                  placeholder="Choose a person"
                  options={people.map((p) => ({ value: p.id, label: p.full_name?.trim() || p.email || "Member" }))}
                />
                <div className="flex gap-2">
                  <SelectMenu
                    value={awayDate}
                    onChange={setAwayDate}
                    ariaLabel="Service date"
                    placeholder="Service date"
                    className="flex-1"
                    options={upcomingDates.map((d) => ({ value: d, label: new Date(`${d}T12:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) }))}
                  />
                  <button type="button" onClick={addAway} disabled={!awayUser || !awayDate} className="btn btn-primary h-9 px-4 text-sm">Add</button>
                </div>
              </div>
              {away.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No one is away in the coming weeks.</p>
              ) : (
                <ul className="space-y-1">
                  {away.map((a) => (
                    <li key={a.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 text-sm transition-colors hover:bg-[var(--surface-2)]">
                      <CalendarOff className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">{nameOf(a.user_id)}</span>
                      <span className="shrink-0 text-xs text-[var(--text-muted)]">
                        {a.start_date === a.end_date ? shortDate(a.start_date) : `${shortDate(a.start_date)} – ${shortDate(a.end_date)}`}
                      </span>
                      <button type="button" onClick={() => removeAway(a)} aria-label={`Remove away date for ${nameOf(a.user_id)}`} className="rounded-md p-1 text-[var(--text-muted)] opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="stitch-section-card">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Asked to serve</h2>
              <p className="mb-2 mt-0.5 text-xs text-[var(--text-muted)]">From &ldquo;I&apos;d like to serve&rdquo; in the app.</p>
              {requests.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No requests yet.</p>
              ) : (
                <ul className="space-y-2">
                  {requests.map((q) => (
                    <li key={q.id} className="text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium text-[var(--text-primary)]">{nameOf(q.user_id)}</span>
                        <span className="shrink-0 text-[11px] text-[var(--text-muted)]">{shortDate(q.created_at.slice(0, 10))}</span>
                      </div>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {[q.role_names.length ? q.role_names.join(", ") : "Any role", q.note ? `“${q.note}”` : null].filter(Boolean).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        }
      />
      {toast && (
        <div role="status" className="fixed right-6 top-20 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm shadow-lg">
          <p className={toast.tone === "error" ? "text-red-600" : "text-green-700"}>{toast.message}</p>
        </div>
      )}
    </PageGrid>
  );
}
