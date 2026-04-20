import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { GradientButton } from "../components/ui/GradientButton";
import { AppShell } from "../components/app/AppShell";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard } from "../theme/stitch";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDetailLabel(dateStr: string, startTime: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = weekdayNames[d.getDay()] ?? "";
  const [h, m] = (startTime || "09:00").split(":").map(Number);
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${day} ${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function AssignmentDetailScreen({ route, navigation }: any) {
  const { assignmentId } = route.params ?? {};
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<{
    id: string;
    role_name: string;
    service_label: string;
    status: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !assignmentId || !profile?.church_id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data: row, error: fetchError } = await supabase
        .from("volunteer_assignments")
        .select("id, role_id, service_time_id, status, scheduled_date")
        .eq("id", assignmentId)
        .eq("church_id", profile.church_id)
        .single();

      if (fetchError || !row) {
        setError("Assignment not found.");
        setLoading(false);
        return;
      }

      const [roleRes, serviceRes] = await Promise.all([
        supabase.from("volunteer_roles").select("name").eq("id", (row as any).role_id).single(),
        supabase.from("service_times").select("start_time").eq("id", (row as any).service_time_id).single(),
      ]);

      const roleName = (roleRes.data as any)?.name ?? "Role";
      const startTime = (serviceRes.data as any)?.start_time ?? "09:00";
      const serviceLabel = formatDetailLabel((row as any).scheduled_date, startTime);

      setAssignment({
        id: (row as any).id,
        role_name: roleName,
        service_label: serviceLabel,
        status: (row as any).status,
      });
      setLoading(false);
    };

    load();
  }, [assignmentId, profile?.church_id]);

  const handleConfirm = async () => {
    if (!supabase || !assignmentId || saving) return;
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ status: "CONFIRMED" })
      .eq("id", assignmentId)
      .or(`assigned_user_id.eq.${user?.id},backup_user_id.eq.${user?.id}`);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    setAssignment((prev) => (prev ? { ...prev, status: "CONFIRMED" } : null));
    setSaving(false);
    navigation.goBack();
  };

  const handleDecline = async () => {
    if (!supabase || !assignmentId || saving) return;
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ status: "DECLINED" })
      .eq("id", assignmentId)
      .or(`assigned_user_id.eq.${user?.id},backup_user_id.eq.${user?.id}`);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    setAssignment((prev) => (prev ? { ...prev, status: "DECLINED" } : null));
    setSaving(false);
    navigation.goBack();
  };

  const canRespond = assignment?.status === "ASSIGNED" || assignment?.status === "OPEN";

  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: STITCH_PAD_H }}>
        <StitchHero title="Assignment" subtitle={assignment?.role_name ?? "Volunteer schedule"} />

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : assignment ? (
          <View style={stitchFilledCard()}>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontWeight: theme.typography.fontWeight.semibold as any, fontSize: 20, color: theme.colors.primaryText }}>{assignment.role_name}</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 8 }}>{assignment.service_label}</Text>
            {error ? <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.error, marginTop: theme.spacing.sm }}>{error}</Text> : null}
            {canRespond ? (
              <View style={{ flexDirection: "row", gap: 12, marginTop: theme.spacing.lg }}>
                <GradientButton compact style={{ flex: 1 }} onPress={handleConfirm} disabled={saving}>
                  {saving ? "Saving…" : "Confirm"}
                </GradientButton>
                <Pressable
                  onPress={handleDecline}
                  disabled={saving}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface,
                    opacity: saving ? 0.55 : 1,
                  })}
                >
                  <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.bold as any, color: theme.colors.textSecondary }}>
                    {saving ? "Saving…" : "Decline"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ marginTop: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
                <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary }}>
                  You have already responded to this assignment.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={stitchFilledCard()}>
            <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary }}>{error ?? "Assignment not found."}</Text>
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}
