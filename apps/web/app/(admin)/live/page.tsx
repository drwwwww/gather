"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CheckCircle2, Circle, Clock, Heart, Radio, SkipForward, Undo2, UserCheck } from "lucide-react";
import AdminHeader from "../../../components/admin/AdminHeader";
import Avatar from "../../../components/ui/avatar";
import { PageGrid, PageGridFull, PageGridRowTwoOne } from "../../../components/layout/PageGrid";
import { getCurrentContext } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import { localDateString } from "../../../lib/format";
import { useToast } from "../../../lib/toast";

type Plan = { id: string; title: string | null; service_date: string; start_time: string | null; service_time_id: string | null; recap_sent_at: string | null };
type Slot = { id: string; role_id: string; assigned_user_id: string | null; status: string; checked_in_at: string | null };
type Item = { id: string; position: number; title: string | null; duration_minutes: number | null; assigned_user_id: string | null; status: string; assignment_status: string | null; checked_in_at: string | null };
type Person = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

const POLL_MS = 15_000;

const fmtTime = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export default function LivePage() {
  const router = useRouter();
  const { toast, pushToast } = useToast();
  const [churchId, setChurchId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isToday, setIsToday] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [sendingRecap, setSendingRecap] = useState(false);

  const today = localDateString();

  // Today's services, or the next one if nothing is scheduled today.
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const ctx = await getCurrentContext();
      if (!ctx) { router.push("/login"); return; }
      const cid = ctx.profile.church_id;
      setChurchId(cid);
      setServiceNames(Object.fromEntries(ctx.serviceTimes.map((s) => [s.id, s.name])));
      const db = supabase as any;
      const { data: todays } = await db
        .from("service_plans")
        .select("id, title, service_date, start_time, service_time_id, recap_sent_at")
        .eq("church_id", cid).eq("service_date", today).order("start_time");
      let list = (todays ?? []) as Plan[];
      if (list.length === 0) {
        setIsToday(false);
        const { data: next } = await db
          .from("service_plans")
          .select("id, title, service_date, start_time, service_time_id, recap_sent_at")
          .eq("church_id", cid).gt("service_date", today).order("service_date").order("start_time").limit(1);
        list = (next ?? []) as Plan[];
      }
      setPlans(list);
      setPlanId(list[0]?.id ?? null);
      const [{ data: roles }, { data: profs }] = await Promise.all([
        db.from("volunteer_roles").select("id, name").eq("church_id", cid),
        db.from("profiles").select("id, full_name, email, avatar_url").eq("church_id", cid),
      ]);
      setRoleNames(Object.fromEntries((roles ?? []).map((r: any) => [r.id, r.name])));
      setPeople(Object.fromEntries((profs ?? []).map((p: Person) => [p.id, p])));
      if (list.length === 0) setLoading(false);
    })();
  }, [router, today]);

  const loadPlan = useCallback(async () => {
    if (!supabase || !planId) return;
    const db = supabase as any;
    const [s, i] = await Promise.all([
      db.from("service_plan_role_slots").select("id, role_id, assigned_user_id, status, checked_in_at").eq("plan_id", planId).order("sort_order"),
      db.from("service_plan_items").select("id, position, title, duration_minutes, assigned_user_id, status, assignment_status, checked_in_at").eq("plan_id", planId).order("position"),
    ]);
    setSlots((s.data ?? []) as Slot[]);
    setItems((i.data ?? []) as Item[]);
    setUpdatedAt(new Date());
    setLoading(false);
  }, [planId]);

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    void loadPlan();
    const t = setInterval(() => { if (document.visibilityState === "visible") void loadPlan(); }, POLL_MS);
    return () => clearInterval(t);
  }, [planId, loadPlan]);

  const plan = plans.find((p) => p.id === planId) ?? null;

  // One row per person on the team, with every assignment they hold.
  const team = useMemo(() => {
    const map = new Map<string, { id: string; jobs: string[]; here: boolean; declined: boolean; confirmed: boolean }>();
    const add = (uid: string, job: string, here: boolean, status: string) => {
      const row = map.get(uid) ?? { id: uid, jobs: [], here: false, declined: true, confirmed: false };
      row.jobs.push(job);
      row.here ||= here;
      row.declined &&= status === "DECLINED";
      row.confirmed ||= status === "CONFIRMED";
      map.set(uid, row);
    };
    for (const s of slots) if (s.assigned_user_id) add(s.assigned_user_id, roleNames[s.role_id] ?? "Role", !!s.checked_in_at, s.status);
    for (const i of items) if (i.assigned_user_id) add(i.assigned_user_id, i.title || "Service part", !!i.checked_in_at, i.assignment_status ?? "ASSIGNED");
    return [...map.values()];
  }, [slots, items, roleNames]);

  const active = team.filter((t) => !t.declined);
  const here = active.filter((t) => t.here);
  const notYet = active.filter((t) => !t.here);
  const openSlots = slots.filter((s) => !s.assigned_user_id || s.status === "OPEN");
  const declinedSlots = slots.filter((s) => s.status === "DECLINED");
  const done = items.filter((i) => i.status === "DONE").length;
  const skipped = items.filter((i) => i.status === "SKIPPED").length;
  const nowItem = items.find((i) => i.status === "PLANNED");
  const progress = items.length ? Math.round(((done + skipped) / items.length) * 100) : 0;
  const serviceOver = plan ? plan.service_date <= today : false;

  const setItemStatus = async (item: Item, status: "PLANNED" | "DONE" | "SKIPPED") => {
    if (!supabase) return;
    const prev = items;
    setItems((list) => list.map((x) => (x.id === item.id ? { ...x, status } : x)));
    const { error } = await (supabase as any).rpc("set_plan_item_status", { p_item_id: item.id, p_status: status });
    if (error) {
      setItems(prev);
      pushToast("Couldn't update that part.", "error");
    }
  };

  const sendRecap = async () => {
    if (!plan) return;
    if (!window.confirm(`Send a thank-you recap to the ${active.length} people who served?`)) return;
    setSendingRecap(true);
    const res = await fetch("/api/notifications/recap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id }),
    });
    const json = await res.json().catch(() => ({}));
    setSendingRecap(false);
    if (!res.ok) { pushToast(json.error ?? "Couldn't send the recap.", "error"); return; }
    pushToast(`Recap sent to ${json.sentTo} people.`, "success");
    setPlans((list) => list.map((p) => (p.id === plan.id ? { ...p, recap_sent_at: new Date().toISOString() } : p)));
  };

  const name = (uid: string) => people[uid]?.full_name?.trim() || people[uid]?.email || "Member";
  const serviceLabel = (p: Plan) => [p.service_time_id ? serviceNames[p.service_time_id] : null, fmtTime(p.start_time)].filter(Boolean).join(" · ") || p.title || "Service";
  const dateLabel = plan ? new Date(`${plan.service_date}T12:00:00`).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "";

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <AdminHeader
          title={isToday ? "Sunday live" : "Next service"}
          subtitle={
            plan
              ? isToday
                ? `${dateLabel} — who's here, what's open, and where the service is.`
                : `Nothing is scheduled today. This board goes live on ${dateLabel}.`
              : "No upcoming services yet."
          }
          actions={
            plan ? (
              <div className="flex items-center gap-2">
                {isToday && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live{updatedAt ? ` · ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
                  </span>
                )}
                {serviceOver && (
                  <button
                    type="button"
                    onClick={sendRecap}
                    disabled={sendingRecap || !!plan.recap_sent_at || active.length === 0}
                    className="btn btn-secondary inline-flex h-9 items-center gap-1.5 px-3 text-sm"
                  >
                    <Heart className="h-4 w-4" />
                    {plan.recap_sent_at ? "Recap sent" : sendingRecap ? "Sending…" : "Send thank-you recap"}
                  </button>
                )}
                <Link href={`/admin/service-plans/${plan.id}`} className="btn btn-ghost inline-flex h-9 items-center px-3 text-sm">
                  Open plan
                </Link>
              </div>
            ) : null
          }
        />
        {plans.length > 1 && (
          <div role="tablist" aria-label="Services today" className="stitch-pill-toolbar mb-2 inline-flex gap-1 p-1">
            {plans.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === planId}
                onClick={() => setPlanId(p.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${p.id === planId ? "bg-amber-50 text-amber-800" : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
              >
                {serviceLabel(p)}
              </button>
            ))}
          </div>
        )}
      </PageGridFull>

      {!plan && !loading ? (
        <PageGridFull>
          <div className="stitch-section-card flex flex-col items-center gap-3 py-12 text-center">
            <Radio className="h-6 w-6 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">Create a service plan and this board fills in on the day.</p>
            <Link href="/admin/service-plans" className="btn btn-primary inline-flex h-9 items-center px-4 text-sm">Plan a service</Link>
          </div>
        </PageGridFull>
      ) : (
        <>
          <PageGridFull>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={UserCheck} label="Checked in" value={`${here.length}`} context={`of ${active.length} scheduled`} loading={loading} tone={here.length === active.length && active.length > 0 ? "good" : "plain"} />
              <Stat icon={AlertTriangle} label="Gaps" value={`${openSlots.length + declinedSlots.length}`} context={`${openSlots.length} open · ${declinedSlots.length} declined`} loading={loading} tone={openSlots.length + declinedSlots.length > 0 ? "warn" : "good"} />
              <Stat icon={CheckCircle2} label="Run of show" value={`${progress}%`} context={`${done} done · ${skipped} skipped of ${items.length}`} loading={loading} tone="plain" />
              {isToday ? (
                <Stat icon={Clock} label="Now" value={nowItem?.title || (items.length ? "Finished" : "—")} context={nowItem?.duration_minutes ? `${nowItem.duration_minutes} min` : items.length ? "All parts handled" : "No run of show"} loading={loading} tone="plain" small />
              ) : (
                <Stat icon={Clock} label="Starts" value={plan ? `${new Date(`${plan.service_date}T12:00:00`).toLocaleDateString([], { weekday: "short" })} ${fmtTime(plan.start_time)}`.trim() : "—"} context={plan ? `in ${Math.max(1, Math.round((new Date(`${plan.service_date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86_400_000))} days` : ""} loading={loading} tone="plain" small />
              )}
            </div>
          </PageGridFull>

          <PageGridRowTwoOne
            main={
              <section className="stitch-section-card">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Run of show</h2>
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden>
                    <div className="h-full rounded-full bg-amber-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[var(--text-muted)]">This service has no run of show.</p>
                ) : (
                  <ol className="divide-y divide-[var(--divider)]">
                    {items.map((item) => {
                      const isNow = item.id === nowItem?.id && isToday;
                      return (
                        <li key={item.id} className={`flex items-center gap-3 py-2.5 ${isNow ? "-mx-2 rounded-xl bg-amber-50/70 px-2" : ""}`}>
                          {item.status === "DONE" ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Done" />
                          ) : item.status === "SKIPPED" ? (
                            <SkipForward className="h-5 w-5 shrink-0 text-[var(--text-muted)]" aria-label="Skipped" />
                          ) : (
                            <Circle className={`h-5 w-5 shrink-0 ${isNow ? "text-amber-500" : "text-[var(--border)]"}`} aria-label="Planned" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium ${item.status === "SKIPPED" ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                              {item.title || "Untitled part"}
                              {isNow && <span className="ml-2 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Now</span>}
                            </p>
                            <p className="truncate text-xs text-[var(--text-muted)]">
                              {[item.duration_minutes ? `${item.duration_minutes} min` : null, item.assigned_user_id ? name(item.assigned_user_id) : null, item.assigned_user_id ? (item.checked_in_at ? "here" : "not checked in") : null].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          {isToday && (
                            item.status === "PLANNED" ? (
                              <div className="flex shrink-0 gap-1">
                                <button type="button" onClick={() => setItemStatus(item, "DONE")} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-emerald-50 hover:text-emerald-700">
                                  <Check className="h-3.5 w-3.5" /> Done
                                </button>
                                <button type="button" onClick={() => setItemStatus(item, "SKIPPED")} aria-label={`Skip ${item.title || "part"}`} className="inline-flex h-8 items-center rounded-lg px-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]">
                                  Skip
                                </button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => setItemStatus(item, "PLANNED")} aria-label={`Undo ${item.title || "part"}`} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]">
                                <Undo2 className="h-3.5 w-3.5" />
                              </button>
                            )
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            }
            side={
              <div className="space-y-4">
                <section className="stitch-section-card">
                  <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                    Team <span className="font-normal text-[var(--text-muted)]">· {here.length} here</span>
                  </h2>
                  {active.length === 0 ? (
                    <p className="py-4 text-sm text-[var(--text-muted)]">No one is scheduled yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {[...notYet, ...here].map((t) => (
                        <li key={t.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-[var(--surface-2)]">
                          <Avatar name={name(t.id)} email={people[t.id]?.email ?? ""} imageUrl={people[t.id]?.avatar_url ?? null} size={28} className="bg-amber-100 text-[10px] font-bold text-amber-700" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-[var(--text-primary)]">{name(t.id)}</p>
                            <p className="truncate text-[11px] text-[var(--text-muted)]">{t.jobs.join(", ")}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.here ? "bg-emerald-50 text-emerald-700" : t.confirmed ? "bg-[var(--surface-2)] text-[var(--text-secondary)]" : "bg-amber-50 text-amber-700"}`}>
                            {t.here ? "Here" : t.confirmed ? "Not yet" : "Pending"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                {(openSlots.length > 0 || declinedSlots.length > 0) && (
                  <section className="stitch-section-card">
                    <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Needs someone</h2>
                    <ul className="space-y-1.5">
                      {[...declinedSlots, ...openSlots].map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate text-[var(--text-primary)]">{roleNames[s.role_id] ?? "Role"}</span>
                          <span className={`shrink-0 text-[11px] font-medium ${s.status === "DECLINED" ? "text-red-600" : "text-[var(--text-muted)]"}`}>
                            {s.status === "DECLINED" ? `${s.assigned_user_id ? name(s.assigned_user_id) : "Someone"} declined` : "Open"}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {plan && (
                      <Link href={`/admin/service-plans/${plan.id}`} className="mt-3 inline-flex text-xs font-semibold text-amber-700 transition-colors hover:text-amber-800">
                        Fill in the plan →
                      </Link>
                    )}
                  </section>
                )}
              </div>
            }
          />
        </>
      )}
      {toast && (
        <div role="status" className="fixed right-6 top-20 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm shadow-lg">
          <p className={toast.tone === "error" ? "text-red-600" : "text-green-700"}>{toast.message}</p>
        </div>
      )}
    </PageGrid>
  );
}

function Stat({
  icon: Icon, label, value, context, loading, tone, small,
}: {
  icon: React.ElementType; label: string; value: string; context: string; loading: boolean; tone: "good" | "warn" | "plain"; small?: boolean;
}) {
  const toneCls = tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-[var(--text-muted)]";
  return (
    <div className="card-elevated rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
        <Icon className={`h-3.5 w-3.5 ${toneCls}`} aria-hidden /> {label}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded-md bg-[var(--surface-2)]" />
      ) : (
        <p className={`mt-1 truncate font-semibold tabular-nums text-[var(--text-primary)] ${small ? "text-base leading-7" : "text-2xl"}`}>{value}</p>
      )}
      <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{context}</p>
    </div>
  );
}
