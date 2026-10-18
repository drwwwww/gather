import { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, Linking, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Avatar, Pill, EmptyState, Loader, Button, Divider, StatGrid, Eyebrow,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { WEB_URL } from "../lib/webApi";

type AssignmentChip = { key: string; label: string; role: "Primary" | "Backup" | "Part" };
/** `start_time` lives directly on the plan (migration 0027) — service_time_id is legacy and often null. */
type PlanRow = { id: string; title: string; service_date: string; start_time: string | null; service_time_id?: string | null };
/** `status` = execution state (PLANNED/DONE/SKIPPED); `assignment_status` = confirm/decline state — the two are unrelated. */
type PlanItemRow = { id: string; title: string; duration_minutes: number | null; notes: string; status: string; assigned_user_id: string | null; backup_user_id: string | null; assignment_status: string | null; checked_in_at: string | null };
type RoleSlotRow = { id: string; role_id: string; assigned_user_id: string | null; backup_user_id: string | null; status: string; checked_in_at: string | null };
type VolunteerRoleRow = { id: string; name: string };
type ProfilePeer = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

function peerName(map: Record<string, ProfilePeer>, userId: string | null): string | null {
  if (!userId) return null;
  const p = map[userId];
  return p ? (p.full_name?.trim() || p.email || null) : null;
}
/** YYYY-MM-DD for "now" in an IANA timezone (en-CA formats dates as ISO). */
function todayInTimeZone(tz: string): string {
  try { return new Date().toLocaleDateString("en-CA", { timeZone: tz }); }
  catch { return new Date().toISOString().slice(0, 10); }
}
function formatWeekday(dateStr: string): string {
  try { return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" }); }
  catch { return "on service day"; }
}
function formatClock(iso: string): string {
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
  catch { return ""; }
}
function formatDate(dateStr: string): string {
  try { return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }
  catch { return dateStr; }
}
function formatStartTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
function subtractMinutesFromTimeString(start: string, sub: number): string {
  const [hStr, mStr] = start.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  let total = h * 60 + m - sub;
  if (total < 0) total = 0;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function ServicePlanScreen() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [items, setItems] = useState<PlanItemRow[]>([]);
  const [roleSlots, setRoleSlots] = useState<RoleSlotRow[]>([]);
  const [roles, setRoles] = useState<VolunteerRoleRow[]>([]);
  const [peers, setPeers] = useState<Record<string, ProfilePeer>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const [churchTz, setChurchTz] = useState<string>("America/New_York");
  /** Upcoming services to switch between — one stray plan must never hide Sunday's bulletin. */
  const [upcoming, setUpcoming] = useState<(PlanRow & { label: string })[]>([]);
  const selectedIdRef = useRef<string | null>(null);

  // Running the service is an admin job; volunteers only check themselves in.
  const canRunService = profile?.role === "ADMIN";
  const myUserId = profile?.id ?? null;

  const roleLookup = useMemo(() => roles.reduce<Record<string, string>>((acc, r) => { acc[r.id] = r.name; return acc; }, {}), [roles]);
  // "You're serving" only counts assignments you haven't declined.
  const myItems = useMemo(
    () => (myUserId ? items.filter((i) => (i.assigned_user_id === myUserId || i.backup_user_id === myUserId) && i.assignment_status !== "DECLINED") : []),
    [items, myUserId]
  );
  const mySlots = useMemo(
    () => (myUserId ? roleSlots.filter((s) => (s.assigned_user_id === myUserId || s.backup_user_id === myUserId) && s.status !== "DECLINED") : []),
    [roleSlots, myUserId]
  );

  const assignmentChips: AssignmentChip[] = useMemo(() => {
    const chips: AssignmentChip[] = [];
    for (const item of myItems) chips.push({ key: `i-${item.id}`, label: item.title, role: item.assigned_user_id === myUserId ? "Part" : "Backup" });
    for (const slot of mySlots) {
      const name = roleLookup[slot.role_id] ?? "Role";
      chips.push({ key: `s-${slot.id}`, label: name, role: slot.assigned_user_id === myUserId ? "Primary" : "Backup" });
    }
    return chips;
  }, [myItems, mySlots, roleLookup, myUserId]);

  // Check-in applies to what you're actually covering (primary, not backup).
  const myPrimary = useMemo(
    () => [
      ...myItems.filter((i) => i.assigned_user_id === myUserId).map((i) => i.checked_in_at),
      ...mySlots.filter((s) => s.assigned_user_id === myUserId).map((s) => s.checked_in_at),
    ],
    [myItems, mySlots, myUserId]
  );
  const checkedInAt =
    myPrimary.length > 0 && myPrimary.every(Boolean) ? ([...myPrimary].sort()[0] as string) : null;

  // Check-in opens on the service day in the church's timezone (the server
  // enforces the same rule in check_in_to_plan).
  const isServiceDay = !!plan && plan.service_date === todayInTimeZone(churchTz);

  const doneCount = items.filter((i) => i.status === "DONE" || i.status === "SKIPPED").length;
  const currentItemId = items.find((i) => i.status === "PLANNED")?.id ?? null;

  const readyBy = useMemo(() => {
    if (assignmentChips.length === 0 || !plan?.start_time) return null;
    return formatStartTime(subtractMinutesFromTimeString(plan.start_time, 15));
  }, [assignmentChips.length, plan?.start_time]);

  const totalMinutes = useMemo(() => items.reduce((sum, i) => sum + (typeof i.duration_minutes === "number" ? i.duration_minutes : 0), 0), [items]);

  const load = useCallback(async () => {
    if (!supabase || !profile?.church_id) { setError("Unable to load profile."); setLoading(false); setRefreshing(false); return; }
    setError(null);
    const { data: churchRow } = await supabase.from("churches").select("timezone").eq("id", profile.church_id).maybeSingle();
    const tz = (churchRow as { timezone: string | null } | null)?.timezone || "America/New_York";
    setChurchTz(tz);
    // "Today" in the church's timezone — a UTC date would drop Sunday's plan
    // on Sunday evening in the US.
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
      label: [
        new Date(p.service_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
        p.start_time ? formatStartTime(p.start_time) : null,
        p.service_time_id ? timeName.get(p.service_time_id) : null,
      ].filter(Boolean).join(" · "),
    })));

    // Keep the service the person picked; otherwise open the next one they serve in.
    let planData = list.find((p) => p.id === selectedIdRef.current) ?? null;
    if (!planData && myUserId) {
      const ids = list.map((p) => p.id);
      const mine = `assigned_user_id.eq.${myUserId},backup_user_id.eq.${myUserId}`;
      const [ms, mi] = await Promise.all([
        supabase.from("service_plan_role_slots").select("plan_id").in("plan_id", ids).or(mine),
        supabase.from("service_plan_items").select("plan_id").in("plan_id", ids).or(mine),
      ]);
      const servingIn = new Set([...(ms.data ?? []), ...(mi.data ?? [])].map((r: any) => r.plan_id));
      planData = list.find((p) => servingIn.has(p.id)) ?? null;
    }
    planData ??= list[0];
    selectedIdRef.current = planData.id;
    setPlan(planData);
    const [itemRes, slotRes, roleRes, peersRes] = await Promise.all([
      supabase.from("service_plan_items").select("id, title, duration_minutes, notes, status, assigned_user_id, backup_user_id, assignment_status, checked_in_at").eq("plan_id", planData.id).order("position"),
      supabase.from("service_plan_role_slots").select("id, role_id, assigned_user_id, backup_user_id, status, checked_in_at").eq("plan_id", planData.id).order("sort_order"),
      supabase.from("volunteer_roles").select("id, name").eq("church_id", profile.church_id),
      supabase.from("profiles").select("id, full_name, email, avatar_url").eq("church_id", profile.church_id).eq("disabled", false),
    ]);
    setItems(itemRes.error ? [] : (itemRes.data ?? []) as PlanItemRow[]);
    setRoleSlots(slotRes.error ? [] : (slotRes.data ?? []) as RoleSlotRow[]);
    setRoles(roleRes.error ? [] : (roleRes.data ?? []) as VolunteerRoleRow[]);
    const peerMap: Record<string, ProfilePeer> = {};
    if (!peersRes.error && peersRes.data) for (const row of peersRes.data as ProfilePeer[]) peerMap[row.id] = row;
    setPeers(peerMap);
    setLoading(false); setRefreshing(false);
  }, [profile?.church_id, myUserId]);

  const selectPlan = (id: string) => {
    if (id === plan?.id) return;
    Haptics.selectionAsync().catch(() => {});
    selectedIdRef.current = id;
    setLoading(true);
    void load();
  };

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  const handleCheckIn = async () => {
    if (!supabase || !plan || checkingIn) return;
    setCheckingIn(true);
    setCheckInError(null);
    const { error: rpcError } = await supabase.rpc("check_in_to_plan", { p_plan_id: plan.id } as any);
    setCheckingIn(false);
    if (rpcError) {
      setCheckInError(
        String(rpcError.message).includes("NOT_SERVICE_DAY")
          ? "Check-in opens on the day of the service."
          : "Couldn't check you in. Try again in a moment."
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    void load();
  };

  /** Optimistic: the circle fills immediately, and rolls back if the RPC refuses. */
  const setItemStatus = async (item: PlanItemRow, next: "PLANNED" | "DONE" | "SKIPPED") => {
    if (!supabase) return;
    const prev = item.status;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
    Haptics.selectionAsync().catch(() => {});
    const { error: rpcError } = await supabase.rpc("set_plan_item_status", { p_item_id: item.id, p_status: next } as any);
    if (rpcError) setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: prev } : i)));
  };

  const dateLine = plan
    ? [formatDate(plan.service_date), plan.start_time ? formatStartTime(plan.start_time) : null].filter(Boolean).join(" · ")
    : "";
  const planTitle = plan?.title?.trim() || "Sunday Service";

  const heroStats = plan ? [
    { icon: "clock" as const, label: "Time", value: plan.start_time ? formatStartTime(plan.start_time) : "—" },
    { icon: "bookOpen" as const, label: "Parts", value: String(items.length) },
    { icon: "members" as const, label: "Team", value: String(roleSlots.length) },
  ] : [];

  return (
    <Screen>
      <View style={styles.header}><Text style={styles.headerTitle}>Bulletin</Text></View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        {loading ? (
          <Loader />
        ) : error ? (
          <View style={styles.errorBox}><Text style={styles.errorTxt}>{error}</Text></View>
        ) : !plan ? (
          <EmptyState icon="servicePlan" title="No upcoming bulletin" body="Your church hasn't published a plan for a future service yet." />
        ) : (
          <View>
            {upcoming.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerRow}
                style={{ marginHorizontal: -space.gutter, marginBottom: space.md }}
                accessibilityRole="tablist"
              >
                {upcoming.map((p) => {
                  const active = p.id === plan.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => selectPlan(p.id)}
                      accessibilityRole="tab"
                      aria-selected={active}
                      accessibilityLabel={p.label}
                      style={({ pressed }: { pressed: boolean }) => [styles.pickerChip, active && styles.pickerChipActive, pressed && !active && { opacity: 0.8 }]}
                    >
                      <Text style={[styles.pickerTxt, active && styles.pickerTxtActive]} numberOfLines={1}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
            {/* Hero card */}
            <View style={styles.hero}>
              <Eyebrow>{plan.id === upcoming[0]?.id ? "Next bulletin" : "Bulletin"}</Eyebrow>
              <Text style={styles.heroTitle}>{planTitle}</Text>
              <Text style={styles.heroMeta}>{dateLine}</Text>
              <View style={styles.statWrap}><StatGrid items={heroStats} columns={3} /></View>
              {myPrimary.length > 0 || (canRunService && items.length > 0) ? (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                  {myPrimary.length > 0 ? (
                    <View style={{ flex: 1 }}>
                      {checkedInAt ? (
                        <View style={styles.checkedIn}>
                          <Icon name="checkCircle" size={18} color={palette.amberInk} />
                          <Text style={styles.checkedInTxt}>Checked in · {formatClock(checkedInAt)}</Text>
                        </View>
                      ) : isServiceDay ? (
                        <Button label="Check in" icon="check" loading={checkingIn} style={{ minHeight: 46 }} onPress={handleCheckIn} />
                      ) : (
                        <View style={styles.checkInLater} accessibilityRole="text">
                          <Icon name="clock" size={16} color={palette.inkSoft} />
                          <Text style={styles.checkInLaterTxt} numberOfLines={1}>
                            Check-in opens {formatWeekday(plan.service_date)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : null}
                  {canRunService && items.length > 0 ? (
                    <View style={{ flex: 1 }}>
                      <Button
                        label={live ? "Stop running" : "Run service"}
                        icon={live ? "close" : "servicePlan"}
                        variant="secondary"
                        style={{ minHeight: 46 }}
                        onPress={() => setLive((v) => !v)}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
              {checkInError ? <Text style={styles.inlineError}>{checkInError}</Text> : null}
              {profile?.role === "ADMIN" ? (
                <Pressable
                  onPress={() => Linking.openURL(`${WEB_URL}/admin/service-plans/print/${plan.id}`)}
                  style={styles.printLink}
                  accessibilityRole="link"
                >
                  <Text style={styles.printLinkTxt}>Open printable bulletin</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Serving */}
            {assignmentChips.length > 0 ? (
              <View style={styles.serving}>
                <View style={styles.servingHead}>
                  <Icon name="handshake" size={16} color={palette.amber} />
                  <Text style={styles.servingEyebrow}>YOU'RE SERVING</Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {assignmentChips.map((chip) => (
                    <View key={chip.key} style={styles.chip}>
                      <Text style={styles.chipTxt}>{chip.label}</Text>
                      {chip.role !== "Part" ? <Text style={styles.chipRole}>{chip.role}</Text> : null}
                    </View>
                  ))}
                </View>
                {readyBy ? <Text style={styles.readyBy}>Please be ready by {readyBy}.</Text> : null}
              </View>
            ) : null}

            {/* Order of service */}
            {items.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Order of Service</Text>
                  {live ? (
                    <Pill label={`${doneCount} of ${items.length} done`} tone={doneCount === items.length ? "success" : "amber"} />
                  ) : totalMinutes > 0 ? (
                    <Pill label={`${totalMinutes} min`} tone="amber" />
                  ) : null}
                </View>
                {live ? (
                  <View style={styles.progressTrack} accessibilityLabel={`${doneCount} of ${items.length} parts done`}>
                    <View style={[styles.progressFill, { width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }]} />
                  </View>
                ) : null}
                {items.map((item, idx) => {
                  const declined = item.assignment_status === "DECLINED";
                  const isMe = item.assigned_user_id === myUserId && !declined;
                  const assignedName = peerName(peers, item.assigned_user_id);
                  const statusTone = declined ? "danger" : item.assignment_status === "CONFIRMED" ? "success" : "amber";
                  const statusLabel = declined ? "Declined" : item.assignment_status === "CONFIRMED" ? "Confirmed" : "Pending";
                  const done = item.status === "DONE";
                  const skipped = item.status === "SKIPPED";
                  const isNow = live && item.id === currentItemId;
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.orderCard,
                        isMe && styles.orderCardMe,
                        isNow && styles.orderCardNow,
                        live && (done || skipped) && { opacity: 0.55 },
                      ]}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <View style={{ flexDirection: "row", gap: 14, flex: 1, minWidth: 0 }}>
                          {live ? (
                            <Pressable
                              onPress={() => setItemStatus(item, done || skipped ? "PLANNED" : "DONE")}
                              hitSlop={10}
                              accessibilityRole="checkbox"
                              aria-checked={done}
                              accessibilityLabel={`Mark ${item.title} ${done ? "not done" : "done"}`}
                              style={[styles.doneCircle, done && styles.doneCircleOn]}
                            >
                              {done ? <Icon name="check" size={16} color={palette.onDark} /> : null}
                            </Pressable>
                          ) : (
                            <Text style={[styles.orderNum, isMe && { color: palette.amberDeep }]}>{String(idx + 1).padStart(2, "0")}</Text>
                          )}
                          <View style={{ flex: 1, minWidth: 0 }}>
                            {isNow ? <Text style={styles.nowLabel}>Now</Text> : null}
                            <Text
                              style={[styles.orderTitle, live && (done || skipped) && { textDecorationLine: "line-through" }]}
                              numberOfLines={3}
                            >
                              {item.title}
                            </Text>
                            {live && skipped ? <Text style={styles.skippedTxt}>Skipped</Text> : null}
                            {item.notes ? <Text style={styles.orderNotes} numberOfLines={6}>{item.notes}</Text> : null}
                            {isMe ? (
                              <View style={styles.assignedRow}>
                                <Icon name="checkCircle" size={14} color={palette.amber} />
                                <Text style={styles.assignedTxt}>Assigned to you</Text>
                              </View>
                            ) : assignedName ? (
                              <View style={[styles.assignedRow, { marginTop: 8, flexWrap: "wrap" }]}>
                                <Icon name="members" size={14} color={palette.inkMuted} />
                                <Text style={styles.assignedToOther} numberOfLines={1}>{assignedName}</Text>
                                <Pill label={statusLabel} tone={statusTone} />
                              </View>
                            ) : null}
                          </View>
                        </View>
                        {live && !done ? (
                          <Pressable
                            onPress={() => setItemStatus(item, skipped ? "PLANNED" : "SKIPPED")}
                            style={({ pressed }: { pressed: boolean }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
                            accessibilityRole="button"
                            accessibilityLabel={skipped ? `Restore ${item.title}` : `Skip ${item.title}`}
                          >
                            <Text style={styles.skipBtnTxt}>{skipped ? "Restore" : "Skip"}</Text>
                          </Pressable>
                        ) : item.duration_minutes != null ? (
                          <View style={[styles.durationPill, isMe && { backgroundColor: palette.amber }]}>
                            <Text style={[styles.durationTxt, isMe && { color: palette.onDark }]}>{item.duration_minutes} min</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Service team */}
            {roleSlots.length > 0 ? (
              <View style={{ marginTop: 28 }}>
                <Text style={[styles.sectionLabel, { marginBottom: 14 }]}>Service Team</Text>
                <View style={styles.teamCard}>
                  {roleSlots.map((slot, idx) => {
                    const roleName = roleLookup[slot.role_id] ?? "Role";
                    const assignedName = peerName(peers, slot.assigned_user_id);
                    const isLast = idx === roleSlots.length - 1;
                    const declined = slot.status === "DECLINED";
                    const statusTone = declined ? "danger" : slot.status === "CONFIRMED" ? "success" : "amber";
                    const statusLabel = declined ? "Declined" : slot.status === "CONFIRMED" ? "Confirmed" : "Pending";
                    return (
                      <View key={slot.id}>
                        <View style={styles.teamRow}>
                          {assignedName ? (
                            <Avatar imageUri={slot.assigned_user_id ? peers[slot.assigned_user_id]?.avatar_url : null} name={assignedName} size={42} seed={slot.assigned_user_id ?? roleName} />
                          ) : (
                            <View style={styles.emptyAvatar}><Icon name="add" size={18} color={palette.inkMuted} /></View>
                          )}
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.teamRole} numberOfLines={1}>{roleName}</Text>
                            <Text style={[styles.teamPerson, !assignedName && { color: palette.inkMuted, fontFamily: font.regular }]} numberOfLines={1}>{assignedName ?? "Unassigned"}</Text>
                          </View>
                          {assignedName ? (
                            slot.checked_in_at ? <Pill label="Here" tone="success" /> : <Pill label={statusLabel} tone={statusTone} />
                          ) : null}
                        </View>
                        {!isLast ? <Divider inset={70} /> : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, paddingHorizontal: space.gutter, justifyContent: "center" },
  pickerRow: { gap: space.sm, paddingHorizontal: space.gutter },
  pickerChip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  pickerChipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  pickerTxt: { fontFamily: font.medium, fontSize: 13, color: palette.inkSoft },
  pickerTxtActive: { color: palette.onDark },
  headerTitle: { fontFamily: font.bold, fontSize: 22, color: palette.ink, letterSpacing: -0.4 },
  errorBox: { padding: 16, borderRadius: radius.md, backgroundColor: palette.dangerSoft },
  errorTxt: { fontFamily: font.regular, fontSize: 14, color: palette.dangerInk },

  hero: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 22, marginBottom: 20, ...shadow.md },
  heroTitle: { fontFamily: font.bold, fontSize: 24, color: palette.ink, letterSpacing: -0.3, marginTop: 6 },
  heroMeta: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, marginTop: 4 },
  statWrap: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line, marginVertical: 16, paddingHorizontal: 2 },

  serving: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 18, marginBottom: 20, ...shadow.sm },
  servingHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  servingEyebrow: { fontFamily: font.bold, fontSize: 10, color: palette.amberDeep, letterSpacing: 1.6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.amberSofter, borderRadius: radius.chip, paddingHorizontal: 12, paddingVertical: 7 },
  chipTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.amberDeep },
  chipRole: { fontFamily: font.bold, fontSize: 9, color: palette.amberDeep, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 },
  readyBy: { fontFamily: font.regular, fontSize: 12, color: palette.inkSoft, marginTop: 12 },

  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionLabel: { fontFamily: font.bold, fontSize: 19, color: palette.ink, letterSpacing: -0.3 },

  orderCard: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: 18, marginBottom: 10, ...shadow.sm },
  orderCardMe: { borderWidth: 1.5, borderColor: palette.amberSoft },
  orderNum: { fontFamily: font.bold, fontSize: 24, color: "#D8D2E2", marginTop: 2, minWidth: 30 },
  orderTitle: { fontFamily: font.bold, fontSize: 17, color: palette.ink },
  orderNotes: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, marginTop: 4, lineHeight: 19 },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  assignedTxt: { fontFamily: font.bold, fontSize: 12, color: palette.amberDeep },
  assignedToOther: { fontFamily: font.semibold, fontSize: 12, color: palette.inkSoft },
  durationPill: { backgroundColor: palette.sunken, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.chip, alignSelf: "flex-start" },
  orderCardNow: { borderWidth: 1.5, borderColor: palette.amber },
  nowLabel: { fontFamily: font.bold, fontSize: 11, color: palette.amberInk, marginBottom: 2 },
  skippedTxt: { fontFamily: font.medium, fontSize: 12, color: palette.inkMuted, marginTop: 4 },
  doneCircle: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: palette.line,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  doneCircleOn: { backgroundColor: palette.amberInk, borderColor: palette.amberInk },
  skipBtn: { paddingHorizontal: 12, minHeight: 32, borderRadius: radius.chip, backgroundColor: palette.sunken, justifyContent: "center" },
  skipBtnTxt: { fontFamily: font.semibold, fontSize: 12, color: palette.inkSoft },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: palette.sunken, overflow: "hidden", marginTop: -4, marginBottom: 14 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: palette.amber },
  checkedIn: {
    minHeight: 46, borderRadius: radius.lg, backgroundColor: palette.amberSofter,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12,
  },
  checkInLater: {
    minHeight: 46, borderRadius: radius.lg, backgroundColor: palette.sunken,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12,
  },
  checkInLaterTxt: { fontFamily: font.semibold, fontSize: 14, color: palette.inkSoft },
  checkedInTxt: { fontFamily: font.semibold, fontSize: 14, color: palette.amberInk },
  inlineError: { fontFamily: font.medium, fontSize: 13, color: palette.dangerInk, marginTop: 10 },
  printLink: { alignSelf: "center", marginTop: 12, minHeight: 32, justifyContent: "center", paddingHorizontal: 8 },
  printLinkTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.amberInk },
  durationTxt: { fontFamily: font.bold, fontSize: 11, color: palette.inkSoft },

  teamCard: { backgroundColor: palette.surface, borderRadius: radius.xl, overflow: "hidden", ...shadow.sm },
  teamRow: { padding: 14, flexDirection: "row", alignItems: "center", gap: 14 },
  emptyAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.sunken, alignItems: "center", justifyContent: "center" },
  teamRole: { fontFamily: font.bold, fontSize: 10, color: palette.inkMuted, letterSpacing: 1, textTransform: "uppercase" },
  teamPerson: { fontFamily: font.bold, fontSize: 15, color: palette.ink, marginTop: 2 },
});
