import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { AppShell } from "../components/app/AppShell";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { GradientButton } from "../components/ui/GradientButton";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard } from "../theme/stitch";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";

export default function ProfileMenuScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [churchName, setChurchName] = useState<string | null>(null);
  const [loadingChurch, setLoadingChurch] = useState(false);

  useEffect(() => {
    if (!supabase || !profile?.church_id) {
      setChurchName(null);
      return;
    }
    let cancelled = false;
    setLoadingChurch(true);
    (async () => {
      const { data } = await supabase.from("churches").select("name").eq("id", profile.church_id).maybeSingle();
      if (!cancelled) {
        setChurchName(data?.name ?? null);
        setLoadingChurch(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.church_id]);

  const displayName = profile?.full_name?.trim() || user?.user_metadata?.full_name || user?.email || "Member";
  const email = profile?.email?.trim() || user?.email || "";
  const role = profile?.role ?? "—";

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: STITCH_PAD_H }}>
        <StitchHero title="Account" subtitle="Your profile and church access." />

        <View style={stitchFilledCard()}>
          <Text style={{ fontFamily: theme.typography.fontFamily, fontWeight: theme.typography.fontWeight.semibold as any, fontSize: 20, color: theme.colors.primaryText }}>
            {displayName}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 8 }}>{email}</Text>
          <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.primary, marginTop: 8, fontWeight: theme.typography.fontWeight.semibold as any }}>{role}</Text>
          {loadingChurch ? (
            <ActivityIndicator style={{ marginTop: theme.spacing.sm }} color={theme.colors.primary} />
          ) : (
            <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 8, marginBottom: theme.spacing.md }}>{churchName ?? "Church"}</Text>
          )}

          <GradientButton compact onPress={() => navigation.navigate("Members")} style={{ marginTop: theme.spacing.sm }}>
            Members directory
          </GradientButton>

          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              marginTop: theme.spacing.md,
              borderRadius: 999,
              paddingVertical: 12,
              alignItems: "center",
              backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface,
            })}
          >
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.bold as any, color: theme.colors.textSecondary }}>
              Sign out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppShell>
  );
}
