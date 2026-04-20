import { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppShell } from "../components/app/AppShell";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { EmptyState } from "../components/app/EmptyState";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard } from "../theme/stitch";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type MemberRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};

function roleLabel(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "SERVICE") return "Service team";
  return "Member";
}

export default function MembersScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !profile?.church_id) {
      setMembers([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const { data, error } = await client
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("church_id", profile.church_id)
      .order("full_name", { ascending: true, nullsFirst: false });

    if (!error && data) {
      const rows = data as MemberRow[];
      const selfFirst = [...rows].sort((a, b) => {
        if (a.id === user?.id) return -1;
        if (b.id === user?.id) return 1;
        const an = (a.full_name || a.email || "").toLowerCase();
        const bn = (b.full_name || b.email || "").toLowerCase();
        return an.localeCompare(bn);
      });
      setMembers(selfFirst);
    }
    setLoading(false);
    setRefreshing(false);
  }, [profile?.church_id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: STITCH_PAD_H }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <StitchHero title="Members" subtitle="People in your church." />

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : members.length === 0 ? (
          <EmptyState title="No members yet" description="When people join your church, they will show up here." />
        ) : (
          <View style={{ gap: 16 }}>
            {members.map((m) => (
              <View key={m.id} style={stitchFilledCard()}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                    <Text
                      style={{
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: theme.typography.fontWeight.semibold as any,
                        fontSize: 20,
                        color: theme.colors.primaryText,
                      }}
                    >
                      {m.full_name?.trim() || m.email?.split("@")[0] || "Member"}
                      {m.id === user?.id ? " (you)" : ""}
                    </Text>
                    {m.email ? (
                      <Text
                        style={{
                          fontFamily: theme.typography.fontFamily,
                          color: theme.colors.textSecondary,
                          marginTop: 8,
                          fontSize: theme.typography.fontSize.sm,
                        }}
                      >
                        {m.email}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={{
                      backgroundColor: theme.colors.primarySoft,
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: 6,
                      borderRadius: theme.radii.md,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.semibold as any,
                        color: theme.colors.primaryHover,
                      }}
                    >
                      {roleLabel(m.role)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}
