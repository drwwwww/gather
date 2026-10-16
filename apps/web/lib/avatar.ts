"use client";

import { supabase } from "./supabaseClient";

const BUCKET = "avatars";
const SIZE = 512; // px, square — plenty for every avatar slot at 2x
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/** Center-crops to a square and re-encodes as a ~512px JPEG in the browser. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process that image.");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
    0, 0, SIZE, SIZE
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob || blob.size === 0) throw new Error("Your browser couldn't process that image.");
  return blob;
}

async function clearFolder(userId: string, keep?: string) {
  const { data } = await supabase.storage.from(BUCKET).list(userId, { limit: 100 });
  const stale = ((data ?? []) as { name: string }[]).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
}

/**
 * Same storage layout as the mobile app (`<uid>/avatar-<ts>.jpg`, one file per
 * user, unique name = cache-bust). Returns the new public URL; throws a
 * user-facing message on failure.
 */
export async function saveAvatar(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Not connected. Refresh and try again.");
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file (JPG, PNG or WebP).");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is over 15 MB. Choose a smaller one.");

  const blob = await toSquareJpeg(file);
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (uploadError) throw new Error("Couldn't upload that photo. Try again.");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
  if (error) throw new Error("Your photo uploaded but couldn't be saved to your profile. Try again.");

  await clearFolder(userId, path).catch(() => {});
  return data.publicUrl as string;
}

export async function removeAvatar(userId: string): Promise<void> {
  if (!supabase) throw new Error("Not connected. Refresh and try again.");
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
  if (error) throw new Error("Couldn't remove your photo. Try again.");
  await clearFolder(userId).catch(() => {});
}
