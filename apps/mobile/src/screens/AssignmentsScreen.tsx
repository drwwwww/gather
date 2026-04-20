import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppShell } from "../components/app/AppShell";
import { StitchTabAppBar } from "../components/app/StitchTabAppBar";
import { EmptyState } from "../components/app/EmptyState";
import { GradientButton } from "../components/ui/GradientButton";
import { Icon } from "../components/ui/Icon";
import { theme } from "../theme/theme";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type Source = "schedule" | "bulletin_part" | "bulletin_role";

type AssignmentRow = {
  key: string;
  source: Source;
  scheduleAssignmentId?: string;
  bulletinSlotId?: string;
  bulletinItemId?: string;
  scheduled_date: string;
  service_time_id: string;
  status: string;
  titleLine: string;
  subtitleLine: string;
  service_label: string;
  isBackup?: boolean;
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

function stitchRoleSubtitle(a: AssignmentRow): string {
  if (a.source === "schedule") return a.isBackup ? "Volunteer schedule · backup" : "Volunteer schedule";
  if (a.source === "bulletin_part") return "Bulletin";
  return "Bulletin";
}

function stitchStatusLabel(status: string): string {
  if (status === "OPEN" || status === "ASSIGNED") return "ASSIGNED";
  if (status === "CONFIRMED") return "CONFIRMED";
  if (status === "DECLINED") return "DECLINED";
  return status;
}

export default function AssignmentsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ key: string; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) {
      setAssignments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const today = localTodayString();

    type ScheduleRow = {
      id: string; role_id: string; service_time_id: string;
      status: string; scheduled_date: string;
      assigned_user_id: string | null; backup_user_id: string | null;
    };
    let scheduleRows: ScheduleRow[] = [];

    const { data: aData, error: aErr } = await supabase
      .from("volunteer_assignments")
      .select("id, role_id, service_time_id, status, scheduled_date, assigned_user_id, backup_user_id")
      .eq("church_id", profile.church_id)
      .or(`assigned_user_id.eq.${user.id},backup_user_id.eq.${user.id}`)
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true })
      .limit(40);

    if (aErr) {
      console.warn("[Serve] backup_user_id unavailable, retrying:", aErr.message);
      const { data: fb, error: fbErr } = await supabase
        .from("volunteer_assignments")
        .select("id, role_id, service_time_id, status, scheduled_date, assigned_user_id")
        .eq("church_id", profile.church_id)
        .eq("assigned_user_id", user.id)
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(40);
      if (fbErr) console.error("[Serve] volunteer_assignments error:", fbErr.message);
      else scheduleRows = (fb ?? []).map((r: any) => ({ ...r, backup_user_id: null }));
    } else {
      scheduleRows = (aData ?? []) as ScheduleRow[];
    }

    const { data: plansData, error: plansErr } = await supabase
      .from("service_plans")
      .select("id, service_date, service_time_id")
      .eq("church_id", profile.church_id)
      .gte("service_date", today)
      .order("service_date", { ascending: true })
      .limit(40);
    if (plansErr) console.error("[Serve] service_plans error:", plansErr.message);

    const plans = (plansData ?? []) as { id: string; service_date: string; service_time_id: string }[];
    const planIds = plans.map((p) => p.id);
    const planById = new Map(plans.map((p) => [p.id, p]));

    type ItemRow = { id: string; title: string; plan_id: string; assignment_status: string | null };
    type SlotRow = {
      id: string; role_id: string; plan_id: string; status: string;
      assigned_user_id: string | null; backup_user_id: string | null;
    };

    let planItems: ItemRow[] = [];
    let planSlots: SlotRow[] = [];

    if (planIds.length > 0) {
      const itemsRes = await supabase
        .from("service_plan_items")
        .select("id, title, plan_id, assignment_status, assigned_user_id")
        .in("plan_id", planIds)
        .eq("assigned_user_id", user.id);

      if (itemsRes.error) {
        const { data: fb, error: fbErr } = await supabase
          .from("service_plan_items")
          .select("id, title, plan_id, assigned_user_id")
          .in("plan_id", planIds)
          .eq("assigned_user_id", user.id);
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

    const allRoleIds = [...new Set([...scheduleRows.map((r) => r.role_id), ...planSlots.map((s) => s.role_id)])];
    const allServiceTimeIds = [...new Set([...scheduleRows.map((r) => r.service_time_id), ...plans.map((p) => p.service_time_id)])];

    const [rolesRes, servicesRes] = await Promise.all([
      allRoleIds.length
        ? supabase.from("volunteer_roles").select("id, name").in("id", allRoleIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
      allServiceTimeIds.length
        ? supabase.from("service_times").select("id, start_time").in("id", allServiceTimeIds)
        : Promise.resolve({ data: [] as { id: string; start_time: string }[], error: null }),
    ]);

    const rolesMap = new Map((rolesRes.data ?? []).map((r) => [r.id, r.name]));
    const timesMap = new Map(
      (servicesRes.data ?? []).map((s) => [s.id, typeof s.start_time === "string" ? s.start_time.slice(0, 5) : "09:00"])
    );

    const merged: AssignmentRow[] = [];

    for (const row of scheduleRows) {
      const start = timesMap.get(row.service_time_id) ?? "09:00";
      const isBackup = row.backup_user_id === user.id && row.assigned_user_id !== user.id;
      merged.push({
        key: `s-${row.id}`,
        source: "schedule",
        scheduleAssignmentId: row.id,
        scheduled_date: row.scheduled_date,
        service_time_id: row.service_time_id,
        status: row.status,
        titleLine: rolesMap.get(row.role_id) ?? "Role",
        subtitleLine: isBackup ? "Volunteer schedule · backup" : "Volunteer schedule",
        service_label: formatServiceTime(row.scheduled_date, start),
        isBackup,
      });
    }

    for (const item of planItems) {
      const plan = planById.get(item.plan_id);
      if (!plan) continue;
      const start = timesMap.get(plan.service_time_id) ?? "09:00";
      merged.push({
        key: `i-${item.id}`,
        source: "bulletin_part",
        bulletinItemId: item.id,
        scheduled_date: plan.service_date,
        service_time_id: plan.service_time_id,
        status: item.assignment_status ?? "ASSIGNED",
        titleLine: item.title?.trim() || "Service part",
        subtitleLine: "Bulletin · run of show",
        service_label: formatServiceTime(plan.service_date, start),
      });
    }

    for (const slot of planSlots) {
      const plan = planById.get(slot.plan_id);
      if (!plan) continue;
      const isBackup = slot.backup_user_id === user.id && slot.assigned_user_id !== user.id;
      const start = timesMap.get(plan.service_time_id) ?? "09:00";
      merged.push({
        key: `r-${slot.id}${isBackup ? "-b" : ""}`,
        source: "bulletin_role",
        bulletinSlotId: slot.id,
        scheduled_date: plan.service_date,
        service_time_id: plan.service_time_id,
        status: slot.status,
        titleLine: rolesMap.get(slot.role_id) ?? "Role",
        subtitleLine: isBackup ? "Bulletin · role · backup" : "Bulletin · role",
        service_label: formatServiceTime(plan.service_date, start),
        isBackup,
      });
    }

    merged.sort((a, b) => {
      const d = a.scheduled_date.localeCompare(b.scheduled_date);
      if (d !== 0) return d;
      const order: Record<Source, number> = { schedule: 0, bulletin_role: 1, bulletin_part: 2 };
      return order[a.source] - order[b.source];
    });

    // Drop DECLINED assignments for past/today-completed dates only when the user
    // is no longer the primary (backup was promoted). When there's no backup and
    // they declined, show it until the service date passes so they're aware.
    // Already handled by date filter — just remove DECLINED that are already past.
    const filtered = merged.filter((row) => {
      if (row.status === "DECLINED" && row.scheduled_date < today) return false;
      return true;
    });

    setAssignments(filtered.slice(0, 60));
    setLoading(false);
    setRefreshing(false);
  }, [user?.id, profile?.church_id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const respondToAssignment = async (a: AssignmentRow, response: "CONFIRMED" | "DECLINED") => {
    if (!supabase || !user?.id || savingKey) return;
    setSavingKey(a.key);
    setRowError(null);

    const sourceMap: Record<Source, string> = {
      schedule: "volunteer_assignment",
      bulletin_role: "plan_role_slot",
      bulletin_part: "plan_item",
    };
    const idMap: Record<Source, string | undefined> = {
      schedule: a.scheduleAssignmentId,
      bulletin_role: a.bulletinSlotId,
      bulletin_part: a.bulletinItemId,
    };
    const p_id = idMap[a.source];
    if (!p_id) {
      setRowError({ key: a.key, message: "Missing assignment ID." });
      setSavingKey(null);
      return;
    }

    // Use the respond_assignment RPC (migration 0020) — handles backup promotion atomically
    const { data: rpcData, error: rpcError } = await supabase.rpc("respond_assignment", {
      p_source: sourceMap[a.source],
      p_id,
      p_response: response,
    });

    if (rpcError) {
      console.warn("[Serve] respond_assignment RPC unavailable, falling back:", rpcError.message);
      let errMsg: string | null = null;

      if (a.source === "schedule" && a.scheduleAssignmentId) {
        const { error, count } = await supabase
          .from("volunteer_assignments")
          .update({ status: response }, { count: "exact" })
          .eq("id", a.scheduleAssignmentId);
        if (error) errMsg = error.message;
        else if (count === 0) errMsg = "Permission denied. Ask an admin to confirm your role is set to Service.";
      } else if (a.source === "bulletin_role" && a.bulletinSlotId) {
        const { error, count } = await supabase
          .from("service_plan_role_slots")
          .update({ status: response }, { count: "exact" })
          .eq("id", a.bulletinSlotId);
        if (error) errMsg = error.message;
        else if (count === 0) errMsg = "Permission denied. Ask an admin to apply database migration 0017.";
      } else if (a.source === "bulletin_part" && a.bulletinItemId) {
        const { error, count } = await supabase
          .from("service_plan_items")
          .update({ assignment_status: response }, { count: "exact" })
          .eq("id", a.bulletinItemId);
        if (error) {
          errMsg = error.message.includes("assignment_status")
            ? "Database migration 0018 hasn't been applied yet."
            : error.message;
        } else if (count === 0) {
          errMsg = "Permission denied. Ask an admin to apply database migration 0017.";
        }
      }

      if (errMsg) {
        console.error("[Serve] respond error:", errMsg);
        setRowError({ key: a.key, message: errMsg });
        setSavingKey(null);
        return;
      }

      setAssignments((prev) =>
        prev.map((row) => (row.key === a.key ? { ...row, status: response } : row))
      );
      setSavingKey(null);
      return;
    }

    if (rpcData?.error) {
      console.error("[Serve] respond_assignment error:", rpcData.error);
      setRowError({ key: a.key, message: String(rpcData.error) });
      setSavingKey(null);
      return;
    }

    const promoted = rpcData?.promoted === true;

    if (promoted && response === "DECLINED") {
      setAssignments((prev) => prev.filter((row) => row.key !== a.key));
    } else {
      setAssignments((prev) =>
        prev.map((row) => (row.key === a.key ? { ...row, status: response } : row))
      );
    }
    setSavingKey(null);
  };

  const grouped = assignments.reduce<{ date: string; rows: AssignmentRow[] }[]>((acc, row) => {
    const last = acc[acc.length - 1];
    if (last && last.date === row.scheduled_date) last.rows.push(row);
    else acc.push({ date: row.scheduled_date, rows: [row] });
    return acc;
  }, []);

  const pendingCount = assignments.filter((a) => a.status === "ASSIGNED" || a.status === "OPEN").length;
  const pendingLine =
    pendingCount > 0
      ? pendingCount === 1
        ? "1 ASSIGNMENT NEEDS RESPONSE"
        : `${pendingCount} ASSIGNMENTS NEED RESPONSE`
      : null;

  const stitchListShadow = {
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 4,
  };

  return (
    <AppShell>
      <StitchTabAppBar navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
      >
        <View style={{ marginTop: 8, marginBottom: 40 }}>
          <Text
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: 56,
              lineHeight: 62,
              fontWeight: theme.typography.fontWeight.bold as any,
              color: theme.colors.primaryText,
              letterSpacing: -0.5,
              marginBottom: 16,
            }}
          >
            Serve
          </Text>
          {pendingLine ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: theme.colors.primarySoft,
                borderRadius: 999,
              }}
            >
              <Icon name="alertImportant" size={16} color={theme.colors.primary} />
              <Text
                style={{
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 12,
                  fontWeight: theme.typography.fontWeight.bold as any,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: theme.colors.primary,
                }}
              >
                {pendingLine}
              </Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : assignments.length === 0 ? (
          <EmptyState title="No upcoming assignments" description="You'll see your volunteer schedule and bulletin roles here." />
        ) : (
          <View style={{ gap: 40 }}>
            {grouped.map(({ date, rows }) => (
              <View key={date}>
                <Text
                  style={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: 12,
                    fontWeight: theme.typography.fontWeight.bold as any,
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    color: theme.colors.textSecondary,
                    marginBottom: 24,
                    paddingHorizontal: 8,
                  }}
                >
                  {formatDateLabel(date)}
                </Text>

                <View style={{ gap: 16 }}>
                  {rows.map((a) => {
                    const needsResponse = a.status !== "CONFIRMED" && a.status !== "DECLINED";
                    const label = stitchStatusLabel(a.status);
                    const saving = savingKey === a.key;

                    const cardBg = needsResponse ? theme.colors.card : "rgba(255,255,255,0.6)";

                    return (
                      <View
                        key={a.key}
                        style={{
                          backgroundColor: cardBg,
                          borderRadius: theme.radii.lg,
                          padding: 24,
                          borderWidth: needsResponse ? 0 : 1,
                          borderColor: theme.colors.surface,
                          ...(needsResponse ? stitchListShadow : { elevation: 1 }),
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Text
                              style={{
                                fontFamily: theme.typography.fontFamily,
                                fontSize: 20,
                                fontWeight: theme.typography.fontWeight.semibold as any,
                                color: theme.colors.primaryText,
                              }}
                            >
                              {a.titleLine}
                            </Text>
                            <Text
                              style={{
                                fontFamily: theme.typography.fontFamily,
                                fontSize: theme.typography.fontSize.sm,
                                color: theme.colors.textSecondary,
                                marginTop: 4,
                              }}
                            >
                              {stitchRoleSubtitle(a)}
                            </Text>
                          </View>
                          {a.status === "CONFIRMED" ? (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: theme.colors.surface,
                              }}
                            >
                              <Icon name="checkCircle" size={14} color={theme.colors.textSecondary} />
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: theme.typography.fontWeight.bold as any,
                                  letterSpacing: 1,
                                  textTransform: "uppercase",
                                  color: theme.colors.textSecondary,
                                }}
                              >
                                {label}
                              </Text>
                            </View>
                          ) : a.status === "DECLINED" ? (
                            <View
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: theme.colors.dangerSoft ?? "#FEE2E2",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: theme.typography.fontWeight.bold as any,
                                  letterSpacing: 1,
                                  textTransform: "uppercase",
                                  color: theme.colors.danger,
                                }}
                              >
                                {label}
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: theme.colors.primarySoft,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: theme.typography.fontWeight.bold as any,
                                  letterSpacing: 1,
                                  textTransform: "uppercase",
                                  color: theme.colors.primary,
                                }}
                              >
                                {label}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: needsResponse ? 24 : 0 }}>
                          <Icon name="schedule" size={18} color={theme.colors.textSecondary} />
                          <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                            {a.service_label}
                          </Text>
                        </View>

                        {rowError?.key === a.key ? (
                          <Text style={{ color: theme.colors.danger, fontSize: theme.typography.fontSize.sm, marginBottom: 12 }}>
                            {rowError.message}
                          </Text>
                        ) : null}

                        {needsResponse ? (
                          <View style={{ flexDirection: "row", gap: 12 }}>
                            <GradientButton
                              compact
                              style={{ flex: 1 }}
                              disabled={!!savingKey}
                              onPress={() => void respondToAssignment(a, "CONFIRMED")}
                            >
                              {saving ? "Saving…" : "Confirm"}
                            </GradientButton>
                            <Pressable
                              onPress={() => void respondToAssignment(a, "DECLINED")}
                              disabled={!!savingKey}
                              style={({ pressed }) => ({
                                flex: 1,
                                borderRadius: 999,
                                paddingVertical: 12,
                                paddingHorizontal: theme.spacing.md,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface,
                                opacity: savingKey ? 0.55 : 1,
                              })}
                            >
                              <Text
                                style={{
                                  fontFamily: theme.typography.fontFamily,
                                  fontSize: theme.typography.fontSize.sm,
                                  fontWeight: theme.typography.fontWeight.bold as any,
                                  color: theme.colors.textSecondary,
                                }}
                              >
                                {saving ? "Saving…" : "Decline"}
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}
