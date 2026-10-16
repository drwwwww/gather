import { useState } from "react";
import { View, Text, ScrollView, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Icon } from "../components/ui/Icon";
import { Screen, AppBar, Button, palette, font, radius, shadow, space } from "../components/ds";
import { supabase } from "../supabase";
import { postWebApi } from "../lib/webApi";

const WHAT_GOES = [
  "Your sign-in, profile, photo and favorite verse",
  "Your RSVPs, serve requests and notification history",
  "Your spot in your church's member directory",
];

const WHAT_STAYS = [
  "Service plans you were on stay with your church — your backup steps in, or the slot reopens",
  "Announcements and events your church posted",
];

/** Permanent, in-app account deletion (App Store 5.1.1(v), Google Play). */
export default function DeleteAccountScreen({ navigation }: any) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const armed = confirmText.trim().toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!armed || deleting) return;
    setDeleting(true);
    setError(null);
    const res = await postWebApi("/api/account/delete", { confirm: "DELETE" });
    if (!res.ok) {
      setError(res.data.error ?? "We couldn't delete your account. Please try again.");
      setDeleting(false);
      return;
    }
    // The auth user no longer exists; clearing the local session drops the
    // app back to sign-in.
    await supabase?.auth.signOut().catch(() => {});
  };

  return (
    <Screen>
      <AppBar title="Delete account" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: 60, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Icon name="trash" size={26} color={palette.danger} />
            </View>
            <Text style={styles.title}>This can't be undone</Text>
            <Text style={styles.body}>
              Deleting your account removes you from Gather everywhere. If you just want to switch churches, ask your
              church admin instead — you'll keep your account.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Deleted right away</Text>
            {WHAT_GOES.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <Icon name="close" size={16} color={palette.danger} />
                <Text style={styles.bullet}>{line}</Text>
              </View>
            ))}
            <View style={styles.sep} />
            <Text style={styles.cardLabel}>Stays with your church</Text>
            {WHAT_STAYS.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <Icon name="church" size={16} color={palette.inkSoft} />
                <Text style={styles.bullet}>{line}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.confirmLabel}>
            Type <Text style={{ fontFamily: font.bold, color: palette.ink }}>DELETE</Text> to confirm
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="DELETE"
            placeholderTextColor={palette.inkMuted}
            style={[styles.input, armed && { borderColor: palette.danger }]}
            accessibilityLabel="Type DELETE to confirm"
          />

          {error ? (
            <View style={styles.error} accessibilityRole="alert">
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <Button
            label="Permanently delete my account"
            variant="danger"
            icon="trash"
            onPress={handleDelete}
            disabled={!armed}
            loading={deleting}
            style={{ marginTop: 20 }}
          />
          <Button label="Keep my account" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 10 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingTop: 12, paddingBottom: 24 },
  heroIcon: {
    width: 60, height: 60, borderRadius: 20, backgroundColor: palette.dangerSoft,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: font.bold, fontSize: 22, color: palette.ink, marginTop: 16 },
  body: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: palette.inkSoft, textAlign: "center", marginTop: 8 },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 18, ...shadow.sm },
  cardLabel: { fontFamily: font.semibold, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: palette.inkMuted, marginBottom: 10 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  bullet: { flex: 1, fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: palette.ink },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginVertical: 8 },
  confirmLabel: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 28, marginBottom: 10 },
  input: {
    backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1.5, borderColor: palette.line,
    paddingHorizontal: 16, paddingVertical: 14, fontFamily: font.semibold, fontSize: 16, color: palette.ink, letterSpacing: 2,
  },
  error: { marginTop: 14, backgroundColor: palette.dangerSoft, borderRadius: radius.lg, padding: 14 },
  errorTxt: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: palette.dangerInk },
});
