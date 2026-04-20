export const ADMIN_HOME = "/admin";
export const MEMBER_HOME = "/member";

/** Safe in-app path only (rejects absolute URLs). */
export function sanitizeNextPath(raw: string | null): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  if (s.includes("://") || s.startsWith("//")) return null;
  return s.startsWith("/") ? s : `/${s}`;
}

/**
 * Where to send the user after a successful church-associated sign-in.
 * Non-admins always land on the member hub unless `next` already targets `/member`.
 */
export function destinationAfterSignIn(opts: { role: string | null | undefined; nextPath: string | null }): string {
  const next = sanitizeNextPath(opts.nextPath);
  const role = opts.role ?? "MEMBER";

  if (role === "ADMIN") {
    if (!next || next === "/") return ADMIN_HOME;
    if (next.startsWith("/member")) return ADMIN_HOME;
    return next;
  }

  if (next?.startsWith("/member")) return next;
  return MEMBER_HOME;
}
