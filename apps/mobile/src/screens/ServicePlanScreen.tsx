import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, Linking, StyleSheet, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import { Screen, Avatar, EmptyState, Loader, palette, font, radius, shadow, space } from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { WEB_URL, postWebApi } from "../lib/webApi";
import { SpringIn } from "../components/ds/motion";
import { addToCalendar } from "../lib/events";
import { addMinutes, clock } from "../lib/serving";
import { hueAt } from "../theme/areas";

/** `start_time` lives directly on the plan (migration 0027) — service_time_id is legacy and often null. */
type PlanRow = { id: string; title: string; service_date: string; start_time: string | null; service_time_id?: string | null };
/** `status` = execution state (PLANNED/DONE/SKIPPED); `assignment_status` = confirm/decline state — the two are unrelated. */
type PlanItemRow = { id: string; title: string; duration_minutes: number | null; notes: string; status: string; assigned_user_id: string | null; backup_user_id: string | null; assignment_status: string | null; checked_in_at: string | null };
type RoleSlotRow = { id: string; role_id: string; assigned_user_id: string | null; backup_user_id: string | null; status: string; checked_in_at: string | null };
type VolunteerRoleRow = { id: string; name: string; ministry_id: string | null };
type Ministry = { id: string; name: string };
type ProfilePeer = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

const STATUS_RING = { CONFIRMED: "#12B76A", DECLINED: "#F04438", WAITING: "#F59E0B" } as const;

function peerName(map: Record<string, ProfilePeer>, userId: string | null): string | null {
  if (!userId) return null;
  const p = map[userId];
  return p ? (p.full_name?.trim() || p.email || null) : null;
}
const firstName = (name: string | null) => (name ? name.split(/\s+/)[0] : "");
/** YYYY-MM-DD for "now" in an IANA timezone (en-CA formats dates as ISO). */
function todayInTimeZone(tz: string): string {
  try { return new Date().toLocaleDateString("en-CA", { timeZone: tz }); }
  catch { return new Date().toISOString().slice(0, 10); }
}
const weekdayOf = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" });
const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * The bulletin, in three moods:
 *  - Before the day: a ticket-style "You're serving" card (role, date, be ready by,
 *    when check-in opens), the order of service with real clock times, the team.
 *  - On the day: a live status card ("You're up next"), check-in, progress.
 *  - Admin running it (service day only, same as web Live Service): one "Now" card
 *    with Mark done / Skip, then Coming up and Done with Undo.
 */
