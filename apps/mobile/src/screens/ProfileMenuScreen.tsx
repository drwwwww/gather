import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import Constants from "expo-constants";
import { Icon } from "../components/ui/Icon";
import {
  Screen, AppBar, Avatar, Pill, Divider, Button,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";

function roleTone(role: string): "amber" | "success" | "neutral" {
  if (role === "ADMIN") return "amber";
  if (role === "SERVICE") return "success";
  return "neutral";
}
function roleLabel(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "SERVICE") return "Service team";
  return "Member";
}

function MenuRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: palette.sunken }]}>
      <View style={styles.menuIcon}><Icon name={icon} size={19} color={palette.amber} /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevronRight" size={18} color={palette.inkMuted} />
    </Pressable>
  );
}

export default function ProfileMenuScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [churchName, setChurchName] = useState<string | null>(null);
  const [loadingChurch, setLoadingChurch] = useState(false);

  useEffect(() => {
    if (!supabase || !profile?.church_id) { setChurchName(null); return; }
    let cancelled = false;
    setLoadingChurch(true);
    (async () => {
      const { data } = await supabase.from("churches").select("name").eq("id", profile.church_id as string).maybeSingle();
      if (!cancelled) { setChurchName((data as { name: string } | null)?.name ?? null); setLoadingChurch(false); }
    })();
    return () => { cancelled = true; };
  }, [profile?.church_id]);

  const displayName = profile?.full_name?.trim() || user?.user_metadata?.full_name || user?.email || "Member";
  const email = profile?.email?.trim() || user?.email || "";
  const role = profile?.role ?? "—";
  const appVersion = Constants.expoConfig?.version ?? "—";

  const handleSignOut = async () => { if (supabase) await supabase.auth.signOut(); };

  return (
    <Screen>
      <AppBar title="Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Avatar name={displayName} email={email} tone="amber" size={88} />
          <Text style={styles.name}>{displayName}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
          <View style={{ marginTop: 12 }}><Pill label={roleLabel(role)} tone={roleTone(role)} /></View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Church</Text>
            {loadingChurch ? <ActivityIndicator size="small" color={palette.amber} /> : <Text style={styles.infoValue}>{churchName ?? "—"}</Text>}
          </View>
          <Divider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App version</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          {role === "MEMBER" && (
            <>
              <MenuRow icon="serve" label="Request to serve" onPress={() => navigation.navigate("RequestToServe")} />
              <Divider inset={58} />
            </>
          )}
          <MenuRow icon="members" label="View members" onPress={() => navigation.navigate("Members")} />
          <Divider inset={58} />
          <MenuRow icon="church" label="Church info" onPress={() => navigation.navigate("ChurchInfo")} />
          <Divider inset={58} />
          <MenuRow icon="notifications" label="Notifications" onPress={() => navigation.navigate("Notifications")} />
        </View>

        <Button label="Sign out" variant="ghost" icon="logout" onPress={handleSignOut} style={{ marginTop: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: "center", paddingTop: 24, paddingBottom: 28 },
  name: { fontFamily: font.bold, fontSize: 22, color: palette.ink, marginTop: 16 },
  email: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted, marginTop: 4 },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, overflow: "hidden", ...shadow.sm },
  infoRow: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft },
  infoValue: { fontFamily: font.bold, fontSize: 14, color: palette.ink },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: palette.amberSofter, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: font.semibold, fontSize: 15, color: palette.ink, flex: 1 },
});
