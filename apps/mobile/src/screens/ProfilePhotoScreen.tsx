import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Txt, Button, Avatar, OnboardingProgress,
  palette, font, radius,
} from "../components/ds";
import { useAuth } from "../context/AuthContext";
import { useAvatarEditor } from "../hooks/useAvatarEditor";

export default function ProfilePhotoScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { photoUri, busy: uploading, error, pick } = useAvatarEditor();

  return (
    <Screen edges={["top", "bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 20 }}>
        <OnboardingProgress step={2} total={4} label="Add a photo" />

        <Txt variant="h1" style={{ marginBottom: 8 }}>Add a photo</Txt>
        <Txt variant="body" color="inkMuted" style={{ marginBottom: 32 }}>
          Help your church family recognize you. Totally optional — you can always add one later.
        </Txt>

        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View style={styles.avatarWrap}>
            <Avatar
              imageUri={photoUri}
              name={profile?.full_name}
              email={profile?.email}
              size={140}
              tone="amber"
            />
            {uploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={palette.onDark} />
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Pressable onPress={() => pick("library")} disabled={uploading} style={({ pressed }: { pressed: boolean }) => [styles.pickRow, pressed && { opacity: 0.85 }]}>
            <Icon name="image" size={18} color={palette.amberDeep} />
            <Text style={styles.pickLabel}>Choose from library</Text>
          </Pressable>
          <Pressable onPress={() => pick("camera")} disabled={uploading} style={({ pressed }: { pressed: boolean }) => [styles.pickRow, pressed && { opacity: 0.85 }]}>
            <Icon name="camera" size={18} color={palette.amberDeep} />
            <Text style={styles.pickLabel}>Take a photo</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}

        <View style={{ flex: 1 }} />

        <Button label="Continue" onPress={() => navigation.navigate("ProfileVerse")} style={{ marginBottom: 20 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { position: "relative" },
  uploadingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 70,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  pickLabel: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  errorCard: { backgroundColor: palette.dangerSoft, borderRadius: radius.sm, padding: 12, marginTop: 14 },
  errorTxt: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, lineHeight: 18 },
});
