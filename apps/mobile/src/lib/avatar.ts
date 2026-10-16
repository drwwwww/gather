import type { ImagePickerAsset } from "expo-image-picker";
import { supabase } from "../supabase";

const BUCKET = "avatars";

/**
 * Bytes from the picker's base64 payload. Supabase's React Native guidance is
 * to upload an ArrayBuffer/Uint8Array: `fetch(fileUri).blob()` hands
 * supabase-js a Blob it can't read on RN, which silently stored 0-byte files
 * (every avatar uploaded before this fix was empty).
 */
function base64ToBytes(b64: string): Uint8Array {
  const binary = globalThis.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function extensionFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Removes every file in the user's avatar folder (keeps storage to one photo per person). */
async function clearFolder(userId: string, keep?: string) {
  if (!supabase) return;
  const { data } = await supabase.storage.from(BUCKET).list(userId, { limit: 100 });
  const stale = (data ?? []).map((f: { name: string }) => `${userId}/${f.name}`).filter((p: string) => p !== keep);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
}

/**
 * Uploads a picked photo as the user's avatar and saves it on their profile.
 * Each upload gets a unique file name, so the new URL is never served from a
 * stale image cache; older files are deleted afterwards. Throws a
 * user-facing message on failure.
 */
export async function saveAvatar(userId: string, asset: ImagePickerAsset): Promise<string> {
  if (!supabase) throw new Error("You're offline. Try again in a moment.");
  if (!asset.base64) throw new Error("Couldn't read that photo. Try a different one.");

  const mime = asset.mimeType && asset.mimeType.startsWith("image/") ? asset.mimeType : "image/jpeg";
  const path = `${userId}/avatar-${Date.now()}.${extensionFor(mime)}`;
  const bytes = base64ToBytes(asset.base64);
  if (bytes.byteLength === 0) throw new Error("Couldn't read that photo. Try a different one.");

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: mime, upsert: false });
  if (uploadError) throw new Error("Couldn't upload that photo. Check your connection and try again.");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error: profileError } = await (supabase as any).from("profiles").update({ avatar_url: data.publicUrl } as any).eq("id", userId);
  if (profileError) throw new Error("Your photo uploaded but couldn't be saved to your profile. Try again.");

  await clearFolder(userId, path).catch(() => {});
  return data.publicUrl;
}

/** Removes the user's photo; everyone sees their initials again. */
export async function removeAvatar(userId: string): Promise<void> {
  if (!supabase) throw new Error("You're offline. Try again in a moment.");
  const { error } = await (supabase as any).from("profiles").update({ avatar_url: null } as any).eq("id", userId);
  if (error) throw new Error("Couldn't remove your photo. Try again.");
  await clearFolder(userId).catch(() => {});
}
