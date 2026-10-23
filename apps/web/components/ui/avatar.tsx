"use client";

import { useState } from "react";
import { hueForSeed } from "../../lib/areas";

/** Two-letter initials from a name, falling back to the email's local part. */
export function initialsFor(name?: string | null, email?: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The one avatar for the web app: the member's uploaded photo when there is
 * one (`profiles.avatar_url`, set from the mobile app or Account), otherwise
 * their initials. A broken or deleted photo falls back to initials rather than
 * a blank circle. Size and initials styling come from `className`, so each
 * caller keeps its existing look.
 */
export default function Avatar({
  name,
  email,
  imageUrl,
  size = 36,
  className = "bg-[var(--primary-soft)] text-amber-800",
}: {
  name?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  size?: number;
  /** Background + text color for the initials state. */
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!imageUrl && failedUrl !== imageUrl;
  const label = (name ?? "").trim() || email || "Member";
  // Initials wear a stable area tint per person (same person, same colour everywhere).
  const tone = hueForSeed((email || name || "member").toLowerCase());

  return (
    <span
      className={`relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold ${
        showImage ? "bg-[var(--surface-2)]" : className
      }`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        ...(showImage ? null : { background: tone.tint, color: tone.ink }),
      }}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs; next/image would need remotePatterns + adds nothing at avatar size
        <img
          src={imageUrl!}
          alt={label}
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(imageUrl!)}
          className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10"
        />
      ) : (
        initialsFor(name, email)
      )}
    </span>
  );
}
