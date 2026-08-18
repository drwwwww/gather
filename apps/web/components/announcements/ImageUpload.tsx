"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

type ImageUploadProps = {
  value: string | null;
  churchId: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

export default function ImageUpload({ value, churchId, onChange, disabled }: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!supabase) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Ensure bucket exists — createBucket is idempotent (ignores "already exists" errors)
      await supabase.storage.createBucket("announcements", {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      }).catch(() => {}); // Bucket already exists → no-op

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${churchId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("announcements")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("announcements").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!supabase || !value) { onChange(null); return; }
    try {
      const match = value.match(/\/announcements\/(.+)$/);
      if (match?.[1]) await supabase.storage.from("announcements").remove([match[1]]);
    } catch {}
    onChange(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  if (value) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-[var(--border)]">
        <img src={value} alt="Announcement banner" className="h-44 w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-100"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload image"
        className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
          dragging
            ? "border-amber-400 bg-amber-50"
            : "border-[var(--border)] bg-[var(--surface-2)] hover:border-amber-300 hover:bg-amber-50/50"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${dragging ? "bg-amber-100" : "bg-[var(--surface)]"}`}>
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" aria-label="Uploading" />
          ) : (
            <Upload className="h-5 w-5 text-[var(--text-muted)]" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {uploading ? "Uploading…" : "Drop a banner image, or click to browse"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">PNG · JPG · GIF · WebP · Max 5 MB</p>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
    </div>
  );
}
