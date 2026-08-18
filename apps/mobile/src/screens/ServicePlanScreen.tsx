import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Avatar, Pill, EmptyState, Loader, Button, Divider, StatGrid, Eyebrow,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type AssignmentChip = { key: string; label: string; role: "Primary" | "Backup" | "Part" };
/** `start_time` lives directly on the plan (migration 0027) — service_time_id is legacy and often null. */
type PlanRow = { id: string; title: string; service_date: string; start_time: string | null };
/** `status` = execution state (PLANNED/DONE/SKIPPED); `assignment_status` = confirm/decline state — the two are unrelated. */
type PlanItemRow = { id: string; title: string; duration_minutes: number | null; notes: string; status: string; assigned_user_id: string | null; backup_user_id: string | null; assignment_status: string | null };
type RoleSlotRow = { id: string; role_id: string; assigned_user_id: string | null; backup_user_id: string | null; status: string };
type VolunteerRoleRow = { id: string; name: string };
type ProfilePeer = { id: string; full_name: string | null; email: string | null };

function peerName(map: Record<string, ProfilePeer>, userId: string | null): string | null {
  if (!userId) return null;
  const p = map[userId];
  return p ? (p.full_name?.trim() || p.email || null) : null;
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

  const readyBy = useMemo(() => {
    if (assignmentChips.length === 0 || !plan?.start_time) return null;
    return formatStartTime(subtractMinutesFromTimeString(plan.start_time, 15));
  }, [assignmentChips.length, plan?.start_time]);

  const totalMinutes = useMemo(() => items.reduce((sum, i) => sum + (typeof i.duration_minutes === "number" ? i.duration_minutes : 0), 0), [items]);

  const load = useCallback(async () => {
    if (!supabase || !profile?.church_id) { setError("Unable to load profile."); setLoading(false); setRefreshing(false); return; }
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const { data: planData, error: planError } = await supabase
      .from("service_plans")
      .select("id, title, service_date, start_time")
      .eq("church_id", profile.church_id)
      .gte("service_date", today)
      .order("service_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (planError || !planData) { setPlan(null); setItems([]); setRoleSlots([]); setLoading(false); setRefreshing(false); return; }
    setPlan(planData as PlanRow);
    const [itemRes, slotRes, roleRes, peersRes] = await Promise.all([
      supabase.from("service_plan_items").select("id, title, duration_minutes, notes, status, assigned_user_id, backup_user_id, assignment_status").eq("plan_id", planData.id).order("position"),
      supabase.from("service_plan_role_slots").select("id, role_id, assigned_user_id, backup_user_id, status").eq("plan_id", planData.id).order("sort_order"),
      supabase.from("volunteer_roles").select("id, name").eq("church_id", profile.church_id),
      supabase.from("profiles").select("id, full_name, email").eq("church_id", profile.church_id).eq("disabled", false),
    ]);
    setItems(itemRes.error ? [] : (itemRes.data ?? []) as PlanItemRow[]);
    setRoleSlots(slotRes.error ? [] : (slotRes.data ?? []) as RoleSlotRow[]);
    setRoles(roleRes.error ? [] : (roleRes.data ?? []) as VolunteerRoleRow[]);
    const peerMap: Record<string, ProfilePeer> = {};
    if (!peersRes.error && peersRes.data) for (const row of peersRes.data as ProfilePeer[]) peerMap[row.id] = row;
    setPeers(peerMap);
    setLoading(false); setRefreshing(false);
  }, [profile?.church_id]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

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
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 130 }}
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
            {/* Hero card */}
            <View style={styles.hero}>
              <Eyebrow>Current bulletin</Eyebrow>
              <Text style={styles.heroTitle}>{planTitle}</Text>
              <Text style={styles.heroMeta}>{dateLine}</Text>
              <View style={styles.statWrap}><StatGrid items={heroStats} columns={3} /></View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Print PDF" variant="secondary" style={{ minHeight: 46 }}
                    onPress={() => Alert.alert("Print bulletin", "Open Gather in a browser, go to Admin → Service plans, and use Print from there.")} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Check In" style={{ minHeight: 46 }}
                    onPress={() => Alert.alert("Check in", "Check-in will be available in a future update.")} />
                </View>
              </View>
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
                  {totalMinutes > 0 ? <Pill label={`${totalMinutes} min`} tone="amber" /> : null}
                </View>
                {items.map((item, idx) => {
                  const declined = item.assignment_status === "DECLINED";
                  const isMe = item.assigned_user_id === myUserId && !declined;
                  const assignedName = peerName(peers, item.assigned_user_id);
                  const statusTone = declined ? "danger" : item.assignment_status === "CONFIRMED" ? "success" : "amber";
                  const statusLabel = declined ? "Declined" : item.assignment_status === "CONFIRMED" ? "Confirmed" : "Pending";
                  return (
                    <View key={item.id} style={[styles.orderCard, isMe && styles.orderCardMe]}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <View style={{ flexDirection: "row", gap: 14, flex: 1, minWidth: 0 }}>
                          <Text style={[styles.orderNum, isMe && { color: palette.amberDeep }]}>{String(idx + 1).padStart(2, "0")}</Text>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.orderTitle} numberOfLines={3}>{item.title}</Text>
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
                        {item.duration_minutes != null ? (
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
                            <Avatar name={assignedName} size={42} seed={slot.assigned_user_id ?? roleName} />
                          ) : (
                            <View style={styles.emptyAvatar}><Icon name="add" size={18} color={palette.inkMuted} /></View>
                          )}
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.teamRole} numberOfLines={1}>{roleName}</Text>
                            <Text style={[styles.teamPerson, !assignedName && { color: palette.inkMuted, fontFamily: font.regular }]} numberOfLines={1}>{assignedName ?? "Unassigned"}</Text>
                          </View>
                          {assignedName ? <Pill label={statusLabel} tone={statusTone} /> : null}
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
  durationTxt: { fontFamily: font.bold, fontSize: 11, color: palette.inkSoft },

  teamCard: { backgroundColor: palette.surface, borderRadius: radius.xl, overflow: "hidden", ...shadow.sm },
  teamRow: { padding: 14, flexDirection: "row", alignItems: "center", gap: 14 },
  emptyAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.sunken, alignItems: "center", justifyContent: "center" },
  teamRole: { fontFamily: font.bold, fontSize: 10, color: palette.inkMuted, letterSpacing: 1, textTransform: "uppercase" },
  teamPerson: { fontFamily: font.bold, fontSize: 15, color: palette.ink, marginTop: 2 },
});
