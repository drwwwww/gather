import { useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/AuthContext";
import { saveAvatar, removeAvatar } from "../lib/avatar";

type Source = "library" | "camera";

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.6, // JPEG at 0.6 keeps a full-res square crop well under ~1 MB
  base64: true, // raw bytes for the upload — see lib/avatar.ts
};

/**
 * Pick → upload → save → refresh, shared by onboarding and Profile.
 * `choose()` opens the platform-native chooser: an action sheet on iOS, an
 * alert with options on Android.
 */
export function useAvatarEditor() {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const pick = async (source: Source) => {
    setError(null);
    const perm = source === "library"
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError(source === "library"
        ? "Photo access is off. You can turn it on in Settings."
        : "Camera access is off. You can turn it on in Settings.");
      return;
    }

    const result = source === "library"
      ? await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS)
      : await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (result.canceled || !result.assets?.[0] || !user?.id) return;

    const asset = result.assets[0];
    setPreviewUri(asset.uri); // instant feedback while it uploads
    setBusy(true);
    try {
      await saveAvatar(user.id, asset);
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setPreviewUri(null);
      setError(e instanceof Error ? e.message : "Couldn't save that photo.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!user?.id) return;
    setError(null);
    setBusy(true);
    try {
      await removeAvatar(user.id);
      setPreviewUri(null);
      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove your photo.");
    } finally {
      setBusy(false);
    }
  };

  const hasPhoto = !!(previewUri || profile?.avatar_url);

  const choose = () => {
    if (busy) return;
    const options = ["Choose from library", "Take photo", ...(hasPhoto ? ["Remove photo"] : []), "Cancel"];
    const handle = (i: number) => {
      if (options[i] === "Choose from library") void pick("library");
      else if (options[i] === "Take photo") void pick("camera");
      else if (options[i] === "Remove photo") void remove();
    };
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: hasPhoto ? options.indexOf("Remove photo") : undefined,
        },
        handle
      );
    } else {
      Alert.alert(
        "Profile photo",
        undefined,
        [
          { text: "Choose from library", onPress: () => void pick("library") },
          { text: "Take photo", onPress: () => void pick("camera") },
          ...(hasPhoto ? [{ text: "Remove photo", style: "destructive" as const, onPress: () => void remove() }] : []),
        ],
        { cancelable: true }
      );
    }
  };

  return {
    photoUri: previewUri ?? profile?.avatar_url ?? null,
    busy,
    error,
    pick,
    remove,
    choose,
  };
}
