import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Txt, Button, Avatar, OnboardingProgress,
  palette, font, radius,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const ext = uri.split(".").pop()?.toLowerCase().split("?")[0] || "jpg";
    const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, { contentType, upsert: true });
    if (uploadError) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export default function ProfilePhotoScreen({ navigation }: any) {
  const { user, profile, refreshProfile } = useAuth();
  const [localUri, setLocalUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: "library" | "camera") => {
    setError(null);
    const perm =
      source === "library"
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError(source === "library" ? "Photo library access is off — you can enable it in Settings, or skip for now." : "Camera access is off — you can enable it in Settings, or skip for now.");
      return;
    }

    const result =
      source === "library"
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setLocalUri(asset.uri);

    if (!user?.id) return;
    setUploading(true);
    const publicUrl = await uploadAvatar(user.id, asset.uri);
    setUploading(false);
    if (!publicUrl) {
      setError("Couldn't upload that photo. You can try again or skip for now.");
      return;
    }
    if (supabase) {
      await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("id", user.id);
      await refreshProfile();
    }
  };

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
              imageUri={localUri}
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
