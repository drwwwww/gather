import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppShell } from "../components/app/AppShell";
import { StitchTabAppBar } from "../components/app/StitchTabAppBar";
import { EmptyState } from "../components/app/EmptyState";
import { YourAssignmentsBanner, type AssignmentChip } from "../components/app/YourAssignmentsBanner";
import { GradientButton } from "../components/ui/GradientButton";
import { Icon } from "../components/ui/Icon";
import { theme } from "../theme/theme";
import { stitchRowShadowSoft } from "../theme/stitch";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type PlanRow = {
  id: string;
  title: string;
  service_date: string;
  service_time_id: string;
};

type PlanItemRow = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  status: string;
  assigned_user_id: string | null;
};

type RoleSlotRow = {
  id: string;
  role_id: string;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: string;
};

type VolunteerRoleRow = { id: string; name: string };
type ProfilePeer = { id: string; full_name: string | null; email: string | null };
type ServiceTimeRow = { id: string; name: string; start_time: string };

function peerName(map: Record<string, ProfilePeer>, userId: string | null): string | null {
  if (!userId) return null;
  const p = map[userId];
  return p ? (p.full_name?.trim() || p.email || null) : null;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatStartTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** HH:MM clock string minus `sub` minutes (floored at 00:00). */
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

export default function ServicePlanScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [serviceTime, setServiceTime] = useState<ServiceTimeRow | null>(null);
  const [items, setItems] = useState<PlanItemRow[]>([]);
  const [roleSlots, setRoleSlots] = useState<RoleSlotRow[]>([]);
  const [roles, setRoles] = useState<VolunteerRoleRow[]>([]);
  const [peers, setPeers] = useState<Record<string, ProfilePeer>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myUserId = profile?.id ?? null;

  const roleLookup = useMemo(
    () => roles.reduce<Record<string, string>>((acc, r) => {
      acc[r.id] = r.name;
      return acc;
    }, {}),
    [roles]
  );

  const myItems = useMemo(
    () => (myUserId ? items.filter((i) => i.assigned_user_id === myUserId) : []),
    [items, myUserId]
  );

  const mySlots = useMemo(
    () => (myUserId ? roleSlots.filter((s) => s.assigned_user_id === myUserId || s.backup_user_id === myUserId) : []),
    [roleSlots, myUserId]
  );

  const assignmentChips: AssignmentChip[] = useMemo(() => {
    const chips: AssignmentChip[] = [];
    for (const item of myItems) chips.push({ key: `i-${item.id}`, label: item.title });
    for (const slot of mySlots) {
      const name = roleLookup[slot.role_id] ?? "Role";
      const role = slot.assigned_user_id === myUserId ? "Primary" : "Backup";
      chips.push({ key: `s-${slot.id}`, label: `${name} (${role})` });
    }
    return chips;
  }, [myItems, mySlots, roleLookup, myUserId]);

  const assignmentsSubtitle = useMemo(() => {
    const n = assignmentChips.length;
    if (n === 0 || !serviceTime?.start_time) return undefined;
    const readyBy = formatStartTime(subtractMinutesFromTimeString(serviceTime.start_time, 15));
    return n === 1
      ? `You have 1 role today. Please be ready by ${readyBy}.`
      : `You have ${n} roles today. Please be ready by ${readyBy}.`;
  }, [assignmentChips.length, serviceTime?.start_time]);

  const totalMinutes = useMemo(
    () => items.reduce((sum, i) => sum + (typeof i.duration_minutes === "number" ? i.duration_minutes : 0), 0),
    [items]
  );

  const load = useCallback(async () => {
    if (!supabase || !profile?.church_id) {
      setError("Unable to load profile.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    const today = new Date().toISOString().slice(0, 10);

    const { data: planData, error: planError } = await supabase
      .from("service_plans")
      .select("id, title, service_date, service_time_id")
      .eq("church_id", profile.church_id)
      .gte("service_date", today)
      .order("service_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (planError || !planData) {
      setPlan(null);
      setItems([]);
      setRoleSlots([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setPlan(planData as PlanRow);

    const [stRes, itemRes, slotRes, roleRes, peersRes] = await Promise.all([
      supabase.from("service_times").select("id, name, start_time").eq("id", planData.service_time_id).maybeSingle(),
      supabase.from("service_plan_items").select("id, title, duration_minutes, notes, status, assigned_user_id").eq("plan_id", planData.id).order("position"),
      supabase.from("service_plan_role_slots").select("id, role_id, assigned_user_id, backup_user_id, status").eq("plan_id", planData.id).order("sort_order"),
      supabase.from("volunteer_roles").select("id, name").eq("church_id", profile.church_id),
      supabase.from("profiles").select("id, full_name, email").eq("church_id", profile.church_id).eq("disabled", false),
    ]);

    if (stRes.data && !stRes.error) setServiceTime(stRes.data as ServiceTimeRow);
    setItems(itemRes.error ? [] : (itemRes.data ?? []) as PlanItemRow[]);
    setRoleSlots(slotRes.error ? [] : (slotRes.data ?? []) as RoleSlotRow[]);
    setRoles(roleRes.error ? [] : (roleRes.data ?? []) as VolunteerRoleRow[]);

    const peerMap: Record<string, ProfilePeer> = {};
    if (!peersRes.error && peersRes.data) {
      for (const row of peersRes.data as ProfilePeer[]) peerMap[row.id] = row;
    }
    setPeers(peerMap);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.church_id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const dateTimeLine =
    serviceTime?.start_time != null
      ? `${formatDate(plan?.service_date ?? "")} · ${formatStartTime(serviceTime.start_time)}`
      : plan
        ? formatDate(plan.service_date)
        : "";

  if (!profile?.church_id) {
    return (
      <AppShell>
        <StitchTabAppBar navigation={navigation} />
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Text style={styles.heroEyebrow}>Current bulletin</Text>
          <Text style={styles.heroTitle}>Bulletin</Text>
          <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.lg, color: theme.colors.textSecondary, marginTop: 12 }}>
            Sign in to view your church bulletin.
          </Text>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StitchTabAppBar navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={{ color: theme.colors.danger }}>{error}</Text>
          </View>
        ) : !plan ? (
          <>
            <View style={{ marginTop: 8, marginBottom: 24 }}>
              <Text style={styles.heroEyebrow}>Current bulletin</Text>
              <Text style={styles.heroTitle}>Upcoming service</Text>
            </View>
            <EmptyState title="No upcoming bulletin" description="Your church hasn't published a plan for a future service yet." />
          </>
        ) : (
          <View style={{ marginTop: 8, gap: 32 }}>
            {/* Hero — stitch_gather_mobile_app_dossier/bulletin */}
            <View>
              <Text style={styles.heroEyebrow}>Current bulletin</Text>
              <Text style={styles.heroTitle}>{plan.title?.trim() || "Sunday morning service"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <Icon name="calendar" size={20} color={theme.colors.primary} />
                <Text style={styles.heroMeta}>{dateTimeLine}</Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      "Print bulletin",
                      "Open Gather in a browser, go to Admin → Service plans, and use Print from there."
                    )
                  }
                  style={({ pressed }) => ({
                    paddingHorizontal: 22,
                    paddingVertical: 12,
                    borderRadius: 999,
                    backgroundColor: "#E9E8E4",
                    opacity: pressed ? 0.88 : 1,
                  })}
                >
                  <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold as any, color: theme.colors.primaryText }}>
                    Print PDF
                  </Text>
                </Pressable>
                <GradientButton compact onPress={() => Alert.alert("Check in", "Check-in will be available in a future update.")}>
                  Check in
                </GradientButton>
              </View>
            </View>

            {assignmentChips.length > 0 ? (
              <YourAssignmentsBanner chips={assignmentChips} subtitle={assignmentsSubtitle} />
            ) : null}

            {/* Order of service */}
            {items.length > 0 ? (
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingHorizontal: 2 }}>
                  <Text style={styles.sectionTitle}>Order of service</Text>
                  {totalMinutes > 0 ? (
                    <View style={styles.totalPill}>
                      <Text style={styles.totalPillText}>{totalMinutes} min total</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ gap: 12 }}>
                  {items.map((item, idx) => {
                    const isMe = item.assigned_user_id === myUserId;
                    const assignedName = peerName(peers, item.assigned_user_id);
                    const num = String(idx + 1).padStart(2, "0");
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.orderCard,
                          isMe && styles.orderCardMe,
                          stitchRowShadowSoft,
                        ]}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <View style={{ flexDirection: "row", gap: 14, flex: 1, minWidth: 0 }}>
                            <Text
                              style={{
                                fontFamily: theme.typography.fontFamily,
                                fontSize: 20,
                                fontWeight: theme.typography.fontWeight.bold as any,
                                color: isMe ? theme.colors.primary : theme.colors.border,
                                marginTop: 2,
                                minWidth: 28,
                              }}
                            >
                              {num}
                            </Text>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={{
                                  fontFamily: theme.typography.fontFamily,
                                  fontSize: 20,
                                  fontWeight: theme.typography.fontWeight.bold as any,
                                  color: theme.colors.primaryText,
                                }}
                                numberOfLines={3}
                              >
                                {item.title}
                              </Text>
                              {item.notes ? (
                                <Text
                                  style={{
                                    fontFamily: theme.typography.fontFamily,
                                    fontSize: theme.typography.fontSize.lg,
                                    lineHeight: 24,
                                    color: theme.colors.textSecondary,
                                    marginTop: 6,
                                    fontStyle: isMe ? "italic" : "normal",
                                  }}
                                  numberOfLines={6}
                                >
                                  {item.notes}
                                </Text>
                              ) : null}
                              {isMe ? (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
                                  <Icon name="members" size={16} color={theme.colors.primary} />
                                  <Text
                                    style={{
                                      fontFamily: theme.typography.fontFamily,
                                      fontSize: theme.typography.fontSize.sm,
                                      fontWeight: theme.typography.fontWeight.bold as any,
                                      color: theme.colors.primary,
                                    }}
                                  >
                                    Assigned to you
                                  </Text>
                                </View>
                              ) : assignedName ? (
                                <Text
                                  style={{
                                    fontFamily: theme.typography.fontFamily,
                                    fontSize: theme.typography.fontSize.sm,
                                    color: theme.colors.textSecondary,
                                    marginTop: 8,
                                  }}
                                  numberOfLines={2}
                                >
                                  {assignedName}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          {item.duration_minutes != null ? (
                            <View style={[styles.durationPill, isMe && styles.durationPillMe]}>
                              <Text style={[styles.durationPillText, isMe && styles.durationPillTextMe]}>{item.duration_minutes} min</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Service team */}
            {roleSlots.length > 0 ? (
              <View style={styles.teamPanel}>
                <Text style={[styles.sectionTitle, { marginBottom: 22 }]}>Service team</Text>
                <View style={{ gap: 22 }}>
                  {roleSlots.map((slot) => {
                    const roleName = roleLookup[slot.role_id] ?? "Role";
                    const assignedName = peerName(peers, slot.assigned_user_id);
                    const hasAssignee = !!assignedName;
                    return (
                      <View key={slot.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: hasAssignee ? theme.colors.primarySoft : "rgba(216, 195, 173, 0.35)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: theme.typography.fontFamily,
                                fontSize: 13,
                                fontWeight: theme.typography.fontWeight.bold as any,
                                color: hasAssignee ? theme.colors.primary : theme.colors.textMuted,
                              }}
                            >
                              {hasAssignee ? initials(assignedName) : "?"}
                            </Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={{
                                fontFamily: theme.typography.fontFamily,
                                fontSize: 11,
                                fontWeight: theme.typography.fontWeight.bold as any,
                                color: "#867461",
                                letterSpacing: 1.2,
                                textTransform: "uppercase",
                              }}
                              numberOfLines={1}
                            >
                              {roleName}
                            </Text>
                            <Text
                              style={{
                                fontFamily: theme.typography.fontFamily,
                                fontSize: theme.typography.fontSize.md,
                                fontWeight: theme.typography.fontWeight.bold as any,
                                color: hasAssignee ? theme.colors.primaryText : theme.colors.textSecondary,
                                fontStyle: hasAssignee ? "normal" : "italic",
                                marginTop: 2,
                              }}
                              numberOfLines={1}
                            >
                              {assignedName ?? "Unassigned"}
                            </Text>
                          </View>
                        </View>
                        {hasAssignee ? (
                          <Icon name="checkCircle" size={22} color={theme.colors.textMuted} />
                        ) : (
                          <Pressable onPress={() => Alert.alert("Claim role", "Role claiming is managed on the web admin for now.")}>
                            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.bold as any, color: theme.colors.primary, textDecorationLine: "underline" }}>
                              Claim
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.dangerSoft,
  },
  heroEyebrow: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primaryText,
    letterSpacing: -0.5,
  },
  heroMeta: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.lg,
    lineHeight: 24,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primaryText,
  },
  totalPill: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  totalPillText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  orderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: 22,
    borderLeftWidth: 0,
  },
  orderCardMe: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  durationPill: {
    backgroundColor: "#F4F4F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  durationPillMe: {
    backgroundColor: theme.colors.primary,
  },
  durationPillText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primaryText,
  },
  durationPillTextMe: {
    color: theme.colors.onPrimary,
  },
  teamPanel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 28,
  },
});
