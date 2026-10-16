import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet, Linking } from "react-native";
import Constants from "expo-constants";
import { Icon } from "../components/ui/Icon";
import {
  Screen, AppBar, Avatar, Pill, Divider, Button,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import { LEGAL } from "../lib/webApi";
import { useAvatarEditor } from "../hooks/useAvatarEditor";

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
    <Pressable onPress={onPress} style={({ pressed }: { pressed: boolean }) => [styles.menuRow, pressed && { backgroundColor: palette.sunken }]}>
      <View style={styles.menuIcon}><Icon name={icon} size={19} color={palette.amber} /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevronRight" size={18} color={palette.inkMuted} />
    </Pressable>
  );
}

export default function ProfileMenuScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const avatar = useAvatarEditor();
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
          <Pressable
            onPress={avatar.choose}
            disabled={avatar.busy}
            accessibilityRole="button"
            accessibilityLabel={avatar.photoUri ? "Change profile photo" : "Add profile photo"}
            style={({ pressed }: { pressed: boolean }) => [styles.avatarBtn, pressed && { opacity: 0.8 }]}
          >
            <Avatar imageUri={avatar.photoUri} name={displayName} email={email} tone="amber" size={88} />
            {avatar.busy ? (
              <View style={styles.avatarBusy}><ActivityIndicator color={palette.onDark} /></View>
            ) : null}
            <View style={styles.avatarBadge}>
              <Icon name="camera" size={15} color={palette.onDark} />
            </View>
          </Pressable>
          {avatar.error ? <Text style={styles.avatarError}>{avatar.error}</Text> : null}
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

        <Text style={styles.groupLabel}>Help & legal</Text>
        <View style={styles.card}>
          <MenuRow icon="sparkle" label="App tour" onPress={() => navigation.navigate("GuidedTour")} />
          <Divider inset={58} />
          <MenuRow icon="mail" label="Contact support" onPress={() => Linking.openURL(`mailto:${LEGAL.supportEmail}`)} />
          <Divider inset={58} />
          <MenuRow icon="shield" label="Privacy policy" onPress={() => Linking.openURL(LEGAL.privacy)} />
          <Divider inset={58} />
          <MenuRow icon="fileText" label="Terms of service" onPress={() => Linking.openURL(LEGAL.terms)} />
        </View>

        <Button label="Sign out" variant="ghost" icon="logout" onPress={handleSignOut} style={{ marginTop: 24 }} />
        <Pressable
          onPress={() => navigation.navigate("DeleteAccount")}
          style={({ pressed }: { pressed: boolean }) => [styles.deleteLink, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          <Text style={styles.deleteLinkTxt}>Delete account</Text>
        </Pressable>
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
  avatarBtn: { width: 88, height: 88 },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject, borderRadius: 44,
    backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center",
  },
  // Camera badge: the affordance that the photo is tappable.
  avatarBadge: {
    position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15,
    backgroundColor: palette.amberInk, borderWidth: 3, borderColor: palette.bg,
    alignItems: "center", justifyContent: "center",
  },
  avatarError: { fontFamily: font.medium, fontSize: 13, color: palette.dangerInk, marginTop: 10, textAlign: "center" },
  menuLabel: { fontFamily: font.semibold, fontSize: 15, color: palette.ink, flex: 1 },
  groupLabel: {
    fontFamily: font.semibold, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase",
    color: palette.inkMuted, marginTop: 24, marginBottom: 8, marginLeft: 4,
  },
  deleteLink: { alignSelf: "center", marginTop: 18, paddingVertical: 10, paddingHorizontal: 16, minHeight: 44, justifyContent: "center" },
  deleteLinkTxt: { fontFamily: font.semibold, fontSize: 14, color: palette.danger },
});