export default function ServicePlanScreen({ route }: any) {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [items, setItems] = useState<PlanItemRow[]>([]);
  const [roleSlots, setRoleSlots] = useState<RoleSlotRow[]>([]);
  const [roles, setRoles] = useState<VolunteerRoleRow[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [peers, setPeers] = useState<Record<string, ProfilePeer>>({});
  const [churchAddress, setChurchAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [churchTz, setChurchTz] = useState<string>("America/New_York");
  /** Upcoming services to switch between — one stray plan must never hide Sunday's bulletin. */
  const [upcoming, setUpcoming] = useState<(PlanRow & { day: string; when: string })[]>([]);
  const selectedIdRef = useRef<string | null>(null);

  // Running the service is an admin job; volunteers only check themselves in.
  const isAdmin = profile?.role === "ADMIN";
  const me = profile?.id ?? null;

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const mine = (r: { assigned_user_id: string | null; backup_user_id: string | null }) => !!me && (r.assigned_user_id === me || r.backup_user_id === me);
  const myItems = useMemo(() => items.filter((i) => mine(i) && i.assignment_status !== "DECLINED"), [items, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const mySlots = useMemo(() => roleSlots.filter((s) => mine(s) && s.status !== "DECLINED"), [roleSlots, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const serving = myItems.length + mySlots.length > 0;

  // Check-in applies to what you're actually covering (primary, not backup).
  const myPrimary = [...myItems.filter((i) => i.assigned_user_id === me), ...mySlots.filter((s) => s.assigned_user_id === me)];
  const checkedInAt = myPrimary.length > 0 && myPrimary.every((r) => r.checked_in_at) ? [...myPrimary.map((r) => r.checked_in_at!)].sort()[0] : null;
  const myAnswer = myPrimary.length === 0 ? "BACKUP" : myPrimary.every((r) => ("assignment_status" in r ? r.assignment_status : r.status) === "CONFIRMED") ? "CONFIRMED" : "WAITING";

  // Check-in and running the service open on the service day in the church's
  // timezone (the server enforces both: check_in_to_plan, set_plan_item_status).
  const isServiceDay = !!plan && plan.service_date === todayInTimeZone(churchTz);
  const doneCount = items.filter((i) => i.status === "DONE" || i.status === "SKIPPED").length;
  const nowItem = items.find((i) => i.status === "PLANNED") ?? null;
  const inProgress = isServiceDay && doneCount > 0;
  const finished = isServiceDay && items.length > 0 && doneCount === items.length;

  // Clock time for each step: service start + the steps before it.
  const timed = useMemo(() => {
    let offset = 0;
    return items.map((i) => {
      const at = plan?.start_time ? clock(addMinutes(plan.start_time, offset)) : null;
      offset += i.duration_minutes ?? 0;
      return { ...i, at };
    });
  }, [items, plan?.start_time]);
  const totalMinutes = items.reduce((s, i) => s + (i.duration_minutes ?? 0), 0);
  const readyBy = plan?.start_time ? clock(addMinutes(plan.start_time, -15)) : null;

  // Where the service is relative to *my* next part.
  const myLive = useMemo(() => {
    if (!inProgress || !me) return null;
    const planned = items.filter((i) => i.status === "PLANNED");
    const idx = planned.findIndex((i) => i.assigned_user_id === me);
    if (idx === 0) return { title: "You're up now", sub: planned[0].title };
    if (idx === 1) return { title: "You're up next", sub: `${planned[1].title} · after ${planned[0].title}` };
    if (idx > 1) {
      const mins = planned.slice(0, idx).reduce((s, i) => s + (i.duration_minutes ?? 0), 0);
      return { title: `Your part is ${idx} steps away`, sub: `${planned[idx].title}${mins ? ` · about ${mins} min` : ""}` };
    }
    if (items.some((i) => i.assigned_user_id === me && i.status === "DONE")) return { title: "Your part is done", sub: "Thank you for serving today" };
    return null;
  }, [inProgress, items, me]);
  const myNextPart = items.find((i) => i.status === "PLANNED" && i.assigned_user_id === me && i.notes?.trim());

  const load = useCallback(async () => {
    if (!supabase || !profile?.church_id) { setError("Unable to load profile."); setLoading(false); setRefreshing(false); return; }
    setError(null);
    const { data: churchRow } = await supabase.from("churches").select("timezone, address").eq("id", profile.church_id).maybeSingle();
    const tz = (churchRow as { timezone: string | null } | null)?.timezone || "America/New_York";
    setChurchTz(tz);
    setChurchAddress((churchRow as { address: string | null } | null)?.address ?? null);
    // "Today" in the church's timezone — a UTC date would drop Sunday's plan on Sunday evening in the US.
    const today = todayInTimeZone(tz);
    const { data: listData, error: planError } = await supabase
      .from("service_plans")
      .select("id, title, service_date, start_time, service_time_id")
      .eq("church_id", profile.church_id)
      .gte("service_date", today)
      .order("service_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(8);
    const list = (listData ?? []) as PlanRow[];
    if (planError || list.length === 0) { setPlan(null); setUpcoming([]); setItems([]); setRoleSlots([]); setLoading(false); setRefreshing(false); return; }

    const timeIds = [...new Set(list.map((p) => p.service_time_id).filter((id): id is string => !!id))];
    const { data: timeRows } = timeIds.length
      ? await supabase.from("service_times").select("id, name").in("id", timeIds)
      : { data: [] as { id: string; name: string }[] };
    const timeName = new Map(((timeRows ?? []) as { id: string; name: string }[]).map((t) => [t.id, t.name]));
    setUpcoming(list.map((p) => ({
      ...p,
      day: shortDate(p.service_date),
      when: [p.start_time ? clock(p.start_time) : null, p.service_time_id ? timeName.get(p.service_time_id) : null].filter(Boolean).join(" ") || p.title,
    })));

    // Keep the service the person picked; otherwise open the next one they serve in.
    let planData = list.find((p) => p.id === selectedIdRef.current) ?? null;
    if (!planData && me) {
      const ids = list.map((p) => p.id);
      const or = `assigned_user_id.eq.${me},backup_user_id.eq.${me}`;
      const [ms, mi] = await Promise.all([
        supabase.from("service_plan_role_slots").select("plan_id").in("plan_id", ids).or(or),
        supabase.from("service_plan_items").select("plan_id").in("plan_id", ids).or(or),
      ]);
      const servingIn = new Set([...(ms.data ?? []), ...(mi.data ?? [])].map((r: any) => r.plan_id));
      planData = list.find((p) => servingIn.has(p.id)) ?? null;
    }
    planData ??= list[0];
    selectedIdRef.current = planData.id;
    setPlan(planData);
    const [itemRes, slotRes, roleRes, minRes, peersRes] = await Promise.all([
      supabase.from("service_plan_items").select("id, title, duration_minutes, notes, status, assigned_user_id, backup_user_id, assignment_status, checked_in_at").eq("plan_id", planData.id).order("position"),
      supabase.from("service_plan_role_slots").select("id, role_id, assigned_user_id, backup_user_id, status, checked_in_at").eq("plan_id", planData.id).order("sort_order"),
      supabase.from("volunteer_roles").select("id, name, ministry_id").eq("church_id", profile.church_id),
      supabase.from("ministries").select("id, name").eq("church_id", profile.church_id).order("name"),
      supabase.from("profiles").select("id, full_name, email, avatar_url").eq("church_id", profile.church_id).eq("disabled", false),
    ]);
    setItems(itemRes.error ? [] : (itemRes.data ?? []) as PlanItemRow[]);
    setRoleSlots(slotRes.error ? [] : (slotRes.data ?? []) as RoleSlotRow[]);
    setRoles(roleRes.error ? [] : (roleRes.data ?? []) as VolunteerRoleRow[]);
    setMinistries(minRes.error ? [] : (minRes.data ?? []) as Ministry[]);
    const peerMap: Record<string, ProfilePeer> = {};
    if (!peersRes.error && peersRes.data) for (const row of peersRes.data as ProfilePeer[]) peerMap[row.id] = row;
    setPeers(peerMap);
    setLoading(false); setRefreshing(false);
  }, [profile?.church_id, me]);

  const selectPlan = (id: string) => {
    if (id === plan?.id) return;
    Haptics.selectionAsync().catch(() => {});
    setLive(false);
    selectedIdRef.current = id;
    setLoading(true);
    void load();
  };

  // Opened from an assignment ("See the whole order of service"): show that plan.
  const requestedPlanId = route?.params?.planId as string | undefined;
  useEffect(() => {
    if (requestedPlanId && requestedPlanId !== selectedIdRef.current) {
      selectedIdRef.current = requestedPlanId;
      setLive(false);
      setLoading(true);
      void load();
    }
  }, [requestedPlanId, load]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  // On the day, follow the service live: refresh every 15s while this screen is open.
  useFocusEffect(
    useCallback(() => {
      if (!isServiceDay) return;
      const t = setInterval(() => { void load(); }, 15_000);
      return () => clearInterval(t);
    }, [isServiceDay, load])
  );

  const handleCheckIn = async () => {
    if (!supabase || !plan || checkingIn) return;
    setCheckingIn(true);
    setNotice(null);
    const { error: rpcError } = await supabase.rpc("check_in_to_plan", { p_plan_id: plan.id } as any);
    setCheckingIn(false);
    if (rpcError) {
      setNotice(String(rpcError.message).includes("NOT_SERVICE_DAY") ? "Check-in opens on the day of the service." : "Couldn't check you in. Try again in a moment.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    void load();
  };

  /** Optimistic, rolled back if the server refuses (e.g. not the service day). */
  const setItemStatus = async (item: PlanItemRow, next: "PLANNED" | "DONE" | "SKIPPED") => {
    if (!supabase) return;
    const prev = item.status;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
    Haptics.selectionAsync().catch(() => {});
    const { error: rpcError } = await supabase.rpc("set_plan_item_status", { p_item_id: item.id, p_status: next } as any);
    if (rpcError) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: prev } : i)));
      setNotice(String(rpcError.message).includes("NOT_SERVICE_DAY") ? "The service can be run on the day of the service." : "Couldn't save that. Try again.");
      return;
    }
    if (next === "DONE") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // The database wrote the thank-you / "you're up next" notes; this sends their push.
    if (next !== "PLANNED" && plan) void postWebApi("/api/live/push", { planId: plan.id });
  };

  const calendar = async () => {
    if (!plan?.start_time) return;
    const start = new Date(`${plan.service_date}T${plan.start_time.slice(0, 5)}:00`);
    const end = new Date(start.getTime() + (totalMinutes || 90) * 60_000);
    const roleName = mySlots[0] ? roleById.get(mySlots[0].role_id)?.name : myItems[0]?.title;
    try {
      await addToCalendar(
        { id: plan.id, title: roleName ? `Serving: ${roleName}` : plan.title || "Service", description: readyBy ? `Be ready by ${readyBy}.` : null, location: null, start_at: start.toISOString(), end_at: end.toISOString() },
        churchAddress
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn't open your calendar.");
    }
  };

  // Team grouped by ministry, each ministry keeping its colour (same order as the web board).
  const teamGroups = useMemo(() => {
    const groups = new Map<string, { name: string; hue: { mark: string; tint: string; ink: string } | null; slots: RoleSlotRow[] }>();
    for (const s of roleSlots) {
      const mid = roleById.get(s.role_id)?.ministry_id ?? null;
      const idx = mid ? ministries.findIndex((m) => m.id === mid) : -1;
      const key = idx >= 0 ? mid! : "other";
      if (!groups.has(key)) groups.set(key, { name: idx >= 0 ? ministries[idx].name : "Team", hue: idx >= 0 ? hueAt(idx) : null, slots: [] });
      groups.get(key)!.slots.push(s);
    }
    return [...groups.values()];
  }, [roleSlots, roleById, ministries]);
  const confirmedCount = roleSlots.filter((s) => s.assigned_user_id && s.status === "CONFIRMED").length;
  const hereCount = roleSlots.filter((s) => s.assigned_user_id && s.checked_in_at).length;
  const filledCount = roleSlots.filter((s) => s.assigned_user_id).length;

  const myTitle = mySlots.length > 0 ? roleById.get(mySlots[0].role_id)?.name ?? "Serving" : myItems[0]?.title ?? "Serving";
  const myAlso = [...mySlots.slice(1).map((s) => roleById.get(s.role_id)?.name), ...myItems.filter((i) => i.title !== myTitle).map((i) => i.title)].filter(Boolean) as string[];

  /* ─────────────── Admin running the service ─────────────── */
  const renderRun = () => {
    const coming = items.filter((i) => i.status === "PLANNED" && i.id !== nowItem?.id);
    const done = items.filter((i) => i.status !== "PLANNED").reverse();
    const notHere = roleSlots.filter((s) => s.assigned_user_id && !s.checked_in_at && s.status !== "DECLINED");
    const timeFor = (id: string) => timed.find((t) => t.id === id)?.at;
    return (
      <View>
        <View style={styles.runHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.runEyebrow}>Running · {plan?.title || "Service"}</Text>
            <Text style={styles.runTitle}>{doneCount} of {items.length} done</Text>
          </View>
          <Pressable onPress={() => setLive(false)} accessibilityRole="button" style={styles.ghostBtn}>
            <Text style={styles.ghostTxt}>Done running</Text>
          </Pressable>
        </View>
        <View style={styles.track} accessibilityLabel={`${doneCount} of ${items.length} steps done`}>
          <View style={[styles.trackFill, { width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }]} />
        </View>

        {nowItem ? (
          <View style={styles.nowCard}>
            <Text style={styles.nowEyebrow}>NOW</Text>
            <Text style={styles.nowTitle}>{nowItem.title}</Text>
            {peerName(peers, nowItem.assigned_user_id) ? (
              <View style={styles.nowWho}>
                <Avatar name={peerName(peers, nowItem.assigned_user_id)} imageUri={peers[nowItem.assigned_user_id!]?.avatar_url} size={28} />
                <Text style={styles.nowWhoTxt}>
                  {peerName(peers, nowItem.assigned_user_id)} · {nowItem.checked_in_at ? "checked in" : "not checked in"}{nowItem.duration_minutes ? ` · ${nowItem.duration_minutes} min` : ""}
                </Text>
              </View>
            ) : null}
            <View style={styles.nowActions}>
              <Pressable onPress={() => void setItemStatus(nowItem, "DONE")} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}>
                <Icon name="check" size={20} color="#3A2600" />
                <Text style={styles.doneBtnTxt}>Mark done</Text>
              </Pressable>
              <Pressable onPress={() => void setItemStatus(nowItem, "SKIPPED")} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.skipBtn, pressed && { opacity: 0.8 }]}>
                <Text style={styles.skipBtnTxt}>Skip</Text>
              </Pressable>
            </View>
            {coming[0] && peerName(peers, coming[0].assigned_user_id) ? (
              <Text style={styles.nowHint}>{firstName(peerName(peers, coming[0].assigned_user_id))} gets "You're up next" when you tap Mark done.</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.finishedCard}>
            <Icon name="checkCircle" size={22} color={palette.successInk} />
            <View style={{ flex: 1 }}>
              <Text style={styles.finishedTitle}>Service complete</Text>
              <Text style={styles.finishedBody}>Thank the team from Live Service on the web.</Text>
            </View>
          </View>
        )}
        {notice ? <Text style={[styles.notice, { marginTop: 10 }]}>{notice}</Text> : null}

        {coming.length > 0 ? (
          <>
            <Text style={styles.section}>Coming up</Text>
            <View style={styles.card}>
              {coming.map((i, idx) => (
                <View key={i.id} style={[styles.row, idx > 0 && styles.rowBorder]}>
                  <Text style={styles.timeCol}>{timeFor(i.id) ? `~${timeFor(i.id)!.replace(/\s?[AP]M$/, "")}` : ""}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{i.title}</Text>
                    <Text style={styles.rowMeta}>{[peerName(peers, i.assigned_user_id), i.assigned_user_id ? (i.checked_in_at ? "here" : "not here yet") : null].filter(Boolean).join(" · ") || "—"}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {done.length > 0 ? (
          <>
            <Text style={styles.section}>Done</Text>
            <View style={styles.card}>
              {done.map((i, idx) => (
                <View key={i.id} style={[styles.row, { alignItems: "center" }, idx > 0 && styles.rowBorder]}>
                  <View style={[styles.circle, i.status === "DONE" ? styles.circleDone : styles.circleSkipped]}>
                    <Icon name={i.status === "DONE" ? "check" : "close"} size={13} color={i.status === "DONE" ? palette.onDark : palette.inkSoft} />
                  </View>
                  <Text style={[styles.rowMeta, { flex: 1, marginTop: 0, fontSize: 15 }]}>{i.title}{i.status === "SKIPPED" ? " · skipped" : ""}</Text>
                  <Pressable onPress={() => void setItemStatus(i, "PLANNED")} accessibilityRole="button" accessibilityLabel={`Undo ${i.title}`} style={styles.undoBtn}>
                    <Text style={styles.undoTxt}>Undo</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={[styles.card, { padding: 16, marginTop: 20 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.rowTitle}>Team</Text>
            <Text style={styles.rowMeta}>{hereCount} of {filledCount} here</Text>
          </View>
          {notHere.length > 0 ? (
            <Text style={[styles.rowMeta, { marginTop: 6 }]}>
              Not yet: {notHere.map((s) => `${firstName(peerName(peers, s.assigned_user_id))} (${roleById.get(s.role_id)?.name ?? "role"})`).join(", ")}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  /* ─────────────── Everyone else (and admins before they press Run) ─────────────── */
  const renderBulletin = () => (
    <View>
      {/* Live status on the day, once the service is under way */}
      {inProgress || finished ? (
        <View style={styles.liveCard} accessibilityLiveRegion="polite">
          <Text style={styles.liveEyebrow}>Today · {plan?.title || "Service"}</Text>
          <Text style={styles.liveTitle}>{finished ? "Service complete" : myLive?.title ?? `${doneCount} of ${items.length} done`}</Text>
          <Text style={styles.liveSub}>
            {finished ? "Thank you to everyone who served today." : myLive?.sub ?? (nowItem ? `Now: ${nowItem.title}` : "")}
          </Text>
          <View style={styles.segments}>
            {items.map((i) => (
              <View key={i.id} style={[styles.segment, i.status !== "PLANNED" ? { backgroundColor: palette.amber } : i.id === nowItem?.id ? { backgroundColor: "rgba(245,158,11,0.5)" } : null]} />
            ))}
          </View>
          {checkedInAt ? (
            <View style={styles.liveCheck}>
              <Icon name="check" size={16} color="#A7F3D0" />
              <Text style={styles.liveCheckTxt}>Checked in at {timeOf(checkedInAt)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Ticket: what you're doing, when, and when check-in opens */}
      {serving && !(inProgress || finished) ? (
        <View style={styles.ticket}>
          <View style={styles.ticketTop}>
            <Text style={[styles.ticketEyebrow, { color: myAnswer === "CONFIRMED" ? palette.successInk : myAnswer === "BACKUP" ? palette.inkSoft : palette.amberInk }]}>
              {myAnswer === "CONFIRMED" ? "You're serving · Confirmed" : myAnswer === "BACKUP" ? "You're the backup" : "You're serving · Waiting for your answer"}
            </Text>
            <Text style={styles.ticketTitle}>{myTitle}</Text>
            {myAlso.length > 0 ? <Text style={styles.ticketSub}>Also on {myAlso.join(", ")}</Text> : null}
            <View style={styles.ticketGrid}>
              <View style={{ flex: 1 }}><Text style={styles.gridLabel}>Date</Text><Text style={styles.gridValue}>{plan ? shortDate(plan.service_date).replace(/^\w+, /, "") : ""}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.gridLabel}>Starts</Text><Text style={styles.gridValue}>{plan?.start_time ? clock(plan.start_time) : "—"}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.gridLabel}>Be ready by</Text><Text style={styles.gridValue}>{readyBy ?? "—"}</Text></View>
            </View>
          </View>
          <View style={styles.perforation} />
          <View style={styles.ticketFoot}>
            {myPrimary.length === 0 ? (
              <Text style={styles.footTxt}>You step in if the person serving can't make it.</Text>
            ) : checkedInAt ? (
              <View style={styles.footRow}>
                <Icon name="checkCircle" size={18} color={palette.successInk} />
                <Text style={[styles.footTxt, { color: palette.successInk, fontFamily: font.semibold }]}>Checked in at {timeOf(checkedInAt)}</Text>
              </View>
            ) : isServiceDay ? (
              <Pressable onPress={() => void handleCheckIn()} disabled={checkingIn} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.checkInBtn, (pressed || checkingIn) && { opacity: 0.85 }]}>
                {checkingIn ? <ActivityIndicator color="#3A2600" /> : <><Icon name="check" size={18} color="#3A2600" /><Text style={styles.checkInTxt}>Check in</Text></>}
              </Pressable>
            ) : (
              <View style={styles.footRow}>
                <Icon name="clock" size={18} color={palette.inkSoft} />
                <Text style={[styles.footTxt, { flex: 1 }]}>Check-in opens {weekdayOf(plan!.service_date)}</Text>
                {plan?.start_time ? (
                  <Pressable onPress={() => void calendar()} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
                    <Text style={styles.link}>Add to calendar</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </View>
      ) : null}

      {/* Your notes for what's coming (key, mic, cues) */}
      {inProgress && myNextPart ? (
        <View style={[styles.card, { padding: 16, marginBottom: 12 }]}>
          <Text style={styles.rowMeta}>Before you go on</Text>
          <Text style={[styles.rowTitle, { marginTop: 4 }]}>{myNextPart.title}</Text>
          <Text style={[styles.rowMeta, { marginTop: 2 }]}>{myNextPart.notes}</Text>
        </View>
      ) : null}

      {isAdmin && items.length > 0 ? (
        isServiceDay && !finished ? (
          <Pressable onPress={() => setLive(true)} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.runBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="servicePlan" size={18} color={palette.onDark} />
            <Text style={styles.runBtnTxt}>{inProgress ? "Keep running the service" : "Run the service"}</Text>
          </Pressable>
        ) : !isServiceDay ? (
          <Text style={styles.adminNote}>You can run the service from here on {weekdayOf(plan!.service_date)}.</Text>
        ) : null
      ) : null}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {/* Order of service */}
      {items.length > 0 ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionInline} accessibilityRole="header">Order of service</Text>
            {plan?.start_time && totalMinutes ? (
              <Text style={styles.sectionMeta}>{clock(plan.start_time)} – {clock(addMinutes(plan.start_time, totalMinutes))}</Text>
            ) : null}
          </View>
          <View style={[styles.card, { paddingVertical: 6 }]}>
            {timed.map((i) => {
              const isMe = i.assigned_user_id === me && i.assignment_status !== "DECLINED";
              const who = isMe ? "You" : peerName(peers, i.assigned_user_id);
              const done = i.status === "DONE", skipped = i.status === "SKIPPED";
              const isNow = inProgress && i.id === nowItem?.id;
              return (
                <View key={i.id} style={[styles.orderRow, isMe && styles.orderMine, inProgress && (done || skipped) && { opacity: 0.6 }]}>
                  {inProgress ? (
                    <View style={[styles.circle, done ? styles.circleDone : skipped ? styles.circleSkipped : isNow ? styles.circleNow : styles.circleIdle]}>
                      {done ? <Icon name="check" size={13} color={palette.onDark} /> : skipped ? <Icon name="close" size={12} color={palette.inkSoft} /> : isNow ? <View style={styles.nowDot} /> : null}
                    </View>
                  ) : (
                    <Text style={[styles.timeCol, isMe && { color: palette.amberInk }]}>{i.at ? i.at.replace(/\s?[AP]M$/, "") : ""}</Text>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    {isNow ? <Text style={styles.nowLabel}>{isMe ? "NOW · YOU" : "NOW"}</Text> : null}
                    <Text style={[styles.rowTitle, inProgress && done && { textDecorationLine: "line-through" }]}>{i.title}</Text>
                    <Text style={[styles.rowMeta, isMe && { color: "#7A4508" }]}>
                      {[inProgress && i.at ? `~${i.at}` : null, who, i.duration_minutes ? `${i.duration_minutes} min` : null, skipped ? "skipped" : null].filter(Boolean).join(" · ")}
                    </Text>
                    {i.notes?.trim() && !inProgress ? <Text style={styles.orderNotes} numberOfLines={4}>{i.notes.trim()}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {/* Team */}
      {roleSlots.length > 0 ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionInline} accessibilityRole="header">Team</Text>
            <Text style={styles.sectionMeta}>{isServiceDay ? `${hereCount} of ${filledCount} here` : `${confirmedCount} of ${roleSlots.length} confirmed`}</Text>
          </View>
          {isServiceDay ? (
            <View style={[styles.card, { paddingVertical: 4 }]}>
              {roleSlots.filter((s) => s.assigned_user_id).map((s, idx) => (
                <View key={s.id} style={[styles.teamRow, idx > 0 && styles.rowBorder]}>
                  <Avatar name={peerName(peers, s.assigned_user_id)} imageUri={peers[s.assigned_user_id!]?.avatar_url} size={36} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{s.assigned_user_id === me ? "You" : peerName(peers, s.assigned_user_id)}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>{roleById.get(s.role_id)?.name ?? "Role"}</Text>
                  </View>
                  <Text style={[styles.hereTxt, { color: s.checked_in_at ? palette.successInk : palette.inkMuted }]}>{s.checked_in_at ? "Here" : "Not yet"}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.card, { padding: 16, gap: 18 }]}>
              {teamGroups.map((g) => (
                <View key={g.name}>
                  <View style={styles.groupHead}>
                    <View style={[styles.groupDot, { backgroundColor: g.hue?.mark ?? palette.line }]} />
                    <Text style={[styles.groupName, g.hue ? { color: g.hue.ink } : null]}>{g.name} · {g.slots.length}</Text>
                  </View>
                  <View style={styles.avatars}>
                    {g.slots.map((s) => {
                      const name = peerName(peers, s.assigned_user_id);
                      const role = roleById.get(s.role_id)?.name ?? "Role";
                      const ring = s.status === "CONFIRMED" ? STATUS_RING.CONFIRMED : s.status === "DECLINED" ? STATUS_RING.DECLINED : STATUS_RING.WAITING;
                      const state = s.status === "CONFIRMED" ? "confirmed" : s.status === "DECLINED" ? "can't make it" : "waiting";
                      return (
                        <View key={s.id} style={styles.person} accessibilityLabel={name ? `${role}: ${name}, ${state}` : `${role}: open`}>
                          {name ? (
                            <View style={[styles.ring, { borderColor: ring }]}>
                              <Avatar name={name} imageUri={peers[s.assigned_user_id!]?.avatar_url} size={40} />
                            </View>
                          ) : (
                            <View style={styles.openSeat}><Icon name="add" size={16} color={palette.inkMuted} /></View>
                          )}
                          <Text style={styles.personName} numberOfLines={1}>{s.assigned_user_id === me ? "You" : name ? firstName(name) : role}</Text>
                          <Text style={styles.personRole} numberOfLines={1}>{name ? role : "Open"}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
              <View style={styles.legend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: STATUS_RING.CONFIRMED }]} /><Text style={styles.legendTxt}>Confirmed</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: STATUS_RING.WAITING }]} /><Text style={styles.legendTxt}>Waiting</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: STATUS_RING.DECLINED }]} /><Text style={styles.legendTxt}>Can't make it</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, styles.legendOpen]} /><Text style={styles.legendTxt}>Open</Text></View>
              </View>
            </View>
          )}
        </>
      ) : null}

      {isAdmin && plan ? (
        <Pressable onPress={() => Linking.openURL(`${WEB_URL}/admin/service-plans/print/${plan.id}`)} style={styles.printLink} accessibilityRole="link">
          <Text style={styles.link}>Open printable bulletin</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.base, paddingTop: 8, paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        {!live ? (
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header">Plan</Text>
            {isServiceDay && inProgress ? (
              <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveBadgeTxt}>Live</Text></View>
            ) : null}
          </View>
        ) : null}

        {!live && upcoming.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow} style={{ marginHorizontal: -space.base, marginBottom: 14 }} accessibilityRole="tablist">
            {upcoming.map((p) => {
              const active = p.id === plan?.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => selectPlan(p.id)}
                  accessibilityRole="tab"
                  aria-selected={active}
                  accessibilityLabel={`${p.day} ${p.when}`}
                  style={({ pressed }: { pressed: boolean }) => [styles.pickerChip, active && styles.pickerChipActive, pressed && !active && { opacity: 0.8 }]}
                >
                  <Text style={[styles.pickerDay, active && { color: "rgba(255,255,255,0.75)" }]} maxFontSizeMultiplier={1.3}>{p.day}</Text>
                  <Text style={[styles.pickerWhen, active && { color: palette.onDark }]} maxFontSizeMultiplier={1.3} numberOfLines={1}>{p.when}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {loading ? (
          <Loader />
        ) : error ? (
          <View style={styles.errorBox}><Text style={styles.errorTxt}>{error}</Text></View>
        ) : !plan ? (
          <EmptyState icon="servicePlan" title="No upcoming plan" body="Your church hasn't published a plan for a future service yet." />
        ) : live && isAdmin && isServiceDay ? (
          renderRun()
        ) : (
          renderBulletin()
        )}
      </ScrollView>
    </Screen>
  );
}

const card = { backgroundColor: palette.surface, borderRadius: 20, ...shadow.sm } as const;

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 8, marginBottom: 12 },
  title: { fontFamily: font.bold, fontSize: 28, letterSpacing: -0.5, color: palette.ink },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.amber },
  liveBadgeTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.amberInk },

  pickerRow: { gap: space.sm, paddingHorizontal: space.base },
  pickerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, minHeight: 48, justifyContent: "center" },
  pickerChipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  pickerDay: { fontFamily: font.regular, fontSize: 12, color: palette.inkSoft },
  pickerWhen: { fontFamily: font.semibold, fontSize: 14, color: palette.ink, maxWidth: 160 },

  errorBox: { padding: 16, borderRadius: radius.md, backgroundColor: palette.dangerSoft },
  errorTxt: { fontFamily: font.regular, fontSize: 14, color: palette.dangerInk },

  ticket: { ...card, overflow: "hidden", marginBottom: 12 },
  ticketTop: { padding: 18, paddingBottom: 16 },
  ticketEyebrow: { fontFamily: font.semibold, fontSize: 13 },
  ticketTitle: { fontFamily: font.bold, fontSize: 24, letterSpacing: -0.4, color: palette.ink, marginTop: 4 },
  ticketSub: { fontFamily: font.regular, fontSize: 15, color: palette.inkSoft, marginTop: 2 },
  ticketGrid: { flexDirection: "row", gap: 8, marginTop: 16 },
  gridLabel: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted },
  gridValue: { fontFamily: font.semibold, fontSize: 15, color: palette.ink, marginTop: 2 },
  perforation: { borderTopWidth: 2, borderStyle: "dashed", borderColor: palette.line, marginHorizontal: 14 },
  ticketFoot: { paddingHorizontal: 18, paddingVertical: 10, minHeight: 56, justifyContent: "center" },
  footRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  footTxt: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft },
  checkInBtn: { minHeight: 48, borderRadius: radius.md, backgroundColor: palette.amber, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  checkInTxt: { fontFamily: font.semibold, fontSize: 16, color: "#3A2600" },
  link: { fontFamily: font.semibold, fontSize: 14, color: palette.amberInk },

  liveCard: { backgroundColor: palette.ink, borderRadius: 20, padding: 18, marginBottom: 12 },
  liveEyebrow: { fontFamily: font.regular, fontSize: 13, color: "rgba(255,255,255,0.7)" },
  liveTitle: { fontFamily: font.bold, fontSize: 26, letterSpacing: -0.4, color: palette.onDark, marginTop: 6 },
  liveSub: { fontFamily: font.regular, fontSize: 15, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  segments: { flexDirection: "row", gap: 4, marginTop: 16 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" },
  liveCheck: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  liveCheckTxt: { fontFamily: font.regular, fontSize: 14, color: "#A7F3D0" },

  runBtn: { minHeight: 48, borderRadius: radius.md, backgroundColor: palette.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  runBtnTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.onDark },
  adminNote: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginHorizontal: 4, marginBottom: 8 },
  notice: { fontFamily: font.medium, fontSize: 13, color: palette.dangerInk, marginHorizontal: 4, marginBottom: 8 },

  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 22, marginBottom: 10, marginHorizontal: 4 },
  sectionInline: { fontFamily: font.bold, fontSize: 20, letterSpacing: -0.3, color: palette.ink },
  sectionMeta: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft },
  section: { fontFamily: font.bold, fontSize: 18, color: palette.ink, marginTop: 22, marginBottom: 10, marginHorizontal: 4 },

  card: { ...card },
  row: { flexDirection: "row", gap: 12, paddingVertical: 12, paddingHorizontal: 18 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  rowTitle: { fontFamily: font.semibold, fontSize: 16, color: palette.ink },
  rowMeta: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 2 },
  timeCol: { width: 48, fontFamily: font.semibold, fontSize: 14, color: palette.inkSoft, fontVariant: ["tabular-nums"], marginTop: 1 },

  orderRow: { flexDirection: "row", gap: 14, paddingVertical: 12, paddingHorizontal: 18, borderLeftWidth: 3, borderLeftColor: "transparent" },
  orderMine: { backgroundColor: "#FFF8EB", borderLeftColor: palette.amber },
  orderNotes: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: palette.inkSoft, marginTop: 4 },
  nowLabel: { fontFamily: font.bold, fontSize: 12, color: palette.amberInk, marginBottom: 2 },
  circle: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 1 },
  circleIdle: { borderWidth: 2, borderColor: palette.line },
  circleNow: { borderWidth: 2, borderColor: palette.amber },
  circleDone: { backgroundColor: "#0B5E57" },
  circleSkipped: { backgroundColor: palette.sunken },
  nowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.amber },

  teamRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 18 },
  hereTxt: { fontFamily: font.semibold, fontSize: 13 },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupName: { fontFamily: font.semibold, fontSize: 13, color: palette.inkSoft },
  avatars: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  person: { width: 64, alignItems: "center" },
  ring: { borderWidth: 2, borderRadius: 24, padding: 2 },
  openSeat: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderStyle: "dashed", borderColor: "#D6D3D1", alignItems: "center", justifyContent: "center" },
  personName: { fontFamily: font.medium, fontSize: 12, color: palette.ink, marginTop: 6, maxWidth: 64 },
  personRole: { fontFamily: font.regular, fontSize: 11, color: palette.inkMuted, maxWidth: 64 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendOpen: { borderWidth: 1.5, borderStyle: "dashed", borderColor: "#A8A29E", backgroundColor: "transparent" },
  legendTxt: { fontFamily: font.regular, fontSize: 12, color: palette.inkSoft },
  printLink: { alignSelf: "center", marginTop: 16, minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },

  runHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4, paddingTop: 8 },
  runEyebrow: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft },
  runTitle: { fontFamily: font.bold, fontSize: 24, letterSpacing: -0.4, color: palette.ink, marginTop: 2 },
  ghostBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.chip, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, justifyContent: "center" },
  ghostTxt: { fontFamily: font.semibold, fontSize: 14, color: palette.ink },
  track: { height: 6, borderRadius: 3, backgroundColor: palette.line, overflow: "hidden", marginHorizontal: 4, marginTop: 14, marginBottom: 16 },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: "#009B90" },
  nowCard: { ...card, padding: 18, borderWidth: 2, borderColor: palette.amber },
  nowEyebrow: { fontFamily: font.bold, fontSize: 12, color: palette.amberInk, letterSpacing: 0.4 },
  nowTitle: { fontFamily: font.bold, fontSize: 24, letterSpacing: -0.4, color: palette.ink, marginTop: 4 },
  nowWho: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  nowWhoTxt: { flex: 1, fontFamily: font.regular, fontSize: 15, color: palette.inkSoft },
  nowActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  doneBtn: { flex: 2, minHeight: 52, borderRadius: 14, backgroundColor: palette.amber, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  doneBtnTxt: { fontFamily: font.semibold, fontSize: 17, color: "#3A2600" },
  skipBtn: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, alignItems: "center", justifyContent: "center" },
  skipBtnTxt: { fontFamily: font.semibold, fontSize: 16, color: palette.inkSoft },
  nowHint: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, marginTop: 12 },
  undoBtn: { minHeight: 44, paddingHorizontal: 10, justifyContent: "center" },
  undoTxt: { fontFamily: font.semibold, fontSize: 14, color: palette.amberInk },
  finishedCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.successSoft, borderRadius: radius.lg, padding: 16 },
  finishedTitle: { fontFamily: font.bold, fontSize: 15, color: palette.successInk },
  finishedBody: { fontFamily: font.regular, fontSize: 13, color: palette.successInk, marginTop: 2 },
});
