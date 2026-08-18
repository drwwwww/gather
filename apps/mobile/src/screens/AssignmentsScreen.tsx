import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Pill, EmptyState, Loader, IconChip, LinearGradient,
  palette, font, gradient, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type Source = "bulletin_part" | "bulletin_role";
type AssignmentRow = {
  key: string; source: Source; bulletinSlotId?: string; bulletinItemId?: string;
  scheduled_date: string; status: string;
  titleLine: string; service_label: string; isBackup?: boolean;
};

function localTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${weekdayNames[d.getDay()]}, ${month} ${d.getDate()}`;
}
function formatServiceTime(dateStr: string, startTime: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = weekdayShort[d.getDay()] ?? "";
  const [h, m] = (startTime || "09:00").split(":").map(Number);
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${day} ${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
function subtitleFor(a: AssignmentRow): string {
  if (a.source === "bulletin_part") return a.isBackup ? "Run of show · backup" : "Run of show";
  return a.isBackup ? "Role · backup" : "Role";
}

export default function AssignmentsScreen() {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ key: string; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) {
      setAssignments([]); setLoading(false); setRefreshing(false);
      return;
    }
    const today = localTodayString();
    const { data: plansData, error: plansErr } = await supabase
      .from("service_plans")
      .select("id, service_date, start_time")
      .eq("church_id", profile.church_id)
      .gte("service_date", today)
      .order("service_date", { ascending: true })
      .limit(40);
    if (plansErr) console.error("[Serve] service_plans error:", plansErr.message);

    const plans = (plansData ?? []) as { id: string; service_date: string; start_time: string | null }[];
    const planIds = plans.map((p) => p.id);
    const planById = new Map(plans.map((p) => [p.id, p]));

    type ItemRow = { id: string; title: string; plan_id: string; assignment_status: string | null; assigned_user_id: string | null; backup_user_id: string | null };
    type SlotRow = { id: string; role_id: string; plan_id: string; status: string; assigned_user_id: string | null; backup_user_id: string | null };

    let planItems: ItemRow[] = [];
    let planSlots: SlotRow[] = [];

    if (planIds.length > 0) {
      const itemsRes = await supabase
        .from("service_plan_items")
        .select("id, title, plan_id, assignment_status, assigned_user_id, backup_user_id")
        .in("plan_id", planIds)
        .or(`assigned_user_id.eq.${user.id},backup_user_id.eq.${user.id}`);
      if (itemsRes.error) {
        const { data: fb, error: fbErr } = await supabase
          .from("service_plan_items")
          .select("id, title, plan_id, assigned_user_id, backup_user_id")
          .in("plan_id", planIds)
          .or(`assigned_user_id.eq.${user.id},backup_user_id.eq.${user.id}`);
        if (fbErr) console.error("[Serve] service_plan_items error:", fbErr.message);
        else planItems = (fb ?? []).map((r: any) => ({ ...r, assignment_status: null }));
      } else {
        planItems = (itemsRes.data ?? []) as ItemRow[];
      }
      const slotsRes = await supabase
        .from("service_plan_role_slots")
        .select("id, role_id, plan_id, status, assigned_user_id, backup_user_id")
        .in("plan_id", planIds)
        .or(`assigned_user_id.eq.${user.id},backup_user_id.eq.${user.id}`);
      if (slotsRes.error) console.error("[Serve] role_slots error:", slotsRes.error.message);
      else planSlots = (slotsRes.data ?? []) as SlotRow[];
    }

    const allRoleIds = [...new Set(planSlots.map((s) => s.role_id))];
    const rolesRes = allRoleIds.length
      ? await supabase.from("volunteer_roles").select("id, name").in("id", allRoleIds)
      : { data: [] as { id: string; name: string }[], error: null };
    const rolesMap = new Map((rolesRes.data ?? []).map((r) => [r.id, r.name]));

    const merged: AssignmentRow[] = [];
    for (const item of planItems) {
      const plan = planById.get(item.plan_id);
      if (!plan) continue;
      const isBackup = item.backup_user_id === user.id && item.assigned_user_id !== user.id;
      merged.push({
        key: `i-${item.id}${isBackup ? "-b" : ""}`, source: "bulletin_part", bulletinItemId: item.id,
        scheduled_date: plan.service_date,
        status: item.assignment_status ?? "ASSIGNED", titleLine: item.title?.trim() || "Service part",
        service_label: formatServiceTime(plan.service_date, plan.start_time ?? "09:00"), isBackup,
      });
    }
    for (const slot of planSlots) {
      const plan = planById.get(slot.plan_id);
      if (!plan) continue;
      const isBackup = slot.backup_user_id === user.id && slot.assigned_user_id !== user.id;
      merged.push({
        key: `r-${slot.id}${isBackup ? "-b" : ""}`, source: "bulletin_role", bulletinSlotId: slot.id,
        scheduled_date: plan.service_date, status: slot.status,
        titleLine: rolesMap.get(slot.role_id) ?? "Role",
        service_label: formatServiceTime(plan.service_date, plan.start_time ?? "09:00"), isBackup,
      });
    }
    merged.sort((a, b) => {
      const d = a.scheduled_date.localeCompare(b.scheduled_date);
      if (d !== 0) return d;
      const order: Record<Source, number> = { bulletin_role: 0, bulletin_part: 1 };
      return order[a.source] - order[b.source];
    });
    const filtered = merged.filter((row) => !(row.status === "DECLINED" && row.scheduled_date < today));
    setAssignments(filtered.slice(0, 60));
    setLoading(false); setRefreshing(false);
  }, [user?.id, profile?.church_id]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  const respondToAssignment = async (a: AssignmentRow, response: "CONFIRMED" | "DECLINED") => {
    if (!supabase || !user?.id || savingKey) return;
    setSavingKey(a.key); setRowError(null);
    const sourceMap: Record<Source, string> = { bulletin_role: "plan_role_slot", bulletin_part: "plan_item" };
    const idMap: Record<Source, string | undefined> = { bulletin_role: a.bulletinSlotId, bulletin_part: a.bulletinItemId };
    const p_id = idMap[a.source];
    if (!p_id) { setRowError({ key: a.key, message: "Missing assignment ID." }); setSavingKey(null); return; }

    const { data: rpcData, error: rpcError } = await supabase.rpc("respond_assignment", { p_source: sourceMap[a.source], p_id, p_response: response });
    if (rpcError) {
      console.warn("[Serve] respond_assignment RPC unavailable, falling back:", rpcError.message);
      let errMsg: string | null = null;
      if (a.source === "bulletin_role" && a.bulletinSlotId) {
        const { error, count } = await supabase.from("service_plan_role_slots").update({ status: response }, { count: "exact" }).eq("id", a.bulletinSlotId);
        if (error) errMsg = error.message;
        else if (count === 0) errMsg = "Permission denied. Ask an admin to confirm your role is set to Service.";
      } else if (a.source === "bulletin_part" && a.bulletinItemId) {
        const { error, count } = await supabase.from("service_plan_items").update({ assignment_status: response }, { count: "exact" }).eq("id", a.bulletinItemId);
        if (error) errMsg = error.message.includes("assignment_status") ? "Database migration 0018 hasn't been applied yet." : error.message;
        else if (count === 0) errMsg = "Permission denied. Ask an admin to confirm your role is set to Service.";
      }
      if (errMsg) { console.error("[Serve] respond error:", errMsg); setRowError({ key: a.key, message: errMsg }); setSavingKey(null); return; }
      setAssignments((prev) => prev.map((row) => (row.key === a.key ? { ...row, status: response } : row)));
      setSavingKey(null);
      return;
    }
    if (rpcData?.error) {
      console.error("[Serve] respond_assignment error:", rpcData.error);
      const errStr = String(rpcData.error);
      if (errStr === "not found") { setSavingKey(null); setRowError(null); setLoading(true); void load(); return; }
      setRowError({ key: a.key, message: errStr === "permission denied" ? "You are no longer assigned to this role." : errStr });
      setSavingKey(null);
      return;
    }
    const promoted = rpcData?.promoted === true;
    if (promoted && response === "DECLINED") setAssignments((prev) => prev.filter((row) => row.key !== a.key));
    else setAssignments((prev) => prev.map((row) => (row.key === a.key ? { ...row, status: response } : row)));
    setSavingKey(null);
  };

  const grouped = assignments.reduce<{ date: string; rows: AssignmentRow[] }[]>((acc, row) => {
    const last = acc[acc.length - 1];
    if (last && last.date === row.scheduled_date) last.rows.push(row);
    else acc.push({ date: row.scheduled_date, rows: [row] });
    return acc;
  }, []);
  const pendingCount = assignments.filter((a) => a.status === "ASSIGNED" || a.status === "OPEN").length;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Schedule</Text>
        {pendingCount > 0 ? <Pill label={`${pendingCount} pending`} tone="amber" /> : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        {loading ? (
          <Loader />
        ) : assignments.length === 0 ? (
          <EmptyState icon="schedule" title="No upcoming assignments" body="Your volunteer schedule and bulletin roles will show up here." />
        ) : (
          <>
            {pendingCount > 0 ? (
              <View style={styles.statusCard}>
                <IconChip name="alertImportant" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusHl}>{pendingCount} need{pendingCount === 1 ? "s" : ""} a response</Text>
                  <Text style={styles.statusBd}>Confirm or decline so your team knows.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.allDone}>
                <Icon name="checkCircle" size={22} color={palette.success} />
                <Text style={styles.allDoneTxt}>All assignments confirmed</Text>
              </View>
            )}

            <View style={{ gap: 28 }}>
              {grouped.map(({ date, rows }) => (
                <View key={date}>
                  <Text style={styles.groupLabel}>{formatDateLabel(date)}</Text>
                  <View style={{ gap: 12 }}>
                    {rows.map((a) => {
                      const needsResponse = a.status !== "CONFIRMED" && a.status !== "DECLINED";
                      const saving = savingKey === a.key;
                      return (
                        <View key={a.key} style={styles.card}>
                          <View style={styles.cardTop}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text style={styles.cardTitle}>{a.titleLine}</Text>
                              <Text style={styles.cardSub}>{subtitleFor(a)}</Text>
                            </View>
                            {a.status === "CONFIRMED" ? <Pill label="Confirmed" tone="success" />
                              : a.status === "DECLINED" ? <Pill label="Declined" tone="danger" />
                              : <Pill label="Pending" tone="amber" />}
                          </View>
                          <View style={styles.timeRow}>
                            <Icon name="clock" size={14} color={palette.inkMuted} />
                            <Text style={styles.timeTxt}>{a.service_label}</Text>
                          </View>
                          {rowError?.key === a.key ? <Text style={styles.rowError}>{rowError.message}</Text> : null}
                          {needsResponse ? (
                            <>
                              <View style={styles.divider} />
                              <View style={styles.actions}>
                                <Pressable onPress={() => void respondToAssignment(a, "CONFIRMED")} disabled={!!savingKey} style={({ pressed }) => [styles.confirmBtn, { opacity: savingKey ? 0.55 : pressed ? 0.9 : 1 }]}>
                                  <LinearGradient colors={gradient.amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirmFill}>
                                    <Text style={styles.confirmTxt}>{saving ? "Saving…" : "Confirm"}</Text>
                                  </LinearGradient>
                                </Pressable>
                                <Pressable onPress={() => void respondToAssignment(a, "DECLINED")} disabled={!!savingKey} style={({ pressed }) => [styles.declineBtn, { opacity: savingKey ? 0.55 : pressed ? 0.85 : 1 }]}>
                                  <Text style={styles.declineTxt}>{saving ? "Saving…" : "Decline"}</Text>
                                </Pressable>
                              </View>
                            </>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, paddingHorizontal: space.gutter, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontFamily: font.bold, fontSize: 22, color: palette.ink, letterSpacing: -0.4 },

  statusCard: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24, ...shadow.md },
  statusHl: { fontFamily: font.bold, fontSize: 17, color: palette.ink, letterSpacing: -0.2 },
  statusBd: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  allDone: { backgroundColor: palette.successSoft, borderRadius: radius.xl, padding: 18, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  allDoneTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.successInk },

  groupLabel: { fontFamily: font.bold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.6, color: palette.inkMuted, marginBottom: 14 },

  card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 20, ...shadow.sm },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardTitle: { fontFamily: font.bold, fontSize: 17, color: palette.ink, lineHeight: 22 },
  cardSub: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted, marginTop: 3 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  timeTxt: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft },
  rowError: { fontFamily: font.regular, fontSize: 12, color: palette.danger, marginTop: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginTop: 16, marginBottom: 14 },
  actions: { flexDirection: "row", gap: 10 },
  confirmBtn: { flex: 1, borderRadius: radius.md, overflow: "hidden" },
  confirmFill: { paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  confirmTxt: { fontFamily: font.bold, fontSize: 14, color: palette.onDark },
  declineBtn: { flex: 1, backgroundColor: palette.sunken, borderRadius: radius.md, paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  declineTxt: { fontFamily: font.bold, fontSize: 14, color: palette.ink },
});
