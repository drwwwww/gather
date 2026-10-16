"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import Avatar from "../ui/avatar";
import { saveAvatar, removeAvatar } from "../../lib/avatar";

/** Photo control: shows the current avatar, uploads/replaces/removes it. */
function ProfilePhotoField({
  userId, name, email, avatarUrl, onAvatarChange,
}: {
  userId: string; name: string; email: string; avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const announce = (url: string | null) => {
    onAvatarChange(url);
    window.dispatchEvent(new CustomEvent("gather-avatar-updated", { detail: url }));
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      announce(await saveAvatar(userId, file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that photo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onRemove = async () => {
    setBusy(true);
    setError(null);
    try {
      await removeAvatar(userId);
      announce(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove your photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="relative shrink-0">
        <Avatar name={name} email={email} imageUrl={avatarUrl} size={64}
          className="bg-amber-100 text-xl font-bold text-amber-700" />
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35">
            <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {avatarUrl ? "Change photo" : "Add photo"}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="inline-flex h-9 items-center whitespace-nowrap rounded-xl px-3 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
    </div>
      <p className="text-xs text-[var(--text-muted)]">Shown to your church in the directory and on schedules.</p>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function ProfileCard({
  name, email, roleLabel, onNameChange, onSave, saveDisabled,
  userId, avatarUrl = null, onAvatarChange,
}: {
  name: string; email: string; roleLabel: string;
  onNameChange: (v: string) => void; onSave: () => void; saveDisabled: boolean;
  userId?: string; avatarUrl?: string | null; onAvatarChange?: (url: string | null) => void;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">My Profile</h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Update your photo and name, and view your role.</p>
      </div>

      <div className="space-y-4">
        {userId && onAvatarChange && (
          <ProfilePhotoField userId={userId} name={name} email={email} avatarUrl={avatarUrl} onAvatarChange={onAvatarChange} />
        )}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Display name</label>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Email address</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-container-low)] px-4 py-2.5 text-sm text-[var(--text-muted)] cursor-not-allowed"
          />
          <p className="text-xs text-[var(--text-muted)]">Email cannot be changed here.</p>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            {roleLabel}
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="btn btn-primary-gradient btn-sm"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
